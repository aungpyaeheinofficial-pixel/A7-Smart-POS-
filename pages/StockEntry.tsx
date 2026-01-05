
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, Trash2, Box, ArrowLeft, Loader2, Zap, 
  Calendar, MapPin, Hash, DollarSign, Tag, CheckCircle2,
  AlertTriangle, ScanLine, Camera, X
} from 'lucide-react';
import { Button, Badge } from '../components/UI';
import { useProductStore, useSupplierStore, useAuthStore } from '../store';
import { UNIT_TYPES } from '../types';
import { parseBarcode } from '../utils/gs1Parser';
import CameraScanner from '../components/CameraScanner';

// --- Types ---
interface GridRow {
  id: string; // Unique ID for the row
  gtin: string;
  productName: string;
  category: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  location: string;
  supplierId: string;
  isNew?: boolean; // For highlighting new rows
  isHighlighted?: boolean; // For flash animation
}

// --- Hook: Headless Scanner Listener ---
const useScanListener = (onScan: (code: string) => void) => {
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if event target is an input (unless it's the body/window capturing bubbling)
      // Actually for a headless scanner, we often want to capture it globally 
      // BUT if the user is manually typing in a cell, we shouldn't interfere.
      // Scanner usually fires very fast (<50ms between keys).
      
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      const now = Date.now();
      
      // If time between keys is long, reset buffer (it's manual typing)
      if (now - lastKeyTime > 50) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
           // It's likely a scan if buffer has content and was typed fast
           e.preventDefault();
           e.stopPropagation();
           onScan(buffer);
           buffer = '';
        } else {
           // Just a normal Enter key press (e.g. moving to next row)
           buffer = '';
        }
      } else if (e.key.length === 1) {
        // Printable char
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Capture phase to intercept before inputs if needed
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onScan]);
};

const StockEntry = () => {
  const navigate = useNavigate();
  const { allProducts, incrementStock, addProduct } = useProductStore();
  const { suppliers } = useSupplierStore();
  const { user } = useAuthStore();

  // --- State ---
  const [gridData, setGridData] = useState<GridRow[]>([]);
  const [scannerStatus, setScannerStatus] = useState<'ready' | 'processing'>('ready');
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Refs for cell navigation
  const gridRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const createEmptyRow = (barcode = ''): GridRow => ({
    id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    gtin: barcode,
    productName: '',
    category: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 1,
    unit: 'PCS',
    costPrice: 0,
    sellingPrice: 0,
    location: '',
    supplierId: '',
    isNew: true
  });

  const focusCell = (rowId: string, field: string) => {
     const el = document.getElementById(`cell-${rowId}-${field}`);
     if (el) {
        (el as HTMLInputElement).focus();
        if ((el as HTMLInputElement).select) {
          (el as HTMLInputElement).select();
        }
     }
  };

  // --- Core Logic: Handle Scan ---
  const handleScan = useCallback((code: string) => {
    setScannerStatus('processing');
    
    // Parse GS1 or raw
    const result = parseBarcode(code);
    const scannedCode = result.gtin || result.rawData || code;
    
    // 1. Search Master DB
    const product = allProducts.find(p => p.gtin === scannedCode || p.id === scannedCode || p.sku === scannedCode);
    
    setGridData(prevData => {
       // 2. Check for Duplicate in Grid
       const existingRowIndex = prevData.findIndex(row => row.gtin === scannedCode);
       
       if (existingRowIndex >= 0) {
          // SCENARIO B: Duplicate Found -> Increment & Highlight
          const newData = [...prevData];
          const existingRow = newData[existingRowIndex];
          
          newData[existingRowIndex] = {
             ...existingRow,
             quantity: existingRow.quantity + 1,
             isHighlighted: true
          };
          
          // Scroll to row and focus quantity
          setTimeout(() => {
             focusCell(existingRow.id, 'quantity');
             // Remove highlight after animation
             setGridData(current => current.map(r => r.id === existingRow.id ? { ...r, isHighlighted: false } : r));
          }, 100);

          return newData;
       } else {
          // SCENARIO A/C: New Row at TOP
          const newRow = createEmptyRow(scannedCode);
          
          if (product) {
             // Pre-fill from DB
             newRow.productName = product.nameEn;
             newRow.category = product.category;
             newRow.unit = product.unit;
             newRow.costPrice = product.batches[0]?.costPrice || 0;
             newRow.sellingPrice = product.price;
             newRow.location = product.location || '';
             
             // Smart Batch/Expiry from scan if available
             if (result.batchNumber) newRow.batchNumber = result.batchNumber;
             if (result.expiryDate) newRow.expiryDate = result.expiryDate;
          }
          
          // Add to TOP of grid
          const newData = [newRow, ...prevData];
          
          // Focus logic
          setTimeout(() => {
             // If product found in DB, we trust the name, jump to Quantity to confirm
             // If unknown, jump to Name to fill it in
             const fieldToFocus = product ? 'quantity' : 'productName';
             focusCell(newRow.id, fieldToFocus);
          }, 100);

          return newData;
       }
    });

    // Reset status badge
    setTimeout(() => setScannerStatus('ready'), 600);
  }, [allProducts]);

  const handleCameraScan = (code: string) => {
      handleScan(code);
      setIsCameraOpen(false);
  };

  // Activate Listener
  useScanListener(handleScan);

  // --- Grid Operations ---
  const updateRow = (id: string, field: keyof GridRow, value: any) => {
     setGridData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const deleteRow = (id: string) => {
     setGridData(prev => prev.filter(row => row.id !== id));
  };

  // --- Keyboard Navigation (Excel Style) ---
  const handleCellKeyDown = (e: React.KeyboardEvent, rowId: string, field: string, rowIndex: number) => {
     const columns = ['gtin', 'productName', 'category', 'batchNumber', 'expiryDate', 'quantity', 'unit', 'costPrice', 'sellingPrice', 'location', 'supplierId'];
     const colIndex = columns.indexOf(field);
     
     if (e.key === 'ArrowRight' || e.key === 'Tab') {
        if (colIndex < columns.length - 1) {
            e.preventDefault();
            focusCell(rowId, columns[colIndex + 1]);
        }
     } else if (e.key === 'ArrowLeft') {
        if (colIndex > 0) {
            e.preventDefault();
            focusCell(rowId, columns[colIndex - 1]);
        }
     } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextRow = gridData[rowIndex + 1];
        if (nextRow) focusCell(nextRow.id, field);
     } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevRow = gridData[rowIndex - 1];
        if (prevRow) focusCell(prevRow.id, field);
     } else if (e.key === 'Enter') {
        e.preventDefault();
        // Enter moves down or confirms line
        const nextRow = gridData[rowIndex + 1];
        if (nextRow) {
           focusCell(nextRow.id, field);
        } else {
            // If on last row, maybe create new? 
            // For now, scan drives creation.
        }
     }
  };

  // --- Save Logic ---
  const handleSaveAll = async () => {
    if (gridData.length === 0) return;
    if (!window.confirm(`Save ${gridData.length} items to inventory?`)) return;

    setIsSaving(true);
    
    try {
      // Process sequentially
      for (const entry of gridData) {
        if (!entry.productName) continue; // Skip empty rows

        const existing = allProducts.find(p => p.gtin === entry.gtin || p.nameEn === entry.productName);
        
        if (existing) {
           // Add stock via batch API
           await incrementStock(
              existing.id,
              entry.batchNumber || 'DEFAULT',
              entry.quantity,
              entry.unit,
              entry.location,
              entry.expiryDate,
              entry.costPrice
           );
        } else {
           // Create new product
           await addProduct({
              id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              gtin: entry.gtin,
              sku: entry.gtin || `SKU-${Date.now()}`,
              nameEn: entry.productName,
              nameMm: entry.productName,
              category: entry.category || 'Uncategorized',
              price: entry.sellingPrice,
              stockLevel: entry.quantity,
              unit: entry.unit,
              minStockLevel: 10,
              requiresPrescription: false,
              branchId: user?.branchId || 'b1',
              location: entry.location,
              image: '',
              batches: [{
                 id: `b-${Date.now()}-${Math.random()}`,
                 batchNumber: entry.batchNumber || 'DEFAULT',
                 expiryDate: entry.expiryDate || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
                 quantity: entry.quantity,
                 costPrice: entry.costPrice
              }]
           });
           
           // If product was created, add the batch separately
           const newProduct = allProducts.find(p => p.gtin === entry.gtin || p.nameEn === entry.productName);
           if (newProduct && entry.batchNumber && entry.batchNumber !== 'DEFAULT') {
             await incrementStock(
               newProduct.id,
               entry.batchNumber,
               entry.quantity,
               entry.unit,
               entry.location,
               entry.expiryDate,
               entry.costPrice
             );
           }
        }
      }

      // Refresh products to get updated data
      const { fetchProducts } = useProductStore.getState();
      await fetchProducts();
      
      setIsSaving(false);
      setGridData([]);
      navigate('/inventory');
    } catch (error) {
      setIsSaving(false);
      alert('Failed to save some items. Please check and try again.');
      console.error('Save error:', error);
    }
  };

  // --- Header Stats ---
  const totalItems = gridData.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = gridData.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      
      {/* --- HEADER BAR --- */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-20">
         <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
                <ArrowLeft size={20} />
             </Button>
             <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   Stock Entry Grid
                   {scannerStatus === 'ready' ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] border border-emerald-100 uppercase tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Scanner Ready
                      </span>
                   ) : (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] border border-blue-100 uppercase tracking-wide transition-all">
                        <Zap size={10} className="fill-current" />
                        Processing...
                      </span>
                   )}
                </h1>
                <p className="text-xs text-slate-500">Scan barcodes or click 'Scan Barcode' to add rows.</p>
             </div>
         </div>
         
         {/* MAIN ACTION: SCAN BUTTON */}
         <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 border-none gap-2 px-6 py-2.5 rounded-full transform hover:scale-105 active:scale-95 transition-all"
            onClick={() => setIsCameraOpen(true)}
         >
             <Camera size={20} className="text-white stroke-[2.5]" /> 
             <span className="font-bold text-sm">Scan Barcode</span>
         </Button>

         <div className="flex items-center gap-6">
             <div className="hidden md:flex gap-6 text-sm">
                 <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-xs font-semibold uppercase">Items</span>
                    <span className="font-bold text-slate-800 text-lg leading-none">{totalItems}</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-xs font-semibold uppercase">Total Value</span>
                    <span className="font-bold text-slate-800 text-lg leading-none">{totalValue.toLocaleString()}</span>
                 </div>
             </div>
             
             <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>

             <div className="flex gap-2">
                <Button variant="outline" onClick={() => setGridData([])} disabled={gridData.length === 0}>
                   Clear
                </Button>
                <Button 
                   variant="primary" 
                   className="shadow-lg shadow-blue-500/20 px-6"
                   onClick={handleSaveAll}
                   disabled={gridData.length === 0 || isSaving}
                >
                   {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                   Save to Inventory
                </Button>
             </div>
         </div>
      </div>

      {/* --- SPREADSHEET GRID --- */}
      <div className="flex-1 overflow-auto bg-slate-100 p-4" ref={gridRef}>
         <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden min-w-[1200px]">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                     <th className="w-10 border-b border-r border-slate-300 py-2 text-center">#</th>
                     <th className="w-40 border-b border-r border-slate-300 px-2 py-2">Barcode</th>
                     <th className="w-64 border-b border-r border-slate-300 px-2 py-2">Product Name</th>
                     <th className="w-32 border-b border-r border-slate-300 px-2 py-2">Category</th>
                     <th className="w-32 border-b border-r border-slate-300 px-2 py-2">Batch No.</th>
                     <th className="w-32 border-b border-r border-slate-300 px-2 py-2">Expiry</th>
                     <th className="w-24 border-b border-r border-slate-300 px-2 py-2 text-center bg-blue-50/50">Qty</th>
                     <th className="w-24 border-b border-r border-slate-300 px-2 py-2">Unit</th>
                     <th className="w-32 border-b border-r border-slate-300 px-2 py-2">Location</th>
                     <th className="w-40 border-b border-r border-slate-300 px-2 py-2">Supplier</th>
                     <th className="w-28 border-b border-r border-slate-300 px-2 py-2 text-right">Cost</th>
                     <th className="w-28 border-b border-r border-slate-300 px-2 py-2 text-right">Subtotal</th>
                     <th className="w-12 border-b border-slate-300 px-2 py-2 text-center"></th>
                  </tr>
               </thead>
               <tbody className="text-sm">
                  {gridData.map((row, idx) => (
                     <tr 
                        key={row.id} 
                        className={`group transition-colors duration-500 ${row.isHighlighted ? 'bg-green-100' : 'hover:bg-slate-50'}`}
                     >
                        <td className="border-b border-r border-slate-200 text-center text-slate-400 text-xs bg-slate-50 select-none">
                           {gridData.length - idx}
                        </td>
                        
                        {/* Barcode */}
                        <td className="border-b border-r border-slate-200 p-0">
                           <input 
                              id={`cell-${row.id}-gtin`}
                              className="w-full h-full px-2 py-1.5 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/50 font-mono text-slate-700 bg-transparent text-xs"
                              value={row.gtin}
                              onChange={(e) => updateRow(row.id, 'gtin', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row.id, 'gtin', idx)}
                           />
                        </td>
                        
                        {/* Name */}
                        <td className="border-b border-r border-slate-200 p-0">
                           <input 
                              id={`cell-${row.id}-productName`}
                              className="w-full h-full px-2 py-1.5 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-800 bg-transparent"
                              value={row.productName}
                              onChange={(e) => updateRow(row.id, 'productName', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row.id, 'productName', idx)}
                           />
                        </td>
                        
                        {/* Category */}
                         <td className="border-b border-r border-slate-200 p-0">
                           <input 
                              id={`cell-${row.id}-category`}
                              className="w-full h-full px-2 py-1.5 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/50 text-slate-600 bg-transparent text-xs"
                              value={row.category}
                              onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row.id, 'category', idx)}
                           />
                        </td>

                        {/* Batch */}
                        <td className="border-b border-r border-slate-200 p-0">
                           <input 
                              id={`cell-${row.id}-batchNumber`}
                              className="w-full h-full px-2 py-1.5 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/50 font-mono text-slate-600 bg-transparent text-xs"
                              value={row.batchNumber}
                              onChange={(e) => updateRow(row.id, 'batchNumber', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row.id, 'batchNumber', idx)}
                           />
                        </td>
                        
                        {/* Expiry */}
                        <td className="border-b border-r border-slate-200 p-0">
                           <input 
                              id={`cell-${row.id}-expiryDate`}
                              type="date"
                              className="w-full h-full px-2 py-1.5 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/50 text-slate-600 bg-transparent text-xs"
                              value={row.expiryDate}
                              onChange={(e) => updateRow(row.id, 'expiryDate', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row.id, 'expiryDate', idx)}
                           />
                        </td>
                        
                        {/* Qty */}
                        <td className="border-b border-r border-slate-200 p-0 bg-blue-50/20">
                           <input 
                              id={`cell-${row.id}-quantity`}
                              type="number"
                              className="w-full h-full px-2 py-1.5 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/50 font-bold text-center text-blue-700 bg-transparent"
                              value={row.quantity}
                              onChange={(e) => updateRow(row.id, 'quantity', parseInt(e.target.value) || 0)}
                              onKeyDown={(e) => handleCellKeyDown(e, row.id, 'quantity', idx)}
                           />
                        </td>
                        
                        {/* Unit */}
                        <td className="border-b border-r border-slate-200 p-0">
                           <select 
                              id={`cell-${row.id}-unit`}
                              className="w-full h-full px-1 py-1.5 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/50 text-slate-600 bg-transparent text-xs"
                              value={row.unit}
                              onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row.id, 'unit', idx)}
                           >
                              {UNIT_TYPES.map(u => <option key={u.code} value={u.code}>{u.nameEn}</option>)}
                           </select>
                        </td>
                        
                        {/* Location */}
                        <td className="border-b border-r border-slate-200 p-0">
                           <input 
                              id={`cell-${row.id}-location`}
                              className="w-full h-full px-2 py-1.5 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/50 text-slate-600 bg-transparent text-xs"
                              placeholder="e.g. A-1"
                              value={row.location}
                              onChange={(e) => updateRow(row.id, 'location', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row.id, 'location', idx)}
                           />
                        </td>
                        
                         {/* Supplier */}
                         <td className="border-b border-r border-slate-200 p-0">
                           <select 
                              id={`cell-${row.id}-supplierId`}
                              className="w-full h-full px-1 py-1.5 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/50 text-slate-600 bg-transparent text-xs"
                              value={row.supplierId}
                              onChange={(e) => updateRow(row.id, 'supplierId', e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, row.id, 'supplierId', idx)}
                           >
                              <option value="">Select...</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                        </td>

                        {/* Cost */}
                        <td className="border-b border-r border-slate-200 p-0">
                           <input 
                              id={`cell-${row.id}-costPrice`}
                              type="number"
                              className="w-full h-full px-2 py-1.5 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/50 text-right text-slate-600 bg-transparent text-xs"
                              value={row.costPrice}
                              onChange={(e) => updateRow(row.id, 'costPrice', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => handleCellKeyDown(e, row.id, 'costPrice', idx)}
                           />
                        </td>

                        {/* Subtotal (Read Only) */}
                        <td className="border-b border-r border-slate-200 px-2 py-1.5 text-right font-medium text-slate-800 bg-slate-50/30">
                           {(row.quantity * row.costPrice).toLocaleString()}
                        </td>

                        {/* Action */}
                        <td className="border-b border-slate-200 p-0 text-center">
                           <button 
                              onClick={() => deleteRow(row.id)}
                              className="w-full h-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              tabIndex={-1}
                           >
                              <Trash2 size={14} />
                           </button>
                        </td>
                     </tr>
                  ))}
                  
                  {/* Empty State / Add Row Button */}
                  <tr>
                     <td colSpan={13} className="p-2 border-t border-slate-200 bg-slate-50">
                        <button 
                           onClick={() => setGridData([createEmptyRow(), ...gridData])}
                           className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors px-2 py-1"
                        >
                           <Box size={16} /> Add Empty Row manually
                        </button>
                     </td>
                  </tr>
                  
                  {gridData.length === 0 && (
                     <tr>
                        <td colSpan={13} className="py-20 text-center text-slate-400">
                           <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                 <ScanLine size={32} className="opacity-40" />
                              </div>
                              <p className="text-lg font-medium text-slate-600">Grid is empty</p>
                              <p className="text-sm max-w-xs mx-auto">Scan product barcodes to populate the grid instantly.</p>
                           </div>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* CAMERA SCANNER MODAL */}
      {isCameraOpen && (
          <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <div className="absolute top-4 right-4 z-20">
                    <button 
                        onClick={() => setIsCameraOpen(false)} 
                        className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="relative aspect-square">
                    <CameraScanner 
                        onScan={handleCameraScan} 
                        className="w-full h-full" 
                    />
                </div>
                <div className="p-6 bg-slate-900 text-center text-white border-t border-slate-800">
                    <p className="font-bold text-lg mb-1">Scan Product Barcode</p>
                    <p className="text-slate-400 text-sm">Align the barcode within the frame to add it to the grid.</p>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default StockEntry;
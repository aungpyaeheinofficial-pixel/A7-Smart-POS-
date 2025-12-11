
import React, { useState, useMemo, useEffect } from 'react';
import { useProductStore, useSupplierStore } from '../store';
import { Card, Button, Badge, ProgressBar, Tabs, Input } from '../components/UI';
import { 
  AlertTriangle, Calendar as CalendarIcon, AlertCircle, Clock, Download, 
  ArrowRight, Trash2, Tag, Truck, Image as ImageIcon, ChevronLeft, ChevronRight, 
  List, X, Store, DollarSign, CheckCircle2, Loader2
} from 'lucide-react';
import { Product, Batch, Supplier } from '../types';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  parseISO, isToday, differenceInDays
} from 'date-fns';

// --- Types ---
interface ExpiryItem {
  id: string; // Composite ID for key
  product: Product;
  batch: Batch;
  daysRemaining: number;
  status: 'CRITICAL' | 'WARNING' | 'WATCH' | 'GOOD';
  valueAtRisk: number;
}

interface ExpiryStats {
  CRITICAL: { count: number; value: number };
  WARNING: { count: number; value: number };
  WATCH: { count: number; value: number };
  ALL: { count: number; value: number };
}

// --- Custom Hook: Analytics Logic ---
const useExpiryStats = (products: Product[]) => {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats: ExpiryStats = {
      CRITICAL: { count: 0, value: 0 },
      WARNING: { count: 0, value: 0 },
      WATCH: { count: 0, value: 0 },
      ALL: { count: 0, value: 0 }
    };

    const items: ExpiryItem[] = [];

    products.forEach(product => {
      product.batches.forEach(batch => {
        if (batch.quantity <= 0) return;

        const expiryDate = new Date(batch.expiryDate);
        const daysRemaining = differenceInDays(expiryDate, today);
        const valueAtRisk = batch.quantity * batch.costPrice;

        let status: ExpiryItem['status'] = 'GOOD';
        if (daysRemaining <= 30) status = 'CRITICAL';
        else if (daysRemaining <= 60) status = 'WARNING';
        else if (daysRemaining <= 90) status = 'WATCH';

        // Aggregate Stats
        stats.ALL.count++;
        stats.ALL.value += valueAtRisk;

        if (status !== 'GOOD') {
          stats[status].count++;
          stats[status].value += valueAtRisk;
        }

        items.push({
          id: `${product.id}-${batch.id}`,
          product,
          batch,
          daysRemaining,
          status,
          valueAtRisk
        });
      });
    });

    // Sort by days remaining (ascending)
    items.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return { stats, items };
  }, [products]);
};

// --- Main Component ---
const Expiry = () => {
  const { products, removeBatchStock } = useProductStore();
  const { suppliers } = useSupplierStore(); // To simulate looking up vendor info
  
  const [activeTab, setActiveTab] = useState('CRITICAL');
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Analytics Data
  const { stats, items: expiryItems } = useExpiryStats(products);

  // Return Workflow State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnItem, setSelectedReturnItem] = useState<ExpiryItem | null>(null);
  const [returnQty, setReturnQty] = useState<number>(0);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // --- Filtering Logic ---
  const filteredItems = useMemo(() => {
    if (activeTab === 'ALL') return expiryItems;
    return expiryItems.filter(item => item.status === activeTab);
  }, [expiryItems, activeTab]);

  // --- Helpers ---
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'WARNING': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'WATCH': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getSupplierName = () => {
    // Mock logic: In a real app, batch might have supplierId. 
    // Here we pick a random one or finding via product if applicable.
    if (!suppliers.length) return "Unknown Vendor";
    return suppliers[0].name; 
  };

  // --- Return Workflow Handlers ---
  const initiateReturn = (item: ExpiryItem) => {
    setSelectedReturnItem(item);
    setReturnQty(item.batch.quantity); // Default to full return
    setIsReturnModalOpen(true);
  };

  const confirmReturn = () => {
    if (!selectedReturnItem || returnQty <= 0) return;

    setIsSubmittingReturn(true);

    // Simulate API Call
    setTimeout(() => {
      removeBatchStock(
        selectedReturnItem.product.id, 
        selectedReturnItem.batch.batchNumber, 
        returnQty, 
        'RETURN'
      );
      
      setIsSubmittingReturn(false);
      setIsReturnModalOpen(false);
      setSelectedReturnItem(null);
    }, 1000);
  };

  const handleExport = () => {
    const headers = [
      'Product Name', 
      'Batch Code', 
      'Expiry Date', 
      'Days Left', 
      'Quantity', 
      'Unit Cost', 
      'Total Value', 
      'Status'
    ];

    const rows = expiryItems.map(item => {
      // Escape quotes for CSV
      const safe = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      
      return [
        safe(item.product.nameEn),
        safe(item.batch.batchNumber),
        safe(item.batch.expiryDate),
        item.daysRemaining,
        item.batch.quantity,
        item.batch.costPrice,
        item.valueAtRisk,
        safe(item.status)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expiry_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Calendar Logic ---
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getItemsForDate = (date: Date) => {
    return expiryItems.filter(item => isSameDay(parseISO(item.batch.expiryDate), date));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Expiry Management Center
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full border border-red-200">
              {stats.CRITICAL.count} Critical
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Monitor and manage expiring inventory batches to reduce financial risk.</p>
        </div>
        <div className="flex gap-3">
           <Button 
             variant="outline" 
             className="gap-2 bg-white"
             onClick={handleExport}
           >
             <Download size={16} /> Export Report
           </Button>
           <Button 
             variant="outline" 
             className="gap-2 bg-white"
             onClick={() => setViewMode(viewMode === 'LIST' ? 'CALENDAR' : 'LIST')}
           >
             {viewMode === 'LIST' ? <CalendarIcon size={16} /> : <List size={16} />} 
             {viewMode === 'LIST' ? 'Calendar View' : 'List View'}
           </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-xl border border-red-100 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-red-600 group-hover:scale-110 transition-transform duration-500"><AlertCircle size={80} /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle size={20} /></div>
            <h3 className="font-semibold text-slate-700">Critical (0-30 Days)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.CRITICAL.count}</p>
          <div className="mt-4 pt-4 border-t border-red-100/50">
             <div className="flex justify-between text-xs text-red-700 font-medium mb-1">
               <span>Value at Risk</span>
               <span>{stats.CRITICAL.value.toLocaleString()} MMK</span>
             </div>
             <ProgressBar value={75} variant="danger" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-600 group-hover:scale-110 transition-transform duration-500"><Clock size={80} /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Clock size={20} /></div>
            <h3 className="font-semibold text-slate-700">Warning (31-60 Days)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.WARNING.count}</p>
           <div className="mt-4 pt-4 border-t border-amber-100/50">
             <div className="flex justify-between text-xs text-amber-700 font-medium mb-1">
               <span>Value at Risk</span>
               <span>{stats.WARNING.value.toLocaleString()} MMK</span>
             </div>
             <ProgressBar value={45} variant="warning" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600 group-hover:scale-110 transition-transform duration-500"><CalendarIcon size={80} /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><CalendarIcon size={20} /></div>
            <h3 className="font-semibold text-slate-700">Watch (61-90 Days)</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.WATCH.count}</p>
           <div className="mt-4 pt-4 border-t border-blue-100/50">
             <div className="flex justify-between text-xs text-blue-700 font-medium mb-1">
               <span>Value at Risk</span>
               <span>{stats.WATCH.value.toLocaleString()} MMK</span>
             </div>
             <ProgressBar value={20} variant="info" />
          </div>
        </div>
      </div>

      {viewMode === 'LIST' ? (
        <Card className="p-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <Tabs 
              activeTab={activeTab} 
              onChange={setActiveTab}
              className="w-full md:w-fit"
              tabs={[
                { id: 'CRITICAL', label: 'Critical', count: stats.CRITICAL.count },
                { id: 'WARNING', label: 'Warning', count: stats.WARNING.count },
                { id: 'WATCH', label: 'Watch', count: stats.WATCH.count },
                { id: 'ALL', label: 'All Items', count: stats.ALL.count },
              ]} 
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Batch Info</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Financial Impact</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.product.image ? (
                              <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{item.product.nameEn}</p>
                            <p className="text-xs text-slate-500 font-mm">{item.product.nameMm}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-mono text-slate-700">
                             <span className="bg-slate-100 px-1.5 rounded text-xs border border-slate-200">#{item.batch.batchNumber}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Exp: <span className="font-medium text-slate-700">{item.batch.expiryDate}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Qty: <span className="font-bold text-slate-800">{item.batch.quantity}</span> {item.product.unit}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border ${getStatusColor(item.status)} min-w-[80px]`}>
                           <span className="text-lg font-bold leading-none">{item.daysRemaining}</span>
                           <span className="text-[9px] uppercase font-bold tracking-wide">Days Left</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">
                          {item.valueAtRisk.toLocaleString()} Ks
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Cost: {item.batch.costPrice.toLocaleString()} / unit
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex gap-2 justify-end">
                           {item.status === 'CRITICAL' ? (
                             <Button 
                                variant="outline"
                                onClick={() => initiateReturn(item)}
                                className="h-8 text-xs gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                             >
                                <Truck size={14} /> Return
                             </Button>
                           ) : (
                             <Button variant="ghost" className="h-8 text-xs gap-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100">
                                <Tag size={14} /> Discount
                             </Button>
                           )}
                         </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-slate-400 bg-slate-50/30">
                       <div className="flex flex-col items-center justify-center">
                         <CalendarIcon size={32} className="opacity-20 mb-3" />
                         <p>No items found in this category.</p>
                       </div>
                     </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        // Calendar View Implementation (Keep existing logic but updated styling if needed)
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300 border border-slate-200 overflow-hidden">
           <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
              >
                 <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-bold text-slate-800">
                 {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
              >
                 <ChevronRight size={20} />
              </button>
           </div>

           <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                 <div key={d} className="py-3 text-center border-r border-slate-200 last:border-r-0">{d}</div>
              ))}
           </div>
           
           <div className="grid grid-cols-7 bg-slate-200 gap-[1px]">
              {calendarDays.map((day) => {
                 const dayItems = getItemsForDate(day);
                 const criticalCount = dayItems.filter(i => i.status === 'CRITICAL').length;
                 const warningCount = dayItems.filter(i => i.status === 'WARNING').length;
                 const isCurrentMonth = isSameMonth(day, currentMonth);
                 const isTodayDate = isToday(day);

                 return (
                    <div 
                       key={day.toISOString()} 
                       className={`min-h-[100px] bg-white p-2 relative group hover:bg-blue-50/50 transition-colors ${!isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : ''}`}
                    >
                       <span className={`text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full ${isTodayDate ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700'}`}>
                          {format(day, 'd')}
                       </span>
                       
                       <div className="mt-2 space-y-1">
                          {criticalCount > 0 && (
                             <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-100 text-red-700 border border-red-200 text-xs font-bold">
                                <AlertCircle size={12} /> {criticalCount} Expiring
                             </div>
                          )}
                          {warningCount > 0 && (
                             <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold">
                                <Clock size={12} /> {warningCount} Warning
                             </div>
                          )}
                       </div>
                    </div>
                 );
              })}
           </div>
        </Card>
      )}

      {/* --- Return to Vendor Modal --- */}
      {isReturnModalOpen && selectedReturnItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-red-500">
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                 <div>
                    <h3 className="font-bold text-xl text-slate-800">Return to Vendor</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                       <Store size={12} /> {getSupplierName()}
                    </p>
                 </div>
                 <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                 </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                 {/* Product Info Card */}
                 <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex gap-4">
                    <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                       {selectedReturnItem.product.image ? (
                          <img src={selectedReturnItem.product.image} className="w-full h-full object-cover rounded-lg" />
                       ) : (
                          <ImageIcon className="text-slate-300" />
                       )}
                    </div>
                    <div>
                       <h4 className="font-bold text-slate-800 text-sm">{selectedReturnItem.product.nameEn}</h4>
                       <div className="flex items-center gap-2 mt-1">
                          <Badge variant="neutral" className="font-mono text-[10px]">#{selectedReturnItem.batch.batchNumber}</Badge>
                          <span className="text-xs text-slate-500">Exp: {selectedReturnItem.batch.expiryDate}</span>
                       </div>
                    </div>
                 </div>

                 {/* Input Area */}
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-sm font-semibold text-slate-700">Return Quantity</label>
                       <span className="text-xs text-slate-500">Max: {selectedReturnItem.batch.quantity} units</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <input 
                          type="number" 
                          min="1"
                          max={selectedReturnItem.batch.quantity}
                          value={returnQty}
                          onChange={(e) => setReturnQty(Math.min(parseInt(e.target.value) || 0, selectedReturnItem.batch.quantity))}
                          className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                       />
                       <div className="h-12 flex items-center px-4 bg-slate-100 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
                          {selectedReturnItem.product.unit}
                       </div>
                    </div>
                 </div>

                 {/* Financial Summary */}
                 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <div className="flex justify-between items-center text-sm mb-1">
                       <span className="text-emerald-700">Unit Cost (Refundable)</span>
                       <span className="font-medium text-emerald-900">{selectedReturnItem.batch.costPrice.toLocaleString()} Ks</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-emerald-200 mt-2 pt-2">
                       <span className="font-bold text-emerald-800">Total Refund Value</span>
                       <span className="font-bold text-xl text-emerald-700 flex items-center gap-1">
                          <DollarSign size={16} />
                          {(returnQty * selectedReturnItem.batch.costPrice).toLocaleString()}
                       </span>
                    </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                 <Button variant="outline" className="flex-1" onClick={() => setIsReturnModalOpen(false)} disabled={isSubmittingReturn}>
                    Cancel
                 </Button>
                 <Button 
                    variant="danger" 
                    className="flex-[2] bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 border-none"
                    onClick={confirmReturn}
                    disabled={isSubmittingReturn || returnQty <= 0}
                 >
                    {isSubmittingReturn ? (
                       <><Loader2 className="animate-spin mr-2" size={18}/> Processing...</>
                    ) : (
                       <><Truck className="mr-2" size={18}/> Confirm Return</>
                    )}
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Expiry;

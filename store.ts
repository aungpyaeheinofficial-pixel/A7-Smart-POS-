
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  CartItem, Product, User, Role, Transaction, Customer, Branch, 
  DistributionOrder, PurchaseOrder, Expense, Payable, Receivable, Supplier, AppSettings,
  ScannedItem, SyncLog, SyncStatus, UNIT_TYPES
} from './types';
import { 
  mockProducts, mockUsers, mockTransactions, mockCustomers, 
  mockDistributionOrders, mockPurchaseOrders, mockExpenses, mockPayables, mockReceivables, mockSuppliers 
} from './data';
import { GS1ParsedData } from './utils/gs1Parser';
import { api, removeToken } from './src/api/client';

// --- Shared Helper for Persistence ---
const getInitialBranchId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('currentBranchId') || 'b1';
  }
  return 'b1';
};

const initialBranchId = getInitialBranchId();

// --- Branch Management Store ---
interface BranchState {
  branches: Branch[];
  currentBranchId: string;
  fetchBranches: () => Promise<void>;
  setBranch: (id: string) => void;
  getCurrentBranch: () => Branch | undefined;
  addBranch: (branch: Branch) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
}

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  currentBranchId: initialBranchId,
  
  // Fetch branches from API
  fetchBranches: async () => {
    try {
      const branches = await api.getBranches();
      set({ branches });
      // If no current branch set, use first branch
      if (!get().currentBranchId && branches.length > 0) {
        set({ currentBranchId: branches[0].id });
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      // Fallback to mock branches
      set({ 
        branches: [
          { 
            id: 'b1', 
            name: 'Main Store', 
            code: 'main-01', 
            address: 'No. 45, Arzarni Road, Dawei', 
            phone: '09-420012345',
            managerName: 'U Mg Mg',
            email: 'branch1@a7systems.com',
            status: 'active' 
          }
        ]
      });
    }
  },
  
  setBranch: (id: string) => {
    localStorage.setItem('currentBranchId', id);
    set({ currentBranchId: id });
    
    // Trigger sync in other stores
    useProductStore.getState().syncWithBranch(id);
    useCustomerStore.getState().syncWithBranch(id);
    useTransactionStore.getState().syncWithBranch(id);
    useCartStore.getState().clearCart(); // Clear cart on branch switch
    useDistributionStore.getState().syncWithBranch(id);
    usePurchaseStore.getState().syncWithBranch(id);
    useFinanceStore.getState().syncWithBranch(id);
    useSupplierStore.getState().syncWithBranch(id);
  },
  
  getCurrentBranch: () => get().branches.find(b => b.id === get().currentBranchId),

  addBranch: (branch) => set((state) => ({ 
    branches: [...state.branches, branch] 
  })),

  updateBranch: (id, updates) => set((state) => ({
    branches: state.branches.map(b => b.id === id ? { ...b, ...updates } : b)
  })),

  deleteBranch: (id) => set((state) => {
    const newBranches = state.branches.filter(b => b.id !== id);

    // Cascade Delete Effect
    setTimeout(() => {
        useProductStore.setState(s => ({
            allProducts: s.allProducts.filter(p => p.branchId !== id),
            products: s.products.filter(p => p.branchId !== id)
        }));
        useCustomerStore.setState(s => ({
            allCustomers: s.allCustomers.filter(c => c.branchId !== id),
            customers: s.customers.filter(c => c.branchId !== id)
        }));
        useTransactionStore.setState(s => ({
            allTransactions: s.allTransactions.filter(t => t.branchId !== id),
            transactions: s.transactions.filter(t => t.branchId !== id)
        }));
        useDistributionStore.setState(s => ({
             allOrders: s.allOrders.filter(o => o.branchId !== id),
             orders: s.orders.filter(o => o.branchId !== id)
        }));
        usePurchaseStore.setState(s => ({
             allPOs: s.allPOs.filter(p => p.branchId !== id),
             purchaseOrders: s.purchaseOrders.filter(p => p.branchId !== id)
        }));
        useFinanceStore.setState(s => ({
             allExpenses: s.allExpenses.filter(e => e.branchId !== id),
             expenses: s.expenses.filter(e => e.branchId !== id),
             allPayables: s.allPayables.filter(p => p.branchId !== id),
             payables: s.payables.filter(p => p.branchId !== id),
             allReceivables: s.allReceivables.filter(r => r.branchId !== id),
             receivables: s.receivables.filter(r => r.branchId !== id),
        }));
        useSupplierStore.setState(s => ({
             allSuppliers: s.allSuppliers.filter(supplier => supplier.branchId !== id),
             suppliers: s.suppliers.filter(supplier => supplier.branchId !== id)
        }));
    }, 0);
    
    if (state.currentBranchId === id) {
       const newId = newBranches.length > 0 ? newBranches[0].id : '';
       localStorage.setItem('currentBranchId', newId);
       
       if (newId) {
         setTimeout(() => {
            useBranchStore.getState().setBranch(newId);
         }, 0);
       }
       return { branches: newBranches, currentBranchId: newId };
    }
    return { branches: newBranches };
  })
}));

// --- Auth Store ---
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, 
  isAuthenticated: false,
  login: async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      set({ user: response.user, isAuthenticated: true });
      return response.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },
  logout: () => {
    removeToken();
    set({ user: null, isAuthenticated: false });
  },
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),
}));

// --- Cart Store ---
interface AddItemOptions {
  batchId?: string;
  transactionData?: CartItem['transaction_data'];
  warnings?: string[];
  override?: boolean;
}

interface CartState {
  items: CartItem[];
  customer: any | null;
  setCustomer: (customer: any) => void;
  addItem: (product: Product, options?: AddItemOptions) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  setCustomer: (customer) => set({ customer }),
  addItem: (product, options) => {
    const { batchId, transactionData, warnings, override } = options || {};

    const existing = get().items.find(i => {
      const productMatch = i.id === product.id;
      const scannedBatchMatch = transactionData?.scanned_batch 
          ? i.transaction_data?.scanned_batch === transactionData.scanned_batch
          : i.selectedBatchId === batchId;
      const overrideMatch = i.manager_override === override;

      return productMatch && scannedBatchMatch && overrideMatch;
    });

    if (existing) {
      set({
        items: get().items.map(i => 
          i.cartId === existing.cartId ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      set({ 
        items: [...get().items, { 
          ...product, 
          cartId: Math.random().toString(), 
          quantity: 1, 
          discount: 0,
          selectedBatchId: batchId || product.batches[0]?.id,
          transaction_data: transactionData,
          warning_flags: warnings,
          manager_override: override
        }] 
      });
    }
  },
  removeItem: (cartId) => set({ items: get().items.filter(i => i.cartId !== cartId) }),
  updateQuantity: (cartId, qty) => set({
    items: get().items.map(i => i.cartId === cartId ? { ...i, quantity: Math.max(1, qty) } : i)
  }),
  clearCart: () => set({ items: [], customer: null }),
  total: () => get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
}));

// --- Global UI Store ---
interface GlobalState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

// --- Inventory / Product Management Store ---
interface ProductState {
  allProducts: Product[]; // Master DB
  products: Product[];    // Filtered View
  fetchProducts: () => Promise<void>;
  syncWithBranch: (branchId: string) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  incrementStock: (id: string, batchNumber: string | null, quantity: number, unit?: string, location?: string, expiryDate?: string, costPrice?: number) => Promise<void>;
  removeBatchStock: (productId: string, batchNumber: string, quantity: number, reason?: string) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  allProducts: [],
  products: [],
  
  // Fetch products from API
  fetchProducts: async () => {
    try {
      const products = await api.getProducts();
      // Transform API response to match frontend Product type
      const transformed = products.map((p: any) => ({
        ...p,
        batches: p.batches || [],
        price: Number(p.price),
        stockLevel: p.stockLevel || 0,
      }));
      const currentBranchId = useBranchStore.getState().currentBranchId;
      set({ 
        allProducts: transformed,
        products: transformed.filter((p: Product) => p.branchId === currentBranchId)
      });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Fallback to mock data on error
      set({ 
        allProducts: mockProducts,
        products: mockProducts.filter(p => p.branchId === initialBranchId)
      });
    }
  },
  
  syncWithBranch: (branchId) => {
    set(state => ({
      products: state.allProducts.filter(p => p.branchId === branchId)
    }));
  },

  setProducts: (products) => set({ products }),
  
  addProduct: async (product) => {
    try {
      const newProduct = await api.createProduct(product);
      const transformed = {
        ...newProduct,
        batches: newProduct.batches || [],
        price: Number(newProduct.price),
      };
      set((state) => ({ 
        allProducts: [transformed, ...state.allProducts],
        products: [transformed, ...state.products] 
      }));
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  },
  
  updateProduct: async (id, updates) => {
    try {
      const updated = await api.updateProduct(id, updates);
      const transformed = {
        ...updated,
        batches: updated.batches || [],
        price: Number(updated.price),
      };
      set((state) => {
        const updatedAll = state.allProducts.map((p) => (p.id === id ? transformed : p));
        const currentBranchId = useBranchStore.getState().currentBranchId;
        return {
          allProducts: updatedAll,
          products: updatedAll.filter(p => p.branchId === currentBranchId)
        };
      });
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  },
  
  deleteProduct: async (id) => {
    try {
      await api.deleteProduct(id);
      set((state) => {
        const updatedAll = state.allProducts.filter((p) => p.id !== id);
        const currentBranchId = useBranchStore.getState().currentBranchId;
        return {
          allProducts: updatedAll,
          products: updatedAll.filter(p => p.branchId === currentBranchId)
        };
      });
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },

  // Used by Stock Entry & Scanner - Now saves to database
  incrementStock: async (id, batchNumber, quantity, unit, location, expiryDate, costPrice) => {
    try {
      // Create or update batch via API
      // Backend expects date as ISO string or Date object
      let expiryDateValue: string;
      if (expiryDate) {
        expiryDateValue = expiryDate;
      } else {
        // Default to 1 year from now
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
        expiryDateValue = defaultDate.toISOString().split('T')[0];
      }
      
      const batchData = {
        batchNumber: batchNumber || 'DEFAULT',
        expiryDate: expiryDateValue,
        quantity: Math.floor(Number(quantity)) || 0,
        costPrice: Number(costPrice) || 0,
      };
      
      await api.createBatch(id, batchData);
      
      // Refresh products to get updated stock levels
      await get().fetchProducts();
    } catch (error) {
      console.error('Failed to increment stock:', error);
      throw error;
    }
  },
  
  // Legacy local-only increment (kept for backward compatibility, but should use async version)
  _incrementStockLocal: (id, batchNumber, quantity, unit, location, expiryDate, costPrice) => set((state) => {
    const currentBranchId = useBranchStore.getState().currentBranchId;
    
    const updatedAll = state.allProducts.map(p => {
        if (p.id === id) {
            let updatedBatches = [...p.batches];
            // If batch provided, try to find and update it
            if (batchNumber && batchNumber !== 'DEFAULT') {
                const batchIndex = updatedBatches.findIndex(b => b.batchNumber === batchNumber);
                if (batchIndex >= 0) {
                    updatedBatches[batchIndex] = {
                        ...updatedBatches[batchIndex],
                        quantity: updatedBatches[batchIndex].quantity + quantity
                    };
                } else {
                    // Create new batch with passed expiry and cost
                    updatedBatches.push({
                        id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Use robust ID to prevent collision
                        batchNumber: batchNumber,
                        quantity: quantity,
                        expiryDate: expiryDate || new Date(Date.now() + 31536000000).toISOString().split('T')[0], // Default 1 year if not provided
                        costPrice: costPrice || 0
                    });
                }
            } else {
               // No batch info or default batch, just update main stock (or default batch)
               if (updatedBatches.length > 0) {
                   updatedBatches[0].quantity += quantity;
               } else {
                   // No batches exist, create one
                   updatedBatches.push({
                        id: `batch-${Date.now()}`,
                        batchNumber: 'DEFAULT',
                        expiryDate: expiryDate || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
                        quantity: quantity,
                        costPrice: costPrice || 0
                    });
               }
            }
            
            return {
                ...p,
                stockLevel: p.stockLevel + quantity,
                batches: updatedBatches,
                location: location || p.location, // Update location if provided
                unit: unit || p.unit // Update unit if provided
            };
        }
        return p;
    });

    return {
        allProducts: updatedAll,
        products: updatedAll.filter(p => p.branchId === currentBranchId)
    };
  }),

  // Used by Expiry Center for Write-offs/Returns
  removeBatchStock: (productId, batchNumber, quantity, reason) => set((state) => {
    const currentBranchId = useBranchStore.getState().currentBranchId;
    
    const updatedAll = state.allProducts.map(p => {
        if (p.id === productId) {
            let updatedBatches = [...p.batches];
            const batchIndex = updatedBatches.findIndex(b => b.batchNumber === batchNumber);
            
            if (batchIndex >= 0) {
                const currentQty = updatedBatches[batchIndex].quantity;
                const newQty = Math.max(0, currentQty - quantity);
                
                if (newQty === 0) {
                    // Option: Remove batch entirely or keep with 0?
                    // Let's keep it with 0 for record tracking for now, or filter in view
                    updatedBatches[batchIndex].quantity = 0;
                } else {
                    updatedBatches[batchIndex].quantity = newQty;
                }
                
                return {
                    ...p,
                    stockLevel: Math.max(0, p.stockLevel - quantity),
                    batches: updatedBatches
                };
            }
        }
        return p;
    });

    return {
        allProducts: updatedAll,
        products: updatedAll.filter(p => p.branchId === currentBranchId)
    };
  })
}));

// --- Scanner History Store & Sync Logic (Persisted) ---

interface ScannerState {
    scannedItems: ScannedItem[];
    syncLogs: SyncLog[];
    
    // Verification Stage State
    activeScan: ScannedItem | null;
    setActiveScan: (item: ScannedItem | null) => void;
    
    // Core Actions
    startScan: (record: GS1ParsedData) => void;
    confirmAndSync: (verifiedItem: ScannedItem) => Promise<boolean>;
    
    addToQueue: (record: GS1ParsedData, manual: boolean) => void; // Legacy compatibility
    clearHistory: () => void;
    retrySync: (id: string) => void;
}

export const useScannerStore = create<ScannerState>()(
    persist(
        (set, get) => ({
            scannedItems: [],
            syncLogs: [],
            activeScan: null,

            setActiveScan: (item) => set({ activeScan: item }),

            // Step 1: Initialize Scan (Move to Step 2)
            startScan: (record) => {
                const user = useAuthStore.getState().user;
                const newItem: ScannedItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    gtin: record.gtin || null,
                    productName: '', // Will look up later
                    batchNumber: record.batchNumber || null,
                    expiryDate: record.expiryDate || null,
                    serialNumber: record.serialNumber || null,
                    quantity: 0, // Pending Verification
                    unit: 'PCS', // Default to generic piece for retail
                    timestamp: Date.now(),
                    syncStatus: 'PENDING',
                    rawData: record.rawData,
                    type: record.type,
                    scannedBy: user?.name || 'Unknown',
                    verified: false
                };
                
                // Check if product exists to pre-fill name
                const products = useProductStore.getState().allProducts;
                const match = products.find(p => p.gtin === newItem.gtin);
                if (match) {
                    newItem.productName = match.nameEn;
                    newItem.unit = match.unit; // Default to existing product unit
                }

                set({ activeScan: newItem });
            },

            // Step 3: Confirm & Sync
            confirmAndSync: async (verifiedItem) => {
                const productStore = useProductStore.getState();
                const user = useAuthStore.getState().user;

                // 1. Identify Product
                let product = productStore.allProducts.find(p => p.gtin === verifiedItem.gtin);
                
                // Fallback search
                if (!product && !verifiedItem.gtin) {
                     product = productStore.allProducts.find(p => p.sku === verifiedItem.rawData || p.id === verifiedItem.rawData);
                }

                if (product) {
                    // Update Inventory
                    productStore.incrementStock(
                        product.id, 
                        verifiedItem.batchNumber, 
                        verifiedItem.quantity,
                        verifiedItem.unit,
                        verifiedItem.location,
                        verifiedItem.expiryDate || undefined,
                        verifiedItem.costPrice
                    );

                    const finalItem: ScannedItem = {
                        ...verifiedItem,
                        productName: product.nameEn,
                        syncStatus: 'SYNCED',
                        syncMessage: 'Verified & Added',
                        verified: true
                    };

                    set(state => ({
                        activeScan: null,
                        scannedItems: [finalItem, ...state.scannedItems].slice(0, 500),
                        syncLogs: [{
                            id: `log-${Date.now()}`,
                            scanId: finalItem.id,
                            action: 'UPDATE',
                            productName: product ? product.nameEn : 'Unknown',
                            oldQuantity: product ? product.stockLevel : 0,
                            newQuantity: product ? product.stockLevel + finalItem.quantity : finalItem.quantity,
                            timestamp: new Date().toISOString(),
                            status: 'SUCCESS'
                        }, ...state.syncLogs].slice(0, 200)
                    }));
                    
                    return true;
                } else {
                    const errorItem: ScannedItem = {
                        ...verifiedItem,
                        syncStatus: 'ERROR',
                        syncMessage: 'Product not found. Please add to master list first.',
                        verified: true
                    };
                    
                    set(state => ({
                        activeScan: null,
                        scannedItems: [errorItem, ...state.scannedItems].slice(0, 500)
                    }));
                    return false;
                }
            },

            // Legacy / Direct queue logic (kept for compatibility if needed)
            addToQueue: (record, manual) => {
                 get().startScan(record);
            },
            
            retrySync: (id) => {
                // Logic to retry failed syncs (omitted for brevity in this step)
            },

            clearHistory: () => set({ scannedItems: [], syncLogs: [] })
        }),
        {
            name: 'scanner-store-v2',
        }
    )
);

// Customer Store
export const useCustomerStore = create<any>((set) => ({
  customers: [],
  allCustomers: [],
  fetchCustomers: async () => {
    try {
      const customers = await api.getCustomers();
      set({ customers, allCustomers: customers });
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      set({ customers: mockCustomers, allCustomers: mockCustomers });
    }
  },
  syncWithBranch: (branchId: string) => {
    set((state: any) => ({
      customers: state.allCustomers.filter((c: Customer) => c.branchId === branchId)
    }));
  },
  addCustomer: async (customer: any) => {
    try {
      const newCustomer = await api.createCustomer(customer);
      set((state: any) => ({
        customers: [newCustomer, ...state.customers],
        allCustomers: [newCustomer, ...state.allCustomers]
      }));
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  },
  updateCustomer: async (id: string, updates: any) => {
    try {
      const updated = await api.updateCustomer(id, updates);
      set((state: any) => ({
        customers: state.customers.map((c: Customer) => c.id === id ? updated : c),
        allCustomers: state.allCustomers.map((c: Customer) => c.id === id ? updated : c)
      }));
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  },
  deleteCustomer: async (id: string) => {
    try {
      await api.deleteCustomer(id);
      set((state: any) => ({
        customers: state.customers.filter((c: Customer) => c.id !== id),
        allCustomers: state.allCustomers.filter((c: Customer) => c.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  }
}));

// Transaction Store
export const useTransactionStore = create<any>((set) => ({
  transactions: [],
  allTransactions: [],
  fetchTransactions: async (params?: { type?: string; startDate?: string; endDate?: string }) => {
    try {
      const transactions = await api.getTransactions(params);
      // Transform API response
      const transformed = transactions.map((t: any) => ({
        ...t,
        amount: Number(t.amount),
        date: t.date,
      }));
      set({ transactions: transformed, allTransactions: transformed });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      set({ transactions: mockTransactions, allTransactions: mockTransactions });
    }
  },
  syncWithBranch: (branchId: string) => {
    set((state: any) => ({
      transactions: state.allTransactions.filter((t: Transaction) => t.branchId === branchId)
    }));
  },
  addTransaction: async (transaction: any) => {
    try {
      const newTransaction = await api.createTransaction(transaction);
      const transformed = {
        ...newTransaction,
        amount: Number(newTransaction.amount),
      };
      set((state: any) => ({
        transactions: [transformed, ...state.transactions],
        allTransactions: [transformed, ...state.allTransactions]
      }));
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  },
  getTransactionsByDateRange: (start: Date, end: Date) => {
    const state = useTransactionStore.getState();
    return state.allTransactions.filter((t: Transaction) => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });
  }
}));
export const useDistributionStore = create<any>((set) => ({ orders: mockDistributionOrders, allOrders: mockDistributionOrders, syncWithBranch: () => {}, addOrder: () => {}, updateOrder: () => {}, deleteOrder: () => {} }));
export const usePurchaseStore = create<any>((set) => ({ purchaseOrders: mockPurchaseOrders, allPOs: mockPurchaseOrders, syncWithBranch: () => {}, addPO: () => {}, updatePO: () => {}, deletePO: () => {} }));
export const useFinanceStore = create<any>((set) => ({ expenses: mockExpenses, allExpenses: mockExpenses, payables: mockPayables, allPayables: mockPayables, receivables: mockReceivables, allReceivables: mockReceivables, syncWithBranch: () => {}, addExpense: () => {}, removeExpense: () => {}, markPayablePaid: () => {}, markReceivableCollected: () => {} }));
export const useSupplierStore = create<any>((set) => ({ suppliers: mockSuppliers, allSuppliers: mockSuppliers, syncWithBranch: () => {}, addSupplier: () => {}, updateSupplier: () => {}, deleteSupplier: () => {} }));
export const useSettingsStore = create<any>((set) => ({ settings: { companyName: 'A7 Smart POS' }, updateSettings: () => {} }));
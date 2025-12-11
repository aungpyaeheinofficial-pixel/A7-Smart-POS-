
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  PHARMACIST = 'PHARMACIST',
  CASHIER = 'CASHIER'
}

export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  EXPIRED = 'EXPIRED'
}

export type SyncStatus = 'PENDING' | 'SYNCED' | 'ERROR';

// Unit Types for General Retail / Mini-Mart
export interface UnitType {
  code: string;
  nameEn: string;
  nameMm: string;
}

export const UNIT_TYPES: UnitType[] = [
  { code: 'PCS', nameEn: 'Pcs', nameMm: 'ခု' },
  { code: 'PACK', nameEn: 'Pack', nameMm: 'ထုပ်' },
  { code: 'BOTTLE', nameEn: 'Bottle', nameMm: 'ပုလင်း' },
  { code: 'CAN', nameEn: 'Can', nameMm: 'ဗူး' },
  { code: 'CARTON', nameEn: 'Carton', nameMm: 'ကဒ်' },
  { code: 'BOX', nameEn: 'Box', nameMm: 'သေတ္တာ' },
  { code: 'KG', nameEn: 'Kilogram', nameMm: 'ကီလို' },
  { code: 'LITER', nameEn: 'Liter', nameMm: 'လီတာ' },
  { code: 'TIN', nameEn: 'Tin', nameMm: 'သံဗူး' },
  { code: 'ROLL', nameEn: 'Roll', nameMm: 'လိပ်' },
  { code: 'BUNDLE', nameEn: 'Bundle', nameMm: 'စည်း' },
  { code: 'TRAY', nameEn: 'Tray', nameMm: 'ခွက်' }
];

export interface ScannedItem {
  id: string;
  gtin: string | null;
  productName?: string;
  batchNumber: string | null;
  expiryDate: string | null;
  serialNumber: string | null;
  quantity: number;
  unit?: string;
  timestamp: number;
  syncStatus: SyncStatus;
  syncMessage?: string;
  rawData: string;
  type: string;
  scannedBy: string;
  // Verification Fields
  verified?: boolean;
  location?: string;
  costPrice?: number;
  sellingPrice?: number;
}

export interface SyncLog {
  id: string;
  scanId: string;
  action: 'INSERT' | 'UPDATE';
  productName: string;
  oldQuantity: number;
  newQuantity: number;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  status: 'active' | 'inactive' | 'archived';
  archivedAt?: string;
  logoUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  branchId?: string; // Optional: if user is restricted to a branch
}

export interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string; // ISO date
  quantity: number;
  costPrice: number;
}

export interface Product {
  id: string;
  sku: string;
  gtin?: string; // Global Trade Item Number (GS1)
  nameEn: string;
  nameMm: string;
  genericName?: string;
  category: string;
  description?: string;
  price: number;
  image: string;
  stockLevel: number;
  unit: string; // Main tracking unit
  minStockLevel: number;
  batches: Batch[];
  requiresPrescription: boolean;
  branchId: string;
  location?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  branchId: string;
}

export interface CartItem extends Product {
  cartId: string; // unique ID for cart entry
  selectedBatchId?: string;
  quantity: number;
  discount: number;
  // Enhanced Scanning Data
  transaction_data?: {
    scanned_batch: string | null;
    scanned_expiry: string | null;
    scanned_serial: string | null;
    scanned_at: string;
    raw_barcode: string;
  };
  warning_flags?: string[]; // 'EXPIRED', 'NEAR_EXPIRY'
  manager_override?: boolean;
}

export interface Sale {
  id: string;
  date: string;
  total: number;
  items: CartItem[];
  customer?: Customer;
  cashierId: string;
  paymentMethod: 'CASH' | 'CARD' | 'KBZ_PAY';
  branchId: string;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  date: string; // ISO Date YYYY-MM-DD
  description: string;
  paymentMethod?: string;
  branchId: string;
}

// Distribution Types
export interface DistributionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface DistributionOrder {
  id: string;
  customer: string;
  address: string;
  status: 'PENDING' | 'PACKING' | 'DELIVERING' | 'COMPLETED';
  total: number;
  date: string;
  deliveryTime: string;
  paymentType: 'CASH' | 'CREDIT';
  itemsList: DistributionItem[];
  branchId: string;
}

// Purchase Types
export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  paymentType: 'CASH' | 'CREDIT';
  items: PurchaseItem[];
  totalAmount: number;
  notes?: string;
  branchId: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  credit: number;
  outstanding: number;
  branchId: string;
}

// Finance Types
export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'PAID' | 'PENDING';
  branchId: string;
}

export interface Payable {
  id: string;
  supplierName: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  status: 'OVERDUE' | 'DUE_SOON' | 'NORMAL';
  branchId: string;
}

export interface Receivable {
  id: string;
  customerName: string;
  orderId: string;
  amount: number;
  dueDate: string;
  status: 'OVERDUE' | 'NORMAL';
  branchId: string;
}

export interface AppSettings {
  companyName: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  language: string;
  shopNameReceipt: string;
  receiptFooter: string;
  paperSize: string;
  defaultPrinter: string;
  autoPrint: boolean;
  showImages: boolean;
  lowStockLimit: number;
  expiryWarningDays: number;
  enableEmailReports: boolean;
  enableCriticalAlerts: boolean;
  notificationEmail: string;
}

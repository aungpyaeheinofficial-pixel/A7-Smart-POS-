
import { Product, Role, User, Customer, Transaction, DistributionOrder, PurchaseOrder, Expense, Payable, Receivable, Supplier } from './types';

// Branches
// b1: Main Store
// b2: Branch Store

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Kaung Kaung',
    email: 'admin@a7systems.com',
    role: Role.ADMIN,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
  },
  {
    id: 'u2',
    name: 'Kyaw Kyaw',
    email: 'pos@a7systems.com',
    role: Role.CASHIER,
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    branchId: 'b1'
  }
];

export const mockCustomers: Customer[] = [
  { id: 'c1', name: 'U Ba Maung', phone: '095123456', points: 1250, tier: 'Gold', branchId: 'b1' },
  { id: 'c2', name: 'Daw Hla', phone: '097987654', points: 450, tier: 'Silver', branchId: 'b1' },
  { id: 'c3', name: 'Ko Aung', phone: '092500112', points: 2100, tier: 'Platinum', branchId: 'b2' },
  { id: 'c4', name: 'City Mart HQ', phone: '099999999', points: 5000, tier: 'Platinum', branchId: 'b1' },
  { id: 'c5', name: 'Sein Gay Har', phone: '098888888', points: 12000, tier: 'Platinum', branchId: 'b2' }
];

export const mockProducts: Product[] = [
  // Beverages
  {
    id: 'p1',
    sku: '8851959132014',
    gtin: '08851959132014',
    nameEn: 'Coca-Cola 330ml Can',
    nameMm: 'ကိုကာကိုလာ ၃၃၀ မီလီ',
    category: 'Beverages',
    description: 'Original Taste Carbonated Soft Drink',
    price: 800,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    stockLevel: 150,
    minStockLevel: 24,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'CAN',
    batches: [
      { id: 'b1', batchNumber: 'LOT-202401', expiryDate: '2025-06-01', quantity: 150, costPrice: 600 }
    ]
  },
  {
    id: 'p2',
    sku: '8850029003552',
    gtin: '08850029003552',
    nameEn: 'Purified Drinking Water 600ml',
    nameMm: 'သောက်ရေသန့် ၆၀၀ မီလီ',
    category: 'Beverages',
    price: 300,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=200',
    stockLevel: 500,
    minStockLevel: 100,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'BOTTLE',
    batches: [
         { id: 'b2', batchNumber: 'W-001', expiryDate: '2025-12-31', quantity: 500, costPrice: 150 }
    ]
  },
  // Snacks
  {
    id: 'p3',
    sku: '8851727003011',
    nameEn: 'Oishi Potato Chips (Lobster)',
    nameMm: 'အိုရှီ အာလူးကြော် (ပုဇွန်)',
    category: 'Snacks',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=200',
    stockLevel: 45,
    minStockLevel: 20,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'PACK',
    batches: [
         { id: 'b3', batchNumber: 'S-101', expiryDate: '2024-09-15', quantity: 45, costPrice: 900 }
    ]
  },
  {
      id: 'p9',
      sku: '8854444555666',
      nameEn: 'Instant Noodles (Chicken)',
      nameMm: 'ခေါက်ဆွဲခြောက် ကြက်သားအရသာ',
      category: 'Pantry',
      price: 500,
      image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=200',
      stockLevel: 200,
      minStockLevel: 50,
      requiresPrescription: false,
      branchId: 'b1',
      unit: 'PACK',
      batches: [
          { id: 'b9', batchNumber: 'NDL-22', expiryDate: '2024-12-12', quantity: 200, costPrice: 350 }
      ]
  },
  // Bakery
  {
    id: 'p4',
    sku: '8850123123123',
    nameEn: 'Sandwich Bread (Large)',
    nameMm: 'ပေါင်မုန့် (အကြီး)',
    category: 'Bakery',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&q=80&w=200',
    stockLevel: 12,
    minStockLevel: 10,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'PACK',
    batches: [
         { id: 'b4', batchNumber: 'D-0312', expiryDate: '2024-03-18', quantity: 12, costPrice: 1800 }
    ]
  },
  // Dairy
  {
    id: 'p5',
    sku: '8850324111222',
    nameEn: 'Dutch Mill Yogurt Strawberry',
    nameMm: 'ဒတ်ချ်မီ ယိုဂတ် စတော်ဘယ်ရီ',
    category: 'Dairy',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1571212515416-f22350ca10b6?auto=format&fit=crop&q=80&w=200',
    stockLevel: 30,
    minStockLevel: 20,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'CARTON',
    batches: [
        { id: 'b5', batchNumber: 'D-202', expiryDate: '2024-04-01', quantity: 30, costPrice: 1100 }
    ]
  },
  // Pantry
  {
    id: 'p6',
    sku: '8851111222333',
    nameEn: 'Sunflower Cooking Oil (1 Liter)',
    nameMm: 'နေကြာဆီ ၁ လီတာ',
    category: 'Pantry',
    price: 5500,
    image: 'https://images.unsplash.com/photo-1474979266404-7cadd259d3d7?auto=format&fit=crop&q=80&w=200',
    stockLevel: 80,
    minStockLevel: 15,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'BOTTLE',
    batches: [
        { id: 'b6', batchNumber: 'OIL-01', expiryDate: '2025-05-20', quantity: 80, costPrice: 4200 }
    ]
  },
  {
      id: 'p11',
      sku: '8856666777888',
      nameEn: 'Premium Rice 5kg',
      nameMm: 'ပေါ်ဆန်းမွှေး ၅ ကီလို',
      category: 'Pantry',
      price: 18500,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=200',
      stockLevel: 20,
      minStockLevel: 5,
      requiresPrescription: false,
      branchId: 'b1',
      unit: 'PACK',
      batches: [
          { id: 'b11', batchNumber: 'R-099', expiryDate: '2025-01-01', quantity: 20, costPrice: 16000 }
      ]
  },
  // Household
  {
    id: 'p7',
    sku: '8852222333444',
    nameEn: 'Liquid Detergent 500ml',
    nameMm: 'ဆပ်ပြာရည် ၅၀၀ မီလီ',
    category: 'Household',
    price: 3200,
    image: 'https://images.unsplash.com/photo-1585838030999-73602506e768?auto=format&fit=crop&q=80&w=200',
    stockLevel: 60,
    minStockLevel: 10,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'BOTTLE',
    batches: [
        { id: 'b7', batchNumber: 'DET-09', expiryDate: '2026-01-01', quantity: 60, costPrice: 2400 }
    ]
  },
  {
      id: 'p12',
      sku: '8857777888999',
      nameEn: 'Toilet Paper (6 Rolls)',
      nameMm: 'တစ်ရှူးလိပ် (၆ လိပ်)',
      category: 'Household',
      price: 2800,
      image: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&q=80&w=200',
      stockLevel: 40,
      minStockLevel: 10,
      requiresPrescription: false,
      branchId: 'b1',
      unit: 'PACK',
      batches: [
          { id: 'b12', batchNumber: 'TP-101', expiryDate: '2099-01-01', quantity: 40, costPrice: 2000 }
      ]
  },
  // Personal Care
  {
    id: 'p8',
    sku: '8853333444555',
    nameEn: 'Clear Shampoo 350ml',
    nameMm: 'ကလီးယား ခေါင်းလျှော်ရည်',
    category: 'Personal Care',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&q=80&w=200',
    stockLevel: 25,
    minStockLevel: 10,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'BOTTLE',
    batches: [
        { id: 'b8', batchNumber: 'SH-01', expiryDate: '2026-06-01', quantity: 25, costPrice: 3500 }
    ]
  },
  {
      id: 'p13',
      sku: '8858888999000',
      nameEn: 'Colgate Toothpaste 150g',
      nameMm: 'သွားတိုက်ဆေး',
      category: 'Personal Care',
      price: 2200,
      image: 'https://images.unsplash.com/photo-1559304761-4191c496924b?auto=format&fit=crop&q=80&w=200',
      stockLevel: 50,
      minStockLevel: 15,
      requiresPrescription: false,
      branchId: 'b1',
      unit: 'BOX',
      batches: [
          { id: 'b13', batchNumber: 'COL-55', expiryDate: '2026-02-01', quantity: 50, costPrice: 1800 }
      ]
  },
  // More Beverages
  {
    id: 'p10',
    sku: '8855555666777',
    nameEn: 'Energy Drink 250ml',
    nameMm: 'အားဖြည့်အချိုရည်',
    category: 'Beverages',
    price: 1000,
    image: '',
    stockLevel: 100,
    minStockLevel: 24,
    requiresPrescription: false,
    branchId: 'b1',
    unit: 'CAN',
    batches: [
         { id: 'b10', batchNumber: 'ED-001', expiryDate: '2025-08-01', quantity: 100, costPrice: 700 }
    ]
  },
  {
      id: 'p14',
      sku: '8859999000111',
      nameEn: 'Orange Juice 1L',
      nameMm: 'လိမ္မော်ရည် ၁ လီတာ',
      category: 'Beverages',
      price: 2800,
      image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=200',
      stockLevel: 36,
      minStockLevel: 12,
      requiresPrescription: false,
      branchId: 'b1',
      unit: 'CARTON',
      batches: [
          { id: 'b14', batchNumber: 'OJ-99', expiryDate: '2024-11-30', quantity: 36, costPrice: 2000 }
      ]
  },
  // Snacks
  {
      id: 'p15',
      sku: '8850000111222',
      nameEn: 'Sunflower Seeds 100g',
      nameMm: 'နေကြာစေ့',
      category: 'Snacks',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1516641396056-0ce60a85d49f?auto=format&fit=crop&q=80&w=200',
      stockLevel: 60,
      minStockLevel: 15,
      requiresPrescription: false,
      branchId: 'b1',
      unit: 'PACK',
      batches: [
          { id: 'b15', batchNumber: 'SUN-11', expiryDate: '2025-03-15', quantity: 60, costPrice: 1000 }
      ]
  }
];

export const mockTransactions: Transaction[] = [
  { id: 't1', type: 'INCOME', category: 'Sales', amount: 15000, date: '2024-03-10', description: 'Daily Sales', branchId: 'b1', paymentMethod: 'CASH' },
  { id: 't2', type: 'EXPENSE', category: 'Utilities', amount: 50000, date: '2024-03-08', description: 'Electricity Bill', branchId: 'b1' },
  { id: 't3', type: 'INCOME', category: 'Sales', amount: 25000, date: '2024-03-11', description: 'Daily Sales', branchId: 'b2', paymentMethod: 'KBZ_PAY' },
  { id: 't4', type: 'INCOME', category: 'Sales', amount: 4500, date: '2024-03-12', description: 'POS Sale', branchId: 'b1', paymentMethod: 'CASH' }
];

export const mockDistributionOrders: DistributionOrder[] = [
  { 
      id: 'ord1', 
      customer: 'City Mart HQ', 
      address: 'No 1, Pyay Rd', 
      status: 'PENDING', 
      total: 150000, 
      date: '2024-03-12', 
      deliveryTime: '10:00', 
      paymentType: 'CREDIT', 
      branchId: 'b1',
      itemsList: [
          { id: 'di1', name: 'Coca-Cola 330ml Can', quantity: 100, price: 800 },
          { id: 'di2', name: 'Oishi Potato Chips', quantity: 50, price: 1200 }
      ]
  },
  {
      id: 'ord2',
      customer: 'Sein Gay Har',
      address: 'Hledan Center',
      status: 'DELIVERING',
      total: 50000,
      date: '2024-03-11',
      deliveryTime: '14:00',
      paymentType: 'CASH',
      branchId: 'b1',
      itemsList: [
          { id: 'di3', name: 'Purified Drinking Water', quantity: 30, price: 300 }
      ]
  }
];

export const mockPurchaseOrders: PurchaseOrder[] = [
    {
        id: 'po1',
        supplierId: 's1',
        supplierName: 'Coca-Cola PCL',
        date: '2024-03-01',
        status: 'RECEIVED',
        paymentType: 'CREDIT',
        items: [
            { id: 'pi1', name: 'Coca-Cola 330ml Can', quantity: 1000, unitCost: 600 }
        ],
        totalAmount: 600000,
        notes: 'Monthly restock',
        branchId: 'b1'
    },
    {
        id: 'po2',
        supplierId: 's2',
        supplierName: 'Unilever Myanmar',
        date: '2024-03-05',
        status: 'PENDING',
        paymentType: 'CASH',
        items: [
             { id: 'pi2', name: 'Clear Shampoo 350ml', quantity: 100, unitCost: 3500 }
        ],
        totalAmount: 350000,
        branchId: 'b1'
    }
];

export const mockExpenses: Expense[] = [
    { id: 'e1', category: 'Rent', amount: 300000, date: '2024-03-01', description: 'Shop Rent March', status: 'PAID', branchId: 'b1' },
    { id: 'e2', category: 'Salary', amount: 150000, date: '2024-03-01', description: 'Staff Salary', status: 'PAID', branchId: 'b1' },
    { id: 'e3', category: 'Maintenance', amount: 25000, date: '2024-03-10', description: 'AC Repair', status: 'PENDING', branchId: 'b1' }
];

export const mockSuppliers: Supplier[] = [
    { id: 's1', name: 'Coca-Cola PCL', contact: '091234567', email: 'sales@coke.com.mm', credit: 1000000, outstanding: 600000, branchId: 'b1' },
    { id: 's2', name: 'Unilever Myanmar', contact: '098765432', email: 'sales@unilever.com.mm', credit: 500000, outstanding: 0, branchId: 'b1' },
    { id: 's3', name: 'Oishi Group', contact: '0945454545', email: 'order@oishi.com', credit: 300000, outstanding: 100000, branchId: 'b1' }
];

export const mockPayables: Payable[] = [
    { id: 'py1', supplierName: 'Coca-Cola PCL', invoiceNo: 'INV-001', amount: 600000, dueDate: '2024-03-31', status: 'DUE_SOON', branchId: 'b1' }
];

export const mockReceivables: Receivable[] = [
    { id: 'rc1', customerName: 'City Mart HQ', orderId: 'ord1', amount: 150000, dueDate: '2024-03-20', status: 'NORMAL', branchId: 'b1' }
];

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Database seed script
 * Creates initial data for development/testing
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // Get admin password from environment or use default
  const adminPassword = process.env.ADMIN_PASSWORD || 'password';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { code: 'main-01' },
    update: {},
    create: {
      id: 'b1',
      name: 'Main Store',
      code: 'main-01',
      address: 'No. 45, Arzarni Road, Dawei',
      phone: '09-420012345',
      managerName: 'U Mg Mg',
      email: 'branch1@a7systems.com',
      status: 'active',
    },
  });

  console.log('✅ Created branch:', branch.name);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@a7systems.com' },
    update: {
      passwordHash,
    },
    create: {
      id: 'u1',
      email: 'admin@a7systems.com',
      passwordHash,
      name: 'Kaung Kaung',
      role: 'ADMIN',
      branchId: branch.id,
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create cashier user
  const cashier = await prisma.user.upsert({
    where: { email: 'pos@a7systems.com' },
    update: {},
    create: {
      id: 'u2',
      email: 'pos@a7systems.com',
      passwordHash: await bcrypt.hash('password', 10),
      name: 'Kyaw Kyaw',
      role: 'CASHIER',
      branchId: branch.id,
      isActive: true,
    },
  });

  console.log('✅ Created cashier user:', cashier.email);

  // Create sample customers
  const customers = [
    {
      id: 'c1',
      name: 'U Ba Maung',
      phone: '095123456',
      points: 1250,
      tier: 'Gold',
      branchId: branch.id,
    },
    {
      id: 'c2',
      name: 'Daw Hla',
      phone: '097987654',
      points: 450,
      tier: 'Silver',
      branchId: branch.id,
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {},
      create: customer,
    });
  }

  console.log(`✅ Created ${customers.length} customers`);

  // Create sample suppliers
  const suppliers = [
    {
      id: 's1',
      name: 'Coca-Cola PCL',
      contact: '091234567',
      email: 'sales@coke.com.mm',
      credit: 1000000,
      outstanding: 600000,
      branchId: branch.id,
    },
    {
      id: 's2',
      name: 'Unilever Myanmar',
      contact: '098765432',
      email: 'sales@unilever.com.mm',
      credit: 500000,
      outstanding: 0,
      branchId: branch.id,
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: {},
      create: supplier,
    });
  }

  console.log(`✅ Created ${suppliers.length} suppliers`);

  // Create sample products with batches
  const products = [
    {
      id: 'p1',
      sku: '8851959132014',
      gtin: '08851959132014',
      nameEn: 'Coca-Cola 330ml Can',
      nameMm: 'ကိုကာကိုလာ ၃၃၀ မီလီ',
      category: 'Beverages',
      description: 'Original Taste Carbonated Soft Drink',
      price: 800,
      stockLevel: 150,
      minStockLevel: 24,
      unit: 'CAN',
      requiresPrescription: false,
      branchId: branch.id,
      batches: {
        create: [
          {
            batchNumber: 'LOT-202401',
            expiryDate: new Date('2025-06-01'),
            quantity: 150,
            costPrice: 600,
          },
        ],
      },
    },
    {
      id: 'p2',
      sku: '8850029003552',
      gtin: '08850029003552',
      nameEn: 'Purified Drinking Water 600ml',
      nameMm: 'သောက်ရေသန့် ၆၀၀ မီလီ',
      category: 'Beverages',
      price: 300,
      stockLevel: 500,
      minStockLevel: 100,
      unit: 'BOTTLE',
      requiresPrescription: false,
      branchId: branch.id,
      batches: {
        create: [
          {
            batchNumber: 'W-001',
            expiryDate: new Date('2025-12-31'),
            quantity: 500,
            costPrice: 150,
          },
        ],
      },
    },
  ];

  for (const product of products) {
    const { batches, ...productData } = product;
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        ...productData,
        batches,
      },
    });
  }

  console.log(`✅ Created ${products.length} products with batches`);

  // Create sample transactions
  const transactions = [
    {
      id: 't1',
      type: 'INCOME',
      category: 'Sales',
      amount: 15000,
      date: new Date('2024-03-10'),
      description: 'Daily Sales',
      paymentMethod: 'CASH',
      branchId: branch.id,
      userId: admin.id,
    },
    {
      id: 't2',
      type: 'EXPENSE',
      category: 'Utilities',
      amount: 50000,
      date: new Date('2024-03-08'),
      description: 'Electricity Bill',
      branchId: branch.id,
      userId: admin.id,
    },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.upsert({
      where: { id: transaction.id },
      update: {},
      create: transaction,
    });
  }

  console.log(`✅ Created ${transactions.length} transactions`);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin: admin@a7systems.com / ' + adminPassword);
  console.log('   Cashier: pos@a7systems.com / password');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


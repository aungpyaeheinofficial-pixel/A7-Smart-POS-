import { Router } from 'express';
import authRouter from './api/auth.js';
import productsRouter from './api/products.js';
import batchesRouter from './api/batches.js';
import customersRouter from './api/customers.js';
import branchesRouter from './api/branches.js';
import transactionsRouter from './api/transactions.js';
import purchaseOrdersRouter from './api/purchaseOrders.js';
import distributionOrdersRouter from './api/distributionOrders.js';
import suppliersRouter from './api/suppliers.js';
import expensesRouter from './api/expenses.js';

const router = Router();

// Mount route modules
router.use('/auth', authRouter);
router.use('/products', productsRouter);
router.use('/products/:productId/batches', batchesRouter);
router.use('/customers', customersRouter);
router.use('/branches', branchesRouter);
router.use('/transactions', transactionsRouter);
router.use('/purchase-orders', purchaseOrdersRouter);
router.use('/distribution-orders', distributionOrdersRouter);
router.use('/suppliers', suppliersRouter);
router.use('/expenses', expensesRouter);

export default router;


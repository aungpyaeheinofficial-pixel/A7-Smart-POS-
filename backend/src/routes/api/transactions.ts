import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { HttpErrors } from '../../utils/httpError.js';

const router = Router();

/**
 * Transaction validation schemas
 */
const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  description: z.string().min(1),
  paymentMethod: z.enum(['CASH', 'CARD', 'KBZ_PAY']).optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

/**
 * GET /api/v1/transactions
 * List all transactions for current branch
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const { type, startDate, endDate } = req.query;

      const where: {
        branchId: string;
        type?: string;
        date?: { gte?: Date; lte?: Date };
      } = {
        branchId: req.user.branchId,
      };

      if (type && (type === 'INCOME' || type === 'EXPENSE')) {
        where.type = type;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) {
          where.date.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.date.lte = new Date(endDate as string);
        }
      }

      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: {
          date: 'desc',
        },
        take: 1000, // Limit to prevent huge responses
      });

      res.json(transactions);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/transactions/:id
 * Get single transaction
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const transaction = await prisma.transaction.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!transaction) {
        throw HttpErrors.notFound('Transaction not found');
      }

      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/transactions
 * Create new transaction
 */
router.post(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const data = createTransactionSchema.parse(req.body);

      const transaction = await prisma.transaction.create({
        data: {
          ...data,
          branchId: req.user.branchId,
          userId: req.user.id,
        },
      });

      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/transactions/:id
 * Update transaction (admin/manager only)
 */
router.patch(
  '/:id',
  requireAuth,
  requirePermission('ADMIN', 'MANAGER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const data = updateTransactionSchema.parse(req.body);

      const existing = await prisma.transaction.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Transaction not found');
      }

      const transaction = await prisma.transaction.update({
        where: { id: req.params.id },
        data,
      });

      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }
);

export default router;


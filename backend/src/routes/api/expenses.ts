import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { HttpErrors } from '../../utils/httpError.js';

const router = Router();

/**
 * Expense validation schemas
 */
const createExpenseSchema = z.object({
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  description: z.string().min(1),
  status: z.enum(['PAID', 'PENDING']).default('PENDING'),
});

const updateExpenseSchema = createExpenseSchema.partial();

/**
 * GET /api/v1/expenses
 * List all expenses for current branch
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const expenses = await prisma.expense.findMany({
        where: {
          branchId: req.user.branchId,
        },
        orderBy: {
          date: 'desc',
        },
      });

      res.json(expenses);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/expenses/:id
 * Get single expense
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const expense = await prisma.expense.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!expense) {
        throw HttpErrors.notFound('Expense not found');
      }

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/expenses
 * Create new expense
 */
router.post(
  '/',
  requireAuth,
  requirePermission('ADMIN', 'MANAGER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const data = createExpenseSchema.parse(req.body);

      const expense = await prisma.expense.create({
        data: {
          ...data,
          branchId: req.user.branchId,
        },
      });

      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/expenses/:id
 * Update expense
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

      const data = updateExpenseSchema.parse(req.body);

      const existing = await prisma.expense.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Expense not found');
      }

      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data,
      });

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/expenses/:id
 * Delete expense
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermission('ADMIN', 'MANAGER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const existing = await prisma.expense.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Expense not found');
      }

      await prisma.expense.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;


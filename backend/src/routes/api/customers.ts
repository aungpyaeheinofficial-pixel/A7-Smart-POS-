import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { HttpErrors } from '../../utils/httpError.js';

const router = Router();

/**
 * Customer validation schemas
 */
const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  points: z.coerce.number().int().min(0).default(0),
  tier: z.enum(['Silver', 'Gold', 'Platinum']).default('Silver'),
});

const updateCustomerSchema = createCustomerSchema.partial();

/**
 * GET /api/v1/customers
 * List all customers for current branch
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const customers = await prisma.customer.findMany({
        where: {
          branchId: req.user.branchId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(customers);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/customers/:id
 * Get single customer
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const customer = await prisma.customer.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!customer) {
        throw HttpErrors.notFound('Customer not found');
      }

      res.json(customer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/customers
 * Create new customer
 */
router.post(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const data = createCustomerSchema.parse(req.body);

      const customer = await prisma.customer.create({
        data: {
          ...data,
          branchId: req.user.branchId,
        },
      });

      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/customers/:id
 * Update customer
 */
router.patch(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const data = updateCustomerSchema.parse(req.body);

      const existing = await prisma.customer.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Customer not found');
      }

      const customer = await prisma.customer.update({
        where: { id: req.params.id },
        data,
      });

      res.json(customer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/customers/:id
 * Delete customer
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

      const existing = await prisma.customer.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Customer not found');
      }

      await prisma.customer.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;


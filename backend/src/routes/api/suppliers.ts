import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { HttpErrors } from '../../utils/httpError.js';

const router = Router();

/**
 * Supplier validation schemas
 */
const createSupplierSchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  credit: z.coerce.number().min(0).default(0),
  outstanding: z.coerce.number().min(0).default(0),
});

const updateSupplierSchema = createSupplierSchema.partial();

/**
 * GET /api/v1/suppliers
 * List all suppliers for current branch
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const suppliers = await prisma.supplier.findMany({
        where: {
          branchId: req.user.branchId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/suppliers/:id
 * Get single supplier
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const supplier = await prisma.supplier.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!supplier) {
        throw HttpErrors.notFound('Supplier not found');
      }

      res.json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/suppliers
 * Create new supplier
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

      const data = createSupplierSchema.parse(req.body);

      const supplier = await prisma.supplier.create({
        data: {
          ...data,
          branchId: req.user.branchId,
        },
      });

      res.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/suppliers/:id
 * Update supplier
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

      const data = updateSupplierSchema.parse(req.body);

      const existing = await prisma.supplier.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Supplier not found');
      }

      const supplier = await prisma.supplier.update({
        where: { id: req.params.id },
        data,
      });

      res.json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/suppliers/:id
 * Delete supplier
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

      const existing = await prisma.supplier.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Supplier not found');
      }

      await prisma.supplier.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;


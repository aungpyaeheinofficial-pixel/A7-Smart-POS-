import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { HttpErrors } from '../../utils/httpError.js';

const router = Router();

/**
 * Distribution Order validation schemas
 */
const distributionOrderItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().positive(),
});

const createDistributionOrderSchema = z.object({
  customer: z.string().min(1),
  address: z.string().min(1),
  status: z.enum(['PENDING', 'PACKING', 'DELIVERING', 'COMPLETED']).default('PENDING'),
  date: z.coerce.date(),
  deliveryTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm format
  paymentType: z.enum(['CASH', 'CREDIT']).default('CASH'),
  items: z.array(distributionOrderItemSchema).min(1),
});

const updateDistributionOrderSchema = createDistributionOrderSchema.partial();

/**
 * GET /api/v1/distribution-orders
 * List all distribution orders for current branch
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const distributionOrders = await prisma.distributionOrder.findMany({
        where: {
          branchId: req.user.branchId,
        },
        include: {
          items: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      res.json(distributionOrders);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/distribution-orders/:id
 * Get single distribution order
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const distributionOrder = await prisma.distributionOrder.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
        include: {
          items: true,
        },
      });

      if (!distributionOrder) {
        throw HttpErrors.notFound('Distribution order not found');
      }

      res.json(distributionOrder);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/distribution-orders
 * Create new distribution order
 */
router.post(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const data = createDistributionOrderSchema.parse(req.body);

      // Calculate total
      const total = data.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      const distributionOrder = await prisma.distributionOrder.create({
        data: {
          ...data,
          total,
          branchId: req.user.branchId,
          items: {
            create: data.items,
          },
        },
        include: {
          items: true,
        },
      });

      res.status(201).json(distributionOrder);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/distribution-orders/:id
 * Update distribution order
 */
router.patch(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const data = updateDistributionOrderSchema.parse(req.body);

      const existing = await prisma.distributionOrder.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Distribution order not found');
      }

      // Calculate total if items updated
      const { items, ...updateData } = data;
      let total: number = Number(existing.total);
      if (items) {
        total = items.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        );
      }

      const distributionOrder = await prisma.distributionOrder.update({
        where: { id: req.params.id },
        data: {
          ...updateData,
          total,
          ...(items && {
            items: {
              deleteMany: {},
              create: items,
            },
          }),
        },
        include: {
          items: true,
        },
      });

      res.json(distributionOrder);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/distribution-orders/:id
 * Delete distribution order
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

      const existing = await prisma.distributionOrder.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Distribution order not found');
      }

      await prisma.distributionOrder.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;


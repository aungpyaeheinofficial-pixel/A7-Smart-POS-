import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { HttpErrors } from '../../utils/httpError.js';

const router = Router();

/**
 * Purchase Order validation schemas
 */
const purchaseOrderItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().positive(),
});

const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  date: z.coerce.date(),
  status: z.enum(['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED']).default('PENDING'),
  paymentType: z.enum(['CASH', 'CREDIT']).default('CASH'),
  items: z.array(purchaseOrderItemSchema).min(1),
  notes: z.string().optional(),
});

const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

/**
 * GET /api/v1/purchase-orders
 * List all purchase orders for current branch
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
          branchId: req.user.branchId,
        },
        include: {
          supplier: true,
          items: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      res.json(purchaseOrders);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/purchase-orders/:id
 * Get single purchase order
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const purchaseOrder = await prisma.purchaseOrder.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
        include: {
          supplier: true,
          items: true,
        },
      });

      if (!purchaseOrder) {
        throw HttpErrors.notFound('Purchase order not found');
      }

      res.json(purchaseOrder);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/purchase-orders
 * Create new purchase order
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

      const data = createPurchaseOrderSchema.parse(req.body);

      // Verify supplier exists
      const supplier = await prisma.supplier.findFirst({
        where: {
          id: data.supplierId,
          branchId: req.user.branchId,
        },
      });

      if (!supplier) {
        throw HttpErrors.notFound('Supplier not found');
      }

      // Calculate total
      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0
      );

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          supplierId: data.supplierId,
          supplierName: supplier.name,
          date: data.date,
          status: data.status,
          paymentType: data.paymentType,
          totalAmount,
          notes: data.notes,
          branchId: req.user.branchId,
          items: {
            create: data.items,
          },
        },
        include: {
          supplier: true,
          items: true,
        },
      });

      res.status(201).json(purchaseOrder);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/purchase-orders/:id
 * Update purchase order
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

      const data = updatePurchaseOrderSchema.parse(req.body);

      const existing = await prisma.purchaseOrder.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Purchase order not found');
      }

      // Handle items update
      let totalAmount = existing.totalAmount;
      if (data.items) {
        totalAmount = data.items.reduce(
          (sum, item) => sum + item.quantity * item.unitCost,
          0
        );
      }

      const purchaseOrder = await prisma.purchaseOrder.update({
        where: { id: req.params.id },
        data: {
          ...data,
          totalAmount,
          ...(data.items && {
            items: {
              deleteMany: {},
              create: data.items,
            },
          }),
        },
        include: {
          supplier: true,
          items: true,
        },
      });

      res.json(purchaseOrder);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/purchase-orders/:id
 * Delete purchase order
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

      const existing = await prisma.purchaseOrder.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Purchase order not found');
      }

      await prisma.purchaseOrder.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;


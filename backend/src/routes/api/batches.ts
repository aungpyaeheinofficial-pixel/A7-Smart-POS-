import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { HttpErrors } from '../../utils/httpError.js';

const router = Router({ mergeParams: true }); // mergeParams allows :productId from parent route

/**
 * Batch validation schemas
 */
const createBatchSchema = z.object({
  batchNumber: z.string().min(1),
  expiryDate: z.coerce.date(),
  quantity: z.coerce.number().int().min(0),
  costPrice: z.coerce.number().positive(),
});

const updateBatchSchema = createBatchSchema.partial();

/**
 * GET /api/v1/products/:productId/batches
 * List all batches for a product
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const productId = req.params.productId as string;

      // Verify product exists and belongs to user's branch
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          branchId: req.user.branchId,
        },
      });

      if (!product) {
        throw HttpErrors.notFound('Product not found');
      }

      const batches = await prisma.batch.findMany({
        where: {
          productId,
        },
        orderBy: {
          expiryDate: 'asc',
        },
      });

      res.json(batches);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/products/:productId/batches/:id
 * Get single batch
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const productId = req.params.productId as string;
      const batchId = req.params.id as string;

      // Verify product exists and belongs to user's branch
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          branchId: req.user.branchId,
        },
      });

      if (!product) {
        throw HttpErrors.notFound('Product not found');
      }

      const batch = await prisma.batch.findFirst({
        where: {
          id: batchId,
          productId,
        },
      });

      if (!batch) {
        throw HttpErrors.notFound('Batch not found');
      }

      res.json(batch);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/products/:productId/batches
 * Create new batch (add stock)
 */
router.post(
  '/',
  requireAuth,
  requirePermission('ADMIN', 'MANAGER', 'PHARMACIST'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const productId = req.params.productId as string;
      const data = createBatchSchema.parse(req.body);

      // Verify product exists and belongs to user's branch
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          branchId: req.user.branchId,
        },
      });

      if (!product) {
        throw HttpErrors.notFound('Product not found');
      }

      // Check if batch with same batch number exists
      const existingBatch = await prisma.batch.findFirst({
        where: {
          productId,
          batchNumber: data.batchNumber,
        },
      });

      if (existingBatch) {
        // Update existing batch quantity
        const batch = await prisma.batch.update({
          where: { id: existingBatch.id },
          data: {
            quantity: existingBatch.quantity + data.quantity,
            costPrice: data.costPrice, // Update cost price
          },
        });

        // Update product stock level
        await prisma.product.update({
          where: { id: productId },
          data: {
            stockLevel: product.stockLevel + data.quantity,
          },
        });

        res.json(batch);
      } else {
        // Create new batch
        const batch = await prisma.batch.create({
          data: {
            ...data,
            productId,
          },
        });

        // Update product stock level
        await prisma.product.update({
          where: { id: productId },
          data: {
            stockLevel: product.stockLevel + data.quantity,
          },
        });

        res.status(201).json(batch);
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/products/:productId/batches/:id
 * Update batch
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

      const productId = req.params.productId as string;
      const batchId = req.params.id as string;
      const data = updateBatchSchema.parse(req.body);

      // Verify product exists and belongs to user's branch
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          branchId: req.user.branchId,
        },
      });

      if (!product) {
        throw HttpErrors.notFound('Product not found');
      }

      const existingBatch = await prisma.batch.findFirst({
        where: {
          id: batchId,
          productId,
        },
      });

      if (!existingBatch) {
        throw HttpErrors.notFound('Batch not found');
      }

      // Calculate stock level difference if quantity changed
      const quantityDiff = data.quantity
        ? data.quantity - existingBatch.quantity
        : 0;

      const batch = await prisma.batch.update({
        where: { id: batchId },
        data,
      });

      // Update product stock level if quantity changed
      if (quantityDiff !== 0) {
        await prisma.product.update({
          where: { id: productId },
          data: {
            stockLevel: product.stockLevel + quantityDiff,
          },
        });
      }

      res.json(batch);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/products/:productId/batches/:id
 * Delete batch
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

      const productId = req.params.productId as string;
      const batchId = req.params.id as string;

      // Verify product exists and belongs to user's branch
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          branchId: req.user.branchId,
        },
      });

      if (!product) {
        throw HttpErrors.notFound('Product not found');
      }

      const existingBatch = await prisma.batch.findFirst({
        where: {
          id: batchId,
          productId,
        },
      });

      if (!existingBatch) {
        throw HttpErrors.notFound('Batch not found');
      }

      // Update product stock level
      await prisma.product.update({
        where: { id: productId },
        data: {
          stockLevel: Math.max(0, product.stockLevel - existingBatch.quantity),
        },
      });

      await prisma.batch.delete({
        where: { id: batchId },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;


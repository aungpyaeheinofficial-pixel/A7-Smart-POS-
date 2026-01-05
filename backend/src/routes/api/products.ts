import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { HttpErrors } from '../../utils/httpError.js';

const router = Router();

/**
 * Product validation schemas
 */
const createProductSchema = z.object({
  sku: z.string().min(1),
  gtin: z.string().optional(),
  nameEn: z.string().min(1),
  nameMm: z.string().optional(),
  genericName: z.string().optional(),
  category: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  image: z.string().url().optional().or(z.literal('')),
  stockLevel: z.coerce.number().int().min(0).default(0),
  unit: z.string().default('PCS'),
  minStockLevel: z.coerce.number().int().min(0).default(10),
  location: z.string().optional(),
  requiresPrescription: z.boolean().default(false),
});

const updateProductSchema = createProductSchema.partial();

/**
 * GET /api/v1/products
 * List all products for current branch
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const products = await prisma.product.findMany({
        where: {
          branchId: req.user.branchId,
        },
        include: {
          batches: {
            orderBy: {
              expiryDate: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(products);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/products/:id
 * Get single product
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.branchId) {
        throw HttpErrors.badRequest('User must be assigned to a branch');
      }

      const product = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
        include: {
          batches: {
            orderBy: {
              expiryDate: 'asc',
            },
          },
        },
      });

      if (!product) {
        throw HttpErrors.notFound('Product not found');
      }

      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/products
 * Create new product
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

      const data = createProductSchema.parse(req.body);

      // Check for duplicate GTIN if provided
      if (data.gtin) {
        const existing = await prisma.product.findUnique({
          where: { gtin: data.gtin },
        });
        if (existing) {
          throw HttpErrors.conflict('Product with this GTIN already exists');
        }
      }

      const product = await prisma.product.create({
        data: {
          ...data,
          branchId: req.user.branchId,
        },
        include: {
          batches: true,
        },
      });

      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/products/:id
 * Update product
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

      const data = updateProductSchema.parse(req.body);

      // Check if product exists and belongs to user's branch
      const existing = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Product not found');
      }

      // Check for duplicate GTIN if provided
      if (data.gtin && data.gtin !== existing.gtin) {
        const duplicate = await prisma.product.findUnique({
          where: { gtin: data.gtin },
        });
        if (duplicate) {
          throw HttpErrors.conflict('Product with this GTIN already exists');
        }
      }

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data,
        include: {
          batches: {
            orderBy: {
              expiryDate: 'asc',
            },
          },
        },
      });

      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/products/:id
 * Delete product
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

      const existing = await prisma.product.findFirst({
        where: {
          id: req.params.id,
          branchId: req.user.branchId,
        },
      });

      if (!existing) {
        throw HttpErrors.notFound('Product not found');
      }

      await prisma.product.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;


import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { HttpErrors } from '../../utils/httpError.js';

const router = Router();

/**
 * Branch validation schemas
 */
const createBranchSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  managerName: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

const updateBranchSchema = createBranchSchema.partial();

/**
 * GET /api/v1/branches
 * List all branches (admin only) or current user's branch
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Admins can see all branches, others see only their branch
      if (req.user?.role === 'ADMIN') {
        const branches = await prisma.branch.findMany({
          where: {
            status: {
              not: 'archived',
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        res.json(branches);
      } else if (req.user?.branchId) {
        const branch = await prisma.branch.findUnique({
          where: { id: req.user.branchId },
        });
        res.json(branch ? [branch] : []);
      } else {
        res.json([]);
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/branches/:id
 * Get single branch
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Non-admins can only access their own branch
      if (req.user?.role !== 'ADMIN' && req.user?.branchId !== req.params.id) {
        throw HttpErrors.forbidden('Access denied');
      }

      const branch = await prisma.branch.findUnique({
        where: { id: req.params.id },
      });

      if (!branch) {
        throw HttpErrors.notFound('Branch not found');
      }

      res.json(branch);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/branches
 * Create new branch (admin only)
 */
router.post(
  '/',
  requireAuth,
  requirePermission('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createBranchSchema.parse(req.body);

      // Check for duplicate code
      const existing = await prisma.branch.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw HttpErrors.conflict('Branch code already exists');
      }

      const branch = await prisma.branch.create({
        data,
      });

      res.status(201).json(branch);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/branches/:id
 * Update branch (admin only)
 */
router.patch(
  '/:id',
  requireAuth,
  requirePermission('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateBranchSchema.parse(req.body);

      const existing = await prisma.branch.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        throw HttpErrors.notFound('Branch not found');
      }

      // Check for duplicate code if changing
      if (data.code && data.code !== existing.code) {
        const duplicate = await prisma.branch.findUnique({
          where: { code: data.code },
        });
        if (duplicate) {
          throw HttpErrors.conflict('Branch code already exists');
        }
      }

      const branch = await prisma.branch.update({
        where: { id: req.params.id },
        data: {
          ...data,
          archivedAt: data.status === 'archived' ? new Date() : data.status === 'active' ? null : existing.archivedAt,
        },
      });

      res.json(branch);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/branches/:id
 * Delete branch (admin only)
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermission('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.branch.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        throw HttpErrors.notFound('Branch not found');
      }

      // Check if it's the only branch
      const branchCount = await prisma.branch.count();
      if (branchCount <= 1) {
        throw HttpErrors.badRequest('Cannot delete the only remaining branch');
      }

      await prisma.branch.delete({
        where: { id: req.params.id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;


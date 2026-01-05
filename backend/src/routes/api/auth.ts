import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma.js';
import { signToken } from '../../auth/jwt.js';
import { HttpErrors } from '../../utils/httpError.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

/**
 * Login request schema
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and return JWT token
 */
router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (!user) {
        res.status(401).json({
          error: {
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
          },
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          error: {
            message: 'Account is inactive',
            code: 'ACCOUNT_INACTIVE',
          },
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        res.status(401).json({
          error: {
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
          },
        });
        return;
      }

      // Generate JWT token
      const token = signToken({
        sub: user.id,
        role: user.role,
        branchId: user.branchId || undefined,
        email: user.email,
      });

      // Return user data (exclude password hash)
      const { passwordHash: _, ...userWithoutPassword } = user;

      res.json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw HttpErrors.unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      throw HttpErrors.notFound('User not found');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

export default router;


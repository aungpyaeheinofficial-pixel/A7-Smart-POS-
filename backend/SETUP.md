# Quick Setup Guide

## Initial Setup (First Time)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your settings
   ```

3. **Setup database:**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Create and run migrations
   npm run db:migrate:dev

   # Seed database with initial data
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Default Credentials

After running `npm run db:seed`:

- **Admin:** `admin@a7systems.com` / `password` (or value from ADMIN_PASSWORD env var)
- **Cashier:** `pos@a7systems.com` / `password`

## Production Deployment

See [README.md](./README.md#deployment-digital-ocean-vps) for detailed deployment instructions.

## Key Files

- `.env` - Environment variables (not committed to git)
- `prisma/schema.prisma` - Database schema
- `src/routes/api/` - API route handlers
- `ecosystem.config.cjs` - PM2 configuration


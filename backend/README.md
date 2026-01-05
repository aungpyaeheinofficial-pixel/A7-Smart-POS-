# A7 Smart POS Backend API

Production-ready Node.js + TypeScript backend API for A7 Smart POS system.

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Logging**: Pino
- **Security**: Helmet, CORS
- **Process Manager**: PM2

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=9000
CORS_ORIGIN=http://localhost:3500

DATABASE_URL=postgresql://user:password@localhost:5432/a7_smart_pos?schema=public

JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-in-production

ADMIN_PASSWORD=password
```

**Important**: 
- Use a strong JWT_SECRET (minimum 32 characters) in production
- Update DATABASE_URL with your PostgreSQL credentials
- Set CORS_ORIGIN to your frontend URL

### 3. Database Setup

Generate Prisma client:

```bash
npm run db:generate
```

Create and run migrations:

```bash
npm run db:migrate:dev
```

Seed the database with initial data:

```bash
npm run db:seed
```

This creates:
- Default branch (Main Store)
- Admin user: `admin@a7systems.com` / `password` (or ADMIN_PASSWORD from .env)
- Cashier user: `pos@a7systems.com` / `password`
- Sample products, customers, suppliers, and transactions

### 4. Development

Start development server with hot-reload:

```bash
npm run dev
```

The API will be available at `http://localhost:9000`

### 5. Production Build

Build TypeScript:

```bash
npm run build
```

Start production server:

```bash
npm start
```

Or use PM2:

```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.cjs --env production

# View logs
pm2 logs a7-smart-pos-api

# Stop
pm2 stop a7-smart-pos-api
```

## API Documentation

### Base URL

- Development: `http://localhost:9000`
- Production: `http://your-domain:9000`

### Authentication

All API routes (except `/healthz` and `/api/v1/auth/login`) require authentication.

Include JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Health Check

- **GET** `/healthz`
  - No authentication required
  - Returns: `{ ok: true, service: "a7-smart-pos-api", time: "ISO string" }`

#### Authentication

- **POST** `/api/v1/auth/login`
  - Body: `{ email: string, password: string }`
  - Returns: `{ token: string, user: User }`

- **GET** `/api/v1/auth/me`
  - Requires authentication
  - Returns: Current user object

#### Products

- **GET** `/api/v1/products` - List all products (requires auth)
- **GET** `/api/v1/products/:id` - Get single product (requires auth)
- **POST** `/api/v1/products` - Create product (requires ADMIN/MANAGER)
- **PATCH** `/api/v1/products/:id` - Update product (requires ADMIN/MANAGER)
- **DELETE** `/api/v1/products/:id` - Delete product (requires ADMIN/MANAGER)

#### Customers

- **GET** `/api/v1/customers` - List all customers (requires auth)
- **GET** `/api/v1/customers/:id` - Get single customer (requires auth)
- **POST** `/api/v1/customers` - Create customer (requires auth)
- **PATCH** `/api/v1/customers/:id` - Update customer (requires auth)
- **DELETE** `/api/v1/customers/:id` - Delete customer (requires ADMIN/MANAGER)

#### Branches

- **GET** `/api/v1/branches` - List branches (requires auth, admin sees all)
- **GET** `/api/v1/branches/:id` - Get single branch (requires auth)
- **POST** `/api/v1/branches` - Create branch (requires ADMIN)
- **PATCH** `/api/v1/branches/:id` - Update branch (requires ADMIN)
- **DELETE** `/api/v1/branches/:id` - Delete branch (requires ADMIN)

#### Transactions

- **GET** `/api/v1/transactions` - List transactions (requires auth)
  - Query params: `type` (INCOME|EXPENSE), `startDate`, `endDate`
- **GET** `/api/v1/transactions/:id` - Get single transaction (requires auth)
- **POST** `/api/v1/transactions` - Create transaction (requires auth)
- **PATCH** `/api/v1/transactions/:id` - Update transaction (requires ADMIN/MANAGER)

#### Purchase Orders

- **GET** `/api/v1/purchase-orders` - List purchase orders (requires auth)
- **GET** `/api/v1/purchase-orders/:id` - Get single purchase order (requires auth)
- **POST** `/api/v1/purchase-orders` - Create purchase order (requires ADMIN/MANAGER)
- **PATCH** `/api/v1/purchase-orders/:id` - Update purchase order (requires ADMIN/MANAGER)
- **DELETE** `/api/v1/purchase-orders/:id` - Delete purchase order (requires ADMIN/MANAGER)

#### Distribution Orders

- **GET** `/api/v1/distribution-orders` - List distribution orders (requires auth)
- **GET** `/api/v1/distribution-orders/:id` - Get single distribution order (requires auth)
- **POST** `/api/v1/distribution-orders` - Create distribution order (requires auth)
- **PATCH** `/api/v1/distribution-orders/:id` - Update distribution order (requires auth)
- **DELETE** `/api/v1/distribution-orders/:id` - Delete distribution order (requires ADMIN/MANAGER)

#### Suppliers

- **GET** `/api/v1/suppliers` - List suppliers (requires auth)
- **GET** `/api/v1/suppliers/:id` - Get single supplier (requires auth)
- **POST** `/api/v1/suppliers` - Create supplier (requires ADMIN/MANAGER)
- **PATCH** `/api/v1/suppliers/:id` - Update supplier (requires ADMIN/MANAGER)
- **DELETE** `/api/v1/suppliers/:id` - Delete supplier (requires ADMIN/MANAGER)

#### Expenses

- **GET** `/api/v1/expenses` - List expenses (requires auth)
- **GET** `/api/v1/expenses/:id` - Get single expense (requires auth)
- **POST** `/api/v1/expenses` - Create expense (requires ADMIN/MANAGER)
- **PATCH** `/api/v1/expenses/:id` - Update expense (requires ADMIN/MANAGER)
- **DELETE** `/api/v1/expenses/:id` - Delete expense (requires ADMIN/MANAGER)

### Error Response Format

All errors follow this format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {} // Optional, only in development
  }
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## User Roles & Permissions

- **ADMIN**: Full access to all resources
- **MANAGER**: Can create/update/delete products, orders, suppliers, expenses
- **PHARMACIST**: Read access, can create transactions
- **CASHIER**: Read access, can create transactions and customers

## Database Management

### Prisma Studio (Database GUI)

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555`

### Create Migration

```bash
npm run db:migrate:dev
```

### Apply Migrations (Production)

```bash
npm run db:migrate:deploy
```

### Reset Database (⚠️ Destructive)

```bash
# Drop all data and re-run migrations
npx prisma migrate reset

# Re-seed
npm run db:seed
```

## Deployment (Digital Ocean VPS)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE a7_smart_pos;
CREATE USER a7user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE a7_smart_pos TO a7user;
\q
```

Update `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql://a7user:your-secure-password@localhost:5432/a7_smart_pos?schema=public
```

### 3. Application Deployment

```bash
# Clone repository (or upload files)
cd /var/www/a7-smart-pos-backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run migrations
npm run db:migrate:deploy

# Seed database (optional, first time only)
npm run db:seed

# Start with PM2
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions output by the command
```

### 4. Environment Variables

Set production environment variables:

```bash
# Create .env file or use system environment
export NODE_ENV=production
export PORT=9000
export CORS_ORIGIN=http://your-frontend-domain:3500
export DATABASE_URL=postgresql://a7user:password@localhost:5432/a7_smart_pos
export JWT_SECRET=your-super-secure-jwt-secret-minimum-32-chars
```

Or use a `.env` file (ensure it's not committed to git).

### 5. Nginx Reverse Proxy (Optional)

If you want to use a domain name:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP (if using Nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend port (if accessing directly)
sudo ufw allow 9000/tcp

# Enable firewall
sudo ufw enable
```

## Monitoring & Logs

### PM2 Commands

```bash
# View logs
pm2 logs a7-smart-pos-api

# View status
pm2 status

# Restart application
pm2 restart a7-smart-pos-api

# Stop application
pm2 stop a7-smart-pos-api

# View real-time monitoring
pm2 monit
```

### Log Files

- PM2 logs: `./logs/pm2-*.log`
- Application logs: Structured JSON logs via Pino

## Security Checklist

- [ ] Use strong JWT_SECRET (32+ characters, random)
- [ ] Use strong database passwords
- [ ] Set appropriate CORS_ORIGIN (not `*` in production)
- [ ] Enable HTTPS in production (use Nginx reverse proxy with SSL)
- [ ] Keep dependencies updated: `npm audit` and `npm audit fix`
- [ ] Use environment variables for all secrets
- [ ] Enable PostgreSQL SSL connections in production
- [ ] Configure firewall (UFW) properly
- [ ] Regularly backup database
- [ ] Monitor logs for suspicious activity

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL format
- Verify database user has proper permissions
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

### Port Already in Use

```bash
# Find process using port 9000
sudo lsof -i :9000

# Kill process
sudo kill -9 <PID>
```

### PM2 Issues

```bash
# Reset PM2
pm2 kill
pm2 start ecosystem.config.cjs --env production

# Clear logs
pm2 flush
```

## Development

### Code Structure

```
backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── index.ts            # Server entry point
│   ├── env.ts              # Environment validation
│   ├── db/
│   │   └── prisma.ts       # Prisma client
│   ├── auth/
│   │   └── jwt.ts          # JWT utilities
│   ├── middleware/
│   │   ├── auth.ts         # Auth middleware
│   │   └── errorHandler.ts # Error handling
│   ├── routes/
│   │   ├── index.ts        # Route aggregator
│   │   ├── health.ts       # Health check
│   │   └── api/            # API routes
│   └── utils/
│       └── httpError.ts    # Error classes
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.mjs            # Seed script
│   └── migrations/         # Migration files
└── dist/                   # Compiled output
```

### Adding New Routes

1. Create route file in `src/routes/api/`
2. Export router from the file
3. Import and mount in `src/routes/index.ts`
4. Add validation schemas using Zod
5. Use `requireAuth` and `requirePermission` middleware

### Running Tests (Future)

```bash
# When tests are added
npm test
```

## License

MIT

## Support

For issues and questions, contact A7 Systems.


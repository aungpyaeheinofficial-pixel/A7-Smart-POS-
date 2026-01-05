# VPS Deployment Guide - Digital Ocean

Complete step-by-step guide to deploy the A7 Smart POS backend API on your Digital Ocean VPS.

## Prerequisites

- Digital Ocean VPS (Ubuntu 22.04 LTS recommended)
- SSH access to your VPS
- Domain name (optional, for production)
- Basic knowledge of Linux commands

## Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

## Step 2: Update System

```bash
# Update package list
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

## Step 3: Install Node.js 20+

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x or higher
npm --version
```

## Step 4: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

## Step 5: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE a7_smart_pos;
CREATE USER a7user WITH PASSWORD 'your-secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE a7_smart_pos TO a7user;
\q
```

**Important**: Replace `'your-secure-password-here'` with a strong password!

## Step 6: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

## Step 7: Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /var/www/a7-smart-pos-backend
sudo chown $USER:$USER /var/www/a7-smart-pos-backend

# Navigate to the directory
cd /var/www/a7-smart-pos-backend
```

## Step 8: Clone Repository

```bash
# Clone your repository
git clone https://github.com/aungpyaeheinofficial-pixel/A7-Smart-POS-.git .

# Navigate to backend directory
cd backend
```

## Step 9: Install Dependencies

```bash
# Install npm packages
npm install

# This will also run postinstall script to generate Prisma client
```

## Step 10: Configure Environment Variables

```bash
# Copy environment template
cp env.example .env

# Edit the .env file
nano .env
```

**Update `.env` with your production values:**

```env
NODE_ENV=production
PORT=9000

# CORS - Replace with your frontend URL
CORS_ORIGIN=http://your-frontend-domain:3500
# Or for development: CORS_ORIGIN=*

# Database - Use the credentials from Step 5
DATABASE_URL=postgresql://a7user:your-secure-password-here@localhost:5432/a7_smart_pos?schema=public

# JWT Secret - Generate a strong random secret (minimum 32 characters)
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long-change-this-in-production

# Admin password for seed (optional)
ADMIN_PASSWORD=your-admin-password
```

**To generate a secure JWT_SECRET:**
```bash
# Generate random secret (copy the output)
openssl rand -hex 32
```

**Save and exit nano:** Press `Ctrl+X`, then `Y`, then `Enter`

## Step 11: Setup Database

```bash
# Generate Prisma client (if not already done)
npm run db:generate

# Run database migrations
npm run db:migrate:deploy

# Seed database with initial data (optional, first time only)
npm run db:seed
```

This will create:
- Database tables
- Admin user: `admin@a7systems.com`
- Cashier user: `pos@a7systems.com`
- Sample data

**Default password:** The password you set in `ADMIN_PASSWORD` (or "password" if not set)

## Step 12: Build TypeScript

```bash
# Build TypeScript to JavaScript
npm run build

# Verify dist folder was created
ls -la dist/
```

## Step 13: Test the Application

```bash
# Test run (will run in foreground)
npm start
```

You should see:
```
Server running on port 9000
Environment: production
CORS origin: ...
Database connected successfully
```

**Press `Ctrl+C` to stop** the test run.

## Step 14: Start with PM2

```bash
# Start application with PM2
pm2 start ecosystem.config.cjs --env production

# Check status
pm2 status

# View logs
pm2 logs a7-smart-pos-api

# Save PM2 configuration (so it persists after reboot)
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions output by the command (usually run a sudo command)
```

## Step 15: Configure Firewall (UFW)

```bash
# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow backend port (if accessing directly)
sudo ufw allow 9000/tcp

# If using Nginx reverse proxy, allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

## Step 16: Test API

```bash
# Test health check endpoint
curl http://localhost:9000/healthz

# Should return:
# {"ok":true,"service":"a7-smart-pos-api","time":"..."}

# Test from outside (replace with your VPS IP)
curl http://your-vps-ip:9000/healthz
```

## Step 17: (Optional) Setup Nginx Reverse Proxy

If you want to use a domain name and HTTPS:

### Install Nginx

```bash
sudo apt install -y nginx
```

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/a7-backend
```

Add this configuration (replace `api.yourdomain.com` with your domain):

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

Save and exit (`Ctrl+X`, `Y`, `Enter`)

### Enable Nginx Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/a7-backend /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow the prompts to complete setup
```

## Step 18: (Optional) Setup Domain DNS

If using a domain name, add an A record in your DNS settings:

```
Type: A
Name: api (or @ for root domain)
Value: your-vps-ip-address
TTL: 3600 (or default)
```

## Step 19: Update Frontend API URL

Update your frontend configuration to point to the backend:

```
API_URL=http://your-vps-ip:9000
# or
API_URL=https://api.yourdomain.com
```

## Useful Commands

### PM2 Management

```bash
# View status
pm2 status

# View logs
pm2 logs a7-smart-pos-api

# Restart application
pm2 restart a7-smart-pos-api

# Stop application
pm2 stop a7-smart-pos-api

# View real-time monitoring
pm2 monit

# View detailed info
pm2 show a7-smart-pos-api
```

### Database Management

```bash
# Access PostgreSQL
sudo -u postgres psql -d a7_smart_pos

# Create new migration
npm run db:migrate:dev

# View database in browser (optional)
npm run db:studio
```

### Logs

```bash
# Application logs
pm2 logs a7-smart-pos-api

# PM2 logs
tail -f ~/.pm2/logs/pm2-error.log
tail -f ~/.pm2/logs/pm2-out.log

# Nginx logs (if using)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Updates/Deployment

```bash
# Navigate to app directory
cd /var/www/a7-smart-pos-backend/backend

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Run new migrations (if any)
npm run db:migrate:deploy

# Rebuild TypeScript
npm run build

# Restart application
pm2 restart a7-smart-pos-api

# View logs to ensure everything works
pm2 logs a7-smart-pos-api
```

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Configured firewall (UFW)
- [ ] Limited SSH access (optional: disable root, use SSH keys)
- [ ] Set up SSL/HTTPS (if using domain)
- [ ] Restricted CORS_ORIGIN to your frontend domain (not `*`)
- [ ] Secured `.env` file (not accessible via web)
- [ ] Set up regular database backups
- [ ] Configured PM2 to auto-restart on failure
- [ ] Set up monitoring/logging

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs a7-smart-pos-api --lines 50

# Check if port is in use
sudo lsof -i :9000

# Check environment variables
cd /var/www/a7-smart-pos-backend/backend
cat .env
```

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d a7_smart_pos

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Port Already in Use

```bash
# Find process using port 9000
sudo lsof -i :9000

# Kill the process (replace PID with actual process ID)
sudo kill -9 PID
```

### PM2 Not Starting on Boot

```bash
# Run startup command again
pm2 startup

# Follow the instructions
pm2 save
```

## Backup Database

```bash
# Create backup
sudo -u postgres pg_dump a7_smart_pos > /var/backups/a7_smart_pos_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
sudo -u postgres psql a7_smart_pos < /var/backups/a7_smart_pos_backup.sql
```

## Monitoring

Consider setting up:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Application monitoring**: PM2 Plus (optional)
- **Log aggregation**: Use PM2 logs or external service
- **Database backups**: Automated daily backups

## Next Steps

1. ✅ Test API endpoints from your frontend
2. ✅ Monitor logs for any errors
3. ✅ Set up automated database backups
4. ✅ Configure monitoring/alerting
5. ✅ Document your deployment process
6. ✅ Set up staging environment (optional)

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs a7-smart-pos-api`
2. Check application logs
3. Verify environment variables
4. Check database connection
5. Review firewall rules

---

**Congratulations! Your backend API is now deployed and running on your VPS! 🚀**


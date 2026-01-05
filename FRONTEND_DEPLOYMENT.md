# Frontend Deployment Guide

Complete guide to deploy the A7 Smart POS frontend on your VPS.

## Prerequisites

- Backend API running on port 9000
- Nginx installed (recommended) or use Vite preview
- Node.js 20+ installed

## Step 1: Build Frontend

```bash
# Navigate to project root (where package.json is)
cd /var/www/a7-smart-pos

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist/` folder with static files.

## Step 2: Serve Frontend with Nginx (Recommended)

### Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/a7-frontend
```

Add this configuration:

```nginx
server {
    listen 3500;
    server_name 167.172.90.182;  # Replace with your domain if you have one

    root /var/www/a7-smart-pos/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Save and exit (`Ctrl+X`, `Y`, `Enter`)

### Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/a7-frontend /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### Open Firewall Port

```bash
sudo ufw allow 3500/tcp
```

## Step 3: Update Backend CORS

Update the backend `.env` file to allow your frontend:

```bash
cd /var/www/a7-smart-pos/backend
nano .env
```

Update `CORS_ORIGIN`:

```env
CORS_ORIGIN=http://167.172.90.182:3500
# Or if using domain:
# CORS_ORIGIN=http://yourdomain.com:3500
```

Restart backend:

```bash
pm2 restart a7-smart-pos-api
```

## Step 4: Configure Frontend API URL

The frontend needs to know where the backend API is. You have two options:

### Option A: Create API Configuration File

Create a config file that the frontend can read:

```bash
cd /var/www/a7-smart-pos/dist
nano api-config.js
```

Add:

```javascript
window.API_BASE_URL = 'http://167.172.90.182:9000/api/v1';
```

Then update `index.html` to load this config before the app:

```html
<script src="/api-config.js"></script>
```

### Option B: Use Environment Variables (Requires Code Changes)

This requires modifying the frontend code to read from environment variables.

## Step 5: Test Frontend

```bash
# Test Nginx is serving files
curl http://localhost:3500

# Test from browser
# Open: http://167.172.90.182:3500
```

## Alternative: Use Vite Preview (Not Recommended for Production)

If you don't want to use Nginx:

```bash
# Build frontend
npm run build

# Start preview server
npm run preview -- --port 3500 --host 0.0.0.0

# Or use PM2 to keep it running
pm2 start npm --name "a7-frontend" -- run preview -- --port 3500 --host 0.0.0.0
```

## Troubleshooting

### Frontend Shows Blank Page

1. Check browser console for errors
2. Verify `dist/` folder exists and has files:
   ```bash
   ls -la /var/www/a7-smart-pos/dist/
   ```
3. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### API Calls Failing

1. Check backend CORS settings
2. Verify backend is running:
   ```bash
   curl http://localhost:9000/healthz
   ```
3. Check browser network tab for CORS errors

### Nginx Permission Issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/a7-smart-pos/dist
sudo chmod -R 755 /var/www/a7-smart-pos/dist
```

## Updating Frontend

When you update the frontend:

```bash
cd /var/www/a7-smart-pos

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild
npm run build

# Nginx will automatically serve the new files
# No restart needed!
```

## SSL/HTTPS Setup (Optional but Recommended)

If you have a domain:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Follow prompts
```

Then update Nginx config to listen on port 443 and redirect HTTP to HTTPS.

## Summary

- **Frontend URL**: `http://167.172.90.182:3500`
- **Backend API URL**: `http://167.172.90.182:9000/api/v1`
- **Frontend Build**: `/var/www/a7-smart-pos/dist`
- **Nginx Config**: `/etc/nginx/sites-available/a7-frontend`


# Quick Fix: Port Already in Use

## The Error
```
Error: listen EADDRINUSE: address already in use :::9000
```

This means the backend is already running on port 9000.

## Solution

### Option 1: Use PM2 (Recommended)

```bash
# Check if backend is running via PM2
pm2 list

# If you see "a7-smart-pos-api" in the list, it's already running!
# Just restart it to apply any changes:
pm2 restart a7-smart-pos-api

# View logs
pm2 logs a7-smart-pos-api
```

### Option 2: Find and Stop the Process

```bash
# Find what's using port 9000
sudo lsof -i :9000
# Or
sudo netstat -tulpn | grep 9000

# Kill the process (replace PID with actual process ID from above)
sudo kill -9 <PID>
```

### Option 3: Stop All Node Processes (Not Recommended)

```bash
# This will stop ALL node processes
pkill -f node
```

## Recommended: Use PM2

PM2 is the best way to manage your backend:

```bash
# Start backend with PM2
cd /var/www/a7-smart-pos/backend
pm2 start ecosystem.config.cjs --env production

# Or if already configured:
pm2 restart a7-smart-pos-api

# Check status
pm2 status

# View logs
pm2 logs a7-smart-pos-api --lines 50

# Stop backend
pm2 stop a7-smart-pos-api

# Make PM2 start on system boot
pm2 startup
pm2 save
```


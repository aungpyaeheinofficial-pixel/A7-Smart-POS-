# Fix: Backend Not Accessible from Frontend

## Problem
Frontend cannot connect to backend API. Error: "Cannot connect to API at http://167.172.90.182:9000/api/v1"

## Root Cause
The backend was only listening on `localhost` (127.0.0.1), which means it's only accessible from the same machine, not from external network requests.

## Solution

### Step 1: Pull Latest Code
```bash
cd /var/www/a7-smart-pos/backend
git pull origin main
```

### Step 2: Rebuild Backend
```bash
npm run build
```

### Step 3: Update CORS Configuration
```bash
nano .env
```

Make sure `CORS_ORIGIN` is set to:
```env
CORS_ORIGIN=http://167.172.90.182:3500
```

Or for development:
```env
CORS_ORIGIN=*
```

### Step 4: Restart Backend with PM2
```bash
pm2 restart a7-smart-pos-api
```

Or if not using PM2:
```bash
pm2 stop a7-smart-pos-api
pm2 start ecosystem.config.cjs --env production
```

### Step 5: Verify Backend is Accessible
```bash
# From the VPS itself
curl http://localhost:9000/healthz

# From external (should also work now)
curl http://167.172.90.182:9000/healthz
```

Both should return: `{"ok":true,"service":"a7-smart-pos-api",...}`

### Step 6: Check Firewall
```bash
# Ensure port 9000 is open
sudo ufw status
sudo ufw allow 9000/tcp
```

### Step 7: Test Login
Now try logging in from the frontend at `http://167.172.90.182:3500`

## What Changed
The backend now listens on `0.0.0.0` instead of `localhost`, making it accessible from:
- The same machine (localhost)
- Other machines on the network
- External IP addresses

## Verify It's Working
Check PM2 logs to confirm:
```bash
pm2 logs a7-smart-pos-api --lines 20
```

You should see:
```
Server running on http://0.0.0.0:9000
Environment: production
CORS origin: http://167.172.90.182:3500
```


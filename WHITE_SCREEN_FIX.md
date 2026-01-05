# White Screen Fix Guide

## Common Causes of White Screen

1. **JavaScript Runtime Error** - Check browser console (F12)
2. **Import Path Issues** - Verify all imports are correct
3. **Missing Dependencies** - Run `npm install`
4. **Build Errors** - Check build output

## Quick Fix Steps

### 1. Check Browser Console
Open DevTools (F12) → Console tab and look for errors.

### 2. Clear Browser Cache
```bash
# In browser: Ctrl+Shift+Delete or Cmd+Shift+Delete
# Or hard refresh: Ctrl+F5 or Cmd+Shift+R
```

### 3. Rebuild Frontend
```bash
cd /var/www/a7-smart-pos
npm install
npm run build
```

### 4. Check Nginx is Serving Correct Files
```bash
# Verify dist folder exists and has files
ls -la /var/www/a7-smart-pos/dist

# Check Nginx config
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Check for Import Errors
The most common issue is import path problems. Verify:
- `store.ts` imports from `./src/api/client` (correct)
- All components import correctly
- No circular dependencies

### 6. Check Backend is Running
```bash
pm2 list
pm2 logs a7-smart-pos-api
```

### 7. Verify API Client
Check if `src/api/client.ts` exists and exports correctly:
```bash
cat src/api/client.ts | head -20
```

## If Still Not Working

1. **Check Network Tab**: Look for failed requests
2. **Check Console**: Look for specific error messages
3. **Try Login Page Directly**: `http://167.172.90.182:3500/#/login`
4. **Check if it's a routing issue**: Try accessing different routes

## Most Likely Fix

The white screen is usually caused by:
- **API connection error** blocking the initial render
- **Missing error boundaries** causing React to crash
- **Import path issues** in the build

Try accessing the login page directly first to see if that works.


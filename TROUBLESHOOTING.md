# Troubleshooting Guide

## Login Failed Error

If you're seeing "Login failed. Please check your credentials", check the following:

### 1. Check Backend is Running

On your VPS, verify the backend is running:

```bash
# Check if PM2 process is running
pm2 list

# Check backend logs
pm2 logs a7-smart-pos-api

# Or if running directly
cd /var/www/a7-smart-pos/backend
npm start
```

### 2. Check Backend is Accessible

Test if the backend API is reachable:

```bash
# From your local machine or VPS
curl http://167.172.90.182:9000/healthz
```

Expected response:
```json
{"ok":true,"service":"a7-smart-pos-api","time":"..."}
```

### 3. Check CORS Configuration

The backend must allow requests from your frontend URL. Update `/var/www/a7-smart-pos/backend/.env`:

```bash
# Edit the .env file
nano /var/www/a7-smart-pos/backend/.env
```

Set `CORS_ORIGIN` to your frontend URL:
```env
CORS_ORIGIN=http://167.172.90.182:3500
```

Or allow all origins (for development only):
```env
CORS_ORIGIN=*
```

**Important:** After changing `.env`, restart the backend:
```bash
pm2 restart a7-smart-pos-api
# Or if running directly, stop and start again
```

### 4. Check Firewall

Ensure port 9000 is open:

```bash
# Check UFW status
sudo ufw status

# If port 9000 is not open, allow it
sudo ufw allow 9000/tcp
```

### 5. Check Database Connection

Verify the database is accessible:

```bash
cd /var/www/a7-smart-pos/backend
npm run db:studio
# Or test connection
psql -U a7user -d a7_smart_pos -h localhost
```

### 6. Verify User Credentials

Check if the admin user exists in the database:

```bash
cd /var/www/a7-smart-pos/backend
npx prisma studio
# Or via psql
psql -U a7user -d a7_smart_pos -c "SELECT email, role, \"isActive\" FROM \"User\";"
```

Default credentials (from seed):
- Email: `admin@a7systems.com`
- Password: `password`

### 7. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for JavaScript errors
- **Network tab**: Check if the login request is being made and what response you get

### 8. Test API Directly

Test the login endpoint directly:

```bash
curl -X POST http://167.172.90.182:9000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@a7systems.com","password":"password"}'
```

Expected response:
```json
{
  "token": "...",
  "user": {
    "id": "...",
    "email": "admin@a7systems.com",
    ...
  }
}
```

### 9. Common Issues

#### Issue: "Cannot connect to API"
- Backend is not running
- Wrong API URL in frontend
- Firewall blocking port 9000
- CORS not configured

#### Issue: "Invalid email or password"
- User doesn't exist in database
- Wrong password
- User account is inactive (`isActive = false`)

#### Issue: CORS Error in Browser Console
- Backend CORS_ORIGIN doesn't match frontend URL
- Backend not restarted after changing .env

### 10. Quick Fix Checklist

1. ✅ Backend is running (`pm2 list`)
2. ✅ Backend is accessible (`curl http://167.172.90.182:9000/healthz`)
3. ✅ CORS_ORIGIN in backend/.env matches frontend URL
4. ✅ Backend restarted after .env changes
5. ✅ Port 9000 is open in firewall
6. ✅ Database is running and accessible
7. ✅ User exists in database (run seed if needed: `npm run db:seed`)
8. ✅ Frontend API URL is correct (`http://167.172.90.182:9000/api/v1`)

## Still Having Issues?

1. Check backend logs: `pm2 logs a7-smart-pos-api`
2. Check browser console for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure both frontend and backend are rebuilt with latest code


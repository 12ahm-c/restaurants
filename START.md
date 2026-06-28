# RestoManager - Quick Start Guide

##erequisites

1. **Node.js** v18+ installed
2. **MongoDB** running on port 27017
3. **Redis** running on port 6379

## Start Services

### MongoDB
```powershell
# Run as Administrator
net start MongoDB
```

### Redis
```powershell
# If using Redis for Windows
redis-server

# Or if installed as a service
net start Redis
```

## Start Application

### Option 1: Start both (recommended)
```bash
npm run dev
```

### Option 2: Start separately
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Default Login

After starting, create the first user via API or MongoDB:

```javascript
// MongoDB shell
use restomanager
db.users.insertOne({
  name: "Admin",
  email: "admin@restomanager.com",
  passwordHash: "$2a$12$LJ3m4ys3Lk0TSwMCPNEPluAINoB6OyV5KtzyGmDGBQaJQ4lEqJqK", // password: admin123
  role: "owner",
  isActive: true,
  language: "fr"
})
```

Then login with:
- Email: `admin@restomanager.com`
- Password: `admin123`

## Build for Production

```bash
npm run build
```

## Troubleshooting

### Port already in use
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### MongoDB connection failed
- Ensure MongoDB is running: `net start MongoDB`
- Check connection string in `apps/backend/.env`

### Redis connection failed
- Ensure Redis is running
- Check connection string in `apps/backend/.env`

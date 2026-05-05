# Supabase Integration - Quick Setup Checklist

## ✅ Already Completed

### Backend Setup
- [x] Installed `@supabase/supabase-js` and `dotenv`
- [x] Created `.env` file with Supabase credentials
- [x] Created `supabaseClient.js` for Supabase initialization
- [x] Created `supabaseNeighborhoodsRoutes.js` with all endpoints
- [x] Created `supabaseProposalsRoutes.js` with all endpoints
- [x] Updated `app.js` to use ES modules and register routes
- [x] Updated `server.js` to use ES modules and load environment
- [x] Updated `package.json` to support ES modules (`"type": "module"`)
- [x] Converted `mockDataRoutes.js` to ES modules
- [x] Converted `mockData.js` to ES modules

### Frontend Setup
- [x] Created `.env.local` with Supabase credentials
- [x] Installed `@supabase/supabase-js`
- [x] Created `supabaseClient.ts` for Supabase client initialization
- [x] Updated `storage.ts` to use Supabase API for neighborhoods
- [x] Updated `storage.ts` to use Supabase API for proposals
- [x] Added error handling with fallback to local storage

### Security
- [x] Environment variables isolated in `.env` and `.env.local`
- [x] `.gitignore` configured to protect credentials
- [x] Service role key used only on backend
- [x] Anon key used on frontend

## 📋 Still Need to Do (Optional but Recommended)

### In Supabase Dashboard

1. **Create Database Tables** (Use SQL Editor in Supabase)
   ```sql
   -- Copy the schema from SUPABASE_INTEGRATION.md
   ```

2. **Set up Row Level Security (RLS)**
   - Enable RLS on neighborhoods table
   - Enable RLS on neighborhood_proposals table
   - Create policies for admin-only operations
   - Create policies for user-specific access

3. **Enable Real-time** (Optional)
   - Enable real-time for neighborhoods table
   - Enable real-time for proposals table

### In Your Application

1. **Test the Integration**
   ```bash
   # Terminal 1: Backend
   cd Backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && pnpm dev
   ```

2. **Verify Supabase Connection**
   - Check backend console for "Supabase Database: ..." message
   - Make a test API call from frontend
   - Check network tab for successful requests

3. **Test Features**
   - [ ] Browse neighborhoods
   - [ ] Propose a neighborhood
   - [ ] Check proposal status
   - [ ] Admin dashboard - review proposals
   - [ ] Hub settings - update neighborhood

4. **Monitor**
   - Watch browser console for errors
   - Watch backend terminal for SQL errors
   - Check Supabase dashboard for database logs

## 🔐 Important Security Notes

⚠️ **DO NOT COMMIT `.env` or `.env.local` files to Git!**
- Already added to `.gitignore`
- These contain sensitive credentials

✅ **For Production:**
- Use environment-specific Supabase projects
- Implement proper authentication
- Enable RLS policies on all tables
- Use JWT tokens for API requests
- Enable database backups

## 🚀 Next: Start Servers

When ready, start both servers:

```bash
# Terminal 1 - Backend
cd Backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && pnpm dev
```

Then open http://localhost:5173 in your browser.

## 🧪 API Testing Examples

### Create a Test Neighborhood
```bash
curl -X POST http://localhost:3000/neighborhoods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Neighborhood",
    "city": "San Francisco",
    "state": "CA",
    "description": "A test neighborhood for integration testing",
    "population": 500,
    "primaryLandmark": "Golden Gate Bridge",
    "adminId": 1,
    "verified": true
  }'
```

### Create a Test Proposal
```bash
curl -X POST http://localhost:3000/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "proposerId": "user-1",
    "proposerName": "John Doe",
    "name": "New Downtown Area",
    "city": "Oakland",
    "state": "CA",
    "description": "A vibrant downtown community",
    "primaryLandmark": "City Hall"
  }'
```

## 📞 Troubleshooting

If the servers won't start, check:
1. Port 3000 is available (backend)
2. Port 5173 is available (frontend)
3. `.env` file exists in Backend directory
4. `.env.local` file exists in frontend directory
5. All npm dependencies installed (`npm install` / `pnpm install`)

---

**Status: Ready to Connect to Supabase!** 🎉

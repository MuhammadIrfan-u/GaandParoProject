# Commands to Run the Code

## Backend
1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Start the backend server:
   ```bash
   node src/server.js
   ```

## Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Testing the Hub Settings API
1. Use the following PowerShell command to test the new hub settings route:
   ```powershell
   $body = @{enable_marketplace=$true; enable_resource_exchange=$false} | ConvertTo-Json; \
   Invoke-WebRequest -Uri "http://localhost:3000/neighborhoods/1/hub-settings" -Method PUT -Headers @{'Content-Type'='application/json'} -Body $body
   ```

## Notes
- Ensure the `.env` file is properly configured in the `Backend` directory with the required Supabase credentials.
- The backend server runs on `http://localhost:3000`.
- The frontend server runs on `http://localhost:5173`.
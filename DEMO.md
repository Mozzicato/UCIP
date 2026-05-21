# UCIP Demo - Step by Step

## 1. Open Terminal In Project Root

```powershell
cd "C:\Users\SALAUDEEN MUBARAK\Desktop\files\chill_projects\UCIP"
```

## 2. Kill Old Node Processes

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

## 3. Install Dependencies

```powershell
npm install
```

## 4. Start App And API

```powershell
npm run dev
```

Keep this terminal open.

## 5. Confirm App Is Running

Open these URLs:

- http://localhost:5173
- http://localhost:3001/api/v1/health

Expected health response includes `ok: true`.

## 6. Demo Flow (In Recording Order)

## Step 6.1 - Show App Home

- Open app at http://localhost:5173
- Start recording

## Step 6.2 - Submit One Live Report

- Open report form
- Choose Heat
- Choose severity 4
- Submit
- Show success toast with report ID

## Step 6.3 - Show Map Layers

- Open map page
- Toggle Heat
- Toggle Flood
- Toggle NDVI
- Click one neighborhood and show values

## Step 6.4 - Trigger Alert

- Trigger demo alert in app
- Show alert result in UI

## Step 6.5 - Run USSD (Do It Here)

Open a second PowerShell terminal in the same root folder.

Run command 1:

```powershell
curl.exe -X POST "http://localhost:3001/api/v1/ussd/callback" -d "sessionId=demo-1&phoneNumber=%2B2348012345678&serviceCode=*384*UCIP%23&text="
```

Expected:

- Response starts with `CON`
- Shows menu options 1 to 4

Run command 2 (choose option 1 = Report Heat):

```powershell
curl.exe -X POST "http://localhost:3001/api/v1/ussd/callback" -d "sessionId=demo-1&phoneNumber=%2B2348012345678&serviceCode=*384*UCIP%23&text=1"
```

Expected:

- Response starts with `CON`
- Asks for severity

Run command 3 (choose severity 4):

```powershell
curl.exe -X POST "http://localhost:3001/api/v1/ussd/callback" -d "sessionId=demo-1&phoneNumber=%2B2348012345678&serviceCode=*384*UCIP%23&text=1*4"
```

Expected:

- Response starts with `CON`
- Asks for location option

Run command 4 (choose option 1 = Use my area):

```powershell
curl.exe -X POST "http://localhost:3001/api/v1/ussd/callback" -d "sessionId=demo-1&phoneNumber=%2B2348012345678&serviceCode=*384*UCIP%23&text=1*4*1"
```

Expected:

- Response starts with `END`
- Contains report ID like `RPT-XXXX`

Important:

- Do not type `1` by itself in terminal.
- Every choice must be sent as a full `curl.exe` command.
- Keep the same `sessionId=demo-1` for all 4 commands.

## Step 6.6 - Close Demo

- Open Planner page
- Show recommendation or export
- End recording

## 7. One-Block USSD Copy (Fast Retry)

If you need to retry quickly, copy and run these lines one by one:

```powershell
curl.exe -X POST "http://localhost:3001/api/v1/ussd/callback" -d "sessionId=demo-1&phoneNumber=%2B2348012345678&serviceCode=*384*UCIP%23&text="
curl.exe -X POST "http://localhost:3001/api/v1/ussd/callback" -d "sessionId=demo-1&phoneNumber=%2B2348012345678&serviceCode=*384*UCIP%23&text=1"
curl.exe -X POST "http://localhost:3001/api/v1/ussd/callback" -d "sessionId=demo-1&phoneNumber=%2B2348012345678&serviceCode=*384*UCIP%23&text=1*4"
curl.exe -X POST "http://localhost:3001/api/v1/ussd/callback" -d "sessionId=demo-1&phoneNumber=%2B2348012345678&serviceCode=*384*UCIP%23&text=1*4*1"
```

Expected pattern:

- Command 1: `CON`
- Command 2: `CON`
- Command 3: `CON`
- Command 4: `END` + `RPT-XXXX`

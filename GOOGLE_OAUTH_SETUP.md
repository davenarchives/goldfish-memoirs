# Google OAuth Setup Guide

## Current Error

You're seeing "Error 400: origin_mismatch" because your Google OAuth Client ID hasn't been configured with the correct authorized JavaScript origins.

## Quick Fix Steps

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Navigate to Credentials
- Click on the project dropdown (top left)
- Select your project (or create a new one)
- In the left sidebar, click **"APIs & Services"** → **"Credentials"**

### 3. Find Your OAuth Client
- Look for the Client ID: `806048701526-s174deha9gjlva2131uau0btiu9humak.apps.googleusercontent.com`
- Click on it to edit

### 4. Add Authorized JavaScript Origins
Click **"+ ADD URI"** under "Authorized JavaScript origins" and add:
```
http://localhost:5173
```

### 5. Add Authorized Redirect URIs
Click **"+ ADD URI"** under "Authorized redirect URIs" and add:
```
http://localhost:5173
```

### 6. Save
Click **"SAVE"** at the bottom

### 7. Wait & Refresh
- Wait 1-2 minutes for changes to propagate
- Go back to http://localhost:5173
- Refresh the page
- Try signing in again

## Alternative: Create New OAuth Client

If the existing client doesn't work, create a new one:

1. In Google Cloud Console → Credentials, click **"+ CREATE CREDENTIALS"**
2. Select **"OAuth client ID"**
3. Choose **"Web application"**
4. Name it "Goldfish Memoirs Dev"
5. Add Authorized JavaScript origins: `http://localhost:5173`
6. Add Authorized redirect URIs: `http://localhost:5173`
7. Click **"CREATE"**
8. Copy the new Client ID
9. Update your `.env` file with the new `VITE_GOOGLE_CLIENT_ID`
10. Restart dev server

## CSS Status ✅

Your CSS is now working correctly! Tailwind CSS v3.4.19 is installed and configured properly.

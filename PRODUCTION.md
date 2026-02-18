# Production Deployment Guide

To move Goldfish Memoirs from development to production, follow these steps:

## 1. Deploy on Vercel (Recommended - Full Stack)

### Steps
1. Push your code to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **"New Project"**.
3. Import your GitHub repository.
4. Vercel will auto-detect the Vite framework. Confirm:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variables** in Vercel project settings:

   | Variable | Value | Notes |
   |---|---|---|
   | `CANVAS_BASE_URL` | `https://your-canvas-instance.instructure.com` | Your school's Canvas URL |
   | `CANVAS_API_TOKEN` | *(optional)* | Leave empty if using BYOT (users provide their own) |
   | `VITE_PROXY_URL` | *(leave empty)* | On Vercel, the API is on the same domain |
   | `VITE_FIREBASE_API_KEY` | Your Firebase API Key | From Firebase Console |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `your-app.firebaseapp.com` | From Firebase Console |
   | `VITE_FIREBASE_PROJECT_ID` | `your-project-id` | From Firebase Console |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `your-app.appspot.com` | From Firebase Console |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID | From Firebase Console |
   | `VITE_FIREBASE_APP_ID` | Your app ID | From Firebase Console |
   | `VITE_GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | From Google Cloud Console |
   | `VITE_GOOGLE_API_KEY` | Your Google API Key | From Google Cloud Console |

6. Click **Deploy**.
7. Test the health check: `https://your-app.vercel.app/api/health`

### Important: Set `VITE_PROXY_URL` to empty
In production on Vercel, the proxy server runs on the **same domain** as the frontend. So `VITE_PROXY_URL` should be an empty string (or not set at all). The frontend code already handles this:
```js
const proxyUrl = import.meta.env.VITE_PROXY_URL ?? '';
```

---

## 2. Google Classroom API: Moving to Production

By default, Google Cloud projects are in **"Testing"** mode, which limits access to manually added test users and tokens expire after 7 days.

### Steps to Publish
1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Select your project.
3. Navigate to **APIs & Services > OAuth consent screen**.
4. Click **"PUBLISH APP"**.
5. Google will warn you about verification. For internal/educational use, you can proceed.

### If Google Requires Verification
For apps with sensitive scopes (like Classroom), Google may require:
- A **privacy policy URL** (can be a simple page on your domain).
- A **terms of service URL**.
- A **homepage URL** (your Vercel deployment URL).
- A **YouTube video** demonstrating how the app uses the data.

> [!TIP]
> If your app is only for users within your **Google Workspace organization** (e.g., a university), set the app to **"Internal"** instead of **"External"** in the OAuth consent screen. Internal apps don't require Google verification.

### Update Authorized Origins
In **APIs & Services > Credentials > OAuth 2.0 Client IDs**, add:
- **Authorized JavaScript Origins**: `https://your-app.vercel.app`
- **Authorized Redirect URIs**: `https://your-app.vercel.app`

---

## 3. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com).
2. Select your project.
3. Go to **Authentication > Settings > Authorized Domains**.
4. Add your production domain: `your-app.vercel.app`.

---

## 4. Alternative: Deploy Proxy Separately (Render)

If you prefer to separate frontend and backend:

1. Create a new **"Web Service"** on [Render](https://render.com).
2. Connect your repository.
3. Set **"Root Directory"** to `proxy-server`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Environment Variables from your `proxy-server/.env`.
7. Note the URL (e.g., `https://goldfish-proxy.onrender.com`).
8. Set `VITE_PROXY_URL` in Vercel to this Render URL.
9. Update the CORS origin in `proxy-server/server.js` to include your Vercel domain.

---

## 5. Stability Tips
- **Syncing**: On Vercel's free tier, serverless functions have cold starts (~1-2s). This is generally fine.
- **Security**: Tokens are stored in `localStorage`. For higher security, consider HttpOnly cookies.
- **Google Token Expiry**: Google OAuth tokens expire after ~1 hour. The app will prompt re-login when needed.

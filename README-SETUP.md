# Student Dashboard - Setup Guide

## 📋 Overview

This guide will walk you through setting up the Student Dashboard application, which centralizes tasks from Canvas LMS, Google Classroom, and manual entries into a unified to-do list.

## 🎯 What You'll Get

1. **Firebase Firestore Database** - NoSQL database for storing user profiles and tasks
2. **CORS Proxy Server** - Node.js/Express server to handle Canvas API requests
3. **React Dashboard** - Beautiful, responsive dashboard with Tailwind CSS

## 📦 Prerequisites

Before starting, ensure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager (comes with Node.js)
- **Git** (optional, for version control)
- **Firebase Account** - [Create free account](https://firebase.google.com/)
- **Canvas LMS Access** - Your institution's Canvas URL and ability to generate API tokens
- **Google Cloud Account** - For Google Classroom API (optional)

---

## 🔥 Part 1: Firebase Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., "student-dashboard")
4. Disable Google Analytics (optional for this project)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click **"Google"** under Sign-in providers
4. Toggle **"Enable"**
5. Enter your project support email
6. Click **"Save"**

### Step 3: Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll add security rules later)
4. Choose your preferred location (e.g., us-central)
5. Click **"Enable"**

### Step 4: Get Firebase Configuration

1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **web icon** `</>`
5. Register your app with a nickname (e.g., "Student Dashboard Web")
6. Copy the `firebaseConfig` object - you'll need these values

### Step 5: Update Security Rules

1. Go to **Firestore Database** → **Rules**
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. Click **"Publish"**

---

## 🎨 Part 2: Canvas LMS Setup

### Step 1: Generate Canvas API Token

1. Log in to your Canvas account
2. Click on **"Account"** → **"Settings"**
3. Scroll down to **"Approved Integrations"**
4. Click **"+ New Access Token"**
5. Enter a purpose (e.g., "Student Dashboard")
6. Leave expiration blank (or set to a far future date)
7. Click **"Generate Token"**
8. **IMPORTANT**: Copy the token immediately - you won't see it again!

### Step 2: Note Your Canvas URL

Your Canvas URL is typically in this format:
- `https://[institution].instructure.com`
- Example: `https://canvas.harvard.edu`

---

## 🔧 Part 3: Project Setup

### Step 1: Install Dependencies

Navigate to your project directory and install frontend dependencies:

```bash
cd c:\Projects\goldfish-memoirs
npm install
```

Install Firebase SDK:

```bash
npm install firebase
```

Install Tailwind CSS (if not already installed):

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 2: Configure Environment Variables (Frontend)

1. Copy the `.env.example` file to create `.env`:

```bash
copy .env.example .env
```

2. Open `.env` and fill in your Firebase configuration from Part 1, Step 4:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

VITE_PROXY_URL=http://localhost:3001
```

3. **IMPORTANT**: Add `.env` to your `.gitignore` file:

```gitignore
# Environment variables
.env
.env.local
```

### Step 3: Setup Proxy Server

Navigate to the proxy server directory:

```bash
cd proxy-server
```

Install dependencies:

```bash
npm install
```

Create `.env` file from template:

```bash
copy .env.example .env
```

Edit `proxy-server/.env` with your Canvas credentials:

```env
CANVAS_BASE_URL=https://your-institution.instructure.com
CANVAS_API_TOKEN=your_canvas_api_token_here
PORT=3001
```

---

## 🚀 Part 4: Running the Application

You need to run **TWO separate processes**: the proxy server and the React app.

### Terminal 1: Start the Proxy Server

```bash
cd c:\Projects\goldfish-memoirs\proxy-server
npm start
```

You should see:
```
🚀 Canvas Proxy Server is running!
📍 Port: 3001
🌐 Canvas URL: https://your-institution.instructure.com
✅ Health check: http://localhost:3001/health
```

### Terminal 2: Start the React App

Open a **new terminal** window:

```bash
cd c:\Projects\goldfish-memoirs
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Access the Dashboard

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🧪 Testing the Setup

### Test 1: Proxy Server Health Check

In your browser, visit:
```
http://localhost:3001/health
```

You should see:
```json
{"status":"ok","message":"Proxy server is running"}
```

### Test 2: Canvas API Connection

Visit:
```
http://localhost:3001/api/canvas/courses
```

You should see a JSON array of your Canvas courses.

### Test 3: Firebase Authentication

1. Click **"Sign In with Google"** on the dashboard
2. Select your Google account
3. You should be redirected back to the dashboard

### Test 4: Sync Tasks

1. Click the **"Sync Tasks"** button
2. Wait a few seconds
3. Your Canvas assignments should appear in the dashboard

---

## 🔍 Troubleshooting

### Issue: "Failed to fetch Canvas assignments"

**Solution**: Check your proxy server `.env` file:
- Verify `CANVAS_BASE_URL` is correct
- Verify `CANVAS_API_TOKEN` is valid
- Check the proxy server console for error messages

### Issue: "Firebase: Error (auth/configuration-not-found)"

**Solution**: Verify your frontend `.env` file:
- All `VITE_FIREBASE_*` variables are set correctly
- Restart the Vite dev server after changing `.env`

### Issue: CORS errors in browser console

**Solution**: 
- Ensure the proxy server is running on port 3001
- Verify `VITE_PROXY_URL` in frontend `.env` is `http://localhost:3001`
- Check proxy server `cors` configuration allows `http://localhost:5173`

### Issue: "Cannot find module 'firebase'"

**Solution**: Install Firebase SDK:
```bash
npm install firebase
```

### Issue: Tasks not saving to Firestore

**Solution**: Check Firestore security rules:
- Ensure rules allow authenticated users to read/write their own data
- Verify you're signed in with Firebase Authentication

---

## 📚 Optional: Google Classroom Setup

### Step 1: Enable Google Classroom API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Classroom API**
4. Create OAuth 2.0 credentials

### Step 2: Configure OAuth

1. Create **OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Authorized JavaScript origins: `http://localhost:5173`
4. Authorized redirect URIs: `http://localhost:5173`

### Step 3: Update Dashboard Component

The Dashboard component has placeholder code for Google Classroom. You'll need to:

1. Install Google API client library:
```bash
npm install gapi-script
```

2. Initialize the API in your component
3. Implement OAuth flow
4. Uncomment and complete the `fetchGoogleClassroomAssignments` function

For detailed Google Classroom API documentation, visit:
https://developers.google.com/classroom/guides/get-started

---

## 🎨 Customization

### Change Color Scheme

Edit `src/components/Dashboard.jsx` and `src/components/TaskItem.jsx` to modify Tailwind CSS classes.

### Add More Platforms

To add support for other LMS platforms:

1. Add new proxy endpoints in `proxy-server/server.js`
2. Create fetch function in `Dashboard.jsx` (similar to `fetchCanvasAssignments`)
3. Add platform to the filter dropdown
4. Update `platformColors` in `TaskItem.jsx`

### Modify Task Fields

To add custom fields to tasks:

1. Update the schema in `firebase-schema.md`
2. Modify the Firestore writes in `Dashboard.jsx`
3. Update the `TaskItem.jsx` component to display new fields

---

## 📱 Deployment

### Deploy Frontend (Vercel/Netlify)

1. Build the production bundle:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider
3. Add environment variables in the hosting dashboard

### Deploy Proxy Server (Heroku/Railway)

1. Add a `Procfile`:
```
web: node server.js
```

2. Push to your hosting provider
3. Set environment variables in the hosting dashboard
4. Update `VITE_PROXY_URL` in your frontend `.env` to the deployed URL

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Rotate API tokens** regularly
3. **Use Firebase security rules** to protect user data
4. **Enable HTTPS** in production
5. **Implement rate limiting** on the proxy server
6. **Use short-lived Canvas tokens** when possible

---

## 📖 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Canvas API Documentation](https://canvas.instructure.com/doc/api/)
- [Google Classroom API](https://developers.google.com/classroom)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console for errors (F12)
2. Check the proxy server terminal for errors
3. Review the Firebase Console for authentication/database errors
4. Verify all environment variables are set correctly
5. Ensure all services (proxy, frontend) are running

---

## 📝 Next Steps

After setup, consider:

1. Adding manual task creation functionality
2. Implementing task editing and deletion
3. Adding email/push notifications for due dates
4. Creating weekly/monthly task summaries
5. Adding dark mode support
6. Implementing task categories/tags

Happy coding! 🎉

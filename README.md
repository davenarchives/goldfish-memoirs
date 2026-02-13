# Goldfish Memoirs 🐠

**"For things worth remembering and doing."**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A modern, academic-focused productivity platform designed to help students manage their coursework, deadlines, and digital memories in one beautiful, unified interface.

## 📖 Project Overview

**Goldfish Memoirs** is a digital productivity sanctuary for students. In an era of fragmented learning management systems, it provides a unified dashboard that aggregates assignments from **Canvas LMS** and **Google Classroom** into a single, cohesive view. Beyond task management, it offers a space for "Memoirs"—notes and reflections—creating a holistic academic companion.

## ✨ Features

- **Unified Task Aggregation**: Automatically syncs pending assignments from both Canvas LMS and Google Classroom.
- **smart Deadlines**: Visual indicators for "Due Today", "Tomorrow", and "Overdue" with precise timestamps.
- **The Current**: A focused view of all active, pending tasks.
- **The Archive**: A history of completed work with search and bulk deletion capabilities.
- **Subject Folders**: Organize notes and resources by specific courses.
- **Note Editor**: Markdown-supported editor for taking class notes or writing memoirs.
- **Premium UI/UX**: Glassmorphism design system with dark/light mode support and fluid animations.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **Backend/Database**: Firebase (Firestore, Auth)
- **Integrations**: 
  - Google Classroom API (via Google Identity Services)
  - Canvas LMS API (via custom Node.js Proxy)
- **Authentication**: Google OAuth 2.0

## 🏗️ Architecture

The application uses a hybrid architecture to handle different API constraints:

1.  **Client-Side (React)**: Handles UI, Firebase interaction, and direct calls to Google Classroom API.
2.  **Proxy Server (Node.js)**: A lightweight Express server that handles Canvas API requests to bypass CORS restrictions which don't allow direct browser-to-Canvas communication.
3.  **Firebase**: Acts as the source of truth for user data, storing synced tasks, notes, folder structures, and user preferences.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project
- Google Cloud Console Project (for OAuth)
- Canvas LMS API Token

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/davenarchives/goldfish-memoirs.git
    cd goldfish-memoirs
    ```

2.  **Install Frontend Dependencies**
    ```bash
    npm install
    ```

3.  **Install Proxy Server Dependencies**
    ```bash
    cd proxy-server
    npm install
    ```

4.  **Configure Environment**
    - Create `.env` in root (copy from `.env.template`)
    - Create `.env` in `proxy-server/` (copy from `proxy-server/.env.example`)

5.  **Run Development Servers**
    - **Frontend**: `npm run dev`
    - **Proxy**: `node proxy-server/server.js`

---
*Created with ❤️ by Daven*

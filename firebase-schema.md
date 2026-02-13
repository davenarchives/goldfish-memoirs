# Firebase Firestore Database Schema

## Overview

This document describes the Firestore database structure for the Student Dashboard application. Firestore is a NoSQL document database, so data is organized in collections and documents rather than traditional tables.

## Collections Structure

```
firestore/
├── users/                          [Collection]
│   └── {userId}/                   [Document]
│       ├── email: string
│       ├── displayName: string
│       ├── createdAt: timestamp
│       ├── lastLogin: timestamp
│       └── tasks/                  [Sub-collection]
│           └── {taskId}/           [Document]
│               ├── title: string
│               ├── platform: string
│               ├── courseName: string
│               ├── dueDate: timestamp
│               ├── status: string
│               ├── originalLink: string
│               ├── description: string (optional)
│               ├── createdAt: timestamp
│               └── updatedAt: timestamp
```

## Collection: `users`

Stores user profile information and authentication data.

### Document Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address from authentication |
| `displayName` | string | No | User's display name |
| `createdAt` | timestamp | Yes | Account creation timestamp |
| `lastLogin` | timestamp | Yes | Last login timestamp |

### Example Document

```json
{
  "email": "student@ustp.edu.ph",
  "displayName": "Juan Dela Cruz",
  "createdAt": "2024-01-15T08:30:00Z",
  "lastLogin": "2024-02-13T10:15:00Z"
}
```

## Sub-collection: `users/{userId}/tasks`

Stores all tasks (homework, assignments) for a specific user. This is a **sub-collection** under each user document.

### Document Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Assignment/task title (e.g., "Calculus Problem Set 1") |
| `platform` | string | Yes | Source platform: "Canvas", "Google Classroom", or "Manual" |
| `courseName` | string | Yes | Course or subject name (e.g., "MATH 101") |
| `dueDate` | timestamp | Yes | Due date and time for the task |
| `status` | string | Yes | Task status: "pending", "completed", or "overdue" |
| `originalLink` | string | No | URL to the original assignment (if from Canvas/Classroom) |
| `description` | string | No | Additional task details or notes |
| `createdAt` | timestamp | Yes | When the task was added to the dashboard |
| `updatedAt` | timestamp | Yes | Last modification timestamp |

### Platform Values

- `"Canvas"` - Task imported from Canvas LMS
- `"Google Classroom"` - Task imported from Google Classroom
- `"Manual"` - User-created task

### Status Values

- `"pending"` - Task is incomplete and not yet due
- `"completed"` - Task has been marked as complete
- `"overdue"` - Task is incomplete and past due date

### Example Document

```json
{
  "title": "Physics Lab Report - Newton's Laws",
  "platform": "Canvas",
  "courseName": "PHY 102",
  "dueDate": "2024-02-20T23:59:00Z",
  "status": "pending",
  "originalLink": "https://canvas.instructure.com/courses/12345/assignments/67890",
  "description": "Complete all three experiments and submit graphs",
  "createdAt": "2024-02-13T10:00:00Z",
  "updatedAt": "2024-02-13T10:00:00Z"
}
```

## Firestore Security Rules

Add these security rules to ensure users can only access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Users can only read/write their own tasks
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Recommended Indexes

Create composite indexes for efficient querying:

1. **Tasks by due date (for sorting)**
   - Collection: `users/{userId}/tasks`
   - Fields: `status` (Ascending), `dueDate` (Ascending)

2. **Tasks by platform**
   - Collection: `users/{userId}/tasks`
   - Fields: `platform` (Ascending), `dueDate` (Ascending)

These can be created automatically when Firebase prompts you during development, or manually in the Firebase Console under Firestore → Indexes.

## Common Queries

### Get all pending tasks sorted by due date

```javascript
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const tasksRef = collection(db, 'users', userId, 'tasks');
const q = query(
  tasksRef,
  where('status', '==', 'pending'),
  orderBy('dueDate', 'asc')
);

const snapshot = await getDocs(q);
const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### Add a new task

```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const tasksRef = collection(db, 'users', userId, 'tasks');
await addDoc(tasksRef, {
  title: "Calculus Problem Set 1",
  platform: "Canvas",
  courseName: "MATH 101",
  dueDate: new Date("2024-02-25T23:59:00"),
  status: "pending",
  originalLink: "https://canvas.example.com/...",
  description: "Problems 1-15 from Chapter 3",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

### Update task status

```javascript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const taskRef = doc(db, 'users', userId, 'tasks', taskId);
await updateDoc(taskRef, {
  status: 'completed',
  updatedAt: serverTimestamp()
});
```

### Delete a task

```javascript
import { doc, deleteDoc } from 'firebase/firestore';

const taskRef = doc(db, 'users', userId, 'tasks', taskId);
await deleteDoc(taskRef);
```

## Data Migration Notes

When importing tasks from Canvas or Google Classroom:

1. **Canvas**: Use the Assignment object's `due_at` field for `dueDate`
2. **Google Classroom**: Use the CourseWork object's `dueDate` and `dueTime` fields
3. **Platform field**: Always set to the source ("Canvas" or "Google Classroom")
4. **Original Link**: Store the deep link to allow users to navigate to the assignment
5. **Auto-detect overdue**: Check if `dueDate < new Date()` and `status === 'pending'` to mark as overdue

## Scalability Considerations

- **Sub-collections**: Tasks are stored as sub-collections under each user, which scales well
- **Pagination**: For users with many tasks, implement pagination using `limit()` and `startAfter()`
- **Batch operations**: Use batch writes when importing multiple tasks from APIs
- **Cloud Functions**: Consider using Cloud Functions to automatically update task status (e.g., mark as overdue)

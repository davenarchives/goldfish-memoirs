const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow requests from React app
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite default ports
    credentials: true
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Proxy server is running' });
});

// Canvas API proxy endpoints
const CANVAS_BASE_URL = process.env.CANVAS_BASE_URL;
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;

// Validate environment variables
if (!CANVAS_BASE_URL || !CANVAS_API_TOKEN) {
    console.error('ERROR: Missing required environment variables!');
    console.error('Please set CANVAS_BASE_URL and CANVAS_API_TOKEN in .env file');
    process.exit(1);
}

// Helper function to make Canvas API requests
async function canvasApiRequest(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method,
            url: `${CANVAS_BASE_URL}/api/v1${endpoint}`,
            headers: {
                'Authorization': `Bearer ${CANVAS_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Canvas API Error:', error.message);
        throw error;
    }
}

// Get current user's courses
app.get('/api/canvas/courses', async (req, res) => {
    try {
        const data = await canvasApiRequest('/courses?enrollment_state=active');
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch courses',
            message: error.message
        });
    }
});

// Get assignments for a specific course
app.get('/api/canvas/courses/:courseId/assignments', async (req, res) => {
    try {
        const { courseId } = req.params;
        const data = await canvasApiRequest(`/courses/${courseId}/assignments`);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch assignments',
            message: error.message
        });
    }
});

// Get all assignments across all active courses
app.get('/api/canvas/assignments', async (req, res) => {
    try {
        // First, get all active courses
        const courses = await canvasApiRequest('/courses?enrollment_state=active');

        // Then, fetch assignments for each course
        const assignmentPromises = courses.map(async (course) => {
            try {
                const assignments = await canvasApiRequest(`/courses/${course.id}/assignments`);
                // Add course name to each assignment
                return assignments.map(assignment => ({
                    ...assignment,
                    course_name: course.name,
                    course_code: course.course_code
                }));
            } catch (error) {
                console.error(`Error fetching assignments for course ${course.id}:`, error.message);
                return [];
            }
        });

        const assignmentArrays = await Promise.all(assignmentPromises);
        const allAssignments = assignmentArrays.flat();

        res.json(allAssignments);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch all assignments',
            message: error.message
        });
    }
});

// Get upcoming assignments (within the next 30 days)
app.get('/api/canvas/assignments/upcoming', async (req, res) => {
    try {
        const courses = await canvasApiRequest('/courses?enrollment_state=active');

        const assignmentPromises = courses.map(async (course) => {
            try {
                const assignments = await canvasApiRequest(`/courses/${course.id}/assignments`);

                // Filter upcoming assignments
                const now = new Date();
                const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                return assignments
                    .filter(assignment => {
                        if (!assignment.due_at) return false;
                        const dueDate = new Date(assignment.due_at);
                        return dueDate >= now && dueDate <= thirtyDaysFromNow;
                    })
                    .map(assignment => ({
                        ...assignment,
                        course_name: course.name,
                        course_code: course.course_code
                    }));
            } catch (error) {
                console.error(`Error fetching assignments for course ${course.id}:`, error.message);
                return [];
            }
        });

        const assignmentArrays = await Promise.all(assignmentPromises);
        const upcomingAssignments = assignmentArrays.flat();

        // Sort by due date
        upcomingAssignments.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));

        res.json(upcomingAssignments);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch upcoming assignments',
            message: error.message
        });
    }
});

// Get user profile
app.get('/api/canvas/profile', async (req, res) => {
    try {
        const data = await canvasApiRequest('/users/self/profile');
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch user profile',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Canvas Proxy Server is running!`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Canvas URL: ${CANVAS_BASE_URL}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health\n`);
});

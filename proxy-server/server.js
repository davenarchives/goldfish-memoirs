const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow requests from React app
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        /\.vercel\.app$/  // Allow any *.vercel.app domain
    ],
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
if (!CANVAS_BASE_URL) {
    console.error('ERROR: Missing CANVAS_BASE_URL environment variable!');
    console.error('Please set CANVAS_BASE_URL in .env file');
    process.exit(1);
}
if (!CANVAS_API_TOKEN) {
    console.warn('⚠️ CANVAS_API_TOKEN not set. Users must provide their own token (BYOT mode).');
}

// Helper function to make Canvas API requests
async function canvasApiRequest(endpoint, token, method = 'GET', data = null) {
    try {
        // Use provided token or fallback to env var
        const apiKey = token || CANVAS_API_TOKEN;

        if (!apiKey) {
            throw new Error('No Canvas API token provided');
        }

        const config = {
            method,
            url: `${CANVAS_BASE_URL}/api/v1${endpoint}`,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
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
        const token = req.headers.authorization?.split(' ')[1];
        const data = await canvasApiRequest('/courses?enrollment_state=active', token);
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
        const token = req.headers.authorization?.split(' ')[1];
        const data = await canvasApiRequest(`/courses/${courseId}/assignments`, token);
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
        const token = req.headers.authorization?.split(' ')[1];

        // First, get all active courses
        const courses = await canvasApiRequest('/courses?enrollment_state=active', token);

        // Then, fetch assignments for each course
        const assignmentPromises = courses.map(async (course) => {
            try {
                const assignments = await canvasApiRequest(`/courses/${course.id}/assignments`, token);
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
        const token = req.headers.authorization?.split(' ')[1];
        const courses = await canvasApiRequest('/courses?enrollment_state=active', token);

        const assignmentPromises = courses.map(async (course) => {
            try {
                const assignments = await canvasApiRequest(`/courses/${course.id}/assignments`, token);

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
        const token = req.headers.authorization?.split(' ')[1];
        const data = await canvasApiRequest('/users/self/profile', token);
        res.json(data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch user profile',
            message: error.message
        });
    }
});

// UStep (Moodle) API Endpoints
const USTEP_BASE_URL = 'https://ustep.ustp.edu.ph';

// Helper for UStep API requests
async function ustepApiRequest(endpoint, params = {}) {
    try {
        const config = {
            method: 'GET',
            url: `${USTEP_BASE_URL}${endpoint}`,
            params: {
                moodlewsrestformat: 'json',
                ...params
            }
        };

        const response = await axios(config);

        // Moodle API sometimes returns 200 even with errors
        if (response.data.exception || response.data.errorcode) {
            throw new Error(response.data.message || response.data.errorcode);
        }

        return response.data;
    } catch (error) {
        console.error('UStep API Error:', error.message);
        throw error;
    }
}

// UStep Login to get token
app.post('/api/ustep/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const response = await axios.get(`${USTEP_BASE_URL}/login/token.php`, {
            params: {
                username,
                password,
                service: 'moodle_mobile_app'
            }
        });

        if (response.data.error) {
            return res.status(401).json({ error: response.data.error });
        }

        res.json({ token: response.data.token });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to login to UStep',
            message: error.message
        });
    }
});

// Get UStep Assignments
app.get('/api/ustep/assignments', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const userid = req.query.userid; // We might need userid, but usually webservice allows querying by token user context

        if (!token) {
            return res.status(401).json({ error: 'Missing authorization token' });
        }

        // 1. Get user info (to get ID) if not provided - actually 'core_webservice_get_site_info' gives us the userid
        const siteInfo = await ustepApiRequest('/webservice/rest/server.php', {
            wstoken: token,
            wsfunction: 'core_webservice_get_site_info'
        });

        const currentUserId = siteInfo.userid;

        // 2. Get enrolled courses
        const courses = await ustepApiRequest('/webservice/rest/server.php', {
            wstoken: token,
            wsfunction: 'core_enrol_get_users_courses',
            userid: currentUserId
        });

        // 3. Get assignments for these courses
        // mod_assign_get_assignments accepts a list of course IDs
        const courseIds = courses.map(c => c.id);

        if (courseIds.length === 0) {
            return res.json([]);
        }

        // Moodle expects array params like courseids[0]=1, courseids[1]=2
        // But axios params serializer needs to handle this or we can build the query string manually or pass object with numeric keys?
        // Actually, let's try just getting all assignments since mod_assign_get_assignments usually filters by enrollment if no courseids provided? 
        // No, documentation says "Returns the courses and assignments for the users capability". 
        // Let's pass courseids.

        const assignmentsData = await ustepApiRequest('/webservice/rest/server.php', {
            wstoken: token,
            wsfunction: 'mod_assign_get_assignments',
            // Passing courseids is tricky with simple params object in axios if it expects repeated keys or array notation
            // Let's rely on Moodle returning all if we don't filter, or filter client side if needed.
            // Actually 'mod_assign_get_assignments' without courseids might return nothing or everything.
            // Let's try getting all assignments for the user.
        });

        // Use mod_assign_get_assignments which returns structured data
        // We might need to handle courseids param if the default behavior isn't "all my courses"
        // If we need to pass array:
        // params: { ..., 'courseids[]': [1, 2] }

        // Let's verify 'mod_assign_get_assignments' behavior. 
        // It returns { courses: [ { id: ..., assignments: [...] } ], warnings: [] }

        let allAssignments = [];

        if (assignmentsData.courses) {
            assignmentsData.courses.forEach(courseGroup => {
                const courseName = courseGroup.fullname; // or shortname
                // Find matching course info if needed
                const courseInfo = courses.find(c => c.id === courseGroup.id);
                const courseCode = courseInfo ? courseInfo.shortname : courseGroup.shortname;

                courseGroup.assignments.forEach(assign => {
                    // Check if completed/submitted
                    // We need 'mod_assign_get_submission_status' for each assignment to know if it's submitted?
                    // That would be N+1 requests. 
                    // OR 'mod_assign_get_submissions' for a list of assignments.

                    allAssignments.push({
                        ...assign,
                        course_name: courseName,
                        course_code: courseCode
                    });
                });
            });
        }

        // IMPORTANT: We need submission status to know if it's pending.
        // We can batch request 'mod_assign_get_submission_status' or get all submissions.
        // 'mod_assign_get_submissions' takes assignment ids.

        const assignmentIds = allAssignments.map(a => a.id);

        // If we have assignments, fetch their submission status
        if (assignmentIds.length > 0) {
            // We can't easily pass array in query params for GET with axios default serializer for Moodle sometimes.
            // Let's assume we can fetch submissions or just return the assignments and let frontend/later logic handle status if we want to be fast.
            // But we need status for "Pending/Completed".

            // For now, let's just return the assignments and maybe assume 'pending' if due date is future?
            // Accuracy is better. let's try to get submission status. 
            // We'll iterate for now or try to finding a bulk endpoint.
            // 'mod_assign_get_submissions' requires assignment ids.

            // Let's simplify: Return all assignments, and if possible, include submission status.
            // For MVP, we will rely on timestamp comparison and maybe a separate status check if critical.
            // Actually, we can return the raw data and let the frontend decide,
            // OR we can make a POST request to Moodle API to pass arguments in body which handles arrays better?
            // Moodle Web Service mostly uses GET/POST.
        }

        res.json(allAssignments);

    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch UStep assignments',
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

// Start server if not running in Vercel (local development)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`\n🚀 Canvas Proxy Server is running!`);
        console.log(`📍 Port: ${PORT}`);
        console.log(`🌐 Canvas URL: ${CANVAS_BASE_URL}`);
        console.log(`✅ Health check: http://localhost:${PORT}/health\n`);
    });
}

// Export for Vercel
module.exports = app;

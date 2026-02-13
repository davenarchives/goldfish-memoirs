import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import TaskItem from './TaskItem';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterPlatform, setFilterPlatform] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [syncing, setSyncing] = useState(false);

    const user = auth.currentUser;

    // Real-time listener for Firestore tasks
    useEffect(() => {
        if (!user) {
            setLoading(false);
            setError('Please sign in to view your tasks');
            return;
        }

        const tasksRef = collection(db, 'users', user.uid, 'tasks');
        const q = query(tasksRef, orderBy('dueDate', 'asc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const tasksData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    dueDate: doc.data().dueDate?.toDate() || new Date(doc.data().dueDate)
                }));
                setTasks(tasksData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching tasks:', err);
                setError('Failed to load tasks');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Fetch Canvas assignments via proxy
    const fetchCanvasAssignments = async () => {
        try {
            const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';
            const response = await fetch(`${proxyUrl}/api/canvas/assignments/upcoming`);

            if (!response.ok) {
                throw new Error('Failed to fetch Canvas assignments');
            }

            const assignments = await response.json();

            // Transform Canvas data to our task format
            return assignments.map((assignment) => ({
                title: assignment.name,
                platform: 'Canvas',
                courseName: assignment.course_name || assignment.course_code || 'Unknown Course',
                dueDate: new Date(assignment.due_at),
                status: 'pending',
                originalLink: assignment.html_url,
                description: assignment.description?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
                source: 'canvas',
                sourceId: assignment.id.toString()
            }));
        } catch (error) {
            console.error('Error fetching Canvas assignments:', error);
            throw error;
        }
    };

    // Fetch Google Classroom assignments
    const fetchGoogleClassroomAssignments = async () => {
        try {
            // Note: This requires Google API client library and OAuth authentication
            // For now, returning empty array - implement based on Google Classroom API setup
            console.warn('Google Classroom integration not yet configured');
            return [];

            // Example implementation (requires gapi setup):
            /*
            const response = await gapi.client.classroom.courses.courseWork.list({
              courseId: '-', // '-' means all courses
              courseWorkStates: ['PUBLISHED']
            });
      
            return response.result.courseWork.map(work => ({
              title: work.title,
              platform: 'Google Classroom',
              courseName: work.courseName,
              dueDate: new Date(work.dueDate),
              status: 'pending',
              originalLink: work.alternateLink,
              description: work.description || '',
              source: 'google-classroom',
              sourceId: work.id
            }));
            */
        } catch (error) {
            console.error('Error fetching Google Classroom assignments:', error);
            throw error;
        }
    };

    // Sync tasks from Canvas and Google Classroom
    const syncTasks = async () => {
        if (!user) return;

        setSyncing(true);
        setError(null);

        try {
            // Fetch from both platforms
            const [canvasAssignments, googleAssignments] = await Promise.allSettled([
                fetchCanvasAssignments(),
                fetchGoogleClassroomAssignments()
            ]);

            const allNewTasks = [
                ...(canvasAssignments.status === 'fulfilled' ? canvasAssignments.value : []),
                ...(googleAssignments.status === 'fulfilled' ? googleAssignments.value : [])
            ];

            // Get existing task sourceIds to avoid duplicates
            const existingSourceIds = new Set(
                tasks.filter((t) => t.sourceId).map((t) => `${t.source}-${t.sourceId}`)
            );

            // Add new tasks to Firestore
            const tasksRef = collection(db, 'users', user.uid, 'tasks');
            const addPromises = allNewTasks
                .filter((task) => !existingSourceIds.has(`${task.source}-${task.sourceId}`))
                .map((task) =>
                    addDoc(tasksRef, {
                        ...task,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    })
                );

            await Promise.all(addPromises);

            console.log(`Synced ${addPromises.length} new tasks`);
        } catch (err) {
            console.error('Sync error:', err);
            setError('Failed to sync tasks from external platforms');
        } finally {
            setSyncing(false);
        }
    };

    // Update task status
    const handleStatusChange = async (taskId, newStatus) => {
        if (!user) return;

        try {
            const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
            await updateDoc(taskRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error('Error updating task:', err);
            setError('Failed to update task status');
        }
    };

    // Filter tasks
    const filteredTasks = tasks.filter((task) => {
        const platformMatch = filterPlatform === 'all' || task.platform === filterPlatform;
        const statusMatch = filterStatus === 'all' || task.status === filterStatus;
        return platformMatch && statusMatch;
    });

    // Group tasks by status
    const pendingTasks = filteredTasks.filter((t) => t.status === 'pending');
    const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading your tasks...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Student Dashboard</h2>
                    <p className="text-gray-600 mb-6">Please sign in to access your tasks</p>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Sign In with Google
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                            <p className="text-gray-600 mt-1">Centralized view of all your assignments</p>
                        </div>
                        <button
                            onClick={syncTasks}
                            disabled={syncing}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <svg
                                className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            <span>{syncing ? 'Syncing...' : 'Sync Tasks'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                            <select
                                value={filterPlatform}
                                onChange={(e) => setFilterPlatform(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Platforms</option>
                                <option value="Canvas">Canvas</option>
                                <option value="Google Classroom">Google Classroom</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Tasks</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{tasks.length}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-3xl font-bold text-orange-600 mt-1">{pendingTasks.length}</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{completedTasks.length}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Tasks</h2>
                        <div className="space-y-4">
                            {pendingTasks.map((task) => (
                                <TaskItem key={task.id} task={task} onStatusChange={handleStatusChange} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Completed Tasks</h2>
                        <div className="space-y-4">
                            {completedTasks.map((task) => (
                                <TaskItem key={task.id} task={task} onStatusChange={handleStatusChange} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {filteredTasks.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <svg
                            className="w-16 h-16 text-gray-400 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
                        <p className="text-gray-600 mb-6">
                            {tasks.length === 0
                                ? 'Click "Sync Tasks" to import assignments from Canvas and Google Classroom'
                                : 'Try adjusting your filters to see more tasks'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;

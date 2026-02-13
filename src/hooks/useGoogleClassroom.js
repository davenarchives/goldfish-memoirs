import { useState, useCallback, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const DISCOVERY_DOCS = ['https://classroom.googleapis.com/$discovery/rest?version=v1'];
const SCOPES = 'https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.student-submissions.me.readonly';

export const useGoogleClassroom = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [gapiReady, setGapiReady] = useState(false);

    // Ref to hold the resolve function for the sync promise
    const loginResolver = useRef(null);

    // Initialize ONLY the gapi client (no auth2)
    useEffect(() => {
        const loadGapiScript = () => {
            return new Promise((resolve, reject) => {
                if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
                    if (window.gapi) resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.async = true;
                script.defer = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load gapi'));
                document.head.appendChild(script);
            });
        };

        const initClient = async () => {
            try {
                await loadGapiScript();
                await new Promise(resolve => window.gapi.load('client', resolve));

                await window.gapi.client.init({
                    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
                    discoveryDocs: DISCOVERY_DOCS,
                });

                setGapiReady(true);
                console.log('✅ Google API client ready (waiting for OAuth token)');
            } catch (err) {
                console.error('❌ Gapi init error:', err);
                setError(err.message);
            }
        };

        initClient();
    }, []);

    // Modern OAuth login hook
    const login = useGoogleLogin({
        scope: SCOPES,
        onSuccess: async (tokenResponse) => {
            console.log('✅ OAuth success, setting token...');
            window.gapi.client.setToken({
                access_token: tokenResponse.access_token
            });

            // Proceed with fetch after token is set
            const assignments = await fetchAssignments();

            // If the sync button is waiting for this login, resolve the promise!
            if (loginResolver.current) {
                console.log('🔓 Resolving sync promise after login');
                loginResolver.current(assignments);
                loginResolver.current = null;
            }
        },
        onError: error => {
            console.error('❌ Login Failed:', error);
            setError('Google sign-in failed');
            setLoading(false);

            // If waiting, resolve with empty to unblock UI
            if (loginResolver.current) {
                loginResolver.current([]);
                loginResolver.current = null;
            }
        }
    });

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            console.log('📚 Fetching Classroom data...');
            const coursesRes = await window.gapi.client.classroom.courses.list({
                courseStates: ['ACTIVE'],
                pageSize: 20,
            });

            const courses = coursesRes.result.courses || [];
            console.log(`📚 Found ${courses.length} courses`);

            // Fetch assignments for each course
            return await deepFetchCourses(courses);

        } catch (err) {
            console.error('❌ API Error:', err);
            // If error is 401 (unauthorized), it usually means we need to login again
            if (err.status === 401 || err.result?.error?.code === 401) {
                console.log('🔄 Token expired or missing, prompting login...');
                // We don't trigger login here recursively to avoid loops, just fail this attempt
                // The main entry point handles the login trigger
            } else {
                setError(err.message);
            }
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Helper to fetch deep data (assignments and submissions)
    const deepFetchCourses = async (courses) => {
        if (courses.length === 0) return [];

        const assignmentsPromises = courses.map(async (course) => {
            try {
                const courseWorkResponse = await window.gapi.client.classroom.courses.courseWork.list({
                    courseId: course.id,
                    pageSize: 100,
                });

                const courseWork = courseWorkResponse.result.courseWork || [];

                // Fetch student submissions
                const assignmentsWithStatus = await Promise.all(
                    courseWork.map(async (work) => {
                        try {
                            const submissionsResponse = await window.gapi.client.classroom.courses.courseWork.studentSubmissions.list({
                                courseId: course.id,
                                courseWorkId: work.id,
                                userId: 'me',
                            });

                            const submissions = submissionsResponse.result.studentSubmissions || [];
                            const mySubmission = submissions[0];

                            let status = 'pending';
                            if (mySubmission) {
                                if (mySubmission.state === 'TURNED_IN' || mySubmission.state === 'RETURNED') {
                                    status = 'completed';
                                } else if (mySubmission.late) {
                                    status = 'overdue';
                                }
                            }

                            let dueDate = null;
                            if (work.dueDate) {
                                dueDate = new Date(Date.UTC(
                                    work.dueDate.year,
                                    work.dueDate.month - 1,
                                    work.dueDate.day,
                                    work.dueTime?.hours ?? 23,
                                    work.dueTime?.minutes ?? 59
                                ));
                            }

                            return {
                                title: work.title,
                                platform: 'Google Classroom',
                                courseName: course.name,
                                dueDate: dueDate,
                                status: status,
                                originalLink: work.alternateLink,
                                description: work.description ? (work.description.length > 150 ? work.description.substring(0, 150) + '...' : work.description) : '',
                                source: 'google-classroom',
                                sourceId: work.id,
                                submissionState: mySubmission?.state || 'NOT_SUBMITTED',
                            };
                        } catch (err) {
                            // Fallback if submission fetch fails
                            let dueDate = null;
                            if (work.dueDate) {
                                dueDate = new Date(
                                    work.dueDate.year,
                                    work.dueDate.month - 1,
                                    work.dueDate.day,
                                    work.dueTime?.hours || 23,
                                    work.dueTime?.minutes || 59
                                );
                            }
                            return {
                                title: work.title,
                                platform: 'Google Classroom',
                                courseName: course.name,
                                dueDate: dueDate,
                                status: 'pending',
                                originalLink: work.alternateLink,
                                description: work.description || '',
                                source: 'google-classroom',
                                sourceId: work.id,
                            };
                        }
                    })
                );
                return assignmentsWithStatus;
            } catch (err) {
                console.error(`❌ Error fetching course work for ${course.name}:`, err);
                return [];
            }
        });

        const allAssignments = await Promise.all(assignmentsPromises);
        const flattened = allAssignments.flat();

        const pendingCount = flattened.filter(t => t.status === 'pending').length;
        const completedCount = flattened.filter(t => t.status === 'completed').length;
        console.log(`✅ Fetched ${flattened.length} assignments (${pendingCount} pending, ${completedCount} completed)`);

        return flattened;
    };

    const fetchGoogleClassroomAssignments = useCallback(async () => {
        if (!gapiReady) {
            console.warn('⚠️ Google API not ready');
            return [];
        }

        const token = window.gapi.client.getToken();
        if (!token) {
            console.log('🔑 No token found, prompting login...');

            // Return a promise that resolves when the login success callback runs!
            return new Promise((resolve) => {
                loginResolver.current = resolve;
                login();
            });
        }

        return await fetchAssignments();

    }, [gapiReady, login]);

    return { fetchGoogleClassroomAssignments, loading, error, gapiReady };
};

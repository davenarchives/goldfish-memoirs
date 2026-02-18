import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export const useCanvas = (userId) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);
    const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    // Load token from Firestore on mount
    useEffect(() => {
        setToken(null); // Reset token immediately when user changes
        setInitialLoad(true);

        if (!userId) {
            setInitialLoad(false);
            return;
        }

        const loadToken = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists() && userDoc.data().canvasToken) {
                    setToken(userDoc.data().canvasToken);
                }
            } catch (err) {
                console.error('Error loading Canvas token from Firestore:', err);
            } finally {
                setInitialLoad(false);
            }
        };

        loadToken();
    }, [userId]);

    const saveToken = useCallback(async (newToken) => {
        const trimmedToken = newToken?.trim();
        if (!trimmedToken) return;

        setToken(trimmedToken);
        setIsCanvasModalOpen(false);

        if (userId) {
            try {
                await setDoc(doc(db, 'users', userId), {
                    canvasToken: trimmedToken
                }, { merge: true });
                console.log('✅ Canvas token saved to Firestore');
            } catch (err) {
                console.error('Error saving Canvas token to Firestore:', err);
            }
        }
    }, [userId]);

    const clearToken = useCallback(async () => {
        setToken(null);

        if (userId) {
            try {
                await setDoc(doc(db, 'users', userId), {
                    canvasToken: null
                }, { merge: true });
            } catch (err) {
                console.error('Error clearing Canvas token:', err);
            }
        }
    }, [userId]);

    const fetchCanvasAssignments = useCallback(async () => {
        const currentToken = token?.trim();

        if (!currentToken) {
            console.warn('⚠️ No Canvas token found');
            setIsCanvasModalOpen(true);
            return null; // Return null instead of empty array to indicate no sync happened
        }

        setLoading(true);
        setError(null);

        try {
            const proxyUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_PROXY_URL || '');

            // Pass token in headers to proxy
            const response = await fetch(`${proxyUrl}/api/canvas/assignments`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token likely invalid — clear it and re-open modal for new token
                    await clearToken();
                    setError('Canvas token expired or invalid. Please enter a new token.');
                    setIsCanvasModalOpen(true);
                    throw new Error('CANVAS_AUTH_ERROR');
                }
                throw new Error('Failed to fetch Canvas assignments');
            }

            const assignments = await response.json();

            // Transform Canvas data to unified task format
            return assignments.map((assignment) => ({
                title: assignment.name,
                platform: 'Canvas',
                courseName: assignment.course_name || assignment.course_code || 'Unknown Course',
                dueDate: new Date(assignment.due_at),
                status: 'pending',
                originalLink: assignment.html_url,
                description: assignment.description?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
                source: 'canvas',
                sourceId: assignment.id.toString(),
            }));
        } catch (err) {
            console.error('Canvas API Error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [token, clearToken]);

    return {
        fetchCanvasAssignments,
        loading: loading || initialLoad,
        error,
        token,
        isCanvasModalOpen,
        setIsCanvasModalOpen,
        saveToken
    };
};

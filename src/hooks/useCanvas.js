import { useState, useCallback } from 'react';

export const useCanvas = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('canvas_token'));
    const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);

    const saveToken = useCallback((newToken) => {
        setToken(newToken);
        localStorage.setItem('canvas_token', newToken);
        setIsCanvasModalOpen(false);
    }, []);

    const fetchCanvasAssignments = useCallback(async () => {
        const currentToken = token || localStorage.getItem('canvas_token');

        if (!currentToken) {
            console.warn('⚠️ No Canvas token found');
            setIsCanvasModalOpen(true);
            return null; // Return null instead of empty array to indicate no sync happened
        }

        setLoading(true);
        setError(null);

        try {
            const proxyUrl = import.meta.env.VITE_PROXY_URL ?? '';

            // Pass token in headers to proxy
            const response = await fetch(`${proxyUrl}/api/canvas/assignments`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token likely invalid
                    setToken(null);
                    localStorage.removeItem('canvas_token');
                    setError('Canvas token expired or invalid. Please update it.');
                    setIsCanvasModalOpen(true);
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
    }, [token]);

    return {
        fetchCanvasAssignments,
        loading,
        error,
        token,
        isCanvasModalOpen,
        setIsCanvasModalOpen,
        saveToken
    };
};

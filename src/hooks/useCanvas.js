import { useState, useCallback } from 'react';

export const useCanvas = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCanvasAssignments = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';
            // Fetch ALL assignments (including undated ones like Roll Call), not just upcoming
            const response = await fetch(`${proxyUrl}/api/canvas/assignments`);

            if (!response.ok) {
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
    }, []);

    return { fetchCanvasAssignments, loading, error };
};

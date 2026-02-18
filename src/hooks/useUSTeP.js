import { useState, useCallback, useEffect } from 'react';

export const useUSTeP = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('ustep_token'));
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';

            const response = await fetch(`${proxyUrl}/api/ustep/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            setToken(data.token);
            localStorage.setItem('ustep_token', data.token);
            setIsLoginModalOpen(false); // Close modal on success
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = useCallback(() => {
        setToken(null);
        localStorage.removeItem('ustep_token');
    }, []);

    const fetchUSTePAssignments = useCallback(async () => {
        const currentToken = token || localStorage.getItem('ustep_token');

        if (!currentToken) {
            console.warn('⚠️ No USTeP token found');
            return [];
        }

        setLoading(true);
        try {
            const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';
            const response = await fetch(`${proxyUrl}/api/ustep/assignments`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    logout();
                    setError('Session expired. Please login again.');
                }
                throw new Error('Failed to fetch USTeP assignments');
            }

            const assignments = await response.json();

            return assignments.map(a => {
                // Determine status
                let status = 'pending';
                const dueDate = a.duedate ? new Date(a.duedate * 1000) : null;
                const now = new Date();

                if (dueDate && dueDate < now) {
                    status = 'overdue';
                }

                // If we get submission status later, valid updates here

                return {
                    title: a.name,
                    platform: 'USTeP',
                    courseName: a.course_name || a.course_code || 'USTeP Course',
                    dueDate: dueDate,
                    status: status, // default for now
                    originalLink: a.cmid ? `https://ustep.ustp.edu.ph/mod/assign/view.php?id=${a.cmid}` : null,
                    description: a.intro ? a.intro.replace(/<[^>]*>?/gm, '').substring(0, 200) : '',
                    source: 'ustep',
                    sourceId: a.id.toString()
                };
            });

        } catch (err) {
            console.error('❌ USTeP API Error:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    return {
        login,
        logout,
        fetchUSTePAssignments,
        loading,
        error,
        token,
        isLoginModalOpen,
        setIsLoginModalOpen
    };
};

import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export const useUSTeP = (userId) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    // Load token from Firestore on mount
    useEffect(() => {
        if (!userId) {
            setInitialLoad(false);
            return;
        }

        const loadToken = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists() && userDoc.data().ustepToken) {
                    setToken(userDoc.data().ustepToken);
                }
            } catch (err) {
                console.error('Error loading USTeP token from Firestore:', err);
            } finally {
                setInitialLoad(false);
            }
        };

        loadToken();
    }, [userId]);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const proxyUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_PROXY_URL || '');

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
            setIsLoginModalOpen(false);

            // Save token to Firestore
            if (userId) {
                try {
                    await setDoc(doc(db, 'users', userId), {
                        ustepToken: data.token
                    }, { merge: true });
                    console.log('✅ USTeP token saved to Firestore');
                } catch (err) {
                    console.error('Error saving USTeP token to Firestore:', err);
                }
            }

            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = useCallback(async () => {
        setToken(null);

        if (userId) {
            try {
                await setDoc(doc(db, 'users', userId), {
                    ustepToken: null
                }, { merge: true });
            } catch (err) {
                console.error('Error clearing USTeP token:', err);
            }
        }
    }, [userId]);

    const fetchUSTePAssignments = useCallback(async () => {
        const currentToken = token;

        if (!currentToken) {
            console.warn('⚠️ No USTeP token found');
            return [];
        }

        setLoading(true);
        try {
            const proxyUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_PROXY_URL || '');
            const response = await fetch(`${proxyUrl}/api/ustep/assignments`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    await logout();
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

                return {
                    title: a.name,
                    platform: 'USTeP',
                    courseName: a.course_name || a.course_code || 'USTeP Course',
                    dueDate: dueDate,
                    status: status,
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
        loading: loading || initialLoad,
        error,
        token,
        isLoginModalOpen,
        setIsLoginModalOpen
    };
};

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { Archive as ArchiveIcon, Calendar, Trash2 } from 'lucide-react';
import TaskCard from '../components/TaskCard';

const TheArchive = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all');
    const user = auth.currentUser;

    // Real-time listener for completed tasks
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const tasksRef = collection(db, 'users', user.uid, 'tasks');
        const q = query(
            tasksRef,
            where('status', '==', 'completed'),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const tasksData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    dueDate: doc.data().dueDate?.toDate() || new Date(doc.data().dueDate),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                }));
                setTasks(tasksData);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching archived tasks:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Filter by time
    const getFilteredTasks = () => {
        if (timeFilter === 'all') return tasks;

        const now = new Date();
        let cutoffDate;

        switch (timeFilter) {
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'semester':
                cutoffDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
                break;
            default:
                return tasks;
        }

        return tasks.filter((task) => task.updatedAt >= cutoffDate);
    };

    const handleDelete = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task from the archive?')) {
            try {
                await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
            } catch (error) {
                console.error('Error deleting task:', error);
                alert('Failed to delete task');
            }
        }
    };

    const handleDeleteAll = async () => {
        if (filteredTasks.length === 0) return;

        if (window.confirm(`⚠️ WARNING: Are you sure you want to delete ALL ${filteredTasks.length} tasks in this view?\n\nThis action cannot be undone.`)) {
            setLoading(true);
            try {
                const batch = writeBatch(db);
                filteredTasks.forEach((task) => {
                    const docRef = doc(db, 'users', user.uid, 'tasks', task.id);
                    batch.delete(docRef);
                });
                await batch.commit();
                // Alert removed to prevent blocking UI updates
                console.log('Batch delete committed');
            } catch (error) {
                console.error('Error deleting all tasks:', error);
                alert('Failed to delete tasks');
                setLoading(false);
            }
        }
    };

    const filteredTasks = getFilteredTasks();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-goldfish-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading archive...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-goldfish flex items-center gap-3">
                            <ArchiveIcon className="w-8 h-8" />
                            The Archive
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {tasks.length} completed {tasks.length === 1 ? 'task' : 'tasks'}
                        </p>
                    </div>

                    {filteredTasks.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear Archive
                        </button>
                    )}
                </div>

                {/* Time Filter */}
                <div className="mt-4 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'all', label: 'All Time' },
                            { value: 'week', label: 'This Week' },
                            { value: 'month', label: 'This Month' },
                            { value: 'semester', label: 'This Semester' },
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setTimeFilter(filter.value)}
                                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-all
                  ${timeFilter === filter.value
                                        ? 'bg-gradient-goldfish text-white shadow-goldfish'
                                        : 'glass-card hover:bg-white/90 dark:hover:bg-ocean-navy-700/90'
                                    }
                `}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Completed Tasks Grid */}
            {filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {filteredTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 rounded-2xl text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Archive is empty
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        {tasks.length === 0
                            ? 'Complete some tasks to see them here!'
                            : 'No completed tasks in this time period'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default TheArchive;

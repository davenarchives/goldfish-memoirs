import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { RefreshCw, Filter } from 'lucide-react';
import TaskCard from '../components/TaskCard';

const TheCurrent = ({ onSyncTasks, isSyncing, gapiReady }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPlatform, setFilterPlatform] = useState('all');
    const user = auth.currentUser;

    // Real-time listener for pending tasks
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const tasksRef = collection(db, 'users', user.uid, 'tasks');
        const q = query(
            tasksRef,
            where('status', '==', 'pending'),
            orderBy('dueDate', 'asc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const tasksData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    dueDate: doc.data().dueDate?.toDate() || new Date(doc.data().dueDate),
                }));
                setTasks(tasksData);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching tasks:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Filter tasks
    const filteredTasks = filterPlatform === 'all'
        ? tasks
        : tasks.filter((task) => task.platform === filterPlatform);

    // Get unique platforms
    const platforms = ['all', ...new Set(tasks.map((task) => task.platform))];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-goldfish-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading your tasks...</p>
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
                        <h1 className="text-3xl font-bold text-gradient-goldfish">🌊 The Current</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Your active assignments and tasks
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={onSyncTasks}
                            disabled={isSyncing || !gapiReady}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!gapiReady ? 'Waiting for Google API to initialize...' : 'Sync tasks from Canvas and Google Classroom'}
                        >
                            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? 'Syncing...' : 'Sync Tasks'}</span>
                        </button>
                        {!gapiReady && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 animate-pulse">
                                ⏳ Initializing Google API...
                            </p>
                        )}
                    </div>
                </div>

                {/* Filter */}
                <div className="mt-4 flex items-center gap-3">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <div className="flex flex-wrap gap-2">
                        {platforms.map((platform) => (
                            <button
                                key={platform}
                                onClick={() => setFilterPlatform(platform)}
                                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-all
                  ${filterPlatform === platform
                                        ? 'bg-gradient-goldfish text-white shadow-goldfish'
                                        : 'glass-card hover:bg-white/90 dark:hover:bg-ocean-navy-700/90'
                                    }
                `}
                            >
                                {platform === 'all' ? 'All' : platform}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tasks Grid */}
            {filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {filteredTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 rounded-2xl text-center">
                    <div className="text-6xl mb-4">🐠</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        No tasks in the current!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {tasks.length === 0
                            ? "Click 'Sync Tasks' to import from Canvas and Google Classroom"
                            : 'Try selecting a different filter'}
                    </p>
                    {tasks.length === 0 && (
                        <button onClick={onSyncTasks} className="btn-primary">
                            Sync My Tasks
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TheCurrent;

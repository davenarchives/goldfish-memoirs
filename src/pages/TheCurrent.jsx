import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { RefreshCw, Filter, LayoutList, Calendar } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import CalendarView from '../components/CalendarView';

// Assets
import CanvasLogo from '../assets/Canvas_Logo.webp';
import GoogleLogo from '../assets/Google_Classroom_Logo.svg.png';
import USTEPLogo from '../assets/USTeP_Logo.png';

const TheCurrent = ({ user, onSyncCanvas, onSyncGoogle, onSyncUSTeP, isSyncing, gapiReady, ustepToken, canvasToken, setIsLoginModalOpen, setIsCanvasModalOpen }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPlatform, setFilterPlatform] = useState('all');
    const [view, setView] = useState('list'); // 'list' or 'calendar'

    // Real-time listener for pending tasks
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const tasksRef = collection(db, 'users', user.uid, 'tasks');
        const q = query(
            tasksRef,
            where('status', 'in', ['pending', 'overdue']),
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

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex bg-gray-100/50 dark:bg-ocean-navy-800/50 p-1 rounded-lg">
                            <button
                                onClick={() => setView('list')}
                                className={`p-2 rounded-md transition-all ${view === 'list' ? 'bg-white dark:bg-ocean-navy-700 shadow-sm text-goldfish-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                title="List View"
                            >
                                <LayoutList size={20} />
                            </button>
                            <button
                                onClick={() => setView('calendar')}
                                className={`p-2 rounded-md transition-all ${view === 'calendar' ? 'bg-white dark:bg-ocean-navy-700 shadow-sm text-orange-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                title="Calendar View"
                            >
                                <Calendar size={20} />
                            </button>
                        </div>

                        {/* Sync Buttons */}
                        <div className="flex items-center gap-2">

                            <div className="flex items-center gap-1">
                                {/* Canvas Sync */}
                                <button
                                    onClick={() => !canvasToken ? setIsCanvasModalOpen(true) : onSyncCanvas()}
                                    disabled={isSyncing.canvas}
                                    className="group relative p-2 rounded-xl glass-card hover:bg-white/90 dark:hover:bg-ocean-navy-700/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                                    title={!canvasToken ? "Connect Canvas" : "Sync Canvas"}
                                >
                                    <img src={CanvasLogo} alt="Canvas" className={`w-8 h-8 object-contain ${isSyncing.canvas ? 'animate-pulse opacity-50' : ''}`} />
                                    {isSyncing.canvas && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                                        </div>
                                    )}
                                </button>
                                {/* Manage Canvas Token Button */}
                                <button
                                    onClick={() => setIsCanvasModalOpen(true)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-goldfish-500 hover:bg-white/50 dark:hover:bg-ocean-navy-700/50 transition-all"
                                    title="Manage Canvas Token"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-2"><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></svg>
                                </button>
                            </div>

                            {/* Google Sync */}
                            <button
                                onClick={onSyncGoogle}
                                disabled={isSyncing.google || !gapiReady}
                                className="group relative p-2 rounded-xl glass-card hover:bg-white/90 dark:hover:bg-ocean-navy-700/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                                title={!gapiReady ? "Initializing Google API..." : "Sync Google Classroom"}
                            >
                                <img src={GoogleLogo} alt="Google Classroom" className={`w-8 h-8 object-contain ${isSyncing.google ? 'animate-pulse opacity-50' : ''}`} />
                                {isSyncing.google && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                                    </div>
                                )}
                            </button>

                            {/* USTeP Sync */}
                            <button
                                onClick={() => !ustepToken ? setIsLoginModalOpen(true) : onSyncUSTeP()}
                                disabled={isSyncing.ustep}
                                className="group relative p-2 rounded-xl glass-card hover:bg-white/90 dark:hover:bg-ocean-navy-700/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                                title={!ustepToken ? "Login to USTeP" : "Sync USTeP"}
                            >
                                <img src={USTEPLogo} alt="USTeP" className={`w-8 h-8 object-contain ${isSyncing.ustep ? 'animate-pulse opacity-50' : ''}`} />
                                {isSyncing.ustep && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="mt-6 flex items-center gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
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

            {/* Content Display */}
            {view === 'calendar' ? (
                <CalendarView tasks={filteredTasks} />
            ) : (
                <div className="space-y-6">
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
                                    ? "Click 'Sync Tasks' to import from Canvas, Google Classroom, and USTeP"
                                    : 'Try selecting a different filter'}
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={!canvasToken ? () => setIsCanvasModalOpen(true) : onSyncCanvas} className="btn-secondary">
                                    {!canvasToken ? 'Connect Canvas' : 'Sync Canvas'}
                                </button>
                                <button onClick={onSyncGoogle} className="btn-secondary">Sync Classroom</button>
                                <button onClick={!ustepToken ? () => setIsLoginModalOpen(true) : onSyncUSTeP} className="btn-secondary">
                                    {!ustepToken ? 'Login to USTeP' : 'Sync USTeP'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TheCurrent;

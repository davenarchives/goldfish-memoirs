import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { FolderOpen, ChevronDown, ChevronUp } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import NoteEditor from '../components/NoteEditor';

const SubjectFolders = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedFolder, setExpandedFolder] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const user = auth.currentUser;

    // Real-time listener for all tasks
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const tasksRef = collection(db, 'users', user.uid, 'tasks');
        const q = query(tasksRef, where('status', '==', 'pending'));

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

    // Group tasks by course
    const courseGroups = tasks.reduce((acc, task) => {
        const courseName = task.courseName || 'Uncategorized';
        if (!acc[courseName]) {
            acc[courseName] = [];
        }
        acc[courseName].push(task);
        return acc;
    }, {});

    const courses = Object.keys(courseGroups).sort();

    // Folder colors
    const folderColors = [
        'from-blue-400 to-blue-600',
        'from-green-400 to-green-600',
        'from-purple-400 to-purple-600',
        'from-pink-400 to-pink-600',
        'from-yellow-400 to-yellow-600',
        'from-red-400 to-red-600',
    ];

    const getFolderColor = (index) => folderColors[index % folderColors.length];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-goldfish-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading folders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-6 rounded-2xl">
                <h1 className="text-3xl font-bold text-gradient-goldfish flex items-center gap-3">
                    <FolderOpen className="w-8 h-8" />
                    Subject Folders
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {courses.length} {courses.length === 1 ? 'subject' : 'subjects'} with active tasks
                </p>
            </div>

            {/* Folders Grid */}
            {courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((courseName, index) => {
                        const courseTasks = courseGroups[courseName];
                        const isExpanded = expandedFolder === courseName;

                        return (
                            <div key={courseName} className="space-y-4">
                                {/* Folder Card */}
                                <button
                                    onClick={() => {
                                        setExpandedFolder(isExpanded ? null : courseName);
                                        setSelectedCourse(isExpanded ? null : courseName);
                                    }}
                                    className="w-full glass-card p-6 rounded-2xl hover:scale-105 transition-all text-left"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div
                                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getFolderColor(
                                                    index
                                                )} flex items-center justify-center mb-3 shadow-lg`}
                                            >
                                                <FolderOpen className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="font-bold text-lg mb-1">{courseName}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {courseTasks.length} {courseTasks.length === 1 ? 'task' : 'tasks'}
                                            </p>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-goldfish-500" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Expanded Tasks */}
                                {isExpanded && (
                                    <div className="space-y-3 animate-slide-up">
                                        {courseTasks.map((task) => (
                                            <TaskCard key={task.id} task={task} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card p-12 rounded-2xl text-center">
                    <div className="text-6xl mb-4">📁</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        No subject folders yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Sync your tasks to organize them by subject
                    </p>
                </div>
            )}

            {/* Note Editor */}
            {selectedCourse && (
                <div className="mt-8">
                    <NoteEditor courseId={selectedCourse} courseName={selectedCourse} />
                </div>
            )}
        </div>
    );
};

export default SubjectFolders;

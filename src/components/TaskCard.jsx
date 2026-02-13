import { useState } from 'react';
import { ExternalLink, Clock, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';

const TaskCard = ({ task, onDelete }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const user = auth.currentUser;

    const handleToggleComplete = async () => {
        if (!user || isUpdating) return;

        setIsUpdating(true);
        try {
            const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';

            await updateDoc(taskRef, {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating task:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Platform badge styling
    const getPlatformBadgeClass = (platform) => {
        const badges = {
            Canvas: 'badge-canvas',
            'Google Classroom': 'badge-google',
            Google: 'badge-google',
            USTEP: 'badge-ustep',
            Manual: 'badge-manual',
        };
        return badges[platform] || 'badge-manual';
    };

    // Format due date
    const formatDueDate = (date) => {
        const dueDate = new Date(date);
        const now = new Date();
        const diffMs = dueDate - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        const timeStr = dueDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });

        const dateStr = dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });

        if (diffDays < 0) {
            const relativeText = diffDays === -1 ? 'Yesterday' : dateStr;
            return { text: `Overdue (${relativeText})`, time: timeStr, urgent: true, type: 'overdue' };
        } else if (diffDays === 0) {
            return { text: 'Due Today', time: timeStr, urgent: true, type: 'today' };
        } else if (diffDays === 1) {
            return { text: 'Tomorrow', time: timeStr, urgent: false, type: 'tomorrow' };
        } else if (diffDays <= 7) {
            return { text: `${diffDays} days`, time: timeStr, urgent: false, type: 'week' };
        } else {
            return { text: dateStr, time: timeStr, urgent: false, type: 'future' };
        }
    };

    const dueInfo = formatDueDate(task.dueDate);
    const isCompleted = task.status === 'completed';

    return (
        <div
            className={`
        glass-card p-5 rounded-2xl h-full flex flex-col
        transition-all duration-300 hover:scale-[1.02]
        ${isCompleted ? 'opacity-60' : ''}
        ${dueInfo.urgent && !isCompleted ? 'ring-2 ring-red-400/50 dark:ring-red-600/50' : ''}
        animate-slide-up
      `}
        >
            <div className="flex items-start gap-4 flex-1">
                {/* Checkbox */}
                <button
                    onClick={handleToggleComplete}
                    disabled={isUpdating}
                    className="flex-shrink-0 mt-1 focus-ring-goldfish rounded-full disabled:cursor-wait"
                >
                    {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                        <Circle className="w-6 h-6 text-gray-400 hover:text-goldfish-500 transition-colors" />
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col h-full">
                    {/* Title and Platform */}
                    {/* Metadata Header */}
                    <div className="flex items-center justify-between mb-2">
                        <span className={`badge ${getPlatformBadgeClass(task.platform)} text-[10px] uppercase tracking-wider font-bold`}>
                            {task.platform}
                        </span>

                        {onDelete && (
                            <button
                                onClick={() => onDelete(task.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Delete from Archive"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Title */}
                    <h3
                        className={`
                            text-base font-bold leading-tight mb-2 line-clamp-2
                            ${isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}
                        `}
                    >
                        {task.title}
                    </h3>

                    {/* Course Name */}
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                        📚 {task.courseName}
                    </p>

                    {/* Due Date */}
                    <div className="flex items-center gap-2 mb-3">
                        <Clock
                            className={`w-4 h-4 ${dueInfo.urgent && !isCompleted
                                ? 'text-red-500'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        />
                        <span
                            className={`text-sm font-medium ${dueInfo.urgent && !isCompleted
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {dueInfo.text} at {dueInfo.time}
                        </span>

                        {dueInfo.type === 'overdue' && !isCompleted && (
                            <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                ⚠️ Overdue
                            </span>
                        )}
                        {dueInfo.type === 'today' && !isCompleted && (
                            <span className="badge bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                📌 Today
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    {/* Link */}
                    <div className="mt-auto">
                        {task.originalLink && (
                            <a
                                href={task.originalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-goldfish-600 dark:text-goldfish-400 
                    hover:text-goldfish-700 dark:hover:text-goldfish-300 font-bold transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>View Assignment</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;

import { useState } from 'react';

const TaskItem = ({ task, onStatusChange }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleCheckboxChange = async () => {
        setIsUpdating(true);
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            await onStatusChange(task.id, newStatus);
        } finally {
            setIsUpdating(false);
        }
    };

    // Platform-specific styling
    const platformColors = {
        'Canvas': 'bg-blue-100 text-blue-800 border-blue-300',
        'Google Classroom': 'bg-green-100 text-green-800 border-green-300',
        'Manual': 'bg-purple-100 text-purple-800 border-purple-300'
    };

    const platformBadgeColor = platformColors[task.platform] || 'bg-gray-100 text-gray-800 border-gray-300';

    // Format due date
    const formatDueDate = (date) => {
        const dueDate = new Date(date);
        const now = new Date();
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const formattedDate = dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });

        const formattedTime = dueDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

        if (diffDays < 0) {
            return { text: `${formattedDate} at ${formattedTime}`, urgent: true, label: 'Overdue' };
        } else if (diffDays === 0) {
            return { text: `Today at ${formattedTime}`, urgent: true, label: 'Due Today' };
        } else if (diffDays === 1) {
            return { text: `Tomorrow at ${formattedTime}`, urgent: false, label: 'Due Tomorrow' };
        } else if (diffDays <= 7) {
            return { text: `${formattedDate} at ${formattedTime}`, urgent: false, label: `${diffDays} days` };
        } else {
            return { text: `${formattedDate} at ${formattedTime}`, urgent: false, label: null };
        }
    };

    const dueInfo = formatDueDate(task.dueDate);

    return (
        <div
            className={`bg-white rounded-lg shadow-md p-5 border-l-4 transition-all hover:shadow-lg ${task.status === 'completed'
                    ? 'border-green-500 opacity-60'
                    : dueInfo.urgent
                        ? 'border-red-500'
                        : 'border-blue-500'
                }`}
        >
            <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 pt-1">
                    <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={handleCheckboxChange}
                        disabled={isUpdating}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:cursor-wait"
                    />
                </div>

                {/* Task Content */}
                <div className="flex-grow">
                    {/* Title and Platform Badge */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h3
                            className={`text-lg font-semibold text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-500' : ''
                                }`}
                        >
                            {task.title}
                        </h3>
                        <span
                            className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full border ${platformBadgeColor}`}
                        >
                            {task.platform}
                        </span>
                    </div>

                    {/* Course Name */}
                    <p className="text-sm font-medium text-gray-700 mb-2">{task.courseName}</p>

                    {/* Due Date */}
                    <div className="flex items-center gap-2 mb-2">
                        <svg
                            className={`w-4 h-4 ${dueInfo.urgent ? 'text-red-500' : 'text-gray-500'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span className={`text-sm ${dueInfo.urgent ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            {dueInfo.text}
                        </span>
                        {dueInfo.label && (
                            <span
                                className={`ml-2 px-2 py-0.5 text-xs font-medium rounded ${dueInfo.urgent ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}
                            >
                                {dueInfo.label}
                            </span>
                        )}
                    </div>

                    {/* Description (if available) */}
                    {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                    )}

                    {/* Link to Original Assignment */}
                    {task.originalLink && (
                        <a
                            href={task.originalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            <span>View Assignment</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                            </svg>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskItem;

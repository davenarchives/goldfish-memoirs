import { useState } from 'react';
import { Waves, Archive, FolderOpen, LogOut, Moon, Sun } from 'lucide-react';
import { auth } from '../services/firebaseConfig';
import { signOut } from 'firebase/auth';

const Sidebar = ({ currentPage, onPageChange, darkMode, onToggleDarkMode }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const user = auth.currentUser;

    const navItems = [
        { id: 'current', label: 'The Current', icon: Waves, color: 'goldfish' },
        { id: 'archive', label: 'The Archive', icon: Archive, color: 'water-blue' },
        { id: 'folders', label: 'Subject Folders', icon: FolderOpen, color: 'purple' },
    ];

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {!isCollapsed && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsCollapsed(true)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed left-0 top-0 h-screen z-50
          glass-card border-r-2 border-goldfish-200/20 dark:border-goldfish-800/20
          transition-all duration-300 ease-in-out
          ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'w-72 lg:w-72'}
        `}
            >
                <div className="flex flex-col h-full p-6">
                    {/* Logo/Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            {!isCollapsed && (
                                <div className="animate-fade-in">
                                    <h1 className="text-2xl font-bold text-gradient-goldfish">
                                        🐠 Goldfish Memoirs
                                    </h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Never forget a task
                                    </p>
                                </div>
                            )}

                            {/* Collapse Toggle - Desktop */}
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="hidden lg:block glass-card p-2 rounded-lg hover:bg-goldfish-100 dark:hover:bg-goldfish-900/30 transition-colors"
                            >
                                <svg
                                    className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onPageChange(item.id);
                                        if (window.innerWidth < 1024) setIsCollapsed(true);
                                    }}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group
                    ${isActive
                                            ? 'bg-gradient-goldfish text-white shadow-goldfish'
                                            : 'glass-card hover:bg-white/90 dark:hover:bg-ocean-navy-700/90'
                                        }
                  `}
                                >
                                    <Icon
                                        className={`w-5 h-5 ${isActive ? '' : 'text-gray-600 dark:text-gray-400 group-hover:text-goldfish-500'
                                            }`}
                                    />
                                    {!isCollapsed && (
                                        <span className="font-medium animate-fade-in">{item.label}</span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Dark Mode Toggle */}
                    <div className="mb-4">
                        <button
                            onClick={onToggleDarkMode}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl glass-card hover:bg-white/90 dark:hover:bg-ocean-navy-700/90 transition-all"
                        >
                            {darkMode ? (
                                <Sun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-blue-600" />
                            )}
                            {!isCollapsed && (
                                <span className="font-medium animate-fade-in">
                                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* User Profile */}
                    {user && (
                        <div className="glass-card p-4 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-goldfish flex items-center justify-center text-white font-bold">
                                    {user.displayName?.[0] || user.email?.[0] || '?'}
                                </div>
                                {!isCollapsed && (
                                    <div className="flex-1 min-w-0 animate-fade-in">
                                        <p className="text-sm font-semibold truncate">
                                            {user.displayName || 'Student'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {!isCollapsed && (
                                <button
                                    onClick={handleSignOut}
                                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                    bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400
                    hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsCollapsed(false)}
                className={`
          lg:hidden fixed top-4 left-4 z-30
          glass-card p-3 rounded-xl shadow-glass
          ${isCollapsed ? 'block' : 'hidden'}
        `}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </>
    );
};

export default Sidebar;

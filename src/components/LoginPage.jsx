import { GoogleLogin } from '@react-oauth/google';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useState } from 'react';

const LoginPage = ({ onDemoLogin }) => {
    const [useDemoMode, setUseDemoMode] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const credential = GoogleAuthProvider.credential(credentialResponse.credential);
            await signInWithCredential(auth, credential);
        } catch (error) {
            console.error('Login error:', error);
            alert('Firebase is not configured. Use demo mode instead!');
        }
    };

    const handleGoogleError = () => {
        console.error('Google login failed');
    };

    const handleDemoLogin = () => {
        if (onDemoLogin) {
            onDemoLogin({
                uid: 'demo-user',
                email: 'demo@goldfish-memoirs.com',
                displayName: 'Demo User',
                photoURL: '🐠'
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-water-blue-100 via-water-blue-50 to-goldfish-50 dark:from-ocean-navy-900 dark:via-ocean-navy-800 dark:to-ocean-navy-900">
            <div className="glass-card p-12 rounded-4xl max-w-md w-full mx-4 text-center shadow-glass-lg">
                {/* Logo */}
                <div className="text-7xl mb-6 animate-pulse-soft">🐠</div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-gradient-goldfish mb-3">
                    Goldfish Memoirs
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Never forget a task again. Your personal academic assistant.
                </p>

                {/* Features List */}
                <div className="mb-8 space-y-3 text-left">
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-2xl">🌊</span>
                        <span>Centralized dashboard for all tasks</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-2xl">📚</span>
                        <span>Canvas & Google Classroom sync</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-2xl">📝</span>
                        <span>Auto-saving note chapters</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-2xl">✨</span>
                        <span>Beautiful glassmorphism design</span>
                    </div>
                </div>

                {/* Demo Mode Toggle */}
                <div className="mb-6 p-4 glass-card rounded-xl">
                    <label className="flex items-center justify-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useDemoMode}
                            onChange={(e) => setUseDemoMode(e.target.checked)}
                            className="w-4 h-4 rounded accent-goldfish-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Use Demo Mode (Firebase not configured)
                        </span>
                    </label>
                </div>

                {/* Login Options */}
                {useDemoMode ? (
                    <button
                        onClick={handleDemoLogin}
                        className="btn-primary w-full"
                    >
                        🎮 Enter Demo Mode
                    </button>
                ) : (
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            text="signin_with"
                            size="large"
                            theme="outline"
                        />
                    </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                    {useDemoMode ? 'Demo mode with sample data' : 'Sign in with your school Google account'}
                </p>
            </div>
        </div>
    );
};

export default LoginPage;

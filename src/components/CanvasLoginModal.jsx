import { useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';

const CanvasLoginModal = ({ isOpen, onClose, onSaveToken, loading, error }) => {
    const [token, setToken] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSaveToken(token);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-ocean-navy-800 rounded-xl p-8 max-w-md w-full shadow-2xl transform transition-all border-t-4 border-red-500">
                <div className="flex justify-center mb-6">
                    <img src="/src/assets/Canvas_Logo.webp" alt="Canvas" className="h-12 object-contain" />
                </div>

                <div className="flex flex-col items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connect Canvas</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                        Enter your Canvas API Token to sync assignments.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        How to get a token:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>Log in to Canvas.</li>
                        <li>Go to <strong>Account</strong> {'>'} <strong>Settings</strong>.</li>
                        <li>Scroll to <strong>Approved Integrations</strong>.</li>
                        <li>Click <strong>+ New Access Token</strong>.</li>
                        <li>Generate and copy the token.</li>
                    </ol>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">CANVAS API TOKEN</label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-ocean-navy-900 border border-gray-100 dark:border-ocean-navy-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-ocean-navy-800 transition-all text-gray-900 dark:text-white"
                            placeholder="Enter your token here..."
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 dark:border-ocean-navy-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-ocean-navy-700/50 transition-all font-semibold"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Verifying...' : 'Save Token'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CanvasLoginModal;

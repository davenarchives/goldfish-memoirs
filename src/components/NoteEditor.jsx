import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { Save, Check } from 'lucide-react';

const NoteEditor = ({ courseId, courseName }) => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [saveTimeout, setSaveTimeout] = useState(null);
    const user = auth.currentUser;

    // Load note on mount
    useEffect(() => {
        const loadNote = async () => {
            if (!user || !courseId) return;

            try {
                const noteRef = doc(db, 'users', user.uid, 'notes', courseId);
                const noteSnap = await getDoc(noteRef);

                if (noteSnap.exists()) {
                    setContent(noteSnap.data().content || '');
                    setLastSaved(noteSnap.data().updatedAt?.toDate());
                }
            } catch (error) {
                console.error('Error loading note:', error);
            }
        };

        loadNote();
    }, [user, courseId]);

    // Auto-save function
    const saveNote = useCallback(async (noteContent) => {
        if (!user || !courseId) return;

        setIsSaving(true);
        try {
            const noteRef = doc(db, 'users', user.uid, 'notes', courseId);
            await setDoc(
                noteRef,
                {
                    content: noteContent,
                    courseName: courseName || 'Untitled',
                    courseId,
                    updatedAt: serverTimestamp(),
                    createdAt: serverTimestamp(),
                },
                { merge: true }
            );

            setLastSaved(new Date());
        } catch (error) {
            console.error('Error saving note:', error);
        } finally {
            setIsSaving(false);
        }
    }, [user, courseId, courseName]);

    // Debounced auto-save
    const handleContentChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);

        // Clear existing timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }

        // Set new timeout to save after 1 second of inactivity
        const timeout = setTimeout(() => {
            saveNote(newContent);
        }, 1000);

        setSaveTimeout(timeout);
    };

    // Character count
    const charCount = content.length;

    return (
        <div className="glass-card p-6 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        📝 Note Chapter
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {courseName || 'General Notes'}
                    </p>
                </div>

                {/* Save Status */}
                <div className="flex items-center gap-2">
                    {isSaving ? (
                        <div className="flex items-center gap-2 text-sm text-goldfish-600 dark:text-goldfish-400">
                            <Save className="w-4 h-4 animate-pulse" />
                            <span>Saving...</span>
                        </div>
                    ) : lastSaved ? (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <Check className="w-4 h-4" />
                            <span>Saved {lastSaved.toLocaleTimeString()}</span>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Editor */}
            <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Start typing your notes... They'll auto-save as you write! 🐠"
                className="
          w-full h-96 px-4 py-3
          bg-white/50 dark:bg-ocean-navy-800/50
          border border-gray-200 dark:border-ocean-navy-700
          rounded-xl
          focus:outline-none focus:ring-2 focus:ring-goldfish-500/50
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          resize-none
          transition-all duration-200
        "
            />

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {charCount} characters
                </p>

                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Auto-saves 1 second after you stop typing
                </p>
            </div>
        </div>
    );
};

export default NoteEditor;

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, query } from 'firebase/firestore';
import { auth, db } from './services/firebaseConfig';
import { useCanvas } from './hooks/useCanvas';
import { useGoogleClassroom } from './hooks/useGoogleClassroom';

// Components
import Sidebar from './components/Sidebar';
import TheCurrent from './pages/TheCurrent';
import TheArchive from './pages/TheArchive';
import SubjectFolders from './pages/SubjectFolders';
import LoginPage from './components/LoginPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('current');
  const [darkMode, setDarkMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const { fetchCanvasAssignments } = useCanvas();
  const { fetchGoogleClassroomAssignments, gapiReady } = useGoogleClassroom();

  // Check for saved dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle demo login
  const handleDemoLogin = (demoUser) => {
    setUser(demoUser);
    setDemoMode(true);
    setLoading(false);
  };

  // Toggle dark mode
  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync tasks from APIs
  const handleSyncTasks = async () => {
    if (!user || isSyncing) return;

    if (!gapiReady) {
      console.warn('⚠️ Google API not ready yet, please wait...');
      alert('⚠️ Google Classroom API is still loading.\n\nPlease wait a few more seconds and try again!\n\nCheck the console for initialization status.');
      return;
    }

    setIsSyncing(true);
    try {
      console.log('🔄 Starting sync from Canvas and Google Classroom...');

      // Fetch from both platforms
      const [canvasAssignments, googleAssignments] = await Promise.allSettled([
        fetchCanvasAssignments(),
        fetchGoogleClassroomAssignments(),
      ]);

      console.log('Canvas result:', canvasAssignments);
      console.log('Google Classroom result:', googleAssignments);

      const allNewTasks = [
        ...(canvasAssignments.status === 'fulfilled' ? canvasAssignments.value : []),
        ...(googleAssignments.status === 'fulfilled' ? googleAssignments.value : []),
      ];

      console.log(`📥 Fetched ${allNewTasks.length} total tasks`);

      if (allNewTasks.length === 0) {
        alert('No new tasks found to sync. You may already be up to date!');
        return;
      }

      // Get existing task sourceIds from Firestore to avoid duplicates
      const tasksRef = collection(db, 'users', user.uid, 'tasks');

      // Get all existing tasks (or at least their source IDs) to check against
      // In a real app with many tasks, you'd want a more efficient query, 
      // but for a personal dashboard this is fine.
      const existingSnapshot = await getDocs(query(tasksRef));
      const existingSourceIds = new Set(
        existingSnapshot.docs.map(doc => {
          const data = doc.data();
          return `${data.source}-${data.sourceId}`;
        })
      );

      const uniqueNewTasks = allNewTasks.filter(task => {
        const uniqueId = `${task.source}-${task.sourceId}`;
        return !existingSourceIds.has(uniqueId);
      });

      console.log(`🔍 Found ${uniqueNewTasks.length} unique new tasks to add`);

      if (uniqueNewTasks.length === 0) {
        alert('✅ Sync complete! No new tasks found (everything is up to date).');
        return;
      }

      const addPromises = uniqueNewTasks.map((task) =>
        addDoc(tasksRef, {
          ...task,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(addPromises);
      console.log(`✅ Synced ${addPromises.length} new tasks`);

      const pendingCount = allNewTasks.filter(t => t.status === 'pending').length;
      const completedCount = allNewTasks.filter(t => t.status === 'completed').length;

      alert(`✅ Successfully synced ${addPromises.length} tasks!\n\n📊 ${pendingCount} pending tasks\n✅ ${completedCount} completed tasks`);
    } catch (error) {
      console.error('❌ Sync error:', error);
      alert(`❌ Sync failed: ${error.message}\n\nCheck the console for more details.`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Render page based on current selection
  const renderPage = () => {
    switch (currentPage) {
      case 'current':
        return <TheCurrent onSyncTasks={handleSyncTasks} isSyncing={isSyncing} gapiReady={gapiReady} />;
      case 'archive':
        return <TheArchive />;
      case 'folders':
        return <SubjectFolders />;
      default:
        return <TheCurrent onSyncTasks={handleSyncTasks} isSyncing={isSyncing} gapiReady={gapiReady} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-water-blue-100 dark:bg-ocean-navy-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-goldfish-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Goldfish Memoirs...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage onDemoLogin={handleDemoLogin} />
    );
  }

  return (
    <div className="min-h-screen bg-water-blue-100 dark:bg-ocean-navy-900 transition-colors duration-300">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Content */}
      <main className="lg:ml-72 p-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;

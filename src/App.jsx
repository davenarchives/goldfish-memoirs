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
import { useUSTeP } from './hooks/useUStep';
import USTePLoginModal from './components/USTePLoginModal';
import CanvasLoginModal from './components/CanvasLoginModal';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('current');
  const [darkMode, setDarkMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState({
    canvas: false,
    google: false,
    ustep: false
  });
  const [demoMode, setDemoMode] = useState(false);

  const {
    fetchCanvasAssignments,
    token: canvasToken,
    isCanvasModalOpen,
    setIsCanvasModalOpen,
    saveToken: saveCanvasToken,
    loading: canvasLoading,
    error: canvasError
  } = useCanvas(user?.uid);
  const { fetchGoogleClassroomAssignments, gapiReady } = useGoogleClassroom(user?.uid);
  const {
    login: loginUSTeP,
    fetchUSTePAssignments,
    token: ustepToken,
    isLoginModalOpen,
    setIsLoginModalOpen,
    loading: ustepLoading,
    error: ustepError
  } = useUSTeP(user?.uid);

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

  // Sync Canvas tasks
  const handleSyncCanvas = async () => {
    if (!user || isSyncing.canvas) return;

    setIsSyncing(prev => ({ ...prev, canvas: true }));
    try {
      console.log('🔄 Starting Canvas sync...');
      const canvasAssignments = await fetchCanvasAssignments();

      const newTasks = canvasAssignments || [];
      await syncTasksToFirestore(newTasks, 'Canvas');

    } catch (error) {
      if (error.message === 'CANVAS_AUTH_ERROR') {
        // Silent fail - modal is already opening via useCanvas hook
        console.log('🔄 Canvas auth error, opening modal...');
        return;
      }
      console.error('❌ Canvas sync error:', error);
      alert(`❌ Canvas sync failed: ${error.message}`);
    } finally {
      setIsSyncing(prev => ({ ...prev, canvas: false }));
    }
  };

  // Sync Google Classroom tasks
  const handleSyncGoogle = async () => {
    if (!user || isSyncing.google) return;

    if (!gapiReady) {
      alert('⚠️ Google API not ready yet. Please wait a moment.');
      return;
    }

    setIsSyncing(prev => ({ ...prev, google: true }));
    try {
      console.log('🔄 Starting Google Classroom sync...');
      const googleAssignments = await fetchGoogleClassroomAssignments();

      const newTasks = googleAssignments || [];
      await syncTasksToFirestore(newTasks, 'Google Classroom');

    } catch (error) {
      console.error('❌ Google sync error:', error);
      alert(`❌ Google sync failed: ${error.message}`);
    } finally {
      setIsSyncing(prev => ({ ...prev, google: false }));
    }
  };

  // Sync USTeP tasks
  const handleSyncUSTeP = async () => {
    if (!user || isSyncing.ustep) return;

    setIsSyncing(prev => ({ ...prev, ustep: true }));
    try {
      console.log('🔄 Starting USTeP sync...');
      const ustepAssignments = await fetchUSTePAssignments();

      const newTasks = ustepAssignments || [];
      await syncTasksToFirestore(newTasks, 'USTeP');

    } catch (error) {
      console.error('❌ USTeP sync error:', error);
      alert(`❌ USTeP sync failed: ${error.message}`);
    } finally {
      setIsSyncing(prev => ({ ...prev, ustep: false }));
    }
  };

  // Helper function to sync tasks to Firestore
  const syncTasksToFirestore = async (newTasks, sourceName) => {
    console.log(`📥 Fetched ${newTasks.length} tasks from ${sourceName}`);

    if (newTasks.length === 0) {
      alert(`No new tasks found from ${sourceName}. You may already be up to date!`);
      return;
    }

    // Get existing task sourceIds from Firestore to avoid duplicates
    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const existingSnapshot = await getDocs(query(tasksRef));
    const existingSourceIds = new Set(
      existingSnapshot.docs.map(doc => {
        const data = doc.data();
        return `${data.source}-${data.sourceId}`;
      })
    );

    const uniqueNewTasks = newTasks.filter(task => {
      const uniqueId = `${task.source}-${task.sourceId}`;
      return !existingSourceIds.has(uniqueId);
    });

    console.log(`🔍 Found ${uniqueNewTasks.length} unique new tasks to add from ${sourceName}`);

    if (uniqueNewTasks.length === 0) {
      alert(`✅ ${sourceName} Sync complete! No new tasks found.`);
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
    console.log(`✅ Synced ${addPromises.length} new tasks from ${sourceName}`);

    const pendingCount = newTasks.filter(t => t.status === 'pending' || t.status === 'overdue').length;

    alert(`✅ ${sourceName} Sync Complete!\n\n📥 Added ${addPromises.length} new tasks.\n✨ ${newTasks.length - uniqueNewTasks.length} tasks were already up to date.`);
  };

  // Render page based on current selection
  const renderPage = () => {
    switch (currentPage) {
      case 'current':
        return (
          <TheCurrent
            user={user}
            onSyncCanvas={handleSyncCanvas}
            onSyncGoogle={handleSyncGoogle}
            onSyncUSTeP={handleSyncUSTeP}
            isSyncing={isSyncing}
            gapiReady={gapiReady}
            ustepToken={ustepToken}
            canvasToken={canvasToken}
            setIsLoginModalOpen={setIsLoginModalOpen}
            setIsCanvasModalOpen={setIsCanvasModalOpen}
          />
        );
      case 'archive':
        return <TheArchive user={user} />;
      case 'folders':
        return <SubjectFolders user={user} />;
      default:
        return (
          <TheCurrent
            user={user}
            onSyncCanvas={handleSyncCanvas}
            onSyncGoogle={handleSyncGoogle}
            onSyncUSTeP={handleSyncUSTeP}
            isSyncing={isSyncing}
            gapiReady={gapiReady}
            ustepToken={ustepToken}
            canvasToken={canvasToken}
            setIsLoginModalOpen={setIsLoginModalOpen}
            setIsCanvasModalOpen={setIsCanvasModalOpen}
          />
        );
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

      <USTePLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={loginUSTeP}
        loading={ustepLoading}
        error={ustepError}
      />

      <CanvasLoginModal
        isOpen={isCanvasModalOpen}
        onClose={() => setIsCanvasModalOpen(false)}
        onSaveToken={saveCanvasToken}
        loading={canvasLoading}
        error={canvasError}
      />
    </div>
  );
}

export default App;

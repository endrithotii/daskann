import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { CreateDiscussion } from './pages/CreateDiscussion';
import { DiscussionDetail } from './pages/DiscussionDetail';
import { ResultsPage } from './pages/ResultsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DepartmentRoleManagement } from './pages/DepartmentRoleManagement';

type View = 'dashboard' | 'create' | 'discussion' | 'results' | 'admin' | 'departments';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);

  const handleViewDiscussion = (id: string) => {
    setSelectedDiscussionId(id);
    setCurrentView('discussion');
  };

  const handleViewResults = (id: string) => {
    setSelectedDiscussionId(id);
    setCurrentView('results');
  };

  const handleDiscussionCreated = (id: string) => {
    setSelectedDiscussionId(id);
    setCurrentView('discussion');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  switch (currentView) {
    case 'admin':
      return <AdminDashboard onBack={() => setCurrentView('dashboard')} />;
    case 'departments':
      return <DepartmentRoleManagement onBack={() => setCurrentView('dashboard')} />;
    case 'create':
      return (
        <CreateDiscussion
          onBack={() => setCurrentView('dashboard')}
          onCreated={handleDiscussionCreated}
          onSuccess={() => setCurrentView('dashboard')}
        />
      );
    case 'discussion':
      return selectedDiscussionId ? (
        <DiscussionDetail
          discussionId={selectedDiscussionId}
          onBack={() => setCurrentView('dashboard')}
          onViewResults={handleViewResults}
        />
      ) : (
        <Dashboard
          onCreateDiscussion={() => setCurrentView('create')}
          onViewDiscussion={handleViewDiscussion}
          onViewResults={handleViewResults}
          onAdminPanel={() => setCurrentView('admin')}
          onDepartmentManagement={() => setCurrentView('departments')}
        />
      );
    case 'results':
      return selectedDiscussionId ? (
        <ResultsPage
          discussionId={selectedDiscussionId}
          onBack={() => setCurrentView('dashboard')}
        />
      ) : (
        <Dashboard
          onCreateDiscussion={() => setCurrentView('create')}
          onViewDiscussion={handleViewDiscussion}
          onViewResults={handleViewResults}
          onAdminPanel={() => setCurrentView('admin')}
          onDepartmentManagement={() => setCurrentView('departments')}
        />
      );
    default:
      return (
        <Dashboard
          onCreateDiscussion={() => setCurrentView('create')}
          onViewDiscussion={handleViewDiscussion}
          onViewResults={handleViewResults}
          onAdminPanel={() => setCurrentView('admin')}
          onDepartmentManagement={() => setCurrentView('departments')}
        />
      );
  }
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

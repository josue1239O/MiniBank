import { useAuth, AuthProvider } from './context/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { AdminScreen } from './screens/AdminScreen';
import { TeacherScreen } from './screens/TeacherScreen';
import { CollectorScreen } from './screens/CollectorScreen';
import './App.css';

const MainNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminScreen />;
    case 'teacher':
      return <TeacherScreen />;
    case 'collector':
      return <CollectorScreen />;
    default:
      return <LoginScreen />;
  }
};

function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}

export default App;

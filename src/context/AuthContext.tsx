import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { getUsers } from '../services/firebase';

type Role = 'teacher' | 'collector' | 'admin';

const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

interface LoginResult {
  success: boolean;
  message: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (role: Role, email: string, pin: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('minibank_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (role: Role, email: string, pin: string): Promise<LoginResult> => {
    try {
      const users = await getUsers();
      const inputHash = hashPin(pin);
      
      for (const u of users) {
        if (u.role !== role) continue;
        
        if (role === 'teacher') {
          if (u.email?.toLowerCase() !== email.toLowerCase()) continue;
        }
        
        const storedHash = hashPin(u.pin);
        if (inputHash === storedHash) {
          if (role === 'teacher' && !u.active) {
            return { success: false, message: 'inactive' };
          }
          localStorage.setItem('minibank_user', JSON.stringify(u));
          setUser(u);
          return { success: true, message: 'Login exitoso' };
        }
      }
      return { success: false, message: role === 'teacher' ? 'Correo o PIN incorrecto' : 'PIN incorrecto' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('minibank_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  is_super_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            email,
            name,
            is_super_admin,
            user_roles(
              roles(key)
            )
          `)
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          const role = data.user_roles?.[0]?.roles?.key || 'EMPLOYEE';
          setUser({
            id: data.id,
            email: data.email,
            name: data.name,
            role,
            is_super_admin: data.is_super_admin || false,
          });
        } else {
          localStorage.removeItem('userId');
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
          password_hash: passwordHash,
        },
      ])
      .select('id, email, name')
      .single();

    if (error) throw error;

    const { data: employeeRole } = await supabase
      .from('roles')
      .select('id')
      .eq('key', 'EMPLOYEE')
      .single();

    if (employeeRole) {
      await supabase
        .from('user_roles')
        .insert([
          {
            user_id: data.id,
            role_id: employeeRole.id,
          },
        ]);
    }

    setUser(data);
    localStorage.setItem('userId', data.id);
  };

  const signIn = async (email: string, password: string) => {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash, is_super_admin')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error('Invalid email or password');
    }

    if (data.password_hash !== passwordHash) {
      throw new Error('Invalid email or password');
    }

    const userData = {
      id: data.id,
      email: data.email,
      name: data.name,
      is_super_admin: data.is_super_admin || false,
    };

    setUser(userData);
    localStorage.setItem('userId', data.id);
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isSuperAdmin = user?.is_super_admin || false;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

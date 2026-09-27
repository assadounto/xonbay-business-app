import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { api, sessionStorage } from '@/lib/api';
import type { User } from '@/lib/types';

type AuthContextValue = {
  user: User | null; loaded: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (values: { name: string; username: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([sessionStorage.getToken(), sessionStorage.getUser()])
      .then(([token, stored]) => {
        if (token && stored) setUser(JSON.parse(stored) as User);
      })
      .catch(() => sessionStorage.clear())
      .finally(() => setLoaded(true));
  }, []);

  const saveSession = async (data: { token: string; user: User; refresh_token?: string }) => {
    if (!data.token || !data.user) throw new Error('The server did not return a session.');
    await sessionStorage.save(data.token, data.user, data.refresh_token);
    setUser(data.user);
  };

  const signIn = async (email: string, password: string) => {
    const data = await api<{ token: string; user: User; refresh_token?: string }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ user: { email: email.trim(), password } }),
    }, false);
    await saveSession(data);
  };

  const signUp = async (values: { name: string; username: string; email: string; password: string }) => {
    const form = new FormData();
    form.append('user[name]', values.name.trim());
    form.append('user[username]', values.username.trim().toLowerCase());
    form.append('user[email]', values.email.trim().toLowerCase());
    form.append('user[password]', values.password);
    form.append('user[platform]', Platform.OS);
    form.append('user[app]', 'xonbay');
    const data = await api<{ token: string; user: User; refresh_token?: string }>('/auth/register', {
      method: 'POST', body: form,
    }, false);
    await saveSession(data);
  };

  const signOut = async () => {
    await sessionStorage.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loaded, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}

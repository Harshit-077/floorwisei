import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ProjectData } from '@/types/editor';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  saveProject: (project: ProjectData) => void;
  loadProjects: () => ProjectData[];
  deleteProject: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = 'floorwise_users';
const SESSION_KEY = 'floorwise_session';

function getStoredUsers(): Record<string, { id: string; name: string; email: string; passwordHash: string }> {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
}

function projectsKey(userId: string) { return `floorwise_projects_${userId}`; }

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) return null;
      const { userId } = JSON.parse(session);
      const users = getStoredUsers();
      const u = users[userId];
      if (!u) return null;
      return { id: u.id, name: u.name, email: u.email };
    } catch { return null; }
  });

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const users = getStoredUsers();
    const emailKey = email.toLowerCase();
    if (Object.values(users).some(u => u.email === emailKey)) {
      throw new Error('An account with this email already exists.');
    }
    const id = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    users[id] = { id, name, email: emailKey, passwordHash: simpleHash(password) };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: id }));
    setUser({ id, name, email: emailKey });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const users = getStoredUsers();
    const emailKey = email.toLowerCase();
    const u = Object.values(users).find(u => u.email === emailKey);
    if (!u) throw new Error('No account found with this email.');
    if (u.passwordHash !== simpleHash(password)) throw new Error('Incorrect password.');
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: u.id }));
    setUser({ id: u.id, name: u.name, email: u.email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const saveProject = useCallback((project: ProjectData) => {
    if (!user) return;
    const key = projectsKey(user.id);
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as ProjectData[];
    const idx = existing.findIndex(p => p.id === project.id);
    const updated = project.updatedAt ? project : { ...project, updatedAt: new Date().toISOString() };
    if (idx >= 0) existing[idx] = updated;
    else existing.unshift(updated);
    localStorage.setItem(key, JSON.stringify(existing));
  }, [user]);

  const loadProjects = useCallback((): ProjectData[] => {
    if (!user) return [];
    try { return JSON.parse(localStorage.getItem(projectsKey(user.id)) || '[]'); } catch { return []; }
  }, [user]);

  const deleteProject = useCallback((id: string) => {
    if (!user) return;
    const key = projectsKey(user.id);
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as ProjectData[];
    localStorage.setItem(key, JSON.stringify(existing.filter(p => p.id !== id)));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, saveProject, loadProjects, deleteProject }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

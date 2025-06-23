import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken
} from 'firebase/auth';
import { 
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { logAuditEvent, AuditEventType, getClientInfo } from '../utils/auditLogger';

interface AuthContextType {
  currentUser: User | null;
  userRole: 'admin' | 'staff' | null;
  loading: boolean;
  createUser: (email: string, password: string, role: 'admin' | 'staff') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyAdminPassword: (password: string) => Promise<boolean>;
  refreshToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Set up token refresh
  useEffect(() => {
    if (!currentUser) return;

    const refreshTokenInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshTokenInterval);
  }, [currentUser]);

  const createUser = async (email: string, password: string, role: 'admin' | 'staff') => {
    const currentUserDoc = await getDoc(doc(db, 'users', currentUser?.uid || ''));
    if (!currentUserDoc.exists() || currentUserDoc.data().role !== 'admin') {
      throw new Error('Only admins can create new users');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email,
      role,
      createdAt: new Date().toISOString()
    });

    await logAuditEvent({
      eventType: AuditEventType.USER_CREATED,
      userId: currentUser?.uid,
      userEmail: currentUser?.email || undefined,
      details: `Created user: ${email} with role: ${role}`,
      ...getClientInfo()
    });
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists() || !['admin', 'staff'].includes(userDoc.data().role)) {
      await signOut(auth);
      throw new Error('Unauthorized access');
    }
  };

  const logout = async () => {
    if (currentUser) {
      await logAuditEvent({
        eventType: AuditEventType.LOGOUT,
        userId: currentUser.uid,
        userEmail: currentUser.email || undefined,
        ...getClientInfo()
      });
    }
    await signOut(auth);
  };

  const verifyAdminPassword = async (password: string) => {
    if (!currentUser) return false;
    try {
      await signInWithEmailAndPassword(auth, currentUser.email!, password);
      return true;
    } catch {
      return false;
    }
  };

  const refreshToken = async () => {
    if (!currentUser) throw new Error('No user logged in');
    const token = await getIdToken(currentUser, true);
    return token;
  };

  const value = {
    currentUser,
    userRole,
    loading,
    createUser,
    login,
    logout,
    verifyAdminPassword,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 
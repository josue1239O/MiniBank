import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, sendPasswordResetEmail } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import type { Child, User, Transaction } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const ensureAnonymousAuth = async (): Promise<void> => {
  if (auth.currentUser === null) {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Anonymous auth error:', error);
    }
  }
};

ensureAnonymousAuth();

export const generateQRId = (): string => {
  return Math.random().toString().slice(2, 8).padStart(6, '0');
};

export const getAgeGroup = (age: number): '5-6' | '7-8' | '9-10' | '11-12' => {
  if (age >= 5 && age <= 6) return '5-6';
  if (age >= 7 && age <= 8) return '7-8';
  if (age >= 9 && age <= 10) return '9-10';
  return '11-12';
};

export const getUsers = async (): Promise<User[]> => {
  await ensureAnonymousAuth();
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as User));
};

export const subscribeToUsers = (callback: (users: User[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, 'users'), (querySnapshot) => {
    const users = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as User));
    callback(users);
  });
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  await ensureAnonymousAuth();
  const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const docSnap = querySnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as User;
};

export const addUser = async (user: Omit<User, 'id' | 'createdAt'>): Promise<string> => {
  await ensureAnonymousAuth();
  const docRef = await addDoc(collection(db, 'users'), {
    ...user,
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
  await ensureAnonymousAuth();
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, data);
};

export const getUsersByRole = async (role: 'teacher' | 'collector' | 'admin'): Promise<User[]> => {
  await ensureAnonymousAuth();
  const q = query(collection(db, 'users'), where('role', '==', role));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as User));
};

export const getChildren = async (): Promise<Child[]> => {
  await ensureAnonymousAuth();
  const querySnapshot = await getDocs(collection(db, 'children'));
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Child));
};

export const subscribeToChildren = (callback: (children: Child[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, 'children'), (querySnapshot) => {
    const children = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Child));
    callback(children);
  });
};

export const addChild = async (child: Omit<Child, 'id' | 'createdAt'>): Promise<string> => {
  await ensureAnonymousAuth();
  const docRef = await addDoc(collection(db, 'children'), {
    ...child,
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateChildBalance = async (childId: string, newBalance: number): Promise<void> => {
  await ensureAnonymousAuth();
  const childRef = doc(db, 'children', childId);
  await updateDoc(childRef, { balance: newBalance });
};

export const deleteChild = async (childId: string): Promise<void> => {
  await ensureAnonymousAuth();
  await deleteDoc(doc(db, 'children', childId));
};

export const getChildByQRId = async (qrId: string): Promise<Child | null> => {
  await ensureAnonymousAuth();
  const q = query(collection(db, 'children'), where('qrId', '==', qrId));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const docSnap = querySnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Child;
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
  await ensureAnonymousAuth();
  const docRef = await addDoc(collection(db, 'transactions'), {
    ...transaction,
    timestamp: new Date()
  });
  return docRef.id;
};

export const sendPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    await ensureAnonymousAuth();
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'No existe una cuenta con este correo' };
    }
    if (user.role !== 'teacher') {
      return { success: false, message: 'Solo los profesores pueden restablecer su contraseña' };
    }
    if (!user.active) {
      return { success: false, message: 'Tu cuenta aún no ha sido activada por el administrador' };
    }
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Se ha enviado un enlace de recuperación a tu correo' };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return { success: false, message: 'No existe una cuenta con este correo' };
    }
    console.error('Password reset error:', error);
    return { success: false, message: 'Error al enviar el correo de recuperación' };
  }
};

export { db, auth };

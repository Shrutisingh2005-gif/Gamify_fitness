import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ActivityLog from './components/ActivityLog';
import AICoach from './components/AICoach';
import Social from './components/Social';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Sync user profile
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newProfile: UserProfile = {
            uid: u.uid,
            displayName: u.displayName || 'User',
            email: u.email || '',
            photoURL: u.photoURL || '',
            level: 1,
            xp: 0,
            rank: 'Bronze',
            streak: 0,
            lastActive: new Date().toISOString()
          };

          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        } else {
          setProfile(userSnap.data() as UserProfile);
        }

        // Real-time profile updates
        onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          }
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500">
            <Activity size={48} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Ready to start your journey?</h2>
          <p className="text-black/40 max-w-md">
            Join Vigor to track your health, earn rewards, and compete with friends. Sign in to unlock your personalized dashboard.
          </p>
          <button 
            onClick={() => import('./firebase').then(f => f.signIn())}
            className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
          >
            Get Started Now
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard userProfile={profile} />;
      case 'activities': return <ActivityLog userProfile={profile} />;
      case 'coach': return <AICoach />;
      case 'social': return <Social />;
      case 'challenges': return <Social />; // Reusing social for now
      default: return <Dashboard userProfile={profile} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl"></div>
          <div className="h-4 w-24 bg-black/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

import { Activity } from 'lucide-react';


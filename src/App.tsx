import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ActivityLog from './components/ActivityLog';
import AICoach from './components/AICoach';
import Social from './components/Social';
import Challenges from './components/Challenges';
import Onboarding from './components/Onboarding';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
          setShowOnboarding(true);
        } else {
          const data = userSnap.data() as UserProfile;
          setProfile(data);
          if (!data.goal) {
            setShowOnboarding(true);
          }
        }

        // Real-time profile updates
        onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data() as UserProfile;
            setProfile(data);
            if (!data.goal) {
              setShowOnboarding(true);
            } else {
              setShowOnboarding(false);
            }
          }
        });
      } else {
        setProfile(null);
        setShowOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 px-6">
          <div className="space-y-4">
            <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto rotate-12 shadow-xl shadow-emerald-500/10">
              <Activity size={48} />
            </div>
            <h1 className="text-5xl font-black tracking-tight">Gamify Fit</h1>
            <p className="text-black/40 max-w-sm mx-auto font-medium">
              The only wellness app that rewards your journey. Choose your path and start growing today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            {[
              { title: 'Bulk Up', icon: Dumbbell, color: 'text-orange-500', bg: 'bg-orange-50' },
              { title: 'Stay Fit', icon: Heart, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { title: 'Get Light', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
            ].map((g) => (
              <div key={g.title} className={`${g.bg} p-6 rounded-3xl border border-black/5 flex flex-col items-center gap-3`}>
                <g.icon className={g.color} size={32} />
                <span className="font-bold">{g.title}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4 w-full max-w-md">
            <button 
              onClick={() => import('./firebase').then(f => f.signIn())}
              className="w-full bg-black text-white px-8 py-6 rounded-[2rem] font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3"
            >
              Start Your Journey
              <ChevronRight size={24} />
            </button>
            <p className="text-[10px] text-black/20 font-bold uppercase tracking-widest">Secure Google Login</p>
          </div>
        </div>
      );
    }

    if (showOnboarding) {
      return <Onboarding userId={user.uid} onComplete={() => setShowOnboarding(false)} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard userProfile={profile} />;
      case 'activities': return <ActivityLog userProfile={profile} />;
      case 'coach': return <AICoach />;
      case 'social': return <Social />;
      case 'challenges': return <Challenges />;
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

import { Activity, Dumbbell, Heart, Zap, ChevronRight } from 'lucide-react';


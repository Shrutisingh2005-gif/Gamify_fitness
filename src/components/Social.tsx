import React, { useState, useEffect } from 'react';
import { Trophy, Users, Flame, Star, ChevronRight, Heart, MessageSquare, Clock, Zap } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, Timestamp, getDocs, where, writeBatch } from 'firebase/firestore';
import { UserProfile, ActivityLog, Challenge } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const staticChallenges: Challenge[] = [
  { id: 'ch1', title: 'Weekend Warrior', description: 'Log 60 mins of exercise', rewardXp: 500, type: 'Global', icon: 'Activity', targetValue: 60, targetType: 'exercise' },
  { id: 'ch2', title: 'Hydration Hero', description: 'Drink 2000ml of water', rewardXp: 300, type: 'Daily', icon: 'Droplets', targetValue: 2000, targetType: 'water' },
  { id: 'ch3', title: 'Sleep Master', description: 'Log 8 hours of sleep', rewardXp: 400, type: 'Daily', icon: 'Moon', targetValue: 8, targetType: 'sleep' },
];

export default function Social() {
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [feed, setFeed] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningChallenge, setJoiningChallenge] = useState<string | null>(null);

  useEffect(() => {
    // Leaderboard
    const qLeader = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
    const unsubscribeLeader = onSnapshot(qLeader, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => doc.data() as UserProfile));
    });

    // Global Feed
    const qFeed = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribeFeed = onSnapshot(qFeed, (snapshot) => {
      setFeed(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
      setLoading(false);
    });

    return () => {
      unsubscribeLeader();
      unsubscribeFeed();
    };
  }, []);

  const handleCheer = async (activityId: string, currentCheers: string[] = []) => {
    if (!auth.currentUser) return;
    const activityRef = doc(db, 'activities', activityId);
    const hasCheered = currentCheers.includes(auth.currentUser.uid);
    
    try {
      await updateDoc(activityRef, {
        cheers: hasCheered ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'activities');
    }
  };

  const handleJoinChallenge = async (challenge: Challenge) => {
    if (!auth.currentUser) return;
    setJoiningChallenge(challenge.id);
    
    try {
      // In a real app, we'd have a user_challenges collection
      // For this demo, we'll just simulate joining by adding a notification
      await addDoc(collection(db, 'notifications'), {
        userId: auth.currentUser.uid,
        message: `You've joined the ${challenge.title} challenge!`,
        type: 'challenge',
        read: false,
        timestamp: Timestamp.now()
      });
      alert(`Joined ${challenge.title}! Complete the target to earn ${challenge.rewardXp} XP.`);
    } catch (error) {
      console.error(error);
    } finally {
      setJoiningChallenge(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Challenges Section */}
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">Active Challenges</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staticChallenges.map((challenge) => (
              <div key={challenge.id} className="group bg-black/5 p-6 rounded-3xl hover:bg-emerald-50 transition-all border-2 border-transparent hover:border-emerald-100">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-4 bg-white rounded-2xl text-emerald-500 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-white rounded-full text-black/40">
                          {challenge.type}
                        </span>
                        <h4 className="font-bold">{challenge.title}</h4>
                      </div>
                      <p className="text-black/40 text-xs">{challenge.description}</p>
                      <div className="flex items-center gap-4 mt-4 text-xs font-bold">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Zap size={14} />
                          <span>{challenge.rewardXp} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleJoinChallenge(challenge)}
                  disabled={joiningChallenge === challenge.id}
                  className="mt-4 w-full py-2 rounded-xl bg-white text-emerald-600 font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100"
                >
                  {joiningChallenge === challenge.id ? 'Joining...' : 'Join Challenge'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Global Activity Feed */}
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <h3 className="text-2xl font-bold mb-8">Global Activity Feed</h3>
          <div className="space-y-8">
            {feed.length > 0 ? feed.map((activity) => (
              <div key={activity.id} className="flex gap-4 group">
                <img 
                  src={activity.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.userId}`} 
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm" 
                  alt={activity.userName} 
                  referrerPolicy="no-referrer" 
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      <span className="font-bold">{activity.userName}</span> logged{' '}
                      <span className="font-bold text-emerald-600">{activity.value} {activity.unit}</span> of{' '}
                      <span className="capitalize">{activity.type}</span>
                    </p>
                    <span className="text-[10px] text-black/20 font-bold uppercase tracking-widest">
                      {activity.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {activity.note && (
                    <p className="mt-2 text-sm text-black/60 bg-black/5 p-3 rounded-2xl italic">
                      "{activity.note}"
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-4">
                    <button 
                      onClick={() => handleCheer(activity.id!, activity.cheers)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                        activity.cheers?.includes(auth.currentUser?.uid || '') 
                          ? 'text-pink-500' 
                          : 'text-black/40 hover:text-pink-500'
                      }`}
                    >
                      <Heart size={16} fill={activity.cheers?.includes(auth.currentUser?.uid || '') ? 'currentColor' : 'none'} />
                      <span>{activity.cheers?.length || 0} Cheers</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-black/40 hover:text-emerald-500 transition-colors">
                      <MessageSquare size={16} />
                      <span>Comment</span>
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-black/20">
                <Clock size={48} className="mx-auto mb-4 opacity-10" />
                <p className="font-bold">No activities yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Sidebar */}
      <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm h-fit sticky top-[100px]">
        <div className="flex items-center gap-2 mb-8">
          <Flame className="text-orange-500" size={24} />
          <h3 className="text-xl font-bold">Leaderboard</h3>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-black/5 rounded-xl"></div>)}
            </div>
          ) : leaderboard.map((user, index) => (
            <div key={user.uid} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-sm font-bold w-4 ${index < 3 ? 'text-emerald-500' : 'text-black/20'}`}>
                  {index + 1}
                </span>
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm" 
                  alt={user.displayName} 
                  referrerPolicy="no-referrer" 
                />
                <div>
                  <p className="text-sm font-bold truncate max-w-[100px]">{user.displayName}</p>
                  <p className="text-[10px] text-black/40 uppercase font-bold tracking-wider">{user.rank || 'Bronze'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{user.xp.toLocaleString()}</p>
                <p className="text-[10px] text-black/40 uppercase font-bold tracking-wider">XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



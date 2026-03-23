import React, { useState } from 'react';
import { Trophy, Zap, Clock, Activity, Droplets, Moon } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Challenge } from '../types';
import { motion } from 'motion/react';

const staticChallenges: Challenge[] = [
  { id: 'ch1', title: 'Weekend Warrior', description: 'Log 60 mins of exercise', rewardXp: 500, type: 'Global', icon: 'Activity', targetValue: 60, targetType: 'exercise' },
  { id: 'ch2', title: 'Hydration Hero', description: 'Drink 2000ml of water', rewardXp: 300, type: 'Daily', icon: 'Droplets', targetValue: 2000, targetType: 'water' },
  { id: 'ch3', title: 'Sleep Master', description: 'Log 8 hours of sleep', rewardXp: 400, type: 'Daily', icon: 'Moon', targetValue: 8, targetType: 'sleep' },
  { id: 'ch4', title: 'Early Bird', description: 'Log activity before 8 AM', rewardXp: 250, type: 'Special', icon: 'Zap', targetValue: 1, targetType: 'exercise' },
];

export default function Challenges() {
  const [joiningChallenge, setJoiningChallenge] = useState<string | null>(null);

  const handleJoinChallenge = async (challenge: Challenge) => {
    if (!auth.currentUser) return;
    setJoiningChallenge(challenge.id);
    
    try {
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
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-black tracking-tight">Active Challenges</h3>
            <p className="text-black/40 font-medium">Complete tasks to earn massive XP rewards</p>
          </div>
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
            <Trophy size={32} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staticChallenges.map((challenge) => (
            <motion.div 
              key={challenge.id}
              whileHover={{ y: -4 }}
              className="group bg-black/5 p-8 rounded-[2rem] hover:bg-emerald-50 transition-all border-2 border-transparent hover:border-emerald-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={80} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white rounded-full text-black/40 shadow-sm">
                    {challenge.type}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                    <Zap size={14} />
                    <span>{challenge.rewardXp} XP</span>
                  </div>
                </div>

                <h4 className="text-xl font-bold mb-2">{challenge.title}</h4>
                <p className="text-black/40 text-sm mb-6 leading-relaxed">{challenge.description}</p>
                
                <button 
                  onClick={() => handleJoinChallenge(challenge)}
                  disabled={joiningChallenge === challenge.id}
                  className="w-full py-4 rounded-2xl bg-white text-emerald-600 font-bold text-sm hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 shadow-sm flex items-center justify-center gap-2"
                >
                  {joiningChallenge === challenge.id ? 'Joining...' : 'Join Challenge'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-500 p-10 rounded-[2.5rem] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-20">
          <Zap size={120} />
        </div>
        <div className="relative z-10 max-w-lg">
          <h3 className="text-3xl font-black mb-4">Weekly Leaderboard</h3>
          <p className="text-white/80 font-medium mb-8">Top performers this week will receive exclusive badges and bonus XP multipliers!</p>
          <button className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

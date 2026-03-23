import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Flame, 
  Moon, 
  Droplets, 
  Trophy, 
  TrendingUp, 
  ChevronRight, 
  Calendar,
  Zap,
  Star,
  RefreshCw,
  Award,
  Shield,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, writeBatch, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { ActivityLog, UserProfile, WeightEntry } from '../types';
import { calculateRank, getNextRankInfo, XP_THRESHOLDS } from '../utils/rank';
import { Scale } from 'lucide-react';

const StatCard = ({ title, value, unit, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} text-white`}>
        <Icon size={24} />
      </div>
    </div>
    <h3 className="text-black/40 text-sm font-medium uppercase tracking-wider">{title}</h3>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-black/40 text-sm font-medium">{unit}</span>
    </div>
  </div>
);

export default function Dashboard({ userProfile }: { userProfile: UserProfile | null }) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [showSpin, setShowSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [showWeightLog, setShowWeightLog] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'activities'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribeActivities = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      setActivities(logs);
      setLoading(false);
    });

    return () => {
      unsubscribeActivities();
    };
  }, []);

  const profile = userProfile;

  const handleResetProgress = async () => {
    if (!auth.currentUser || !profile) return;
    
    setIsResetting(true);
    try {
      const batch = writeBatch(db);
      
      const q = query(collection(db, 'activities'), where('userId', '==', auth.currentUser.uid));
      const activitySnap = await getDocs(q);
      activitySnap.forEach((doc) => batch.delete(doc.ref));

      const userRef = doc(db, 'users', auth.currentUser.uid);
      batch.update(userRef, {
        xp: 0,
        level: 1,
        rank: 'Bronze',
        streak: 0,
        lastActive: new Date().toISOString(),
        goal: null, // Reset goal to trigger onboarding
        currentWeight: null,
        weightHistory: []
      });

      await batch.commit();
      setResetSuccess(true);
      setShowResetConfirm(false);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reset');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSpin = async () => {
    if (!auth.currentUser || spinning) return;
    
    setSpinning(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const xpWon = [50, 100, 200, 500][Math.floor(Math.random() * 4)];
    setSpinResult(xpWon);
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const newXp = (profile?.xp || 0) + xpWon;
    await updateDoc(userRef, {
      xp: newXp,
      rank: calculateRank(newXp),
      lastActive: new Date().toISOString()
    });
    
    setSpinning(false);
    setTimeout(() => {
      setShowSpin(false);
      setSpinResult(null);
    }, 3000);
  };

  const handleLogWeight = async () => {
    if (!auth.currentUser || !newWeight) return;
    const weightNum = parseFloat(newWeight);
    const today = new Date().toISOString().split('T')[0];
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      currentWeight: weightNum,
      weightHistory: arrayUnion({ date: today, weight: weightNum })
    });
    
    setShowWeightLog(false);
    setNewWeight('');
  };

  const getStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = activities.filter(l => {
      const logDate = l.timestamp?.toDate();
      return logDate && logDate >= today;
    });

    return {
      steps: todayLogs.filter(l => l.type === 'exercise').reduce((acc, l) => acc + l.value, 0),
      calories: todayLogs.filter(l => l.type === 'nutrition').reduce((acc, l) => acc + l.value, 0),
      sleep: todayLogs.filter(l => l.type === 'sleep').reduce((acc, l) => acc + l.value, 0),
      water: todayLogs.filter(l => l.type === 'water').reduce((acc, l) => acc + l.value, 0) / 1000,
    };
  };

  const stats = getStats();

  const getChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      
      const dayLogs = activities.filter(l => {
        const logDate = l.timestamp?.toDate();
        return logDate && logDate.toDateString() === d.toDateString();
      });

      last7Days.push({
        name: dayName,
        steps: dayLogs.filter(l => l.type === 'exercise').reduce((acc, l) => acc + l.value, 0),
        sleep: dayLogs.filter(l => l.type === 'sleep').reduce((acc, l) => acc + l.value, 0),
      });
    }
    return last7Days;
  };

  const chartData = getChartData();

  const weightData = profile.weightHistory?.map(w => ({
    ...w,
    date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  })) || [];

  if (loading || !profile) return <div className="animate-pulse space-y-8 p-8"><div className="h-48 bg-black/5 rounded-[2.5rem]"></div></div>;

  const nextRankInfo = getNextRankInfo(profile.xp);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-black text-white p-10 rounded-[2.5rem] shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold uppercase tracking-widest">
                {profile.rank || 'Bronze'} Tier
              </span>
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                Level {profile.level}
              </span>
            </div>
            <h2 className="text-5xl font-black tracking-tight">
              Welcome back, <span className="text-emerald-400">{profile.displayName?.split(' ')[0]}</span>
            </h2>
            <p className="text-white/60 max-w-md">
              You're crushing your goals! You need <span className="text-white font-bold">{Math.max(0, nextRankInfo.threshold - profile.xp)} XP</span> to reach <span className="text-emerald-400 font-bold">{nextRankInfo.next}</span>.
            </p>
            
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                <span>Progress to {nextRankInfo.next}</span>
                <span>{Math.round(nextRankInfo.progress)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${nextRankInfo.progress}%` }}
                  className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => setShowSpin(true)}
              className="group relative p-8 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all"
            >
              <Trophy size={48} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Daily XP Spin</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Exercise" value={stats.steps} unit="mins" icon={Activity} color="bg-blue-500" />
        <StatCard title="Calories" value={stats.calories} unit="kcal" icon={Zap} color="bg-orange-500" />
        <StatCard title="Sleep" value={stats.sleep} unit="hrs" icon={Moon} color="bg-indigo-500" />
        <StatCard title="Water" value={stats.water.toFixed(1)} unit="L" icon={Droplets} color="bg-cyan-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl">
                  <Flame size={32} />
                </div>
                <div>
                  <h4 className="text-3xl font-black">{profile.streak}</h4>
                  <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Day Streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Keep it up!</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
                  <Scale size={32} />
                </div>
                <div>
                  <h4 className="text-3xl font-black">{profile.currentWeight || '--'}</h4>
                  <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Current Weight (kg)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWeightLog(true)}
                className="p-2 bg-black/5 rounded-xl hover:bg-black/10 transition-all text-black/40"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Weight Progress</h3>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                <TrendingUp size={16} />
                <span>Weekly Tracking</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h3 className="text-xl font-bold mb-8">Exercise Progress</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#F8F9FA' }}
                  />
                  <Bar dataKey="steps" fill="#10B981" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h3 className="text-xl font-bold mb-8">Sleep Quality</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="sleep" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorSleep)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h3 className="text-xl font-bold mb-8">Progress Journey</h3>
            <div className="space-y-6">
              {Object.entries(XP_THRESHOLDS).map(([key, threshold], index) => {
                const rankName = key.charAt(0) + key.slice(1).toLowerCase();
                const isUnlocked = profile.xp >= threshold;
                const isCurrent = profile.rank === rankName;

                return (
                  <div key={key} className="relative flex items-center gap-4">
                    {index !== Object.entries(XP_THRESHOLDS).length - 1 && (
                      <div className={`absolute left-6 top-10 w-0.5 h-10 ${isUnlocked ? 'bg-emerald-500' : 'bg-black/5'}`} />
                    )}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 transition-all ${
                      isCurrent ? 'bg-emerald-500 text-white scale-110 shadow-lg' : 
                      isUnlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-black/5 text-black/20'
                    }`}>
                      {isUnlocked ? <Trophy size={20} /> : <Zap size={20} />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isUnlocked ? 'text-black' : 'text-black/20'}`}>{rankName}</p>
                      <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{threshold.toLocaleString()} XP</p>
                    </div>
                    {isCurrent && (
                      <div className="ml-auto px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Current
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
            <h3 className="text-lg font-bold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-xs text-red-700/60 mb-6">Resetting will delete all logs, reset your rank, and allow you to pick a new goal.</p>
            <button 
              onClick={() => setShowResetConfirm(true)}
              disabled={isResetting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={isResetting ? 'animate-spin' : ''} />
              {isResetting ? 'Resetting...' : 'Reset Progress'}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSpin && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>
              
              <h2 className="text-3xl font-bold mb-2">Daily XP Spin</h2>
              <p className="text-black/40 mb-8">Test your luck for extra progress!</p>
              
              <div className="relative w-48 h-48 mx-auto mb-10">
                <motion.div 
                  animate={spinning ? { rotate: 360 * 5 } : {}}
                  transition={{ duration: 2, ease: "circOut" }}
                  className="w-full h-full rounded-full border-8 border-emerald-100 flex items-center justify-center relative"
                >
                  <Zap size={64} className="text-emerald-500" />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-8 bg-emerald-500 rounded-full"></div>
                </motion.div>
              </div>

              {spinResult ? (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="space-y-2"
                >
                  <p className="text-5xl font-black text-emerald-500">+{spinResult} XP</p>
                  <p className="font-bold text-black/40 uppercase tracking-widest">Congratulations!</p>
                </motion.div>
              ) : (
                <button 
                  onClick={handleSpin}
                  disabled={spinning}
                  className="w-full bg-emerald-500 text-white py-5 rounded-3xl font-bold text-xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                >
                  {spinning ? 'Spinning...' : 'Spin for XP'}
                </button>
              )}
              
              {!spinning && !spinResult && (
                <button 
                  onClick={() => setShowSpin(false)}
                  className="mt-6 text-black/20 font-bold hover:text-black/40 transition-colors"
                >
                  Maybe later
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <RefreshCw size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Are you sure?</h2>
              <p className="text-black/40 mb-8">This will permanently delete all your activity logs and reset your progress. This cannot be undone.</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleResetProgress}
                  disabled={isResetting}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : 'Yes, Reset Everything'}
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  disabled={isResetting}
                  className="w-full py-4 font-bold text-black/40 hover:text-black/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetSuccess && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-2xl z-50 flex items-center gap-3"
          >
            <CheckCircle2 size={20} className="text-emerald-400" />
            Progress reset successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWeightLog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
              <h2 className="text-3xl font-bold mb-2">Update Weight</h2>
              <p className="text-black/40 mb-8">Keep your progress accurate!</p>
              
              <div className="relative mb-8">
                <input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-black/5 rounded-3xl px-8 py-6 text-2xl font-bold outline-none focus:ring-2 ring-blue-500/20 text-center"
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 font-bold text-black/20 text-xl">kg</span>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowWeightLog(false)}
                  className="flex-1 py-4 font-bold text-black/40 hover:text-black/60 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogWeight}
                  disabled={!newWeight}
                  className="flex-1 bg-blue-500 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  Save Weight
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}




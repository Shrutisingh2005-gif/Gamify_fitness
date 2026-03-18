import React, { useState, useEffect } from 'react';
import { Activity, Droplets, Moon, Utensils, Plus, Clock, Award, Zap, Calculator, Sparkles, CheckCircle2 } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, Timestamp, query, where, orderBy, limit, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { ActivityLog as ActivityLogType, UserProfile } from '../types';
import { estimateCalories, getDailySuggestions } from '../services/gemini';
import { motion } from 'motion/react';
import { calculateRank } from '../utils/rank';


const activityTypes = [
  { id: 'exercise', label: 'Exercise', icon: Activity, color: 'bg-blue-500', unit: 'mins', xpPerUnit: 10 },
  { id: 'nutrition', label: 'Nutrition', icon: Utensils, color: 'bg-orange-500', unit: 'kcal', xpPerUnit: 0.5 },
  { id: 'sleep', label: 'Sleep', icon: Moon, color: 'bg-indigo-500', unit: 'hrs', xpPerUnit: 100 },
  { id: 'water', label: 'Water', icon: Droplets, color: 'bg-cyan-500', unit: 'ml', xpPerUnit: 0.1 },
];

export default function ActivityLog({ userProfile }: { userProfile: UserProfile | null }) {
  const [selectedType, setSelectedType] = useState('exercise');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState<ActivityLogType[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Calorie Estimator State
  const [mealDesc, setMealDesc] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [estimation, setEstimation] = useState<{calories: number, breakdown: string} | null>(null);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'activities'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogType));
      setHistory(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'activities');
    });

    fetchSuggestions();

    return () => unsubscribe();
  }, [selectedType]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    const result = await getDailySuggestions(selectedType);
    setSuggestions(result);
    setLoadingSuggestions(false);
  };

  const handleEstimate = async () => {
    if (!mealDesc.trim()) return;
    setEstimating(true);
    const result = await estimateCalories(mealDesc);
    setEstimation(result);
    if (result.calories > 0) {
      setValue(result.calories.toString());
      setSelectedType('nutrition');
    }
    setEstimating(false);
  };

  const handleSubmit = async (e?: React.FormEvent, customData?: any) => {
    if (e) e.preventDefault();
    if (!auth.currentUser) return;

    const finalValue = customData ? customData.value : value;
    const finalType = customData ? customData.type : selectedType;
    const finalNote = customData ? customData.description : note;

    if (!finalValue) return;

    setLoading(true);
    try {
      const typeConfig = activityTypes.find(t => t.id === finalType);
      const xpGained = Math.floor(Number(finalValue) * (typeConfig?.xpPerUnit || 0));

      const newLog: Omit<ActivityLogType, 'id'> = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'User',
        userPhoto: auth.currentUser.photoURL || '',
        type: finalType as any,
        value: Number(finalValue),
        unit: typeConfig?.unit || '',
        timestamp: Timestamp.now(),
        note: finalNote,
        cheers: []
      };


      await addDoc(collection(db, 'activities'), newLog);

      // Update user XP
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const newXp = (userProfile?.xp || 0) + xpGained;
      await updateDoc(userRef, {
        xp: newXp,
        rank: calculateRank(newXp),
        lastActive: new Date().toISOString()
      });

      setValue('');
      setNote('');
      setEstimation(null);
      setMealDesc('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'activities');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Calorie Estimator */}
        <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-3xl border border-orange-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-500 rounded-2xl text-white">
              <Calculator size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">AI Calorie Estimator</h3>
              <p className="text-black/40 text-sm">Describe your meal and we'll estimate the Kcal for you.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <input 
              type="text" 
              value={mealDesc}
              onChange={(e) => setMealDesc(e.target.value)}
              placeholder="e.g., 2 slices of pepperoni pizza and a small coke"
              className="flex-1 bg-white border border-orange-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-orange-500/20 transition-all font-medium"
            />
            <button 
              onClick={handleEstimate}
              disabled={estimating}
              className="bg-orange-500 text-white px-6 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              {estimating ? '...' : 'Estimate'}
            </button>
          </div>

          {estimation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-white rounded-2xl border border-orange-100"
            >
              <p className="text-lg font-bold text-orange-600">{estimation.calories} Kcal Estimated</p>
              <p className="text-sm text-black/60 mt-1">{estimation.breakdown}</p>
            </motion.div>
          )}
        </div>

        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <h3 className="text-2xl font-bold mb-6">Log New Activity</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {activityTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border-2 ${
                  selectedType === type.id 
                    ? `border-emerald-500 bg-emerald-50 text-emerald-600` 
                    : 'border-transparent bg-black/5 text-black/40 hover:bg-black/10'
                }`}
              >
                <div className={`p-3 rounded-xl ${selectedType === type.id ? 'bg-emerald-500 text-white' : 'bg-black/10 text-black/40'}`}>
                  <type.icon size={24} />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider">{type.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-black/40 uppercase tracking-wider">Amount ({activityTypes.find(t => t.id === selectedType)?.unit})</label>
                <input 
                  type="number" 
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter value..."
                  className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-emerald-500/20 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-black/40 uppercase tracking-wider">Note (Optional)</label>
                <input 
                  type="text" 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="How was it?"
                  className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-emerald-500/20 transition-all font-medium"
                />
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <><Plus size={24} /> Log Activity</>}
            </button>
          </form>
        </div>

        {/* AI Suggestions Section */}
        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-xl text-white">
                <Sparkles size={20} />
              </div>
              <h3 className="text-xl font-bold">AI Suggestions</h3>
            </div>
            <button 
              onClick={fetchSuggestions}
              className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingSuggestions ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 bg-black/5 animate-pulse rounded-2xl"></div>)
            ) : suggestions.map((s, i) => (
              <div key={i} className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-purple-900 text-sm">{s.title}</h4>
                  <p className="text-xs text-purple-700/70 mt-1">{s.description}</p>
                </div>
                <button 
                  onClick={() => handleSubmit(undefined, { ...s, type: selectedType })}
                  className="mt-4 w-full bg-white text-purple-600 py-2 rounded-xl text-xs font-bold hover:bg-purple-100 transition-all flex items-center justify-center gap-1"
                >
                  <CheckCircle2 size={14} />
                  Complete (+{Math.floor(s.value * (activityTypes.find(t => t.id === selectedType)?.xpPerUnit || 0))} XP)
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Recent History</h3>
          </div>
          
          <div className="space-y-4">
            {history.length > 0 ? history.map((log) => {
              const type = activityTypes.find(t => t.id === log.type);
              const Icon = type?.icon || Activity;
              return (
                <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/5">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl text-white ${type?.color || 'bg-gray-500'}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold capitalize">{log.type}</p>
                      <div className="flex items-center gap-2 text-xs text-black/40 mt-0.5">
                        <Clock size={12} />
                        <span>{log.timestamp?.toDate().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">+{Math.floor(log.value * (type?.xpPerUnit || 0))} XP</p>
                    <p className="text-sm text-black/40">{log.value} {log.unit}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-center text-black/40 py-8">No activities logged yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-600/20">
          <h3 className="text-xl font-bold mb-2">Weekly Summary</h3>
          <p className="text-indigo-100 text-sm mb-6">Keep logging to see your progress!</p>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Exercise</span>
                <span>{history.filter(l => l.type === 'exercise').reduce((acc, l) => acc + l.value, 0)} / 150 mins</span>
              </div>
              <div className="w-full bg-indigo-400/30 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{ width: `${Math.min(100, (history.filter(l => l.type === 'exercise').reduce((acc, l) => acc + l.value, 0) / 150) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <h3 className="text-xl font-bold mb-4">Milestones</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                <Zap size={24} />
              </div>
              <div>
                <p className="font-bold">First Step</p>
                <p className="text-xs text-black/40">Log your first activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



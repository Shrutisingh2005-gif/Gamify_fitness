import React, { useState } from 'react';
import { Target, Scale, ChevronRight, Dumbbell, Heart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserGoal } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

export default function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [weight, setWeight] = useState('');

  const goals = [
    { 
      id: 'Bulk' as UserGoal, 
      title: 'Bulk Up', 
      desc: 'Build muscle and gain strength', 
      icon: Dumbbell,
      color: 'bg-orange-500'
    },
    { 
      id: 'Fit' as UserGoal, 
      title: 'Stay Fit', 
      desc: 'Maintain health and improve endurance', 
      icon: Heart,
      color: 'bg-emerald-500'
    },
    { 
      id: 'Light' as UserGoal, 
      title: 'Get Light', 
      desc: 'Lose weight and feel more energetic', 
      icon: Zap,
      color: 'bg-blue-500'
    }
  ];

  const handleComplete = async () => {
    if (!goal || !weight) return;
    
    const userRef = doc(db, 'users', userId);
    const weightNum = parseFloat(weight);
    const today = new Date().toISOString().split('T')[0];

    await updateDoc(userRef, {
      goal,
      currentWeight: weightNum,
      weightHistory: [{ date: today, weight: weightNum }]
    });
    
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                  <Target size={32} />
                </div>
                <h2 className="text-3xl font-bold">What is your goal?</h2>
                <p className="text-black/40">We'll personalize your journey based on your choice.</p>
              </div>

              <div className="space-y-4">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setGoal(g.id);
                      setStep(2);
                    }}
                    className={`w-full p-6 rounded-3xl border-2 text-left transition-all flex items-center gap-4 ${
                      goal === g.id ? 'border-emerald-500 bg-emerald-50' : 'border-black/5 hover:border-black/10'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${g.color} text-white`}>
                      <g.icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{g.title}</h3>
                      <p className="text-sm text-black/40">{g.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4">
                  <Scale size={32} />
                </div>
                <h2 className="text-3xl font-bold">What's your weight?</h2>
                <p className="text-black/40">This helps us track your progress accurately.</p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-black/5 rounded-3xl px-8 py-6 text-2xl font-bold outline-none focus:ring-2 ring-blue-500/20 text-center"
                  />
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 font-bold text-black/20 text-xl">kg</span>
                </div>

                <button
                  onClick={handleComplete}
                  disabled={!weight}
                  className="w-full bg-black text-white py-6 rounded-3xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-black/80 transition-all disabled:opacity-50"
                >
                  Start My Journey
                  <ChevronRight size={20} />
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-black/40 font-bold py-2"
                >
                  Back to goals
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

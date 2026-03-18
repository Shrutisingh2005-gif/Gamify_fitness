import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle, Info, AlertTriangle, Trophy } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Notification as NotificationType } from '../types';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationType));
      setNotifications(notes);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setShowAll(!showAll)}
        className="p-2 hover:bg-black/5 rounded-xl relative transition-colors"
      >
        <Bell size={20} className="text-black/60" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showAll && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowAll(false)}
            ></div>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-black/5 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-black/5 flex items-center justify-between bg-emerald-50/50">
                <h4 className="font-bold">Notifications</h4>
                <button onClick={() => setShowAll(false)} className="text-black/20 hover:text-black/40">
                  <X size={18} />
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((note) => (
                    <div 
                      key={note.id} 
                      onClick={() => note.id && markAsRead(note.id)}
                      className={`p-4 border-b border-black/5 last:border-0 cursor-pointer transition-colors ${note.read ? 'bg-white' : 'bg-emerald-50/30'}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 ${
                          note.type === 'success' ? 'text-emerald-500' :
                          note.type === 'challenge' ? 'text-purple-500' :
                          note.type === 'warning' ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          {note.type === 'success' ? <CheckCircle size={16} /> :
                           note.type === 'challenge' ? <Trophy size={16} /> :
                           note.type === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                        </div>
                        <div>
                          <p className={`text-sm ${note.read ? 'text-black/60' : 'text-black font-medium'}`}>
                            {note.message}
                          </p>
                          <p className="text-[10px] text-black/30 mt-1">
                            {note.timestamp?.toDate().toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-black/30">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageSquare, Send, RefreshCw, Clock, Heart, Zap, Star, Shield, Award } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, Timestamp, getDocs, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { UserProfile, Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function Social() {
  const [squad, setSquad] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Random Squad Logic
  const fetchRandomSquad = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs
        .map(doc => doc.data() as UserProfile)
        .filter(u => u.uid !== auth.currentUser?.uid);
      
      // Shuffle and pick 10
      const shuffled = [...allUsers].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 10);
      
      setSquad(selected);
      localStorage.setItem('gamify_fit_squad', JSON.stringify(selected));
      localStorage.setItem('gamify_fit_squad_time', Date.now().toString());
    } catch (error) {
      console.error("Error fetching squad:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for cached squad
    const cachedSquad = localStorage.getItem('gamify_fit_squad');
    const cachedTime = localStorage.getItem('gamify_fit_squad_time');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (cachedSquad && cachedTime && (now - parseInt(cachedTime)) < oneDay) {
      setSquad(JSON.parse(cachedSquad));
      setLoading(false);
    } else {
      fetchRandomSquad();
    }

    // Global Messages
    const qMessages = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribeMessages();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newMessage.trim()) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage.trim(),
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'User',
        senderPhoto: auth.currentUser.photoURL || '',
        timestamp: Timestamp.now()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-180px)]">
      {/* Squad Sidebar */}
      <div className="lg:col-span-1 flex flex-col gap-6 h-full">
        <div className="bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black tracking-tight">Daily Squad</h3>
              <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">Random 10</p>
            </div>
            <button 
              onClick={fetchRandomSquad}
              className="p-3 bg-black/5 rounded-2xl hover:bg-emerald-100 hover:text-emerald-600 transition-all"
              title="Refresh Squad"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {loading ? (
              Array(10).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-black/5 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-black/5 rounded w-2/3"></div>
                    <div className="h-2 bg-black/5 rounded w-1/3"></div>
                  </div>
                </div>
              ))
            ) : squad.length > 0 ? (
              squad.map((user) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={user.uid} 
                  className="flex items-center gap-3 group cursor-pointer p-2 hover:bg-black/5 rounded-2xl transition-all"
                >
                  <div className="relative">
                    <img 
                      src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm" 
                      alt={user.displayName} 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate group-hover:text-emerald-600 transition-colors">{user.displayName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-black/40 font-bold uppercase tracking-widest px-1.5 py-0.5 bg-black/5 rounded-md">
                        {user.rank || 'Bronze'}
                      </span>
                      <div className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500">
                        <Star size={8} fill="currentColor" />
                        <span>Lvl {user.level}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-black/20">
                <Users size={32} className="mx-auto mb-2 opacity-10" />
                <p className="text-xs font-bold">No squad found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Community Chat */}
      <div className="lg:col-span-3 flex flex-col h-full">
        <div className="bg-white rounded-[3rem] border border-black/5 shadow-sm flex flex-col h-full overflow-hidden">
          {/* Chat Header */}
          <div className="p-8 border-b border-black/5 flex items-center justify-between bg-emerald-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Community Chat</h3>
                <p className="text-xs text-black/40 font-medium">Vibe with users across the app</p>
              </div>
            </div>
            <div className="flex -space-x-3">
              {squad.slice(0, 5).map((u) => (
                <img 
                  key={u.uid}
                  src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`}
                  className="w-10 h-10 rounded-full border-4 border-white shadow-sm"
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ))}
              <div className="w-10 h-10 rounded-full bg-black/5 border-4 border-white flex items-center justify-center text-[10px] font-bold text-black/40">
                +{squad.length - 5}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gradient-to-b from-white to-black/[0.01]"
          >
            {messages.map((msg, index) => {
              const isMe = msg.senderId === auth.currentUser?.uid;
              const prevMsg = messages[index - 1];
              const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showHeader && (
                    <div className={`flex items-center gap-2 mb-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <img 
                        src={msg.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`}
                        className="w-6 h-6 rounded-full border border-black/5"
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                    </div>
                  )}
                  <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium shadow-sm ${
                    isMe 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-white border border-black/5 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-black/20 font-bold uppercase tracking-widest mt-1 px-2">
                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="p-8 bg-white border-t border-black/5">
            <form onSubmit={handleSendMessage} className="flex gap-4">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-black/5 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
              <button 
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-emerald-500 text-white p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:scale-100"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}



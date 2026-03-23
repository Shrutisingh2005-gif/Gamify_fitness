import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, Send, Brain, RefreshCw, User as UserIcon } from 'lucide-react';
import { getHealthAdvice } from '../services/gemini';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'coach';
  text: string;
}

export default function AICoach() {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchAdvice = async () => {
    setLoading(true);
    const stats = { steps: 8432, water: 2.1, sleep: 7.5 };
    const recent = [{ type: 'exercise', value: 30, note: 'Morning run' }];
    
    const result = await getHealthAdvice(stats, recent);
    setAdvice(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: Message = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatting(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'coach', text: "I'm sorry, I can't chat right now because the API key is missing." }]);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: chatInput,
        config: {
          systemInstruction: "You are Gamify Fit, a friendly and expert health coach. Provide concise, encouraging, and science-based health advice."
        }
      });

      const coachMessage: Message = { role: 'coach', text: response.text || "I'm not sure how to respond to that. Let's focus on your health!" };
      setMessages(prev => [...prev, coachMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'coach', text: "I'm having a bit of a brain fog. Can you try again?" }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Brain size={120} />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Health Coach</h2>
            <p className="text-black/40 text-sm">Personalized insights powered by Gemini</p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl min-h-[150px] flex flex-col justify-between">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <RefreshCw className="animate-spin text-purple-500" size={32} />
            </div>
          ) : (
            <div className="prose prose-purple max-w-none">
              <Markdown>{advice}</Markdown>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={fetchAdvice}
              disabled={loading}
              className="flex items-center gap-2 text-purple-600 font-bold hover:underline disabled:opacity-50"
            >
              <RefreshCw size={18} />
              Refresh Advice
            </button>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm max-h-[400px] overflow-y-auto space-y-4" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-purple-500 text-white'}`}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Sparkles size={16} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-50 text-emerald-900' : 'bg-purple-50 text-purple-900'}`}>
                <Markdown>{msg.text}</Markdown>
              </div>
            </div>
          ))}
          {isChatting && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-4 rounded-3xl border border-black/5 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-black/40">
          <MessageSquare size={20} />
        </div>
        <input 
          type="text" 
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask your coach anything..."
          className="flex-1 bg-transparent border-none outline-none font-medium"
        />
        <button 
          onClick={handleSendMessage}
          disabled={isChatting}
          className="p-3 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 transition-all disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}


import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { chatbotContext } from '../constants/chatbotContext';
import { cn } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'হ্যালো! আমি ProxyMamaBD সাপোর্ট অ্যাসিস্ট্যান্ট। আপনাকে কীভাবে সাহায্য করতে পারি?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${chatbotContext}\n\nUser: ${userMessage}`,
      });
      
      setMessages(prev => [...prev, { role: 'bot', text: response.text || 'দুঃখিত, এই মুহূর্তে আমি উত্তর দিতে পারছি না।' }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: 'দুঃখিত, কিছু সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-110"
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        <div className="w-80 h-[500px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
          <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot size={20} />
              <span className="font-bold">ProxyMama Support</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded-full">
              <X size={20} />
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn("p-3 rounded-2xl max-w-[80%] text-sm", msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-tl-none")}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-gray-500">লিখছে...</div>}
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="আপনার প্রশ্ন লিখুন..."
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

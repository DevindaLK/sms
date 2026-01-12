
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, Sparkles, Zap } from 'lucide-react';
import { geminiService } from '../geminiService';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hi! I am GlowBot, your personal salon assistant. How can I help you shine today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const quickActions = [
    "Service Pricing",
    "Stylist Availability",
    "Hair Care Tips",
    "Book an Appt"
  ];

  const handleSend = async (textOverride?: string) => {
    const messageToSend = textOverride || input;
    if (!messageToSend.trim()) return;
    
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, text: messageToSend }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Format history for Gemini API (user/model roles)
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await geminiService.getChatbotResponse(messageToSend, history);
      setMessages(prev => [...prev, { role: 'bot', text: response || "I'm sorry, I couldn't process that. Feel free to ask another way!" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "I'm having a little technical trouble. Please try again in a moment!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-4 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all group"
        >
          <div className="relative">
            <MessageCircle className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-[32px] shadow-2xl w-85 md:w-96 flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">GlowBot AI</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest">Always Online</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-indigo-50/50 p-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-100">
            {quickActions.map(action => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                className="whitespace-nowrap bg-white border border-gray-200 px-3 py-1.5 rounded-full text-[11px] font-bold text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
              >
                {action}
              </button>
            ))}
          </div>

          <div 
            ref={scrollRef}
            className="h-96 overflow-y-auto p-5 space-y-4 bg-gray-50/50"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-[24px] px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-200' 
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                </div>
                <div className="bg-white text-gray-400 px-4 py-3 rounded-[24px] rounded-bl-none shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about cuts, prices..."
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Zap className="w-4 h-4 text-indigo-300" />
              </div>
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;

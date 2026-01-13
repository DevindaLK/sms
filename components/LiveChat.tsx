
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, ShieldCheck, Sparkles, Search, Plus, Filter, Users, X, ChevronLeft } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';
import toast from 'react-hot-toast';

interface LiveChatProps {
  userRole: UserRole;
  currentUserId: string;
}

const LiveChat: React.FC<LiveChatProps> = ({ userRole, currentUserId }) => {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [artisans, setArtisans] = useState<any[]>([]);
  const [showArtisanSelect, setShowArtisanSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = userRole === UserRole.ADMIN;
  const isStylist = userRole === UserRole.STYLIST;
  const isCustomer = userRole === UserRole.CUSTOMER;

  useEffect(() => {
    fetchThreads();
    fetchUnreadCounts();
    if (isCustomer) {
      fetchArtisans();
    }
  }, []);

  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread.id);
      
      // Subscribe to real-time messages for this thread
      const channel = supabase
        .channel(`chat_${activeThread.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `thread_id=eq.${activeThread.id}`
        }, payload => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          if (payload.new.sender_id !== currentUserId) {
            markAsRead(activeThread.id);
            fetchUnreadCounts();
          } else {
            // Sent by me, but let's refresh to see if it's marked as read (though unlikely so soon)
            // or just rely on real-time updates for existing messages
          }
          fetchThreads(); // Refresh thread order
          scrollToBottom();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${activeThread.id}`
        }, payload => {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
        })
        .subscribe();
      
      markAsRead(activeThread.id);

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchThreads = async () => {
    try {
      const data = await api.getChatThreads();
      setThreads(data);
    } catch (err) {
      toast.error('Failed to summon chat chronicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const counts = await api.getUnreadCountsPerThread();
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Failed to retrieve unread indicators:', err);
    }
  };

  const fetchArtisans = async () => {
    try {
      const data = await api.getArtisans();
      setArtisans(data.filter(a => a.id !== currentUserId));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const data = await api.getChatMessages(threadId);
      setMessages(data);
      markAsRead(threadId); // Mark as read after fetching
    } catch (err) {
      toast.error('Failed to retrieve neural echoes');
    }
  };

  const markAsRead = async (threadId: string) => {
    try {
      await api.markMessagesAsRead(threadId);
      setUnreadCounts(prev => ({ ...prev, [threadId]: 0 }));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;

    try {
      const sentMsg = await api.sendChatMessage(activeThread.id, newMessage);
      if (sentMsg) {
        setMessages(prev => {
          if (prev.some(m => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
        fetchThreads(); // Update thread list order
        scrollToBottom();
      }
      setNewMessage('');
    } catch (err) {
      toast.error('Neural transmission failed');
    }
  };

  const startThread = async (partnerId: string | null, type: 'admin' | 'stylist') => {
    try {
      const thread = await api.createChatThread(partnerId, type);
      await fetchThreads();
      setActiveThread(thread);
      setShowArtisanSelect(false);
    } catch (err) {
      toast.error('Failed to establish neural link');
    }
  };

  const getPartnerLabel = (thread: any) => {
    if (thread.type === 'admin') return 'PAWA ATELIER';
    if (isCustomer) return thread.stylist?.full_name || 'Sanctuary Artisan';
    return thread.customer?.full_name || 'Member';
  };

  const getPartnerAvatar = (thread: any) => {
    if (thread.type === 'admin') return null;
    if (isCustomer) return thread.stylist?.avatar_url;
    return thread.customer?.avatar_url;
  };

  const filteredThreads = threads.filter(t => 
    getPartnerLabel(t).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] bg-white rounded-[32px] md:rounded-[40px] shadow-2xl border border-atelier-clay/10 overflow-hidden">
      {/* Thread Sidebar */}
      <div className={`${activeThread ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 border-r border-atelier-clay/10 flex-col bg-atelier-charcoal/[0.02]`}>
        <div className="p-6 md:p-8 border-bottom border-atelier-clay/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-atelier-charcoal tracking-widest uppercase flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-atelier-clay" />
              Chronicles
            </h2>
            {isCustomer && (
              <button 
                onClick={() => setShowArtisanSelect(true)}
                className="p-2 bg-atelier-clay text-white rounded-full hover:bg-atelier-charcoal transition-colors shadow-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-clay/40" />
            <input 
              type="text" 
              placeholder="Seek dialogue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-atelier-clay/10 focus:ring-2 focus:ring-atelier-clay/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredThreads.map(thread => (
            <button
              key={thread.id}
              onClick={() => setActiveThread(thread)}
              className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${
                activeThread?.id === thread.id 
                  ? 'bg-atelier-clay text-white shadow-xl translate-x-1' 
                  : 'hover:bg-atelier-clay/5 text-atelier-charcoal/60'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-atelier-sand flex items-center justify-center text-atelier-charcoal shadow-inner overflow-hidden relative shrink-0">
                {getPartnerAvatar(thread) ? (
                  <img src={getPartnerAvatar(thread)} alt={getPartnerLabel(thread)} className="w-full h-full object-cover" />
                ) : (thread.type === 'admin' && !isCustomer) || (isCustomer && thread.type === 'admin') ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest truncate">
                    {getPartnerLabel(thread)}
                  </p>
                </div>
                <p className={`text-[8px] tracking-[0.2em] font-medium uppercase opacity-60`}>
                  {thread.type === 'admin' ? 'Strategic Council' : 'Artisan Dialogue'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={`${!activeThread ? 'hidden lg:flex' : 'flex'} flex-1 flex-col relative bg-white`}>
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 md:p-8 border-b border-atelier-clay/10 flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <button 
                  onClick={() => setActiveThread(null)}
                  className="lg:hidden p-2 text-atelier-clay hover:bg-atelier-cream rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-atelier-sand flex items-center justify-center text-atelier-charcoal shadow-lg overflow-hidden shrink-0">
                  {getPartnerAvatar(activeThread) ? (
                    <img src={getPartnerAvatar(activeThread)} alt={getPartnerLabel(activeThread)} className="w-full h-full object-cover" />
                  ) : activeThread.type === 'admin' ? (
                    <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <User className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-atelier-charcoal uppercase tracking-[0.2em] md:tracking-[0.3em]">
                    {getPartnerLabel(activeThread)}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[7px] md:text-[8px] font-bold text-green-600 uppercase tracking-widest">Neural Link Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-4 md:space-y-6 custom-scrollbar bg-atelier-sand/10">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={msg.id}
                    className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-[70%] p-4 md:p-6 rounded-[24px] md:rounded-[30px] shadow-sm ${
                      msg.sender_id === currentUserId 
                        ? 'bg-atelier-clay text-white rounded-tr-none' 
                        : 'bg-white text-atelier-charcoal border border-atelier-clay/10 rounded-tl-none'
                    }`}>
                      <p className="text-xs leading-relaxed font-medium">{msg.content}</p>
                      <div className="flex items-center justify-between gap-4 mt-2">
                        <p className={`text-[8px] font-bold uppercase tracking-widest opacity-40`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {msg.sender_id === currentUserId && (
                          <span className={`text-[7px] font-black uppercase tracking-widest ${msg.is_read ? 'text-white' : 'text-atelier-sand/60'}`}>
                            {msg.is_read ? 'Read' : 'Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 md:p-10 bg-white">
              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Inscribe your thoughts..."
                  className="w-full pl-6 md:pl-8 pr-20 md:pr-24 py-4 md:py-6 bg-atelier-sand/20 rounded-[20px] md:rounded-[30px] text-[10px] md:text-xs font-bold tracking-widest text-atelier-charcoal placeholder:text-atelier-clay/30 border-none focus:ring-2 focus:ring-atelier-clay/20 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-atelier-clay text-white rounded-[15px] md:rounded-[20px] hover:bg-atelier-charcoal disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                >
                  <Send className="w-4 h-4 md:w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-12 text-center">
            <div className="w-32 h-32 bg-atelier-sand/30 rounded-full flex items-center justify-center text-atelier-clay relative">
              <Sparkles className="w-16 h-16 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-atelier-clay/20 border-dashed animate-spin-slow" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-atelier-charcoal tracking-[0.4em] uppercase">Dialogues of the Sanctuary</h2>
              <p className="text-[10px] text-atelier-clay font-bold tracking-[0.2em] uppercase max-w-xs leading-loose">
                Select a thread from the chronicles or establish a new neural link to begin your journey.
              </p>
            </div>
            {isCustomer && (
              <div className="flex gap-4">
                <button 
                  onClick={() => startThread(null, 'admin')}
                  className="px-8 py-4 bg-atelier-charcoal text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-atelier-clay transition-all shadow-xl"
                >
                  Consult PAWA ATELIER
                </button>
                <button 
                  onClick={() => setShowArtisanSelect(true)}
                  className="px-8 py-4 bg-atelier-clay text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-atelier-charcoal transition-all shadow-xl"
                >
                  Seek an Artisan
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Artisan Selection Overlay */}
      <AnimatePresence>
        {showArtisanSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-atelier-charcoal/40 backdrop-blur-md z-50 flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-atelier-cream w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-atelier-clay/10 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-atelier-charcoal">Summon Artisan</h2>
                <button onClick={() => setShowArtisanSelect(false)} className="p-2 hover:bg-atelier-clay/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto max-h-[400px] space-y-2">
                {artisans.map(artisan => (
                  <button
                    key={artisan.id}
                    onClick={() => startThread(artisan.id, 'stylist')}
                    className="w-full p-4 hover:bg-white rounded-[25px] flex items-center gap-4 transition-all shadow-sm border border-transparent hover:border-atelier-clay/10"
                  >
                    <div className="w-12 h-12 rounded-full bg-atelier-sand flex items-center justify-center text-atelier-charcoal overflow-hidden shrink-0">
                      {artisan.avatar_url ? (
                        <img src={artisan.avatar_url} alt={artisan.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold uppercase tracking-widest text-atelier-charcoal">{artisan.full_name}</p>
                      <div className="flex gap-1 mt-1">
                        {artisan.specialization?.map((spec: string) => (
                          <span key={spec} className="text-[8px] font-bold uppercase tracking-[0.2em] text-atelier-clay">{spec}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveChat;

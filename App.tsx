
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AdminDashboard from './components/AdminDashboard';
import BookingEngine from './components/BookingEngine';
import VirtualTryOn from './components/VirtualTryOn';
import InventoryManager from './components/InventoryManager';
import StylistManager from './components/StylistManager';
import AppointmentHistory from './components/AppointmentHistory';
import StylistSchedule from './components/StylistSchedule';
import LiveConsultation from './components/LiveConsultation';
import LiveChat from './components/LiveChat';
import LandingPage from './components/Landing/LandingPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import MasterCalendar from './components/MasterCalendar';
import POSSystem from './components/POSSystem';
import ServicesManager from './components/ServicesManager';
import GalleryManager from './components/GalleryManager';
import BlogManager from './components/BlogManager';
import CustomerManager from './components/CustomerManager';
import AppointmentManager from './components/AppointmentManager';
import { UserRole } from './types';
import { supabase } from './lib/supabase';
import { Search, Bell, User as UserIcon, ShieldCheck, Sparkles } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { api } from './lib/api';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [activeView, setActiveView] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async (user: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      let currentRole = UserRole.CUSTOMER;

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log("Profile missing, creating fallback for:", user.id);
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'Member',
            email: user.email,
            phone: user.user_metadata?.phone || '',
            role: 'customer'
          })
          .select()
          .single();
        
        if (createError) {
          console.error("App profile fallback error:", createError);
        } else if (newProfile) {
          currentRole = newProfile.role as UserRole;
        }
      } else if (data && !error) {
        currentRole = data.role as UserRole;
      }

      setRole(currentRole);
      
      // Automatic Routing based on role
      if (currentRole === UserRole.ADMIN) {
        setActiveView('dashboard');
      } else if (currentRole === UserRole.STYLIST) {
        setActiveView('my-schedule');
      } else {
        setActiveView('book');
      }
    };

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
        fetchProfile(session.user);
        fetchUnreadCount();
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      if (session?.user) {
        fetchProfile(session.user);
        fetchUnreadCount();
      } else {
        setRole(UserRole.CUSTOMER); // Default role for guests
        setActiveView('landing');
        setUnreadChatCount(0);
      }
    });

    // Global Chat Subscription
    const chatChannel = supabase
      .channel('global_unread_count')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages' 
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(chatChannel);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await api.getUnreadMessageCount();
      setUnreadChatCount(count);
      
      // Notify if count > 0 and user just logged in or view is landing
      if (count > 0 && activeView === 'landing') {
        // We'll show this after a slight delay to ensure user is redirected
        setTimeout(() => {
          toast('messages awaiting your presence', {
            icon: '💬',
            duration: 5000,
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to fetch neural echoes count:', err);
    }
  };

  // View Handlers
  const handleEnterApp = () => setActiveView('login');
  const handleGoToSignup = () => setActiveView('signup');
  const handleGoToLogin = () => setActiveView('login');
  const handleReturnHome = () => setActiveView('landing');

  const handleViewChange = (view: string, data?: any) => {
    if (view === 'book' && data) {
      setEditingAppointment(data);
    } else {
      setEditingAppointment(null);
    }
    setActiveView(view);
    setIsSidebarOpen(false); // Close sidebar on view change on mobile
  };

  const renderView = () => {
    switch (activeView) {
      case 'landing': return <LandingPage onEnterApp={handleEnterApp} />;
      case 'login': return (
        <LoginPage 
          onLoginSuccess={() => {
            setIsAuthenticated(true);
          }} 
          onReturnHome={handleReturnHome}
          onGoToSignup={handleGoToSignup}
        />
      );
      case 'signup': return (
        <SignupPage 
          onSignupSuccess={() => {
            setIsAuthenticated(true);
          }}
          onReturnHome={handleReturnHome}
          onGoToLogin={handleGoToLogin}
        />
      );
      // Public / Guest versions of views
      case 'ai-tryon': return <VirtualTryOn />;
      case 'book': return (
        <BookingEngine 
          isAuthenticated={isAuthenticated} 
          onAuthRedirect={handleEnterApp} 
          onSuccess={(view) => handleViewChange(view)} 
          editingAppointment={editingAppointment}
        />
      );
      
      // Authenticated-only views (should be protected by renderContent)
      case 'dashboard': return isAuthenticated ? <AdminDashboard /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'pos': return isAuthenticated ? <POSSystem /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'inventory': return isAuthenticated ? <InventoryManager /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'stylists': return isAuthenticated ? <StylistManager /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'calendar': return isAuthenticated ? <MasterCalendar role={role} /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'appointments': return isAuthenticated ? <AppointmentManager user={user} role={role} /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'services': return isAuthenticated ? <ServicesManager role={role} /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'gallery': return isAuthenticated ? <GalleryManager /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'blog': return isAuthenticated ? <BlogManager /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'customers': return isAuthenticated ? <CustomerManager /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'ai-insights': return isAuthenticated ? <AdminDashboard /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'my-schedule': return isAuthenticated ? <StylistSchedule user={user} /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'tasks': return isAuthenticated ? <StylistSchedule user={user} /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'history': return isAuthenticated ? <AppointmentHistory onViewChange={handleViewChange} /> : <LandingPage onEnterApp={handleEnterApp} />;
      case 'live-consult': return <LiveConsultation />;
      case 'live-chat': return isAuthenticated ? <LiveChat userRole={role} currentUserId={user?.id} /> : <LandingPage onEnterApp={handleEnterApp} />;
      default: return <LandingPage onEnterApp={handleEnterApp} />;
    }
  };

  const renderContent = () => {
    // Guest Views (No Sidebars)
    if (!isAuthenticated || ['login', 'signup', 'landing'].includes(activeView)) {
      // Force return to landing/login/signup if logout happened but activeView is still restricted
      const protectedViews = [
        'dashboard', 'pos', 'inventory', 'stylists', 'calendar', 'appointments', 
        'services', 'gallery', 'blog', 'customers', 'ai-insights', 'my-schedule', 
        'tasks', 'history', 'live-chat'
      ];
      
      if (!isAuthenticated && protectedViews.includes(activeView)) {
        return <LandingPage onEnterApp={handleEnterApp} />;
      }
      
      return renderView();
    }
    
    // Authenticated Workspace
    return (
      <div className="flex h-screen bg-atelier-cream overflow-hidden relative">
        <Sidebar 
          role={role} 
          activeView={activeView} 
          onViewChange={handleViewChange} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          unreadChatCount={unreadChatCount}
          onLogout={async () => {
            try {
              await supabase.auth.signOut();
              setIsAuthenticated(false);
              setRole(UserRole.CUSTOMER);
              setActiveView('landing');
              setIsSidebarOpen(false);
            } catch (err) {
              console.error("Signout Error:", err);
              // Fallback even on error
              setIsAuthenticated(false);
              setActiveView('landing');
            }
          }} 
        />
        
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-atelier-charcoal/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        <main className="flex-1 flex flex-col min-w-0">
          <Header 
            user={user} 
            role={role} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onLogout={async () => {
              try {
                await supabase.auth.signOut();
                setIsAuthenticated(false);
                setRole(UserRole.CUSTOMER);
                setActiveView('landing');
              } catch (err) {
                setIsAuthenticated(false);
                setActiveView('landing');
              }
            }}
            onViewChange={handleViewChange}
          />

          <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar">
            <div className="max-w-7xl mx-auto pb-24">
              {renderView()}
            </div>
          </div>
        </main>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#3C322D',
          color: '#fff',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '16px 24px',
        },
      }} />
    </>
  );
};

export default App;

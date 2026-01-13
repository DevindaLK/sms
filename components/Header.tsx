
import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User as UserIcon, LogOut, Settings, Camera, Key, RefreshCw, X, ShieldCheck, Menu } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';
import toast from 'react-hot-toast';

interface HeaderProps {
  user: any;
  role: UserRole;
  onLogout: () => void;
  onViewChange: (view: string) => void;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user: initialUser, role, onLogout, onViewChange, onToggleSidebar }) => {
  const [profile, setProfile] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUser) {
      fetchProfile();
      fetchUnreadCount();

      // Subscribe to unread messages
      const channel = supabase
        .channel('global_unread_messages')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'chat_messages' 
        }, () => {
          fetchUnreadCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [initialUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile(initialUser.id);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await api.getUnreadMessageCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Unread count error:', err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await api.updateProfilePhoto(initialUser.id, file);
      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Portrait updated in the chronicles');
    } catch (error) {
      toast.error('Failed to update portrait');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    setIsUpdatingPassword(true);
    try {
      await api.updateUserPassword(newPassword);
      toast.success('Password updated successfully');
      setNewPassword('');
      setShowSettings(false);
    } catch (error) {
      toast.error('Failed to update Password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <header className="h-20 bg-white border-b border-atelier-sand flex items-center justify-between px-4 md:px-10 shrink-0 shadow-sm relative z-20">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-atelier-charcoal hover:bg-atelier-cream rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <div className="relative w-48 md:w-96 hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-atelier-cream border-none rounded-full py-2 pl-10 pr-4 text-[10px] md:text-xs focus:ring-2 focus:ring-atelier-clay outline-none placeholder:text-atelier-sand"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4 md:space-x-8">
        <button 
          onClick={() => onViewChange('landing')}
          className="hidden md:block text-[10px] font-bold text-atelier-sand uppercase tracking-[0.3em] hover:text-atelier-clay transition-colors"
        >
          Public Suite
        </button>
        <div className="hidden md:block h-5 w-px bg-atelier-sand"></div>
        <button 
          onClick={() => onViewChange('live-chat')}
          className="relative text-atelier-sand hover:text-atelier-charcoal transition-colors group"
        >
          <Bell className="w-5 h-5 group-hover:animate-swing" />
        </button>
        <div className="h-10 w-px bg-atelier-sand"></div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 md:space-x-4 group"
          >
            <div className="text-right hidden xs:block">
              <p className="text-[10px] md:text-xs font-bold text-atelier-charcoal uppercase tracking-widest truncate max-w-[80px] md:max-w-none">
                {profile?.full_name?.split(' ')[0] || 'Member'}
              </p>
              <p className="text-[8px] md:text-[9px] text-atelier-clay font-bold uppercase tracking-widest">
                {roleLabel}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-atelier-nude rounded-xl md:rounded-2xl flex items-center justify-center text-atelier-clay shadow-sm border border-atelier-sand overflow-hidden group-hover:border-atelier-clay transition-colors">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-4 w-64 bg-white rounded-[32px] shadow-2xl border border-atelier-sand p-4 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1 px-4 py-3 border-b border-atelier-cream mb-2">
                <p className="text-xs font-bold text-atelier-charcoal uppercase tracking-widest truncate">{profile?.full_name || 'PAWA Member'}</p>
                <p className="text-[9px] text-atelier-taupe font-medium truncate italic">{initialUser?.email}</p>
              </div>
              <button 
                onClick={() => { setShowDropdown(false); setShowSettings(true); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-atelier-charcoal hover:bg-atelier-cream rounded-2xl transition-colors group"
              >
                <Settings className="w-4 h-4 text-atelier-clay group-hover:rotate-45 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Profile Settings</span>
              </button>
              <button 
                onClick={() => { setShowDropdown(false); onLogout(); }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors group"
              >
                <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Exit Portal</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-atelier-charcoal/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl border border-atelier-sand p-6 md:p-10 relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-8 right-8 p-2 hover:bg-atelier-cream rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-atelier-clay" />
            </button>

            <div className="space-y-8 md:space-y-10">
              <div className="text-center space-y-2">
                <h3 className="text-sm font-bold text-atelier-charcoal uppercase tracking-[0.3em]">Profile Settings</h3>
                <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest italic">Manifest your digital presence</p>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-atelier-nude rounded-[32px] md:rounded-[40px] border border-atelier-sand shadow-lg flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 md:w-12 md:h-12 text-atelier-clay" />
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute -bottom-2 -right-2 p-3 md:p-4 bg-atelier-charcoal text-white rounded-[20px] md:rounded-[24px] shadow-xl hover:bg-atelier-clay transition-all disabled:opacity-50 group-hover:scale-110"
                  >
                    {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-atelier-charcoal uppercase tracking-[0.2em]">{profile?.full_name}</p>
                  <p className="text-[9px] text-atelier-clay font-bold uppercase tracking-widest mt-1">{roleLabel}</p>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-6 border-t border-atelier-sand pt-8 md:pt-10">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 ml-4">
                    <Key className="w-3.5 h-3.5 text-atelier-clay" />
                    <label className="text-[10px] font-black text-atelier-clay uppercase tracking-[0.3em]">Update Password</label>
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-3xl py-4 px-6 text-sm outline-none transition-all placeholder:text-atelier-sand"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword}
                  className="w-full py-5 bg-atelier-charcoal text-white rounded-3xl font-bold uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-atelier-clay transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isUpdatingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {isUpdatingPassword ? 'Updating...' : 'Secure Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;


import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { 
  Star, Mail, Calendar, MoreHorizontal, UserPlus, 
  Clock, X, Save, AlertCircle, RefreshCw, Trash2, Edit3, 
  Award, Briefcase, Info, Phone, Upload, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const StylistManager: React.FC = () => {
  const [artisans, setArtisans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '17:00' });
  const [daysOff, setDaysOff] = useState<number[]>([]);
  
  const initialProfileState = {
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    specialization: [] as string[],
    experience_years: 0,
    avatar_url: '',
    role: 'stylist'
  };
  const [profileForm, setProfileForm] = useState(initialProfileState);
  const [newSpecialty, setNewSpecialty] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.getArtisans();
      setArtisans(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load artisans");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchedule = (stylist: any) => {
    setEditingSchedule(stylist);
    setWorkingHours(stylist.working_hours || { start: '09:00', end: '17:00' });
    setDaysOff(stylist.days_off || []);
  };

  const handleEditProfile = (stylist: any) => {
    setEditingProfile(stylist);
    setProfileForm({
      full_name: stylist.full_name || '',
      email: stylist.email || '',
      phone: stylist.phone || '',
      bio: stylist.bio || '',
      specialization: stylist.specialization || [],
      experience_years: stylist.experience_years || 0,
      avatar_url: stylist.avatar_url || '',
      role: stylist.role || 'stylist'
    });
  };

  const toggleDayOff = (day: number) => {
    setDaysOff(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSaveSchedule = async () => {
    try {
      await api.updateProfile(editingSchedule.id, {
        working_hours: workingHours,
        days_off: daysOff
      });
      setEditingSchedule(null);
      fetchData();
      toast.success(`Schedule patterns updated for ${editingSchedule.full_name}`);
    } catch (e) {
      toast.error("Failed to update schedule");
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (editingProfile) {
        await api.updateProfile(editingProfile.id, profileForm);
        toast.success("Profile updated successfully");
      } else {
        // For new profile, we'll generate a UUID if we're in a standalone mode,
        // but typically this should be linked to an Auth user.
        // For this management UI, we'll allow creating a 'detached' profile for now.
        const newProfile = {
          ...profileForm,
          id: crypto.randomUUID(), // Using browser's randomUUID
          created_at: new Date().toISOString()
        };
        await api.createProfile(newProfile);
        toast.success("Artisan successfully recruited into the sanctuary");
      }
      setEditingProfile(null);
      setIsAdding(false);
      fetchData();
    } catch (e) {
      toast.error("Profile update failed");
    }
  };

  const handleDeleteStylist = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the sanctuary?`)) {
      try {
        await api.deleteProfile(id);
        fetchData();
        toast.success(`${name} has been archived`);
      } catch (e) {
        toast.error("Failed to remove artisan");
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const publicUrl = await api.uploadInventoryImage(file); // Reusing upload logic
      setProfileForm({ ...profileForm, avatar_url: publicUrl });
    } catch (e) {
      toast.error("Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty && !profileForm.specialization.includes(newSpecialty)) {
      setProfileForm({
        ...profileForm,
        specialization: [...profileForm.specialization, newSpecialty]
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (s: string) => {
    setProfileForm({
      ...profileForm,
      specialization: profileForm.specialization.filter(item => item !== s)
    });
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) return <div className="p-20 text-center"><RefreshCw className="animate-spin mx-auto w-10 h-10 text-atelier-clay"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">Master <span className="font-bold text-atelier-clay">Artisans</span></h2>
          <p className="text-atelier-taupe text-xs font-bold uppercase tracking-widest mt-1">Directing schedules and sanctuary ritual flow</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingProfile(null); setProfileForm(initialProfileState); }}
          className="bg-atelier-charcoal text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-atelier-clay transition-all uppercase text-[10px] tracking-widest shadow-xl"
        >
          <UserPlus className="w-4 h-4" /> Recruit Artisan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {artisans.map((stylist) => (
          <div key={stylist.id} className="bg-white rounded-[50px] border border-atelier-sand shadow-sm p-8 space-y-8 relative overflow-hidden group hover:border-atelier-clay transition-all duration-500">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <img src={stylist.avatar_url || 'https://via.placeholder.com/150'} alt={stylist.full_name} className="w-20 h-20 rounded-[32px] object-cover border-4 border-atelier-nude shadow-lg" />
                <div>
                  <h3 className="font-bold text-atelier-charcoal uppercase tracking-widest text-sm">{stylist.full_name}</h3>
                  <p className="text-[10px] text-atelier-clay font-bold uppercase tracking-[0.3em] mt-1">{stylist.experience_years || 0} Years Experience</p>
                  <div className="flex items-center gap-1 text-atelier-clay mt-2">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-3 h-3 ${i <= (stylist.rating || 5) ? 'fill-current' : 'text-atelier-sand'}`} />)}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDeleteStylist(stylist.id, stylist.full_name)} className="p-2 text-atelier-sand hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {stylist.bio && (
              <p className="text-[11px] text-atelier-taupe leading-relaxed italic line-clamp-2">
                "{stylist.bio}"
              </p>
            )}

            <div className="space-y-4 pt-4 border-t border-atelier-sand/50">
              <div className="flex items-center justify-between">
                <p className="text-[9px] text-atelier-sand font-black uppercase tracking-[0.4em]">Availability Protocol</p>
                <button onClick={() => handleEditSchedule(stylist)} className="text-[9px] font-black text-atelier-clay uppercase tracking-widest hover:underline flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-atelier-charcoal font-bold tracking-widest uppercase">
                <Clock className="w-4 h-4 text-atelier-clay" />
                {stylist.working_hours?.start} - {stylist.working_hours?.end}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day, i) => (
                  <span key={day} className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${stylist.days_off?.includes(i) ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-atelier-sage/30 text-atelier-charcoal border border-atelier-sage/50'}`}>{day}</span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] text-atelier-sand font-black uppercase tracking-[0.4em]">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {stylist.specialization?.length > 0 ? (
                  stylist.specialization.map((s: string) => (
                    <span key={s} className="px-3 py-1 bg-atelier-cream text-atelier-taupe text-[9px] font-black uppercase rounded-full tracking-widest border border-atelier-sand">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] text-atelier-sand italic uppercase tracking-widest">No specialties defined</span>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => handleEditProfile(stylist)}
                className="flex-1 bg-atelier-charcoal text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-atelier-clay transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Edit Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-atelier-charcoal/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white rounded-[60px] p-12 max-w-lg w-full shadow-2xl space-y-8 border border-atelier-sand">
            <div className="flex justify-between items-center"><h3 className="text-xl font-light tracking-widest uppercase">Ritual <span className="font-bold text-atelier-clay">Cycle</span></h3><button onClick={() => setEditingSchedule(null)} className="p-2 hover:bg-atelier-cream rounded-full"><X className="w-5 h-5"/></button></div>
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Initiation</p><input type="time" className="w-full bg-atelier-cream p-5 rounded-2xl outline-none" value={workingHours.start} onChange={e => setWorkingHours({...workingHours, start: e.target.value})} /></div>
                <div className="space-y-2"><p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Conclusion</p><input type="time" className="w-full bg-atelier-cream p-5 rounded-2xl outline-none" value={workingHours.end} onChange={e => setWorkingHours({...workingHours, end: e.target.value})} /></div>
              </div>
              <div className="space-y-4">
                <p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Silence Days (Off)</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day, i) => (
                    <button key={day} onClick={() => toggleDayOff(i)} className={`px-5 py-3 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all ${daysOff.includes(i) ? 'bg-atelier-clay text-white shadow-xl' : 'bg-atelier-cream text-atelier-sand border border-atelier-sand hover:border-atelier-clay'}`}>{day}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleSaveSchedule} className="w-full py-5 bg-atelier-charcoal text-white rounded-3xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:bg-atelier-clay transition-all flex items-center justify-center gap-3"><Save className="w-4 h-4" /> Finalize Pattern</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {(editingProfile || isAdding) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-atelier-charcoal/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white rounded-[60px] p-12 max-w-2xl w-full shadow-2xl space-y-8 border border-atelier-sand overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-light tracking-widest uppercase">{editingProfile ? 'Refine' : 'Recruit'} <span className="font-bold text-atelier-clay">Artisan</span></h3>
              <button onClick={() => { setEditingProfile(null); setIsAdding(false); }} className="p-2 hover:bg-atelier-cream rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Avatar Upload */}
              <div className="md:col-span-1 space-y-4">
                <p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Avatar Image</p>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-atelier-cream rounded-[40px] border-2 border-dashed border-atelier-sand flex flex-col items-center justify-center cursor-pointer hover:bg-atelier-nude transition-all overflow-hidden relative group"
                >
                  {profileForm.avatar_url ? (
                    <>
                      <img src={profileForm.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="text-white w-8 h-8" />
                      </div>
                    </>
                  ) : (
                    <>
                      {uploading ? (
                        <RefreshCw className="w-8 h-8 text-atelier-clay animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-10 h-10 text-atelier-sand mb-2" />
                          <span className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">Upload Portrait</span>
                        </>
                      )}
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              {/* Form Fields */}
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Full Name</p>
                    <input type="text" className="w-full bg-atelier-cream p-4 rounded-2xl outline-none text-sm font-bold" value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Experience (Years)</p>
                    <input type="number" className="w-full bg-atelier-cream p-4 rounded-2xl outline-none text-sm font-bold" value={profileForm.experience_years} onChange={e => setProfileForm({...profileForm, experience_years: parseInt(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Professional Bio</p>
                  <textarea rows={3} className="w-full bg-atelier-cream p-4 rounded-2xl outline-none text-sm font-bold resize-none" value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} placeholder="e.g. Master of minimalist cuts..." />
                </div>

                <div className="space-y-4">
                  <p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Specializations</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-atelier-cream p-4 rounded-2xl outline-none text-sm font-bold" 
                      placeholder="Add specialty..." 
                      value={newSpecialty} 
                      onChange={e => setNewSpecialty(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addSpecialty()}
                    />
                    <button onClick={addSpecialty} className="bg-atelier-charcoal text-white px-6 rounded-2xl hover:bg-atelier-clay transition-all"><UserPlus className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileForm.specialization.map(s => (
                      <span key={s} className="pl-4 pr-1 py-1.5 bg-atelier-sand/20 text-atelier-charcoal text-[10px] font-bold uppercase rounded-full tracking-widest border border-atelier-sand flex items-center gap-2">
                        {s}
                        <button onClick={() => removeSpecialty(s)} className="p-1 hover:bg-atelier-sand/30 rounded-full"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Phone Protocol</p>
                    <input type="text" className="w-full bg-atelier-cream p-4 rounded-2xl outline-none text-sm font-bold" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Contact Gateway (Email)</p>
                    <input type="email" className="w-full bg-atelier-cream p-4 rounded-2xl outline-none text-sm font-bold" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                  </div>
                </div>

                <button onClick={handleSaveProfile} className="w-full py-5 bg-atelier-charcoal text-white rounded-3xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:bg-atelier-clay transition-all flex items-center justify-center gap-3">
                  <Save className="w-4 h-4" /> Commit Artisan Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StylistManager;


import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Package, 
  Settings, 
  LogOut, 
  Sparkles,
  User as UserIcon,
  MessageSquare,
  CreditCard,
  Image as ImageIcon,
  FileText,
  X
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeView, onViewChange, onLogout, isOpen, onClose }) => {
  const adminLinks = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'pos', icon: CreditCard, label: 'POS' },
    { id: 'calendar', icon: Calendar, label: 'Master Calendar' },
    { id: 'appointments', icon: Package, label: 'Ritual List' },
    { id: 'services', icon: Scissors, label: 'Services' },
    { id: 'gallery', icon: ImageIcon, label: 'Gallery' },
    { id: 'blog', icon: FileText, label: 'Blog' },
    { id: 'stylists', icon: UserIcon, label: 'Stylists' },
    { id: 'inventory', icon: Package, label: 'Inventory' },
    { id: 'customers', icon: UserIcon, label: 'Customers' },
    { id: 'live-chat', icon: MessageSquare, label: 'Atelier Chat' },
    // { id: 'ai-insights', icon: Sparkles, label: 'Analytics' },
  ];

  const stylistLinks = [
    { id: 'my-schedule', icon: Calendar, label: 'Daily Schedule' },
    { id: 'calendar', icon: Calendar, label: 'Master Calendar' },
    { id: 'appointments', icon: Package, label: 'Ritual List' },
    { id: 'services', icon: Scissors, label: 'Service Catalog' },
    { id: 'blog', icon: FileText, label: 'Blog Chronicles' },
    { id: 'gallery', icon: ImageIcon, label: 'Visual Gallery' },
    { id: 'live-chat', icon: MessageSquare, label: 'Atelier Chat' },
  ];

  const customerLinks = [
    { id: 'book', icon: Calendar, label: 'Book Service' },
    { id: 'history', icon: Package, label: 'My Appointments' },
    { id: 'ai-tryon', icon: Sparkles, label: 'AI Try-On' },
    { id: 'live-chat', icon: MessageSquare, label: 'Atelier Chat' },
  ];

  const links = role === UserRole.ADMIN 
    ? adminLinks 
    : role === UserRole.STYLIST 
      ? stylistLinks 
      : customerLinks;

  return (
    <div className={`
      fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-atelier-sand h-full flex flex-col shadow-xl z-40
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-10 flex items-center justify-between">
        <h1 className="text-xl font-light tracking-[0.4em] text-atelier-charcoal uppercase leading-tight">
          PAWA <br /> <span className="font-bold text-atelier-clay">SALON</span>
        </h1>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 text-atelier-sand hover:text-atelier-clay">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      <nav className="flex-1 px-6 space-y-3 overflow-y-auto custom-scrollbar">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => {
              onViewChange(link.id);
              if (onClose) onClose();
            }}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-500 uppercase text-[10px] font-bold tracking-[0.2em] ${
              activeView === link.id 
                ? 'bg-atelier-nude text-atelier-clay shadow-sm border border-atelier-sand' 
                : 'text-atelier-taupe hover:bg-atelier-cream hover:text-atelier-charcoal'
            }`}
          >
            <link.icon className={`w-4 h-4 ${activeView === link.id ? 'text-atelier-clay' : 'text-atelier-sand'}`} />
            <span className="font-bold">{link.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-atelier-sand space-y-3 shrink-0">
        <div className="flex items-center space-x-4 px-6 py-3 text-[9px] text-atelier-sand font-bold uppercase tracking-[0.3em]">
          <UserIcon className="w-4 h-4" />
          <span>{role} Perspective</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-atelier-clay hover:bg-red-50 hover:text-red-600 transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

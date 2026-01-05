
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Truck, 
  Users, BarChart3, Settings, LogOut, Menu, Bell, Search,
  ChevronDown, Building2, Check, X, ScanLine, Calendar, ShoppingBag, PlusCircle, Wrench,
  AlertTriangle, FileText, UserPlus, Info
} from 'lucide-react';
import { useAuthStore, useGlobalStore, useBranchStore } from '../store';

interface NavItemProps {
  to: string;
  icon: any;
  label: string;
  subLabel?: string;
  isSubItem?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, subLabel, isSubItem = false }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative select-none mb-1 ${
        isActive 
          ? 'bg-gradient-to-r from-parami-500 to-parami-600 text-white shadow-md shadow-parami-900/20' 
          : 'text-gray-600 hover:bg-parami-50 hover:text-parami-600'
      } ${isSubItem ? 'pl-4' : ''}`
    }
  >
    {({ isActive }) => (
      <>
        <Icon size={isSubItem ? 18 : 20} className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-parami-600'}`} />
        <div className="flex flex-col relative z-10">
          <span className={`text-sm font-semibold leading-tight ${isActive ? 'text-white' : ''}`}>{label}</span>
          {subLabel && <span className={`text-[10px] ${isActive ? 'text-white/90' : 'text-gray-400 group-hover:text-parami-600/80'} font-mm leading-tight mt-0.5`}>{subLabel}</span>}
        </div>
        {isActive && (
            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/40" />
        )}
      </>
    )}
  </NavLink>
);

interface NavGroupProps {
  label: string;
  icon: any;
  children: React.ReactNode;
  pathPrefixes: string[];
}

const NavGroup: React.FC<NavGroupProps> = ({ label, icon: Icon, children, pathPrefixes }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const isActive = pathPrefixes.some(prefix => location.pathname.startsWith(prefix));

  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [isActive]);

  return (
    <div className="mb-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group select-none ${
          isActive ? 'text-parami-600 bg-parami-50 font-bold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
        }`}
      >
        <div className="flex items-center gap-3">
            <Icon size={20} className={isActive ? 'text-parami-600' : 'text-gray-400 group-hover:text-parami-600'} />
            <span className="text-sm">{label}</span>
        </div>
        <ChevronDown size={16} className={`transition-transform duration-300 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="pt-1 pb-2 pl-4 relative">
             <div className="absolute left-9 top-0 bottom-2 w-px bg-gray-100" />
             <div className="space-y-1 relative z-10">
                {children}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useGlobalStore();
  const { logout } = useAuthStore();
  
  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside 
        className={`w-[280px] bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out shadow-2xl shadow-gray-200/50 md:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-100 bg-white">
          <div className="w-10 h-10 bg-parami-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-parami-600/20 shrink-0">
             <span className="font-bold text-lg tracking-tighter">A7</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 leading-none">Smart POS</h1>
          </div>
          <button 
             onClick={toggleSidebar}
             className="ml-auto md:hidden p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
             <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" subLabel="ခြုံငုံသုံးသပ်ချက်" />
          <NavItem to="/pos" icon={ShoppingCart} label="POS Terminal" subLabel="အရောင်းကောင်တာ" />
          
          <div className="my-2 h-px bg-gray-50 mx-2" />

          {/* Inventory Group */}
          <NavGroup label="Inventory" icon={Package} pathPrefixes={['/stock-entry', '/inventory', '/expiry']}>
             <NavItem to="/stock-entry" icon={PlusCircle} label="Stock Entry" subLabel="ပစ္စည်းထည့်သွင်းရန်" isSubItem />
             <NavItem to="/inventory" icon={Package} label="Current Stock" subLabel="လက်ရှိ ပစ္စည်းများ" isSubItem />
             <NavItem to="/expiry" icon={Calendar} label="Expiry Center" subLabel="သက်တမ်းကုန်ဆုံးမှု" isSubItem />
          </NavGroup>

          {/* Management Group - HIDDEN */}
          {/* <NavGroup label="Management" icon={Building2} pathPrefixes={['/purchase', '/distribution']}>
             <NavItem to="/purchase" icon={ShoppingBag} label="Purchasing" subLabel="အဝယ်ပိုင်း" isSubItem />
             <NavItem to="/distribution" icon={Truck} label="Distribution" subLabel="ဖြန့်ချိရေး" isSubItem />
          </NavGroup> */}

          {/* Finance Group */}
          <NavGroup label="Finance" icon={BarChart3} pathPrefixes={['/finance']}>
             <NavItem to="/finance" icon={BarChart3} label="Financial Overview" subLabel="ငွေစာရင်း" isSubItem />
          </NavGroup>

          {/* CRM Group - HIDDEN */}
          {/* <NavGroup label="CRM" icon={Users} pathPrefixes={['/customers']}>
             <NavItem to="/customers" icon={Users} label="Customer Directory" subLabel="ဖောက်သည်များ" isSubItem />
          </NavGroup> */}

          {/* Tools Group */}
          <NavGroup label="Tools" icon={Wrench} pathPrefixes={['/scanner', '/settings']}>
             <NavItem to="/scanner" icon={ScanLine} label="Scanner Utility" subLabel="စစ်ဆေးရေး" isSubItem />
             <NavItem to="/settings" icon={Settings} label="Settings" subLabel="ဆက်တင်များ" isSubItem />
          </NavGroup>

        </div>

        {/* Footer User Profile */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
           <button 
             onClick={logout}
             className="flex items-center gap-3 w-full p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all group mb-2"
           >
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                 <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-left overflow-hidden">
                 <p className="text-sm font-bold text-gray-800 truncate group-hover:text-parami-600 transition-colors">Kaung Kaung</p>
                 <p className="text-[10px] font-medium text-gray-500 truncate text-parami-600">Administrator</p>
              </div>
              <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
           </button>
           <div className="text-center text-xs text-gray-400 font-medium">Powered by A7 Systems</div>
        </div>
      </aside>
    </>
  );
};

// --- Mock Notification Data ---
interface NotificationItem {
  id: number;
  title: string;
  desc?: string;
  time: string;
  type: 'alert' | 'info' | 'success';
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, title: 'Low Stock Alert', desc: 'Coca-Cola 330ml is below 24 units.', time: '10 mins ago', type: 'alert', read: false },
  { id: 2, title: 'Daily Sales Report Ready', desc: 'Yesterday\'s summary is available.', time: '1 hour ago', type: 'info', read: false },
  { id: 3, title: 'New Customer Registered', desc: 'U Kyaw Swar added to Platinum tier.', time: '2 hours ago', type: 'success', read: true },
  { id: 4, title: 'System Update', desc: 'Patch v1.2 installed successfully.', time: '1 day ago', type: 'info', read: true },
];

export const Header = () => {
  const { toggleSidebar } = useGlobalStore();
  const { branches, currentBranchId, setBranch, getCurrentBranch } = useBranchStore();
  const { user } = useAuthStore();
  
  const currentBranch = getCurrentBranch();

  // Notification Logic
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Close notification popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertTriangle size={16} className="text-red-600" />;
      case 'success': return <UserPlus size={16} className="text-emerald-600" />;
      default: return <FileText size={16} className="text-blue-600" />;
    }
  };

  const getNotifBg = (type: string) => {
    switch(type) {
      case 'alert': return 'bg-red-100';
      case 'success': return 'bg-emerald-100';
      default: return 'bg-blue-100';
    }
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm/50">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
        >
          <Menu size={24} />
        </button>
        
        {/* Branch Switcher */}
        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Branch</span>
              <div className="relative group">
                 <button className="flex items-center gap-2 font-bold text-gray-800 hover:text-parami-600 transition-colors">
                    <Building2 size={16} />
                    <span>{currentBranch?.name || 'Select Branch'}</span>
                    <ChevronDown size={14} className="text-gray-400 group-hover:text-parami-600" />
                 </button>
                 
                 {/* Dropdown */}
                 <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-left z-50">
                    <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Switch Branch</p>
                    {branches.map(branch => (
                       <button 
                         key={branch.id}
                         onClick={() => setBranch(branch.id)}
                         className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                            currentBranchId === branch.id 
                            ? 'bg-parami-50 text-parami-600' 
                            : 'text-gray-600 hover:bg-gray-50'
                         }`}
                       >
                          <span>{branch.name}</span>
                          {currentBranchId === branch.id && <Check size={14} />}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
         {/* Search Bar */}
         <div className="hidden md:flex relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-parami-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Global Search..." 
              className="w-64 pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-parami-500/20 focus:bg-white transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
               <span className="px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-bold text-gray-400">⌘</span>
               <span className="px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-bold text-gray-400">K</span>
            </div>
         </div>

         <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>

         {/* Notification System */}
         <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all ${isNotifOpen ? 'bg-gray-100 text-gray-900' : ''}`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                )}
            </button>

            {/* Notification Popover */}
            {isNotifOpen && (
               <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200 origin-top-right">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                     <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                     {unreadCount > 0 && (
                       <button 
                         onClick={markAllAsRead}
                         className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                       >
                         Mark all as read
                       </button>
                     )}
                  </div>
                  
                  <div className="max-h-[350px] overflow-y-auto">
                     {notifications.length > 0 ? (
                       notifications.map(n => (
                         <div 
                           key={n.id} 
                           className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!n.read ? 'bg-blue-50/30' : ''}`}
                         >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getNotifBg(n.type)}`}>
                               {getNotifIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start">
                                  <p className={`text-sm ${!n.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{n.title}</p>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{n.time}</span>
                               </div>
                               <p className="text-xs text-gray-500 mt-0.5 truncate">{n.desc}</p>
                            </div>
                            {!n.read && (
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 self-center shrink-0"></div>
                            )}
                         </div>
                       ))
                     ) : (
                       <div className="p-8 text-center text-gray-400">
                          <Bell size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="text-xs">No new notifications</p>
                       </div>
                     )}
                  </div>
                  
                  <div className="p-3 border-t border-gray-100 text-center bg-gray-50/30">
                     <button className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wide">
                        View All Notifications
                     </button>
                  </div>
               </div>
            )}
         </div>
         
         <div className="flex items-center gap-3 pl-2 border-l border-gray-200 md:border-none">
            <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-gray-800">{user?.name || 'Guest'}</p>
               <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 uppercase">{user?.role || 'Staff'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 ring-2 ring-white shadow-sm overflow-hidden">
               <img src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} alt="Profile" className="w-full h-full object-cover" />
            </div>
         </div>
      </div>
    </header>
  );
};

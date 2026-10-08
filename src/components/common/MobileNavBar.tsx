import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Award, 
  CheckSquare, 
  FileText, 
  CalendarCheck,
  School,
  BarChart3,
  BookOpen,
  Bell,
  Menu
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface MobileNavBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMenu?: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ currentTab, onSelectTab, onOpenMenu }) => {
  const { activeRole } = useApp();

  const getQuickItems = (role: UserRole) => {
    const baseItems = (() => {
      switch (role) {
        case 'comptable':
          return [
            { id: 'dashboard', label: 'Bord', icon: <LayoutDashboard className="w-5 h-5" /> },
            { id: 'students', label: 'Élèves', icon: <Users className="w-5 h-5" /> },
            { id: 'classes', label: 'Classes', icon: <School className="w-5 h-5" /> },
            { id: 'payments', label: 'Finances', icon: <Wallet className="w-5 h-5" /> }
          ];
        case 'proviseur':
          return [
            { id: 'dashboard', label: 'Bord', icon: <LayoutDashboard className="w-5 h-5" /> },
            { id: 'students', label: 'Élèves', icon: <Users className="w-5 h-5" /> },
            { id: 'reportCards', label: 'Bulletins', icon: <FileText className="w-5 h-5" /> },
            { id: 'certificates', label: 'Certificats', icon: <Award className="w-5 h-5" /> }
          ];
        case 'admin':
          return [
            { id: 'dashboard', label: 'Bord', icon: <LayoutDashboard className="w-5 h-5" /> },
            { id: 'teachers', label: 'Profs', icon: <Users className="w-5 h-5" /> },
            { id: 'grades', label: 'Notes', icon: <FileText className="w-5 h-5" /> },
            { id: 'attendance', label: 'Présences', icon: <CalendarCheck className="w-5 h-5" /> }
          ];
        case 'enseignant':
          return [
            { id: 'grades', label: 'Notes', icon: <CheckSquare className="w-5 h-5" /> },
            { id: 'cahier', label: 'Cahier', icon: <BookOpen className="w-5 h-5" /> },
            { id: 'attendance', label: 'Appel', icon: <CalendarCheck className="w-5 h-5" /> },
            { id: 'classes', label: 'Classes', icon: <School className="w-5 h-5" /> }
          ];
        case 'parent':
          return [
            { id: 'portal', label: 'Notes', icon: <Users className="w-5 h-5" /> },
            { id: 'cahier', label: 'Cahier', icon: <BookOpen className="w-5 h-5" /> },
            { id: 'messages', label: 'Messages', icon: <Bell className="w-5 h-5" /> },
            { id: 'reportCard', label: 'Bulletin', icon: <FileText className="w-5 h-5" /> }
          ];
        default:
          return [];
      }
    })();

    return [
      ...baseItems,
      { id: '__menu__', label: 'Menu & Plus', icon: <Menu className="w-5 h-5 text-cyan-400" /> }
    ];
  };

  const items = getQuickItems(activeRole);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-2 py-1 safe-area-bottom shadow-2xl">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isMenu = item.id === '__menu__';
          const isActive = currentTab === item.id;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                if (isMenu) {
                  if (onOpenMenu) onOpenMenu();
                } else {
                  onSelectTab(item.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-colors duration-200 cursor-pointer ${
                isActive ? 'text-cyan-400 font-bold' : isMenu ? 'text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg relative ${isActive ? 'bg-cyan-500/10' : isMenu ? 'bg-cyan-500/10 border border-cyan-500/20' : ''}`}>
                {item.icon}
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveDot"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

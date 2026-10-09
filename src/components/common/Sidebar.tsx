import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  School, 
  Wallet, 
  FileSpreadsheet, 
  GraduationCap, 
  Award, 
  CalendarCheck, 
  Clock, 
  UserPlus, 
  FileText, 
  CheckSquare,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Download,
  BookOpen,
  BarChart3,
  Bell,
  Sparkles,
  Cloud,
  Settings,
  LogOut,
  Globe,
  RotateCcw,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { UserRole, Language } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen = false, onClose }) => {
  const { 
    currentUser,
    activeRole,
    logout,
    switchRoleQuick,
    language,
    setLanguage,
    theme,
    themeMode,
    setThemeMode,
    openExportModal, 
    setIsAiImportModalOpen, 
    t, 
    schoolProfile, 
    daysRemaining, 
    isSubscriptionRestricted, 
    setIsSchoolRegisterModalOpen, 
    setIsSubscriptionModalOpen, 
    setIsGoogleDriveSyncModalOpen,
    openSettingsModal
  } = useApp();

  const getNavItems = (role: UserRole) => {
    switch (role) {
      case 'comptable':
        return [
          { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'classes', label: 'Espace Classes', icon: <School className="w-5 h-5" />, badge: 'Hub' },
          { id: 'analytics', label: 'Grand Analytics', icon: <TrendingUp className="w-5 h-5" />, badge: 'Pro' },
          { id: 'students', label: t('students'), icon: <Users className="w-5 h-5" /> },
          { id: 'payments', label: t('finance'), icon: <Wallet className="w-5 h-5" /> }
        ];
      case 'proviseur':
        return [
          { id: 'dashboard', label: 'Direction & KPIs', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'classes', label: 'Espace Classes', icon: <School className="w-5 h-5" />, badge: 'Hub' },
          { id: 'analytics', label: 'Grand Analytics', icon: <TrendingUp className="w-5 h-5" />, badge: 'Stratégique' },
          { id: 'subjects', label: 'Matières & Pédagogie', icon: <BookOpen className="w-5 h-5" /> },
          { id: 'attendance', label: 'Assiduité & Contrôle', icon: <CalendarCheck className="w-5 h-5" /> },
          { id: 'students', label: 'Effectifs Élèves', icon: <Users className="w-5 h-5" /> },
          { id: 'grades', label: 'Bloc-notes & Évaluations', icon: <FileSpreadsheet className="w-5 h-5" /> },
          { id: 'reportCards', label: t('reportCards'), icon: <FileText className="w-5 h-5" /> },
          { id: 'certificates', label: 'Certificats Officiels', icon: <Award className="w-5 h-5" />, badge: 'Exclusif' },
          { id: 'accounts', label: 'Comptes d\'Accès', icon: <ShieldCheck className="w-5 h-5" /> }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'classes', label: 'Espace Classes', icon: <School className="w-5 h-5" />, badge: 'Hub' },
          { id: 'analytics', label: 'Grand Analytics', icon: <TrendingUp className="w-5 h-5" />, badge: 'Avancé' },
          { id: 'subjects', label: 'Matières & Cursus', icon: <BookOpen className="w-5 h-5" />, badge: 'Nouveau' },
          { id: 'teachers', label: 'Enseignants & Accès', icon: <UserPlus className="w-5 h-5" /> },
          { id: 'students', label: t('students'), icon: <Users className="w-5 h-5" /> },
          { id: 'grades', label: 'Supervision & Override', icon: <FileSpreadsheet className="w-5 h-5" /> },
          { id: 'attendance', label: t('attendance'), icon: <CalendarCheck className="w-5 h-5" /> },
          { id: 'timetable', label: t('timetable'), icon: <Clock className="w-5 h-5" /> },
          { id: 'accounts', label: t('accounts'), icon: <ShieldCheck className="w-5 h-5" /> }
        ];
      case 'enseignant':
        return [
          { id: 'classes', label: 'Mes Classes', icon: <School className="w-5 h-5" />, badge: 'Hub' },
          { id: 'grades', label: 'Saisie des Notes', icon: <CheckSquare className="w-5 h-5" /> },
          { id: 'cahier', label: 'Cahier de Textes', icon: <BookOpen className="w-5 h-5" />, badge: 'Devoirs' },
          { id: 'analytics', label: 'Analytique de Classe', icon: <BarChart3 className="w-5 h-5" />, badge: 'Graphiques' },
          { id: 'attendance', label: 'Faire l\'Appel', icon: <CalendarCheck className="w-5 h-5" />, badge: 'Séance' },
          { id: 'timetable', label: 'Mon Emploi du Temps', icon: <Clock className="w-5 h-5" /> }
        ];
      case 'parent':
        return [
          { id: 'portal', label: 'Progression Enfant', icon: <GraduationCap className="w-5 h-5" /> },
          { id: 'cahier', label: 'Cahier de Textes', icon: <BookOpen className="w-5 h-5" />, badge: 'Devoirs' },
          { id: 'messages', label: 'Messages & Alertes', icon: <Bell className="w-5 h-5" />, badge: 'École' },
          { id: 'attendance', label: 'Assiduité & Justificatifs', icon: <CalendarCheck className="w-5 h-5" /> },
          { id: 'reportCard', label: 'Bulletin Officiel (PDF)', icon: <FileText className="w-5 h-5" />, badge: 'T2' },
          { id: 'certificates', label: 'Demande Certificats', icon: <Award className="w-5 h-5" /> },
          { id: 'finance', label: 'Scolarité & Reçus', icon: <Wallet className="w-5 h-5" /> }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(activeRole);

  const handleSelect = (id: string) => {
    onSelectTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop with Framer Motion fade */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 sm:top-16 bottom-0 left-0 z-50 lg:z-40 w-72 max-w-[85vw] lg:w-64 border-r border-slate-800/80 bg-slate-950/98 backdrop-blur-2xl
        transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto no-scrollbar
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="flex flex-col min-h-full justify-between p-4">
          
          <div className="space-y-4">
            {/* Mobile Header with close button */}
            <div className="lg:hidden flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-cyan-500/30">
                  <img 
                    src={schoolProfile?.logoUrl || "/src/assets/images/plume_app_icon_1790683767339.jpg"} 
                    alt={schoolProfile?.name || "Logo"} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <span className="font-bold text-white text-sm truncate max-w-[170px]">
                  {schoolProfile?.name || 'Plume Excellence'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                title="Fermer le menu"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            </div>

            {/* User Profile Card & Direct Logout (Visible everywhere, prominent on Mobile & Tablet) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                {currentUser?.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-cyan-500/40 shrink-0" 
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-xs ring-1 ring-cyan-500/40 shrink-0">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {currentUser?.name || 'Utilisateur'}
                  </div>
                  <div className="text-[10px] text-cyan-400 capitalize flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{t(activeRole as any)}</span>
                  </div>
                </div>
              </div>

              {/* High-visibility Logout button in the sidebar */}
              <button
                onClick={() => {
                  if (onClose) onClose();
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                title="Se déconnecter de Plume"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Se déconnecter</span>
              </button>
            </div>

            {/* Mobile/Tablet Role Switcher */}
            <div className="lg:hidden space-y-1.5 pt-1">
              <div className="px-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                <span>Changer d'espace</span>
                <span className="text-[9px] text-cyan-400 font-normal">Accès rapide</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { role: 'admin' as UserRole, label: 'Admin', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                  { role: 'proviseur' as UserRole, label: 'Proviseur', icon: <Award className="w-3.5 h-3.5" /> },
                  { role: 'comptable' as UserRole, label: 'Comptable', icon: <Wallet className="w-3.5 h-3.5" /> },
                  { role: 'enseignant' as UserRole, label: 'Enseignant', icon: <GraduationCap className="w-3.5 h-3.5" /> },
                  { role: 'parent' as UserRole, label: 'Parent', icon: <Users className="w-3.5 h-3.5" /> }
                ].map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRoleQuick(r.role);
                      if (onClose) onClose();
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      activeRole === r.role
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800/80'
                    }`}
                  >
                    {r.icon}
                    <span className="truncate">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1 relative">
              <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Menu Principal
              </div>
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(item.id)}
                    className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-200 group z-10 ${
                      isActive 
                        ? 'text-cyan-400' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebarIndicator"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 shadow-md shadow-cyan-950/40 -z-10"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}

                    <div className="flex items-center gap-3">
                      <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isActive ? 'text-cyan-400 translate-x-0.5' : 'opacity-0 group-hover:opacity-100'}`} />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>

          {/* Assistant IA Import Card for Staff */}
          {['admin', 'proviseur', 'comptable', 'enseignant'].includes(activeRole) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setIsAiImportModalOpen(true);
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 text-left text-xs transition-all cursor-pointer group shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <div className="font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                    <span>Assistant IA</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-200">Excel</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Importer documents</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </motion.button>
          )}

          {/* Quick Export Center Card for Staff */}
          {['admin', 'proviseur', 'comptable'].includes(activeRole) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                openExportModal();
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 text-left text-xs transition-all cursor-pointer group shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">Centre d'Export</div>
                  <div className="text-[10px] text-slate-400">PDF, Excel, Règlements</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </motion.button>
          )}

          {/* School Badge & Quick Links in footer of Sidebar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 text-center"
          >
            <div 
              onClick={() => { setIsSchoolRegisterModalOpen(true); if (onClose) onClose(); }}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              title="Gérer les informations et signataires de l'école"
            >
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-700 mx-auto mb-1 bg-slate-950">
                <img 
                  src={schoolProfile?.logoUrl || "/src/assets/images/plume_app_icon_1790683767339.jpg"} 
                  alt={schoolProfile?.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate">{schoolProfile?.country || 'Bénin'}</div>
              <div className="text-xs font-bold text-slate-100 font-display truncate">{schoolProfile?.name || 'Plume Excellence'}</div>
            </div>

            {/* Subscription Mini Button */}
            <div 
              onClick={() => { setIsSubscriptionModalOpen(true); if (onClose) onClose(); }}
              className={`p-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between cursor-pointer transition-colors ${
                schoolProfile?.subscription?.status === 'active'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : isSubscriptionRestricted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="Abonnement de l'école (15 $/mois)"
            >
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span>{schoolProfile?.subscription?.status === 'active' ? 'Abonnement $15/m' : `Essai J-${daysRemaining}`}</span>
              </span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </div>

            {/* Google Drive & Paramètres Mini Buttons */}
            <div 
              onClick={() => { openSettingsModal('googledrive'); if (onClose) onClose(); }}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-[11px] text-slate-300 flex items-center justify-between cursor-pointer transition-colors"
              title="Liaison Google Drive & Compte de Service"
            >
              <span className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Drive</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            <div 
              onClick={() => { openSettingsModal('profile'); if (onClose) onClose(); }}
              className="p-1.5 rounded-xl border border-slate-800/80 bg-slate-950/50 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 flex items-center justify-between cursor-pointer transition-colors"
              title="Paramètres de l'application & profil"
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paramètres</span>
              </span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </div>

            <div 
              onClick={() => { openSettingsModal('reset'); if (onClose) onClose(); }}
              className="p-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-[11px] text-amber-300 flex items-center justify-between cursor-pointer transition-colors"
              title="Réinitialiser pour une nouvelle utilisation scolaire"
            >
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Nouvelle Rentrée</span>
              </span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </div>

            {/* Language Switcher in Sidebar */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Langue</span>
              </span>
              <div className="flex items-center gap-1">
                {(['fr', 'en', 'es'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      language === l
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white bg-slate-950/80 border border-slate-800'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Theme Switcher in Sidebar */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-400">
                {themeMode === 'system' ? (
                  <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                ) : theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Thème</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setThemeMode('system')}
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                    themeMode === 'system'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white bg-slate-950/80 border border-slate-800'
                  }`}
                  title="Thème automatique (selon le système)"
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white bg-slate-950/80 border border-slate-800'
                  }`}
                  title="Mode Clair haute lisibilité"
                >
                  Clair
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white bg-slate-950/80 border border-slate-800'
                  }`}
                  title="Mode Sombre reposant"
                >
                  Sombre
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </aside>
    </>
  );
};

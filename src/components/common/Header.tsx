import React, { useState } from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  Laptop,
  Globe, 
  LogOut, 
  Settings, 
  Shield, 
  Award, 
  Wallet, 
  GraduationCap, 
  Users, 
  ChevronDown, 
  CheckCircle2, 
  Trash2, 
  Menu,
  CalendarCheck,
  Search,
  Download,
  X,
  CheckCheck,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
  Receipt,
  FileText,
  Wifi,
  WifiOff,
  Database,
  ArrowRight,
  Keyboard,
  Cloud,
  School
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { UserRole, Language, AppNotification } from '../../types';
import { AttendanceModal } from '../attendance/AttendanceModal';
import { GlobalSearch } from '../search/GlobalSearch';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenShortcuts }) => {
  const { 
    currentUser, 
    activeRole, 
    switchRoleQuick, 
    logout, 
    theme, 
    themeMode,
    systemPreference,
    setThemeMode,
    toggleTheme, 
    language, 
    setLanguage, 
    t,
    notifications,
    filteredNotifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    soundEnabled,
    toggleSound,
    executeNotificationAction,
    triggerSimulationNotification,
    isOnline,
    isOfflineSimulated,
    isEffectivelyOffline,
    offlineCacheStatus,
    toggleOfflineSimulation,
    syncOfflineCache,
    setIsSettingsOpen,
    openSettingsModal,
    openExportModal,
    openSearchModal,
    setIsAiImportModalOpen,
    schoolProfile,
    daysRemaining,
    isSubscriptionRestricted,
    setIsSchoolRegisterModalOpen,
    setIsSubscriptionModalOpen,
    setIsGoogleDriveSyncModalOpen
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showOfflineMenu, setShowOfflineMenu] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'grades' | 'documents'>('all');
  const [showSimPanel, setShowSimPanel] = useState(false);

  // Search is available for Administration, Proviseur, and Comptable
  const isPrivilegedStaff = ['admin', 'proviseur', 'comptable'].includes(activeRole);

  const effectiveUnread = unreadCount ?? (filteredNotifications || notifications).filter(n => !n.read).length;

  const displayedNotifications = React.useMemo(() => {
    const base = filteredNotifications || notifications;
    if (notifFilter === 'unread') return base.filter(n => !n.read);
    if (notifFilter === 'grades') return base.filter(n => n.type === 'grade');
    if (notifFilter === 'documents') return base.filter(n => n.type === 'certificate' || n.type === 'finance');
    return base;
  }, [filteredNotifications, notifications, notifFilter]);

  const rolesConfig: { role: UserRole; labelKey: string; icon: React.ReactNode; color: string }[] = [
    { role: 'admin', labelKey: 'admin', icon: <Shield className="w-4 h-4" />, color: 'from-blue-600 to-indigo-600' },
    { role: 'proviseur', labelKey: 'proviseur', icon: <Award className="w-4 h-4" />, color: 'from-amber-500 to-amber-700' },
    { role: 'comptable', labelKey: 'comptable', icon: <Wallet className="w-4 h-4" />, color: 'from-emerald-500 to-teal-600' },
    { role: 'enseignant', labelKey: 'enseignant', icon: <GraduationCap className="w-4 h-4" />, color: 'from-cyan-500 to-blue-600' },
    { role: 'parent', labelKey: 'parent', icon: <Users className="w-4 h-4" />, color: 'from-violet-500 to-purple-600' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl transition-colors duration-300 overflow-x-clip">
      <div className="flex h-14 sm:h-16 items-center justify-between px-2.5 sm:px-6 w-full max-w-full">
        
        {/* Left: Brand & Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onToggleSidebar && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          )}

          <motion.div 
            onClick={() => setIsSchoolRegisterModalOpen(true)}
            className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            title="Paramètres & Inscription de l'Établissement"
          >
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30 bg-gradient-to-br from-slate-900 to-slate-800 shrink-0">
              <img 
                src={schoolProfile?.logoUrl || "/src/assets/images/plume_app_icon_1790683767339.jpg"} 
                alt={schoolProfile?.name || "Logo École"} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-cyan-400/10 mix-blend-overlay"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-bold text-sm sm:text-base tracking-tight text-white truncate max-w-[130px] sm:max-w-[200px]">
                  {schoolProfile?.name || 'Plume'}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {schoolProfile?.countryCode || 'BJ'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 -mt-0.5 hidden md:block truncate max-w-[200px]">
                {schoolProfile?.locality || 'Cotonou'} • {schoolProfile?.motto || 'Gestion Scolaire'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Global Spotlight Search Trigger (All roles, Desktop & Tablet) */}
        <div className="hidden lg:flex flex-1 max-w-xs xl:max-w-sm 2xl:max-w-md mx-3">
          <button
            onClick={() => openSearchModal()}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-slate-200 text-xs shadow-inner transition-all group cursor-pointer"
            title="Recherche globale (Ctrl+K / Cmd+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="truncate">Rechercher élève, classe, document...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-800 group-hover:bg-slate-700/80 border border-slate-700 rounded-lg shrink-0">
              <span className="text-cyan-400">⌘/Ctrl</span> K
            </kbd>
          </button>
        </div>

        {/* Center: Role Switcher Quick Bar (Desktop) with Animated Layout */}
        <div className="hidden xl:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-inner relative">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">
            Rôle actif :
          </span>
          {rolesConfig.map((item) => {
            const isActive = activeRole === item.role;
            return (
              <motion.button
                key={item.role}
                whileTap={{ scale: 0.95 }}
                onClick={() => switchRoleQuick(item.role)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium z-10 transition-colors duration-200 ${
                  isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeRoleIndicator"
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.color} shadow-md shadow-cyan-500/20 -z-10`}
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                {item.icon}
                <span>{t(item.labelKey as any)}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Right Actions: Quick Selector (Mobile/Tablet), Lang, Theme, Notifs, Profile */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          
          {/* Mobile Search Button (All roles) */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => openSearchModal()}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            title="Recherche globale (Ctrl+K / Cmd+K)"
          >
            <Search className="w-4 h-4 text-cyan-400" />
          </motion.button>

          {/* Quick AI Import Document Trigger for Staff (Desktop) */}
          {activeRole !== 'parent' && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAiImportModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Assistant IA • Importer un document scolaire (Excel / CSV)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline">IA Import</span>
            </motion.button>
          )}

          {/* School Subscription ($15/month) & Trial Status Trigger (Tablet & Desktop) */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSubscriptionModalOpen(true)}
            className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
              schoolProfile?.subscription?.status === 'active'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : isSubscriptionRestricted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30 animate-pulse'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Abonnement de l'établissement (15 $/mois) & Période d'essai"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">
              {schoolProfile?.subscription?.status === 'active'
                ? 'Abonnement $15/m'
                : isSubscriptionRestricted
                ? 'Expiré (15$/m)'
                : `Essai J-${daysRemaining}`}
            </span>
            <span className="xl:hidden">
              {schoolProfile?.subscription?.status === 'active' ? '$15/m' : `J-${daysRemaining}`}
            </span>
          </motion.button>

          {/* Google Drive Sovereignty Sync Button (Tablet & Desktop) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsGoogleDriveSyncModalOpen(true)}
            className="hidden md:flex p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800 transition-colors relative cursor-pointer"
            title={`Sauvegarde Google Drive (${schoolProfile?.googleEmail || 'Connecté'})`}
          >
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 ring-2 ring-slate-900"></span>
          </motion.button>

          {/* Quick Reports & Exports Modal Trigger for Staff (Desktop large) */}
          {isPrivilegedStaff && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openExportModal(activeRole === 'comptable' ? 'payments' : 'students')}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Centre d'Exportation & Rapports Officiels (PDF / Excel)"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rapports</span>
            </motion.button>
          )}

          {/* Quick Attendance Modal Trigger for Teacher & Administration (Desktop large) */}
          {(activeRole === 'enseignant' || activeRole === 'admin' || activeRole === 'proviseur') && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAttendanceModal(true)}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-950/40 hover:brightness-110 transition-all cursor-pointer"
              title="Faire l'appel de classe en direct"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Faire l'Appel</span>
            </motion.button>
          )}

          {/* Quick role switcher dropdown (Tablet only; Desktop has top bar, Mobile has sidebar) */}
          <div className="relative hidden sm:block xl:hidden">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-cyan-400 hover:bg-slate-800 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="capitalize text-[11px] sm:text-xs max-w-[80px] md:max-w-none truncate">{t(activeRole as any)}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </motion.button>

            <AnimatePresence>
              {showRoleMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 origin-top-right"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                    Changer de rôle
                  </div>
                  {rolesConfig.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => switchRoleQuick(r.role)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        activeRole === r.role 
                          ? 'bg-cyan-500/10 text-cyan-400 font-semibold' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {r.icon}
                      <span>{t(r.labelKey as any)}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language Selector (desktop) */}
          <div className="relative hidden lg:block">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              title="Changer de langue"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase">{language}</span>
            </motion.button>

            <AnimatePresence>
              {showLangMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-36 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 origin-top-right"
                  onClick={() => setShowLangMenu(false)}
                >
                  {[
                    { code: 'fr' as Language, label: 'Français', flag: '🇫🇷' },
                    { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
                    { code: 'es' as Language, label: 'Español', flag: '🇪🇸' }
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLanguage(l.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                        language === l.code ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </span>
                      {language === l.code && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Offline Cache & Connectivity Status Indicator (Tablet & Desktop - Mobile has dedicated OfflineBanner) */}
          <div className="relative hidden sm:block">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowOfflineMenu(!showOfflineMenu)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isEffectivelyOffline 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              title={isEffectivelyOffline ? 'Mode Hors-Ligne Actif (Cache local)' : 'Connecté au serveur (Cache synchronisé)'}
            >
              {isEffectivelyOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden md:inline text-[11px] font-bold text-amber-300">Hors-Ligne</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="hidden md:inline text-[11px] font-medium text-slate-300">En ligne</span>
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {showOfflineMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-72 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3 sm:p-3.5 z-50 origin-top-right text-left"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${isEffectivelyOffline ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                        {isEffectivelyOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">
                          {isEffectivelyOffline ? 'Mode Hors-Ligne Actif' : 'Connecté & En Ligne'}
                        </h4>
                        <p className="text-[10px] text-slate-400">Cache local (localStorage)</p>
                      </div>
                    </div>
                  </div>

                  {/* Cache metrics */}
                  <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-[11px] mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Notes en mémoire :</span>
                      <strong className="text-cyan-400 font-mono">{offlineCacheStatus.cachedGradesCount}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Bulletins disponibles :</span>
                      <strong className="text-indigo-400 font-mono">{offlineCacheStatus.cachedBulletinsCount}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Dernière synchro :</span>
                      <span className="text-slate-300 font-mono text-[10px]">{offlineCacheStatus.lastCachedAt || 'Aujourd\'hui'}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        syncOfflineCache();
                        setShowOfflineMenu(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Synchroniser le cache</span>
                    </button>

                    <button
                      onClick={() => {
                        toggleOfflineSimulation();
                        setShowOfflineMenu(false);
                      }}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        isOfflineSimulated
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                          : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20'
                      }`}
                    >
                      <span>{isOfflineSimulated ? 'Quitter le mode hors-ligne' : 'Simuler le mode hors-ligne'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Keyboard Shortcuts Guide Button */}
          {onOpenShortcuts && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onOpenShortcuts}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
              title="Raccourcis clavier experts (Ctrl+N, Ctrl+B, ?)"
            >
              <Keyboard className="w-4 h-4" />
              <span className="text-[10px] font-mono text-slate-500 font-bold hidden lg:inline">⌘/Ctrl</span>
            </motion.button>
          )}

          {/* Permanent Dark Theme Indicator (Desktop) */}
          <div
            className="hidden lg:flex p-2 rounded-xl text-cyan-400 bg-slate-900/60 border border-slate-800/80 items-center gap-1.5 select-none"
            title="Thème Sombre actif en permanence pour le confort visuel"
          >
            <Moon className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            <span className="text-[10px] font-mono text-cyan-300 font-bold hidden xl:inline">Sombre</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              title={t('notifications')}
            >
              <Bell className="w-4 h-4" />
              {effectiveUnread > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-1.25rem)] max-w-sm sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3 sm:p-4 z-50 origin-top-right text-left"
                >
                  {/* Notification Center Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                          Centre d'Alertes en Direct
                          {effectiveUnread > 0 && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {effectiveUnread} non {effectiveUnread > 1 ? 'lues' : 'lue'}
                            </span>
                          )}
                        </span>
                        <p className="text-[10px] text-slate-400">Notes d'évaluation & documents officiels certifiés</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Audio chime toggle */}
                      <button
                        onClick={toggleSound}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          soundEnabled 
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' 
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'
                        }`}
                        title={soundEnabled ? 'Alerte sonore activée (cliquer pour couper)' : 'Alerte sonore coupée (cliquer pour activer)'}
                      >
                        {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                      </button>

                      {/* Mark all as read */}
                      {effectiveUnread > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Tout marquer comme lu"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Clear all */}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Effacer les notifications"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-3 text-[11px]">
                    <button
                      onClick={() => setNotifFilter('all')}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all ${
                        notifFilter === 'all' 
                          ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Toutes ({filteredNotifications?.length || notifications.length})
                    </button>
                    <button
                      onClick={() => setNotifFilter('unread')}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all ${
                        notifFilter === 'unread' 
                          ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Non lues ({effectiveUnread})
                    </button>
                    <button
                      onClick={() => setNotifFilter('grades')}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all ${
                        notifFilter === 'grades' 
                          ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Notes
                    </button>
                    <button
                      onClick={() => setNotifFilter('documents')}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all ${
                        notifFilter === 'documents' 
                          ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Actes Officiels
                    </button>
                  </div>

                  {/* Real-time Simulator Panel */}
                  <div className="mb-3">
                    <button
                      onClick={() => setShowSimPanel(!showSimPanel)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-cyan-950/20 hover:bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 text-[11px] font-semibold transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>Simulateur d'Alertes en Direct</span>
                      </span>
                      <span className="text-[10px] text-cyan-400/80">
                        {showSimPanel ? 'Masquer' : 'Tester un envoi'}
                      </span>
                    </button>

                    <AnimatePresence>
                      {showSimPanel && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-1.5 p-2 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-1.5"
                        >
                          <div className="text-[10px] text-slate-400 font-medium px-1">
                            Déclenchez une alerte sonore et un toast temps réel (parents & enseignants) :
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => triggerSimulationNotification('new_grade')}
                              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950/50 border border-cyan-500/20 text-cyan-300 text-[10px] font-semibold text-left transition-colors flex items-center gap-1.5"
                            >
                              <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">Publier Note (Maths)</span>
                            </button>
                            <button
                              onClick={() => triggerSimulationNotification('new_bulletin')}
                              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-950/50 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold text-left transition-colors flex items-center gap-1.5"
                            >
                              <Award className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="truncate">Bulletin T2 Homologué</span>
                            </button>
                            <button
                              onClick={() => triggerSimulationNotification('new_certificate')}
                              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-950/50 border border-amber-500/20 text-amber-300 text-[10px] font-semibold text-left transition-colors flex items-center gap-1.5"
                            >
                              <Award className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">Certificat Proviseur</span>
                            </button>
                            <button
                              onClick={() => triggerSimulationNotification('new_receipt')}
                              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950/50 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold text-left transition-colors flex items-center gap-1.5"
                            >
                              <Receipt className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">Quittance Caisse</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Notifications Scroll List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {displayedNotifications.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-300">Aucune notification</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {notifFilter === 'unread' 
                            ? 'Toutes les alertes ont été consultées.' 
                            : 'Aucune publication dans cette catégorie pour le moment.'}
                        </p>
                      </div>
                    ) : (
                      displayedNotifications.map((n) => {
                        const isGrade = n.type === 'grade';
                        const isCert = n.type === 'certificate';
                        const isFin = n.type === 'finance';
                        const isAbs = n.type === 'absence';

                        let badgeColor = 'bg-blue-500/10 text-blue-300 border-blue-500/20';
                        let typeIcon = <Bell className="w-3.5 h-3.5 text-blue-400" />;
                        if (isGrade) {
                          badgeColor = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
                          typeIcon = <FileText className="w-3.5 h-3.5 text-cyan-400" />;
                        } else if (isCert) {
                          badgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                          typeIcon = <Award className="w-3.5 h-3.5 text-amber-400" />;
                        } else if (isFin) {
                          badgeColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
                          typeIcon = <Receipt className="w-3.5 h-3.5 text-emerald-400" />;
                        } else if (isAbs) {
                          badgeColor = 'bg-violet-500/10 text-violet-300 border-violet-500/20';
                          typeIcon = <CalendarCheck className="w-3.5 h-3.5 text-violet-400" />;
                        }

                        return (
                          <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-xl transition-all border ${
                              n.read 
                                ? 'bg-slate-950/40 border-slate-800/40 text-slate-400' 
                                : 'bg-slate-800/60 border-cyan-500/30 text-slate-200 shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <div className="p-1 rounded-md bg-slate-900 border border-slate-800 shrink-0">
                                  {typeIcon}
                                </div>
                                <span className={`text-xs font-bold truncate ${n.read ? 'text-slate-300' : 'text-white'}`}>
                                  {n.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                )}
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {n.timestamp}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs leading-relaxed text-slate-300 mt-1 pl-6">
                              {n.message}
                            </p>

                            {/* Action & Read buttons */}
                            <div className="mt-2 pl-6 flex items-center justify-between gap-2">
                              {n.action ? (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => {
                                    markNotificationAsRead(n.id);
                                    executeNotificationAction(n.action!);
                                    setShowNotifMenu(false);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all cursor-pointer"
                                >
                                  <span>{n.action.label}</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
                                </motion.button>
                              ) : <span />}

                              {!n.read && (
                                <button
                                  onClick={() => markNotificationAsRead(n.id)}
                                  className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors"
                                >
                                  Marquer comme lu
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Theme Switcher Button (Auto / Clair / Sombre) */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="flex p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800/80 transition-colors shrink-0 cursor-pointer"
            title={`Thème : ${themeMode === 'system' ? `Auto (${theme === 'dark' ? 'Sombre' : 'Clair'})` : theme === 'dark' ? 'Sombre' : 'Clair'} • Cliquer pour basculer`}
            aria-label="Basculer le thème"
          >
            {themeMode === 'system' ? (
              <Laptop className="w-4 h-4 text-cyan-400" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4 text-cyan-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </motion.button>

          {/* Settings Button (Accessible on Mobile, Tablet & Desktop) */}
          <motion.button
            whileTap={{ scale: 0.92, rotate: 20 }}
            onClick={() => setIsSettingsOpen(true)}
            className="flex p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-900 border border-slate-800/80 transition-colors shrink-0"
            title={t('settings')}
            aria-label={t('settings')}
          >
            <Settings className="w-4 h-4" />
          </motion.button>

          {/* User Profile & Direct Logout Button */}
          <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2.5 border-l border-slate-800 shrink-0">
            <button
              onClick={() => openSettingsModal('profile')}
              className="flex items-center gap-1.5 p-0.5 sm:p-1 rounded-xl hover:bg-slate-900 transition-colors text-left"
              title="Mon profil & Paramètres"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover ring-1 ring-cyan-500/30 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-xs ring-1 ring-cyan-500/30 shrink-0">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
              
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[100px] lg:max-w-[130px]">
                  {currentUser?.name || 'Utilisateur'}
                </div>
                <div className="text-[10px] text-cyan-400 capitalize">
                  {t(activeRole as any)}
                </div>
              </div>
            </button>

            {/* Direct Logout Button - High Contrast & Guaranteed Tap Target */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
              title="Se déconnecter (Déconnexion immédiate)"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="hidden sm:inline text-xs font-bold text-rose-300">Quitter</span>
            </motion.button>
          </div>

        </div>

      </div>

      {/* Mobile Collapsible Search Container */}
      <AnimatePresence>
        {isPrivilegedStaff && showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-slate-800 bg-slate-950 p-3 shadow-2xl"
          >
            <GlobalSearch onOpenExportModal={(type, cid) => { openExportModal(type, cid); setShowMobileSearch(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Quick Attendance Modal */}
      <AttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
      />
    </header>
  );
};

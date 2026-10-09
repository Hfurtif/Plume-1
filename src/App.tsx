import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileNavBar } from './components/common/MobileNavBar';
import { LoginView } from './components/auth/LoginView';
import { AccountingDashboard } from './components/accounting/AccountingDashboard';
import { ProviseurView } from './components/proviseur/ProviseurView';
import { AdminView } from './components/administration/AdminView';
import { TeacherView } from './components/teacher/TeacherView';
import { ParentPortalView } from './components/parent/ParentPortalView';
import { OfficialReportCardModal } from './components/bulletin/OfficialReportCardModal';
import { CertificateModal } from './components/proviseur/CertificateModal';
import { PaymentReceiptModal } from './components/accounting/PaymentReceiptModal';
import { UserSettingsModal } from './components/settings/UserSettingsModal';
import { ExportReportModal } from './components/reports/ExportReportModal';
import { GrandAnalyticsDashboard } from './components/analytics/GrandAnalyticsDashboard';
import { NotificationToastContainer } from './components/notifications/NotificationToastContainer';
import { OfflineBanner } from './components/common/OfflineBanner';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { AiDocumentImportModal } from './components/ai/AiDocumentImportModal';
import { AiOnboardingPrompt } from './components/ai/AiOnboardingPrompt';
import { ClassHubView } from './components/classes/ClassHubView';
import { SchoolRegistrationModal } from './components/school/SchoolRegistrationModal';
import { SubscriptionModal } from './components/school/SubscriptionModal';
import { GoogleDriveSyncModal } from './components/school/GoogleDriveSyncModal';

const AppContent: React.FC = () => {
  const { 
    currentUser, 
    activeRole, 
    switchRoleQuick,
    theme,
    students,
    reportCardStudent, 
    setReportCardStudent,
    activeCertificate,
    setActiveCertificate,
    activePaymentReceipt,
    setActivePaymentReceipt,
    isExportModalOpen,
    exportModalType,
    exportModalClassId,
    closeExportModal,
    toggleOfflineSimulation,
    addNotification,
    openSearchModal,
    isSearchModalOpen,
    closeSearchModal,
    isAiImportModalOpen,
    setIsAiImportModalOpen,
    isSubscriptionRestricted,
    setIsSubscriptionModalOpen,
    schoolProfile,
    daysRemaining
  } = useApp();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  // When role changes, set default tab
  React.useEffect(() => {
    if (activeRole === 'comptable') setCurrentTab('dashboard');
    else if (activeRole === 'proviseur') setCurrentTab('dashboard');
    else if (activeRole === 'admin') setCurrentTab('teachers');
    else if (activeRole === 'enseignant') setCurrentTab('grades');
    else if (activeRole === 'parent') setCurrentTab('portal');
  }, [activeRole]);

  // Global Keyboard Shortcuts (Ctrl+N, Ctrl+B, Ctrl+H, ?, etc.)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);

      // Ctrl+N / Cmd+N : Ouvrir la saisie rapide des notes (Espace Enseignant)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (activeRole !== 'enseignant') {
          switchRoleQuick('enseignant');
        }
        setCurrentTab('grades');
        addNotification(
          'Raccourci [Ctrl+N] activé',
          'Accès direct à la grille de saisie des notes (Espace Enseignant).',
          'grade',
          { roleTarget: 'enseignant', showToast: true }
        );
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('plume:focus-grades-input'));
        }, 120);
        return;
      }

      // Ctrl+B / Cmd+B : Ouvrir les bulletins officiels
      if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        const targetStudent = (currentUser?.studentMatricule 
          ? students.find(s => s.matricule === currentUser.studentMatricule) 
          : null) || students[0];

        if (targetStudent) {
          setReportCardStudent(targetStudent);
          addNotification(
            'Raccourci [Ctrl+B] activé',
            `Ouverture du bulletin officiel de ${targetStudent.firstName} ${targetStudent.lastName}.`,
            'system',
            { showToast: true }
          );
        }
        return;
      }

      // Ctrl+K / Cmd+K : Ouvrir la Recherche Globale (Élèves, Classes, Documents)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearchModal();
        return;
      }

      // Ctrl+H / Cmd+H : Basculer le mode Hors-Ligne (simulation)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        toggleOfflineSimulation();
        return;
      }

      // '?' or 'Ctrl+/' : Ouvrir la modale d'aide des raccourcis
      if ((e.key === '?' && !isInput) || (isCmdOrCtrl && (e.key === '/' || e.key === ':'))) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
        return;
      }

      // Escape : Fermer les modales ouvertes
      if (e.key === 'Escape') {
        if (isSearchModalOpen) {
          closeSearchModal();
        }
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeRole, currentUser, students, switchRoleQuick, setReportCardStudent, toggleOfflineSimulation, addNotification, isShortcutsModalOpen, isSearchModalOpen, openSearchModal, closeSearchModal]);

  // If not logged in, show Login Screen with school modals
  if (!currentUser) {
    return (
      <>
        <LoginView />
        <SchoolRegistrationModal />
        <SubscriptionModal />
        <GoogleDriveSyncModal />
      </>
    );
  }

  const renderRoleContent = () => {
    switch (activeRole) {
      case 'comptable':
        return currentTab === 'analytics' ? <GrandAnalyticsDashboard roleVariant="comptable" /> : <AccountingDashboard />;
      case 'proviseur':
        return <ProviseurView currentTab={currentTab} onSelectTab={setCurrentTab} />;
      case 'admin':
        return <AdminView currentTab={currentTab} />;
      case 'enseignant':
        return <TeacherView currentTab={currentTab} onSelectTab={setCurrentTab} />;
      case 'parent':
        return <ParentPortalView currentTab={currentTab} />;
      default:
        return <AccountingDashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100 selection:text-white' : 'bg-slate-50 text-slate-900 selection:text-slate-900'} flex flex-col antialiased selection:bg-cyan-500 transition-colors duration-200 w-full max-w-full overflow-x-hidden relative`}>
      {/* Top Header */}
      <Header 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
      />

      {/* 30-Day Trial Expiration Restriction Banner */}
      {isSubscriptionRestricted && (
        <div className="bg-gradient-to-r from-rose-950 via-red-950 to-rose-950 border-b border-rose-500/40 px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-md w-full max-w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping shrink-0"></span>
            <span className="text-white font-bold shrink-0">Restriction d'accès active :</span>
            <span className="truncate">La période d'essai de 30 jours pour <strong>{schoolProfile?.name}</strong> est terminée.</span>
          </div>
          <button
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md cursor-pointer transition-all shrink-0 text-center"
          >
            Payer l'Abonnement (15 $/mois) pour Débloquer
          </button>
        </div>
      )}

      {/* Offline Mode Banner */}
      <OfflineBanner />

      <div className="flex-1 flex">
        {/* Navigation Sidebar */}
        <Sidebar 
          currentTab={currentTab} 
          onSelectTab={setCurrentTab} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area with Animated Page Transition */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 pb-20 lg:pb-8 overflow-x-hidden w-full max-w-full">
          <div className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeRole}-${currentTab}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {renderRoleContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavBar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        onOpenMenu={() => setIsSidebarOpen(true)}
      />

      {/* Global Real-Time Toaster */}
      <NotificationToastContainer />

      {/* Global Document & Settings Modals */}
      <OfficialReportCardModal 
        student={reportCardStudent} 
        onClose={() => setReportCardStudent(null)} 
      />

      <CertificateModal 
        certificate={activeCertificate} 
        onClose={() => setActiveCertificate(null)} 
      />

      <PaymentReceiptModal 
        payment={activePaymentReceipt} 
        onClose={() => setActivePaymentReceipt(null)} 
      />

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={closeExportModal}
        defaultReportType={exportModalType}
        defaultClassId={exportModalClassId}
      />

      <UserSettingsModal />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onTriggerGradeEntry={() => {
          if (activeRole !== 'enseignant') switchRoleQuick('enseignant');
          setCurrentTab('grades');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('plume:focus-grades-input'));
          }, 120);
        }}
        onTriggerReportCard={() => {
          const s = (currentUser?.studentMatricule 
            ? students.find(std => std.matricule === currentUser.studentMatricule) 
            : null) || students[0];
          if (s) setReportCardStudent(s);
        }}
        onTriggerSearch={() => {
          openSearchModal();
        }}
        onToggleOffline={toggleOfflineSimulation}
      />

      {/* Global Spotlight Search Modal (accessible via Ctrl+K / Cmd+K) */}
      <GlobalSearchModal />

      {/* AI Document Import Modal */}
      <AiDocumentImportModal
        isOpen={isAiImportModalOpen}
        onClose={() => setIsAiImportModalOpen(false)}
      />

      {/* School Registration Modal (New School Signup & Signatories) */}
      <SchoolRegistrationModal />

      {/* School Subscription Modal (30-day Trial & 15$/month) */}
      <SubscriptionModal />

      {/* Google Drive & Cloud Database Synchronization Modal */}
      <GoogleDriveSyncModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

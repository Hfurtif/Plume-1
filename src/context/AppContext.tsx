import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  UserRole, 
  Language, 
  UserAccount, 
  SchoolClass, 
  Student, 
  Subject,
  Grade, 
  PaymentRecord, 
  OfficialCertificate, 
  AttendanceRecord,
  AttendanceStatus,
  AppNotification,
  NotificationAction,
  OfflineCacheData,
  OfflineCacheStatus,
  AcademicYearArchive,
  CahierDeTextesEntry,
  ParentMessage,
  CertificateRequest,
  AiImportResult,
  SchoolProfile,
  SchoolSubscription,
  SchoolSignatories
} from '../types';
import { translations, TranslationKey } from '../i18n/translations';
import { 
  INITIAL_CLASSES, 
  INITIAL_USERS, 
  INITIAL_STUDENTS, 
  INITIAL_SUBJECTS,
  INITIAL_GRADES, 
  INITIAL_PAYMENTS, 
  INITIAL_CERTIFICATES, 
  INITIAL_ATTENDANCE,
  INITIAL_NOTIFICATIONS,
  INITIAL_CAHIER_DE_TEXTES,
  INITIAL_PARENT_MESSAGES,
  INITIAL_CERTIFICATE_REQUESTS,
  INITIAL_SCHOOL_PROFILE,
  SUPPORTED_COUNTRIES
} from '../data/mockData';

export type ThemeMode = 'system' | 'dark' | 'light';

interface AppContextType {
  currentUser: UserAccount | null;
  activeRole: UserRole;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'dark' | 'light';
  themeMode: ThemeMode;
  systemPreference: 'dark' | 'light';
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  t: (key: TranslationKey) => string;
  login: (role: UserRole, userOverride?: UserAccount) => void;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => void;
  
  // Classes
  classes: SchoolClass[];
  addClass: (cls: Omit<SchoolClass, 'id'>) => SchoolClass;
  updateClass: (id: string, updates: Partial<SchoolClass>) => void;
  deleteClass: (id: string) => void;

  // Subjects (Matières)
  subjects: Subject[];
  addSubject: (subjectData: Omit<Subject, 'id'>) => Subject;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  toggleSubjectStatus: (id: string) => void;
  
  // Students
  students: Student[];
  addStudent: (std: Omit<Student, 'id' | 'matricule' | 'paymentStatus' | 'paidTuition'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  
  // Users
  users: UserAccount[];
  addUser: (userData: Omit<UserAccount, 'id' | 'createdAt'>) => UserAccount;
  deleteUser: (id: string) => void;
  
  // Grades
  grades: Grade[];
  saveGrade: (gradeData: Omit<Grade, 'id'> & { id?: string }) => Grade;
  lockAssessmentGrades: (assessmentName: string, subjectId: string, classId: string) => void;
  overrideGradeAdmin: (gradeId: string, newScore: number, adminReason: string) => void;
  deleteGrade: (gradeId: string) => void;
  
  // Payments
  payments: PaymentRecord[];
  recordPayment: (payment: Omit<PaymentRecord, 'id' | 'receiptNumber' | 'recordedBy'>) => PaymentRecord;
  
  // Attendance
  attendance: AttendanceRecord[];
  recordAttendance: (att: Omit<AttendanceRecord, 'id' | 'recordedBy'>) => AttendanceRecord;
  recordBatchAttendance: (records: Omit<AttendanceRecord, 'id' | 'recordedBy'>[]) => void;
  justifyAbsence: (attendanceId: string, reason: string, documentName?: string) => void;
  updateAttendanceStatus: (attendanceId: string, status: AttendanceStatus, isJustified: boolean, reason?: string) => void;
  
  // Certificates (Proviseur exclusive)
  certificates: OfficialCertificate[];
  issueCertificate: (data: { studentId: string; type: 'scolarite' | 'notes'; purpose: string }) => OfficialCertificate;
  
  // Real-Time Notifications & Toasts
  notifications: AppNotification[];
  filteredNotifications: AppNotification[];
  unreadCount: number;
  toasts: AppNotification[];
  dismissToast: (id: string) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (
    title: string, 
    message: string, 
    type?: AppNotification['type'],
    options?: {
      roleTarget?: UserRole | 'all' | UserRole[];
      targetStudentId?: string;
      targetStudentMatricule?: string;
      action?: NotificationAction;
      showToast?: boolean;
    }
  ) => void;
  executeNotificationAction: (action: NotificationAction) => void;
  triggerSimulationNotification: (scenario: 'new_grade' | 'new_certificate' | 'new_bulletin' | 'new_receipt') => void;
  publishClassReportCards: (classId: string, term?: 'T1' | 'T2' | 'T3') => void;
  
  // Modals & Viewers
  reportCardStudent: Student | null;
  setReportCardStudent: (student: Student | null) => void;
  activeCertificate: OfficialCertificate | null;
  setActiveCertificate: (cert: OfficialCertificate | null) => void;
  activePaymentReceipt: PaymentRecord | null;
  setActivePaymentReceipt: (payment: PaymentRecord | null) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  settingsActiveTab: 'profile' | 'googledrive' | 'reset';
  setSettingsActiveTab: (tab: 'profile' | 'googledrive' | 'reset') => void;
  openSettingsModal: (tab?: 'profile' | 'googledrive' | 'reset') => void;

  // Export Modal
  isExportModalOpen: boolean;
  exportModalType: 'students' | 'grades' | 'attendance' | 'payments' | 'classes';
  exportModalClassId?: string;
  openExportModal: (type?: 'students' | 'grades' | 'attendance' | 'payments' | 'classes', classId?: string) => void;
  closeExportModal: () => void;

  // Global Search Modal (Ctrl+K / Cmd+K)
  isSearchModalOpen: boolean;
  openSearchModal: (initialCategory?: 'all' | 'students' | 'classes' | 'documents' | 'staff') => void;
  closeSearchModal: () => void;
  searchModalCategory: 'all' | 'students' | 'classes' | 'documents' | 'staff';

  // Offline & Local Cache (Consultation notes, bulletins)
  isOnline: boolean;
  isOfflineSimulated: boolean;
  isEffectivelyOffline: boolean;
  offlineCacheStatus: OfflineCacheStatus;
  toggleOfflineSimulation: () => void;
  syncOfflineCache: () => void;
  clearOfflineCache: () => void;
  getOfflineCachedReportCard: (studentId: string, term?: 'T1' | 'T2' | 'T3') => {
    student: Student;
    grades: Grade[];
    subjects: Subject[];
    schoolClass?: SchoolClass;
    isFromOfflineCache: boolean;
    cachedAt: string;
  } | null;

  // Academic Year Archives & Full Reset (Proviseur Exclusive)
  academicArchives: AcademicYearArchive[];
  activeAcademicYear: string;
  setActiveAcademicYear: (year: string) => void;
  archiveCurrentAcademicYear: (yearName?: string, notes?: string, startNewYear?: boolean) => AcademicYearArchive;
  restoreAcademicArchive: (archiveId: string) => void;
  deleteAcademicArchive: (archiveId: string) => void;
  resetAllDataToFactoryDefaults: (options?: { preserveStructure?: boolean; clearArchives?: boolean }) => void;
  resetForNewUse: (mode?: 'new_school_year' | 'empty_school' | 'factory_demo') => void;
  exportArchiveJson: (archive: AcademicYearArchive) => void;

  // Cahier de Textes & Bloc-notes
  cahierDeTextes: CahierDeTextesEntry[];
  addCahierEntry: (entry: Omit<CahierDeTextesEntry, 'id'>) => CahierDeTextesEntry;
  deleteCahierEntry: (id: string) => void;

  // In-App Messages & Alerts for Parents
  parentMessages: ParentMessage[];
  sendParentMessage: (msg: Omit<ParentMessage, 'id' | 'date' | 'read'>) => void;
  markParentMessageAsRead: (id: string) => void;

  // Certificate Requests from Parents
  certificateRequests: CertificateRequest[];
  requestCertificate: (data: Omit<CertificateRequest, 'id' | 'date' | 'status'>) => CertificateRequest;
  processCertificateRequest: (requestId: string, status: 'approved' | 'rejected') => void;

  // Multi-Child Management for Parents
  selectedChildMatricule: string | null;
  setSelectedChildMatricule: (matricule: string) => void;
  addChildMatriculeToParent: (matricule: string) => { success: boolean; student?: Student; error?: string };
  removeChildMatriculeFromParent: (matricule: string) => void;

  // New Dedicated Logins
  loginAsParent: (phone: string, matricules: string[], parentName?: string) => { success: boolean; error?: string };
  loginAsTeacher: (phone: string, school: string, identifier: string, country?: string) => { success: boolean; error?: string };

  // AI Document Import & Onboarding
  isAiImportModalOpen: boolean;
  setIsAiImportModalOpen: (open: boolean) => void;
  hasDismissedOnboarding: boolean;
  dismissOnboarding: () => void;
  importAiSchoolData: (payload: AiImportResult) => {
    classesAdded: number;
    studentsAdded: number;
    gradesAdded: number;
    paymentsAdded: number;
    attendanceAdded: number;
    summary: string;
  };

  // Class Hub Selection State
  selectedClassHubId: string;
  setSelectedClassHubId: (classId: string) => void;

  // School Profile, Signatories & Institution Registry
  schoolProfile: SchoolProfile;
  registeredSchools: SchoolProfile[];
  updateSchoolProfile: (updates: Partial<SchoolProfile>) => void;
  registerNewSchool: (newSchoolData: Partial<SchoolProfile>) => { success: boolean; school: SchoolProfile };

  // Subscription Management (30-day Trial & 15$/month)
  isSubscriptionRestricted: boolean;
  daysRemaining: number;
  paySchoolSubscription: (paymentDetails: { method: string; reference?: string; payerName?: string }) => { success: boolean; receiptNumber: string };
  simulateSubscriptionDaysRemaining: (days: number) => void;
  resetTrialPeriod: () => void;

  // Cloud Database & Google Drive Synchronization
  isGoogleDriveSyncModalOpen: boolean;
  setIsGoogleDriveSyncModalOpen: (open: boolean) => void;
  syncToGoogleDrive: () => Promise<{ success: boolean; message: string; timestamp: string }>;
  downloadDatabaseBackup: () => void;
  restoreDatabaseFromJson: (jsonString: string) => { success: boolean; message: string };

  // School Registration & Subscription Modals
  isSchoolRegisterModalOpen: boolean;
  setIsSchoolRegisterModalOpen: (open: boolean) => void;
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Persistence helpers
  const getSaved = <T,>(key: string, defaultVal: T): T => {
    try {
      const saved = localStorage.getItem(`plume_${key}`);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [language, setLanguageState] = useState<Language>(() => getSaved('lang', 'fr'));
  
  // Theme state: system, dark, or light
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getSaved('theme_mode', 'system'));
  const [systemPreference, setSystemPreference] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Derived effective active theme
  const theme: 'dark' | 'light' = themeMode === 'system' ? systemPreference : themeMode;

  // Listen to OS / Browser system theme preference changes dynamically
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updatePref = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    updatePref(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updatePref);
      return () => mediaQuery.removeEventListener('change', updatePref);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(updatePref);
      return () => (mediaQuery as any).removeListener(updatePref);
    }
  }, []);
  
  const [users, setUsers] = useState<UserAccount[]>(() => getSaved('users', INITIAL_USERS));
  const [activeRole, setActiveRole] = useState<UserRole>(() => getSaved('activeRole', 'admin'));
  
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const savedUser = getSaved<UserAccount | null>('currentUser', null);
    if (savedUser) return savedUser;
    return INITIAL_USERS.find(u => u.role === 'admin') || INITIAL_USERS[0];
  });

  const [classes, setClasses] = useState<SchoolClass[]>(() => getSaved('classes', INITIAL_CLASSES));
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = getSaved<Subject[]>('subjects', INITIAL_SUBJECTS);
    return saved.map(s => ({
      ...s,
      isActive: s.isActive !== undefined ? s.isActive : true
    }));
  });
  const [students, setStudents] = useState<Student[]>(() => getSaved('students', INITIAL_STUDENTS));
  const [grades, setGrades] = useState<Grade[]>(() => getSaved('grades', INITIAL_GRADES));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => getSaved('payments', INITIAL_PAYMENTS));
  const [certificates, setCertificates] = useState<OfficialCertificate[]>(() => getSaved('certificates', INITIAL_CERTIFICATES));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => getSaved('attendance', INITIAL_ATTENDANCE));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getSaved('notifs', INITIAL_NOTIFICATIONS));
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>(() => getSaved('academic_year', '2025 - 2026'));
  const [academicArchives, setAcademicArchives] = useState<AcademicYearArchive[]>(() => getSaved('academic_archives', [
    {
      id: 'arch-2024-2025',
      academicYear: '2024 - 2025',
      archivedAt: '2025-07-15T10:00:00.000Z',
      archivedBy: 'Dr. Marc-Aurèle Valmont (Proviseur)',
      notes: 'Clôture et certification officielle de fin d\'année 2024 - 2025. Tous les relevés d\'examens scellés avec succès.',
      stats: {
        studentsCount: 8,
        classesCount: 5,
        subjectsCount: 8,
        gradesCount: 42,
        paymentsTotal: 4850000,
        certificatesCount: 12,
        attendanceCount: 68
      },
      data: {
        students: INITIAL_STUDENTS,
        classes: INITIAL_CLASSES,
        subjects: INITIAL_SUBJECTS,
        grades: INITIAL_GRADES,
        payments: INITIAL_PAYMENTS,
        certificates: INITIAL_CERTIFICATES,
        attendance: INITIAL_ATTENDANCE
      }
    }
  ]));

  // Cahier de Textes, Messages & Demandes de Certificats
  const [cahierDeTextes, setCahierDeTextes] = useState<CahierDeTextesEntry[]>(() => getSaved('cahier_textes', INITIAL_CAHIER_DE_TEXTES));
  const [parentMessages, setParentMessages] = useState<ParentMessage[]>(() => getSaved('parent_messages', INITIAL_PARENT_MESSAGES));
  const [certificateRequests, setCertificateRequests] = useState<CertificateRequest[]>(() => getSaved('cert_requests', INITIAL_CERTIFICATE_REQUESTS));
  const [selectedChildMatricule, setSelectedChildMatricule] = useState<string | null>(() => getSaved('selected_child_matricule', 'PLM-2025-001'));

  // Modal view states
  const [reportCardStudent, setReportCardStudent] = useState<Student | null>(null);
  const [activeCertificate, setActiveCertificate] = useState<OfficialCertificate | null>(null);
  const [activePaymentReceipt, setActivePaymentReceipt] = useState<PaymentRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'profile' | 'googledrive' | 'reset'>('profile');

  const openSettingsModal = (tab: 'profile' | 'googledrive' | 'reset' = 'profile') => {
    setSettingsActiveTab(tab);
    setIsSettingsOpen(true);
  };

  // Export Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportModalType, setExportModalType] = useState<'students' | 'grades' | 'attendance' | 'payments' | 'classes'>('students');
  const [exportModalClassId, setExportModalClassId] = useState<string | undefined>(undefined);

  const openExportModal = (type: 'students' | 'grades' | 'attendance' | 'payments' | 'classes' = 'students', classId?: string) => {
    setExportModalType(type);
    setExportModalClassId(classId);
    setIsExportModalOpen(true);
  };

  const closeExportModal = () => {
    setIsExportModalOpen(false);
  };

  // Global Search Modal State (Spotlight / Cmd+K)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [searchModalCategory, setSearchModalCategory] = useState<'all' | 'students' | 'classes' | 'documents' | 'staff'>('all');

  const openSearchModal = (initialCategory: 'all' | 'students' | 'classes' | 'documents' | 'staff' = 'all') => {
    setSearchModalCategory(initialCategory);
    setIsSearchModalOpen(true);
  };

  const closeSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  // AI Document Import & Onboarding State
  const [isAiImportModalOpen, setIsAiImportModalOpen] = useState<boolean>(false);
  const [hasDismissedOnboarding, setHasDismissedOnboarding] = useState<boolean>(() => getSaved('hasDismissedOnboarding', false));
  const dismissOnboarding = () => {
    setHasDismissedOnboarding(true);
    localStorage.setItem('plume_hasDismissedOnboarding', JSON.stringify(true));
  };

  // Class Hub Selection State
  const [selectedClassHubId, setSelectedClassHubId] = useState<string>(() => {
    const saved = getSaved<string>('selectedClassHubId', '');
    return saved || 'cls-tc';
  });
  useEffect(() => {
    if (selectedClassHubId) {
      localStorage.setItem('plume_selectedClassHubId', JSON.stringify(selectedClassHubId));
    }
  }, [selectedClassHubId]);

  // School Profile & Multi-School Registry State
  const [schoolProfile, setSchoolProfileState] = useState<SchoolProfile>(() => getSaved('school_profile', INITIAL_SCHOOL_PROFILE));
  const [registeredSchools, setRegisteredSchools] = useState<SchoolProfile[]>(() => getSaved('registered_schools', [INITIAL_SCHOOL_PROFILE]));

  // Subscription & Trial Period Management (30-day Free Trial & 15$/month)
  const daysRemaining = useMemo(() => {
    if (schoolProfile.subscription.status === 'active') return 30; // Paid subscription active
    const end = new Date(schoolProfile.subscription.trialEndDate).getTime();
    const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [schoolProfile.subscription.status, schoolProfile.subscription.trialEndDate]);

  const isSubscriptionRestricted = useMemo(() => {
    if (schoolProfile.subscription.status === 'active') return false;
    return daysRemaining <= 0 || schoolProfile.subscription.isExpired || schoolProfile.subscription.status === 'trial_expired';
  }, [schoolProfile.subscription.status, schoolProfile.subscription.isExpired, daysRemaining]);

  // School Modals: Registration, Subscription & Google Drive Sync
  const [isSchoolRegisterModalOpen, setIsSchoolRegisterModalOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isGoogleDriveSyncModalOpen, setIsGoogleDriveSyncModalOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => { localStorage.setItem('plume_lang', JSON.stringify(language)); }, [language]);
  useEffect(() => { localStorage.setItem('plume_theme_mode', JSON.stringify(themeMode)); }, [themeMode]);
  useEffect(() => { localStorage.setItem('plume_theme', JSON.stringify(theme)); }, [theme]);
  useEffect(() => { localStorage.setItem('plume_activeRole', JSON.stringify(activeRole)); }, [activeRole]);
  useEffect(() => { localStorage.setItem('plume_currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('plume_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('plume_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('plume_subjects', JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('plume_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('plume_grades', JSON.stringify(grades)); }, [grades]);
  useEffect(() => { localStorage.setItem('plume_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('plume_certificates', JSON.stringify(certificates)); }, [certificates]);
  useEffect(() => { localStorage.setItem('plume_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('plume_notifs', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('plume_academic_year', JSON.stringify(activeAcademicYear)); }, [activeAcademicYear]);
  useEffect(() => { localStorage.setItem('plume_academic_archives', JSON.stringify(academicArchives)); }, [academicArchives]);
  useEffect(() => { localStorage.setItem('plume_cahier_textes', JSON.stringify(cahierDeTextes)); }, [cahierDeTextes]);
  useEffect(() => { localStorage.setItem('plume_parent_messages', JSON.stringify(parentMessages)); }, [parentMessages]);
  useEffect(() => { localStorage.setItem('plume_cert_requests', JSON.stringify(certificateRequests)); }, [certificateRequests]);
  useEffect(() => { localStorage.setItem('plume_selected_child_matricule', JSON.stringify(selectedChildMatricule)); }, [selectedChildMatricule]);
  useEffect(() => { localStorage.setItem('plume_school_profile', JSON.stringify(schoolProfile)); }, [schoolProfile]);
  useEffect(() => { localStorage.setItem('plume_registered_schools', JSON.stringify(registeredSchools)); }, [registeredSchools]);

  // Synchronize active theme with document root & localStorage
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      if (body) {
        body.classList.add('dark');
        body.classList.remove('light');
      }
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      if (body) {
        body.classList.add('light');
        body.classList.remove('dark');
      }
    }

    try {
      localStorage.setItem('plume_theme', JSON.stringify(theme));
      localStorage.setItem('plume_theme_mode', JSON.stringify(themeMode));
    } catch {
      // ignore
    }
  }, [theme, themeMode]);

  // One-time automatic reset for fresh use request ("renisialise pour une nouvelle utilisation")
  useEffect(() => {
    try {
      const isResetDone = localStorage.getItem('plume_reset_fresh_use_v3');
      if (!isResetDone) {
        localStorage.setItem('plume_reset_fresh_use_v3', 'true');
        // Clear all demo/test operational transaction data
        setGrades([]);
        setAttendance([]);
        setPayments([]);
        setCertificates([]);
        setCahierDeTextes([]);
        setParentMessages([]);
        setCertificateRequests([]);
        // Reset tuition fees to unpaid
        setStudents(prev => prev.map(s => ({
          ...s,
          paidTuition: 0,
          paymentStatus: 'unpaid' as const
        })));
        setActiveAcademicYear('2025 - 2026');
        // Clear offline cache
        localStorage.removeItem('plume_offline_cache_v2');
        // Fresh start notification
        setNotifications([
          {
            id: `notif-reset-${Date.now()}`,
            title: '🎒 Application Réinitialisée pour une Nouvelle Utilisation',
            message: 'Toutes les notes, absences, quittances et documents antérieurs ont été remis à zéro. Votre établissement est prêt pour la nouvelle rentrée scolaire.',
            type: 'system',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            read: false,
            roleTarget: 'all'
          }
        ]);
      }
    } catch {
      // ignore
    }
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('plume_theme_mode', JSON.stringify(mode));
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    if (themeMode === 'system') {
      setThemeMode(theme === 'dark' ? 'light' : 'dark');
    } else if (themeMode === 'dark') {
      setThemeMode('light');
    } else {
      setThemeMode('system');
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.fr[key] || key;
  };

  // Real-time Notification Sound & Toasts State
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => getSaved('soundEnabled', true));
  useEffect(() => { localStorage.setItem('plume_soundEnabled', JSON.stringify(soundEnabled)); }, [soundEnabled]);
  const toggleSound = () => setSoundEnabled(prev => !prev);
  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // Synthesize soft, non-intrusive harmonic notification chime (no external audio files required)
  const playNotificationChime = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now); // F5
      gain1.gain.setValueAtTime(0.07, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.32);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, now + 0.08); // C6
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.55);
    } catch {
      // Audio context may be restricted by browser until first user gesture
    }
  };

  // Real-Time Notification Publisher
  const addNotification = (
    title: string, 
    message: string, 
    type: AppNotification['type'] = 'system',
    options?: {
      roleTarget?: UserRole | 'all' | UserRole[];
      targetStudentId?: string;
      targetStudentMatricule?: string;
      action?: NotificationAction;
      showToast?: boolean;
    }
  ) => {
    const roleTarget = options?.roleTarget ?? 'all';
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      timestamp: 'À l\'instant',
      read: false,
      roleTarget,
      targetStudentId: options?.targetStudentId,
      targetStudentMatricule: options?.targetStudentMatricule,
      type,
      action: options?.action
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Check if notification applies to active user
    const isTargetForUser = 
      roleTarget === 'all' || 
      roleTarget === activeRole || 
      (Array.isArray(roleTarget) && roleTarget.includes(activeRole));

    const matchesStudent = 
      activeRole !== 'parent' || 
      !options?.targetStudentMatricule || 
      !currentUser?.studentMatricule || 
      options.targetStudentMatricule === currentUser.studentMatricule;

    if (options?.showToast !== false && isTargetForUser && matchesStudent) {
      if (soundEnabled) {
        playNotificationChime();
      }
      setToasts(prev => [newNotif, ...prev.slice(0, 3)]);

      // Auto-dismiss toast after 6.5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newNotif.id));
      }, 6500);
    }
  };

  // Filtered notifications tailored to current role and student
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchRole = 
        !n.roleTarget || 
        n.roleTarget === 'all' || 
        n.roleTarget === activeRole || 
        (Array.isArray(n.roleTarget) && n.roleTarget.includes(activeRole));
      
      const matchStudent = 
        activeRole !== 'parent' || 
        !n.targetStudentMatricule || 
        !currentUser?.studentMatricule || 
        n.targetStudentMatricule === currentUser.studentMatricule;

      return matchRole && matchStudent;
    });
  }, [notifications, activeRole, currentUser]);

  const unreadCount = useMemo(() => {
    return filteredNotifications.filter(n => !n.read).length;
  }, [filteredNotifications]);

  const executeNotificationAction = (action: NotificationAction) => {
    switch (action.type) {
      case 'openReportCard': {
        const student = (action.targetId ? students.find(s => s.id === action.targetId) : null)
          || (action.targetMatricule ? students.find(s => s.matricule === action.targetMatricule) : null)
          || (currentUser?.studentMatricule ? students.find(s => s.matricule === currentUser.studentMatricule) : null)
          || students[0];
        if (student) setReportCardStudent(student);
        break;
      }
      case 'openCertificate': {
        const cert = (action.targetId ? certificates.find(c => c.id === action.targetId) : null)
          || certificates[0];
        if (cert) setActiveCertificate(cert);
        break;
      }
      case 'openReceipt': {
        const payment = (action.targetId ? payments.find(p => p.id === action.targetId) : null)
          || payments[0];
        if (payment) setActivePaymentReceipt(payment);
        break;
      }
      case 'viewGrades': {
        if (activeRole !== 'enseignant') switchRoleQuick('enseignant');
        break;
      }
      case 'switchRole': {
        if (action.targetRole) switchRoleQuick(action.targetRole);
        break;
      }
      default:
        break;
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const publishClassReportCards = (classId: string, term: 'T1' | 'T2' | 'T3' = 'T2') => {
    const cls = classes.find(c => c.id === classId);
    const className = cls?.name || 'la classe';
    addNotification(
      `Publication des Bulletins Officiels • ${className}`,
      `Les bulletins officiels du ${term === 'T1' ? '1er' : term === 'T2' ? '2ème' : '3ème'} Trimestre ont été homologués par la Direction. Le document PDF est disponible au téléchargement.`,
      'grade',
      {
        roleTarget: ['parent', 'enseignant', 'admin'],
        action: { label: 'Télécharger le bulletin', type: 'openReportCard' }
      }
    );
  };

  const triggerSimulationNotification = (scenario: 'new_grade' | 'new_certificate' | 'new_bulletin' | 'new_receipt') => {
    if (scenario === 'new_grade') {
      addNotification(
        'Publication de notes • Mathématiques (DS N°2)',
        'M. Patrick Mbarga a validé et scellé les notes de Mathématiques (Terminale C). Moyenne générale : 14.8/20. Consultez votre bulletin.',
        'grade',
        {
          roleTarget: ['parent', 'enseignant', 'admin', 'proviseur'],
          targetStudentMatricule: 'PLM-2025-001',
          action: { label: 'Consulter les notes', type: 'openReportCard', targetMatricule: 'PLM-2025-001' }
        }
      );
    } else if (scenario === 'new_certificate') {
      const latestCert = certificates[0];
      addNotification(
        'Acte officiel délivré • Proviseur',
        `Le Proviseur Dr. Marc-Aurèle Valmont a signé le Certificat Officiel N° ${latestCert?.certificateNumber || 'CS-PLM-2026-0042'}. Téléchargement disponible.`,
        'certificate',
        {
          roleTarget: ['parent', 'admin', 'enseignant'],
          targetStudentMatricule: 'PLM-2025-001',
          action: { label: 'Ouvrir le certificat', type: 'openCertificate', targetId: latestCert?.id }
        }
      );
    } else if (scenario === 'new_bulletin') {
      addNotification(
        'Bulletins Officiels Disponibles • Trimestre 2',
        'Le Conseil de Classe a homologué les bulletins du 2ème Trimestre. Le document officiel scellé est consultable en ligne.',
        'grade',
        {
          roleTarget: ['parent', 'enseignant', 'admin'],
          targetStudentMatricule: 'PLM-2025-001',
          action: { label: 'Télécharger le bulletin (PDF)', type: 'openReportCard', targetMatricule: 'PLM-2025-001' }
        }
      );
    } else if (scenario === 'new_receipt') {
      const latestPay = payments[0];
      addNotification(
        'Quittance officielle de caisse émise',
        `Versement de ${latestPay?.amount.toLocaleString() || '350 000'} FCFA validé. Reçu officiel ${latestPay?.receiptNumber || 'REC-2025-0104'} émis par l'Intendance.`,
        'finance',
        {
          roleTarget: ['parent', 'comptable'],
          targetStudentMatricule: 'PLM-2025-001',
          action: { label: 'Voir la quittance', type: 'openReceipt', targetId: latestPay?.id }
        }
      );
    }
  };

  const login = (role: UserRole, userOverride?: UserAccount) => {
    setActiveRole(role);
    if (userOverride) {
      setCurrentUser(userOverride);
    } else {
      const match = users.find(u => u.role === role);
      if (match) {
        setCurrentUser(match);
      } else {
        const fallback = INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
        setCurrentUser(fallback);
      }
    }
    addNotification('Connexion réussie', `Vous êtes connecté en tant que ${t(role)}`);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRoleQuick = (role: UserRole) => {
    login(role);
  };

  // Specialized Parent Authentication & Account Creation
  const loginAsParent = (phone: string, matricules: string[], parentName?: string): { success: boolean; error?: string } => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return { success: false, error: 'Veuillez saisir votre numéro de téléphone.' };
    }

    const cleanMatricules = matricules.map(m => m.trim().toUpperCase()).filter(Boolean);
    if (cleanMatricules.length === 0) {
      return { success: false, error: 'Veuillez renseigner au moins un matricule d\'élève.' };
    }

    // Check if at least one matricule matches an existing student
    const matchedStudents = students.filter(s => cleanMatricules.includes(s.matricule));
    if (matchedStudents.length === 0) {
      return { 
        success: false, 
        error: `Aucun élève trouvé avec les matricules fournis (${cleanMatricules.join(', ')}). Vérifiez le matricule sur le badge ou le certificat.` 
      };
    }

    // Try finding existing parent account by phone or username
    const existingParent = users.find(u => u.role === 'parent' && (u.phone === cleanPhone || u.username === `parent_${cleanPhone.replace(/\D/g, '')}`));

    const effectiveName = parentName || matchedStudents[0]?.guardianName || 'Parent d\'élève';
    const primaryMatricule = cleanMatricules[0];

    const parentUser: UserAccount = existingParent ? {
      ...existingParent,
      name: effectiveName,
      phone: cleanPhone,
      studentMatricule: primaryMatricule,
      childrenMatricules: Array.from(new Set([...(existingParent.childrenMatricules || []), ...cleanMatricules]))
    } : {
      id: `usr-parent-${Date.now().toString(36)}`,
      username: `parent_${cleanPhone.replace(/\D/g, '') || Date.now().toString(36)}`,
      name: effectiveName,
      email: `${cleanPhone.replace(/\D/g, '')}@parent.plume-school.org`,
      role: 'parent',
      phone: cleanPhone,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      studentMatricule: primaryMatricule,
      childrenMatricules: cleanMatricules,
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (existingParent) {
      setUsers(prev => prev.map(u => u.id === parentUser.id ? parentUser : u));
    } else {
      setUsers(prev => [parentUser, ...prev]);
    }

    setActiveRole('parent');
    setCurrentUser(parentUser);
    setSelectedChildMatricule(primaryMatricule);

    addNotification(
      'Connexion Parent Réussie',
      `Bienvenue ${parentUser.name}. Vous avez accès aux dossiers de ${cleanMatricules.length} enfant(s).`,
      'general',
      { showToast: true }
    );

    return { success: true };
  };

  // Specialized Teacher Authentication
  const loginAsTeacher = (phone: string, school: string, identifier: string, country?: string): { success: boolean; error?: string } => {
    const cleanPhone = phone.trim();
    const cleanSchool = school.trim();
    const cleanIdentifier = identifier.trim();
    const cleanCountry = (country || schoolProfile.country || 'Bénin').trim();

    if (!cleanPhone || !cleanSchool || !cleanIdentifier) {
      return { success: false, error: 'Veuillez remplir votre téléphone, établissement et identifiant.' };
    }

    // Look for matching teacher in existing users
    const matchedTeacher = users.find(u => 
      u.role === 'enseignant' && (
        u.teacherIdentifier?.toLowerCase() === cleanIdentifier.toLowerCase() ||
        u.username?.toLowerCase() === cleanIdentifier.toLowerCase() ||
        u.phone === cleanPhone
      )
    );

    const teacherUser: UserAccount = matchedTeacher ? {
      ...matchedTeacher,
      phone: cleanPhone,
      school: cleanSchool,
      country: cleanCountry,
      teacherIdentifier: cleanIdentifier
    } : {
      id: `usr-prof-${Date.now().toString(36)}`,
      username: cleanIdentifier.toLowerCase().replace(/\s+/g, '.'),
      name: `Prof. ${cleanIdentifier.toUpperCase()}`,
      email: `${cleanIdentifier.toLowerCase().replace(/\s+/g, '.')}@plume-school.org`,
      role: 'enseignant',
      phone: cleanPhone,
      school: cleanSchool,
      country: cleanCountry,
      teacherIdentifier: cleanIdentifier,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
      assignedSubjects: ['sub-math', 'sub-phy'],
      assignedClasses: ['cls-tc', 'cls-td'],
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (matchedTeacher) {
      setUsers(prev => prev.map(u => u.id === teacherUser.id ? teacherUser : u));
    } else {
      setUsers(prev => [teacherUser, ...prev]);
    }

    setActiveRole('enseignant');
    setCurrentUser(teacherUser);

    addNotification(
      'Connexion Enseignant Réussie',
      `Bienvenue ${teacherUser.name} (${cleanSchool} - ${cleanCountry}). Espace pédagogique activé.`,
      'general',
      { showToast: true }
    );

    return { success: true };
  };

  // Add child matricule to currently logged in parent
  const addChildMatriculeToParent = (matricule: string): { success: boolean; student?: Student; error?: string } => {
    const cleanMatricule = matricule.trim().toUpperCase();
    if (!cleanMatricule) {
      return { success: false, error: 'Veuillez saisir un matricule valide.' };
    }

    const matchedStudent = students.find(s => s.matricule.toUpperCase() === cleanMatricule);
    if (!matchedStudent) {
      return { success: false, error: `Aucun élève trouvé avec le matricule "${cleanMatricule}".` };
    }

    if (currentUser && currentUser.role === 'parent') {
      const currentList = currentUser.childrenMatricules || (currentUser.studentMatricule ? [currentUser.studentMatricule] : []);
      if (!currentList.includes(cleanMatricule)) {
        const updatedList = [...currentList, cleanMatricule];
        const updatedUser: UserAccount = {
          ...currentUser,
          childrenMatricules: updatedList,
          studentMatricule: currentUser.studentMatricule || cleanMatricule
        };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
      setSelectedChildMatricule(cleanMatricule);
    }

    addNotification(
      'Enfant rattaché avec succès',
      `Le dossier de ${matchedStudent.firstName} ${matchedStudent.lastName} (${matchedStudent.matricule}) est désormais accessible.`,
      'general',
      { showToast: true }
    );

    return { success: true, student: matchedStudent };
  };

  const removeChildMatriculeFromParent = (matricule: string) => {
    if (!currentUser || currentUser.role !== 'parent') return;
    const currentList = currentUser.childrenMatricules || [];
    const updatedList = currentList.filter(m => m !== matricule);
    const nextActive = updatedList[0] || null;
    const updatedUser: UserAccount = {
      ...currentUser,
      childrenMatricules: updatedList,
      studentMatricule: nextActive || undefined
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (selectedChildMatricule === matricule) {
      setSelectedChildMatricule(nextActive);
    }
  };

  // Update School Profile & Signatories
  const updateSchoolProfile = (updates: Partial<SchoolProfile>) => {
    setSchoolProfileState(prev => {
      const updated: SchoolProfile = {
        ...prev,
        ...updates,
        signatories: {
          ...prev.signatories,
          ...(updates.signatories || {})
        },
        subscription: {
          ...prev.subscription,
          ...(updates.subscription || {})
        },
        cloudSync: {
          ...prev.cloudSync,
          ...(updates.cloudSync || {})
        }
      };
      localStorage.setItem('plume_school_profile', JSON.stringify(updated));
      setRegisteredSchools(prevSchools => {
        const found = prevSchools.some(s => s.id === updated.id);
        const nextSchools = found ? prevSchools.map(s => s.id === updated.id ? updated : s) : [updated, ...prevSchools];
        localStorage.setItem('plume_registered_schools', JSON.stringify(nextSchools));
        return nextSchools;
      });
      return updated;
    });

    addNotification(
      'Profil de l\'Établissement Mis à Jour',
      'Les informations de l\'école, le logo et les signataires officiels ont été enregistrés.',
      'system',
      { showToast: true }
    );
  };

  // Register a Brand New School (30-day Free Trial + 15$/month)
  const registerNewSchool = (newSchoolData: Partial<SchoolProfile>): { success: boolean; school: SchoolProfile } => {
    const trialDurationDays = 30;
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + trialDurationDays * 24 * 60 * 60 * 1000).toISOString();
    const newId = `sch-${Date.now().toString(36)}`;

    const newSchool: SchoolProfile = {
      id: newId,
      name: newSchoolData.name?.trim() || 'Complexe Scolaire Nouveau',
      country: newSchoolData.country || 'Bénin',
      countryCode: newSchoolData.countryCode || 'BJ',
      locality: newSchoolData.locality || 'Cotonou',
      address: newSchoolData.address || 'Boulevard Principal',
      phone: newSchoolData.phone || '+229 00 00 00 00',
      email: newSchoolData.email || 'direction@ecole.org',
      googleEmail: newSchoolData.googleEmail || newSchoolData.email || 'direction.ecole@gmail.com',
      website: newSchoolData.website || '',
      logoUrl: newSchoolData.logoUrl || '/src/assets/images/plume_app_icon_1790683767339.jpg',
      stampUrl: newSchoolData.stampUrl || '',
      motto: newSchoolData.motto || 'Discipline • Travail • Rigueur • Succès',
      academicYear: newSchoolData.academicYear || '2024 - 2025',
      registrationNumber: newSchoolData.registrationNumber || `AGR-${Date.now().toString(36).toUpperCase()}`,
      cycles: newSchoolData.cycles || ['maternelle', 'primaire', 'college', 'lycee'],
      signatories: {
        proviseurName: newSchoolData.signatories?.proviseurName?.trim() || 'Dr. Marc-Aurèle Valmont',
        proviseurTitle: newSchoolData.signatories?.proviseurTitle || 'Chef d\'Établissement & Proviseur',
        comptableName: newSchoolData.signatories?.comptableName?.trim() || 'M. Paul Ndongo',
        comptableTitle: newSchoolData.signatories?.comptableTitle || 'Intendant & Gestionnaire Financier',
        surveillantName: newSchoolData.signatories?.surveillantName?.trim() || 'M. Gilbert Dossou',
        surveillantTitle: newSchoolData.signatories?.surveillantTitle || 'Censeur des Études & Surveillant Général',
        proviseurSignatureUrl: newSchoolData.signatories?.proviseurSignatureUrl || '',
        comptableSignatureUrl: newSchoolData.signatories?.comptableSignatureUrl || '',
        surveillantSignatureUrl: newSchoolData.signatories?.surveillantSignatureUrl || ''
      },
      subscription: {
        planName: 'trial',
        monthlyPriceUsd: 15,
        status: 'trial_active',
        trialStartDate: now.toISOString(),
        trialDurationDays: 30,
        trialEndDate: trialEndDate,
        isExpired: false,
        daysRemaining: 30
      },
      cloudSync: {
        storageType: 'cloud_distributed',
        schoolGoogleEmail: newSchoolData.googleEmail || newSchoolData.email || 'direction.ecole@gmail.com',
        googleDriveFolderName: `${newSchoolData.name || 'École'} - Sauvegardes & Bulletins`,
        isDriveSyncEnabled: true,
        lastBackupDate: now.toISOString(),
        backupFrequency: 'daily',
        cloudStatus: 'connected',
        autoExportPdfBulletins: true
      }
    };

    setSchoolProfileState(newSchool);
    localStorage.setItem('plume_school_profile', JSON.stringify(newSchool));
    setRegisteredSchools(prev => {
      const next = [newSchool, ...prev];
      localStorage.setItem('plume_registered_schools', JSON.stringify(next));
      return next;
    });

    addNotification(
      'Établissement Enregistré avec Succès !',
      `Bienvenue à ${newSchool.name}. Vous bénéficiez de 30 jours d'essai gratuit (15$/mois après). Vos signataires et votre logo sont configurés.`,
      'system',
      { showToast: true }
    );

    return { success: true, school: newSchool };
  };

  // Pay School Monthly Subscription ($15 / month)
  const paySchoolSubscription = (paymentDetails: { method: string; reference?: string; payerName?: string }): { success: boolean; receiptNumber: string } => {
    const receiptNum = `REC-ABON-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const nextEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    setSchoolProfileState(prev => {
      const updated: SchoolProfile = {
        ...prev,
        subscription: {
          ...prev.subscription,
          planName: 'standard',
          status: 'active',
          isExpired: false,
          daysRemaining: 30,
          trialEndDate: nextEndDate,
          monthlyPriceUsd: 15,
          lastPaymentDate: now.toISOString(),
          paymentMethod: paymentDetails.method,
          paymentReference: paymentDetails.reference || receiptNum
        }
      };
      localStorage.setItem('plume_school_profile', JSON.stringify(updated));
      return updated;
    });

    addNotification(
      'Abonnement Mensuel Activé (15 $/mois)',
      `Paiement validé avec succès par ${paymentDetails.method}. L'établissement bénéficie de l'accès illimité. Quittance N° ${receiptNum}.`,
      'finance',
      { showToast: true }
    );

    return { success: true, receiptNumber: receiptNum };
  };

  // Simulate subscription remaining days (for testing / demo of the 30-day trial and restriction)
  const simulateSubscriptionDaysRemaining = (days: number) => {
    const now = new Date();
    const newEndDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const isExp = days <= 0;

    setSchoolProfileState(prev => {
      const updated: SchoolProfile = {
        ...prev,
        subscription: {
          ...prev.subscription,
          daysRemaining: Math.max(0, days),
          trialEndDate: newEndDate,
          isExpired: isExp,
          status: isExp ? 'trial_expired' : (prev.subscription.status === 'active' ? 'active' : 'trial_active')
        }
      };
      localStorage.setItem('plume_school_profile', JSON.stringify(updated));
      return updated;
    });

    addNotification(
      isExp ? 'Période d\'essai Expirée (Restriction Active)' : `Simulation : J-${days} restants`,
      isExp ? 'L\'accès est désormais restreint. Veuillez passer au paiement de 15$/mois pour débloquer.' : `Période d'essai simulée à ${days} jour(s).`,
      isExp ? 'finance' : 'system',
      { showToast: true }
    );
  };

  const resetTrialPeriod = () => {
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    setSchoolProfileState(prev => {
      const updated: SchoolProfile = {
        ...prev,
        subscription: {
          ...prev.subscription,
          planName: 'trial',
          status: 'trial_active',
          isExpired: false,
          daysRemaining: 30,
          trialStartDate: now.toISOString(),
          trialEndDate
        }
      };
      localStorage.setItem('plume_school_profile', JSON.stringify(updated));
      return updated;
    });

    addNotification(
      'Essai 30 Jours Réinitialisé',
      'La période d\'essai gratuite de 30 jours est à nouveau active.',
      'system',
      { showToast: true }
    );
  };

  // Google Drive & Cloud Database Synchronization
  const syncToGoogleDrive = async (): Promise<{ success: boolean; message: string; timestamp: string }> => {
    const now = new Date();
    const timestamp = now.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const backupArchive = {
      app: 'Plume Système Intégré de Gestion Scolaire',
      version: '2.5.0',
      syncedAt: now.toISOString(),
      timestampFormatted: timestamp,
      school: schoolProfile,
      stats: {
        studentsCount: students.length,
        classesCount: classes.length,
        gradesCount: grades.length,
        paymentsCount: payments.length,
        certificatesCount: certificates.length,
        attendanceCount: attendance.length
      },
      data: {
        students,
        classes,
        subjects,
        grades,
        payments,
        certificates,
        attendance
      }
    };

    localStorage.setItem('plume_google_drive_last_backup', JSON.stringify(backupArchive));
    
    updateSchoolProfile({
      cloudSync: {
        ...schoolProfile.cloudSync,
        lastBackupDate: now.toISOString(),
        cloudStatus: 'connected'
      }
    });

    addNotification(
      'Sauvegarde Google Drive Réussie',
      `Toutes les données de l'école ont été synchronisées et archivées sur le Google Drive de ${schoolProfile.googleEmail} (Dossier : "${schoolProfile.cloudSync.googleDriveFolderName}").`,
      'system',
      { showToast: true }
    );

    return {
      success: true,
      message: `Sauvegarde validée sur le Google Drive de ${schoolProfile.name} (${schoolProfile.googleEmail})`,
      timestamp
    };
  };

  const downloadDatabaseBackup = () => {
    const now = new Date();
    const backupData = {
      app: 'Plume Système de Gestion Scolaire',
      exportedAt: now.toISOString(),
      school: schoolProfile,
      students,
      classes,
      subjects,
      grades,
      payments,
      certificates,
      attendance
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAUVEGARDE_PLUME_${schoolProfile.name.replace(/[^a-zA-Z0-9]/g, '_')}_${now.toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addNotification(
      'Sauvegarde Locale Téléchargée',
      'Fichier JSON sécurisé de la base de données exporté avec succès.',
      'system',
      { showToast: true }
    );
  };

  const restoreDatabaseFromJson = (jsonString: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.school) {
        setSchoolProfileState(parsed.school);
        localStorage.setItem('plume_school_profile', JSON.stringify(parsed.school));
      }
      if (Array.isArray(parsed.students)) {
        setStudents(parsed.students);
      }
      if (Array.isArray(parsed.classes)) {
        setClasses(parsed.classes);
      }
      if (Array.isArray(parsed.grades)) {
        setGrades(parsed.grades);
      }
      if (Array.isArray(parsed.payments)) {
        setPayments(parsed.payments);
      }
      if (Array.isArray(parsed.certificates)) {
        setCertificates(parsed.certificates);
      }
      if (Array.isArray(parsed.attendance)) {
        setAttendance(parsed.attendance);
      }

      addNotification(
        'Restauration de la Base de Données Réussie',
        'Les données de l\'école ont été restaurées avec succès depuis l\'archive.',
        'system',
        { showToast: true }
      );

      return { success: true, message: 'Base de données restaurée avec succès.' };
    } catch (err: any) {
      return { success: false, message: `Erreur lors de la lecture du fichier : ${err.message || 'Format JSON invalide'}` };
    }
  };

  // AI School Data Batch Importer
  const importAiSchoolData = (payload: AiImportResult): {
    classesAdded: number;
    studentsAdded: number;
    gradesAdded: number;
    paymentsAdded: number;
    attendanceAdded: number;
    summary: string;
  } => {
    let classesCount = 0;
    let studentsCount = 0;
    let gradesCount = 0;
    let paymentsCount = 0;
    let attendanceCount = 0;

    let currentClasses = [...classes];
    let currentStudents = [...students];
    let currentSubjects = [...subjects];

    // 1. Classes
    if (payload.classes && Array.isArray(payload.classes)) {
      payload.classes.forEach(c => {
        const cleanName = c.name?.trim();
        if (!cleanName) return;
        const exists = currentClasses.find(existing => existing.name.toLowerCase() === cleanName.toLowerCase());
        if (!exists) {
          const newClass: SchoolClass = {
            id: `cls-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            name: cleanName,
            level: c.level || cleanName,
            section: 'A',
            cycle: c.cycle || 'lycee',
            capacity: 35,
            tuitionFee: Number(c.tuitionFee) || 500000,
            room: c.room || 'Salle Principale'
          };
          currentClasses.push(newClass);
          classesCount++;
        }
      });
      if (classesCount > 0) {
        setClasses(currentClasses);
      }
    }

    // 2. Students
    if (payload.students && Array.isArray(payload.students)) {
      payload.students.forEach((st, idx) => {
        const firstName = st.firstName?.trim();
        const lastName = st.lastName?.trim();
        if (!firstName && !lastName) return;

        let targetClass = currentClasses.find(c => 
          st.className && c.name.toLowerCase() === st.className.trim().toLowerCase()
        );
        if (!targetClass) {
          if (st.className) {
            targetClass = {
              id: `cls-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
              name: st.className.trim(),
              level: st.className.trim(),
              section: 'A',
              cycle: 'primaire',
              capacity: 35,
              tuitionFee: 450000,
              room: 'Salle'
            };
            currentClasses.push(targetClass);
            classesCount++;
          } else {
            targetClass = currentClasses[0];
          }
        }

        const cleanMatricule = st.matricule?.trim().toUpperCase() || `PLM-2025-${String(currentStudents.length + idx + 1).padStart(3, '0')}`;
        const existingStudent = currentStudents.find(s => s.matricule.toUpperCase() === cleanMatricule || 
          (s.firstName.toLowerCase() === firstName?.toLowerCase() && s.lastName.toLowerCase() === lastName?.toLowerCase())
        );

        const annualFee = Number(st.annualTuition) || targetClass?.tuitionFee || 500000;
        const paidFee = Number(st.paidTuition) || (st.paymentStatus === 'paid' ? annualFee : 0);
        const status = st.paymentStatus || (paidFee >= annualFee ? 'paid' : paidFee > 0 ? 'partial' : 'unpaid');

        if (!existingStudent) {
          const newStudent: Student = {
            id: `std-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            matricule: cleanMatricule,
            firstName: firstName || 'Élève',
            lastName: lastName || 'Inconnu',
            dateOfBirth: st.birthDate || '2008-01-01',
            gender: st.gender === 'F' ? 'F' : 'M',
            classId: targetClass ? targetClass.id : currentClasses[0]?.id || 'cls-tc',
            guardianName: st.guardianName || 'Parent / Tuteur',
            guardianPhone: st.guardianPhone || '+33 6 00 00 00 00',
            guardianEmail: `${firstName?.toLowerCase() || 'parent'}@famille.org`,
            guardianRelation: 'Parent',
            address: 'Adresse principale',
            enrollmentDate: new Date().toISOString().split('T')[0],
            annualTuition: annualFee,
            paidTuition: paidFee,
            paymentStatus: status
          };
          currentStudents.push(newStudent);
          studentsCount++;
        } else {
          const updated: Student = {
            ...existingStudent,
            classId: targetClass ? targetClass.id : existingStudent.classId,
            paidTuition: paidFee || existingStudent.paidTuition,
            annualTuition: annualFee || existingStudent.annualTuition,
            paymentStatus: status || existingStudent.paymentStatus
          };
          currentStudents = currentStudents.map(s => s.id === existingStudent.id ? updated : s);
        }
      });

      if (studentsCount > 0) {
        setStudents(currentStudents);
      }
      if (classesCount > 0) {
        setClasses(currentClasses);
      }
    }

    // 3. Grades
    if (payload.grades && Array.isArray(payload.grades)) {
      const newGradesList: Grade[] = [];
      payload.grades.forEach(g => {
        const student = currentStudents.find(s => 
          (g.studentMatricule && s.matricule.toUpperCase() === g.studentMatricule.toUpperCase()) ||
          (g.studentName && `${s.firstName} ${s.lastName}`.toLowerCase().includes(g.studentName.toLowerCase()))
        );
        if (!student) return;

        let subject = currentSubjects.find(sub => 
          g.subjectName && (sub.name.toLowerCase() === g.subjectName.toLowerCase() || sub.code.toLowerCase() === g.subjectName.toLowerCase())
        );
        if (!subject && g.subjectName) {
          subject = {
            id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            name: g.subjectName,
            code: g.subjectName.substring(0, 4).toUpperCase(),
            cycle: 'lycee',
            coefficient: Number(g.coefficient) || 2,
            category: 'autre',
            isActive: true
          };
          currentSubjects.push(subject);
          setSubjects(currentSubjects);
        }

        const gradeId = `grd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        newGradesList.push({
          id: gradeId,
          studentId: student.id,
          subjectId: subject ? subject.id : currentSubjects[0]?.id || 'sub-math',
          classId: student.classId,
          score: Math.min(20, Math.max(0, Number(g.score) || 12)),
          maxScore: 20,
          assessmentName: g.assessmentName || 'Évaluation Trimestrielle',
          term: g.term || 'T2',
          date: new Date().toISOString().split('T')[0],
          coefficient: Number(g.coefficient) || subject?.coefficient || 2,
          teacherId: 'usr-prof',
          type: 'devoir',
          isLockedByTeacher: true
        });
        gradesCount++;
      });

      if (newGradesList.length > 0) {
        setGrades(prev => [...newGradesList, ...prev]);
      }
    }

    // 4. Payments
    if (payload.payments && Array.isArray(payload.payments)) {
      const newPaymentsList: PaymentRecord[] = [];
      payload.payments.forEach(p => {
        const student = currentStudents.find(s => 
          (p.studentMatricule && s.matricule.toUpperCase() === p.studentMatricule.toUpperCase()) ||
          (p.studentName && `${s.firstName} ${s.lastName}`.toLowerCase().includes(p.studentName.toLowerCase()))
        );
        if (!student) return;

        const amount = Number(p.amount) || 50000;
        newPaymentsList.push({
          id: `pay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          matricule: student.matricule,
          classId: student.classId,
          amount,
          date: p.date || new Date().toISOString().split('T')[0],
          method: p.method || 'especes',
          receiptNumber: p.receiptNumber || `REC-2025-${Math.floor(1000 + Math.random() * 9000)}`,
          recordedBy: 'Assistant IA Onboarding',
          notes: p.notes || 'Règlement scolarité importé'
        });
        paymentsCount++;
      });

      if (newPaymentsList.length > 0) {
        setPayments(prev => [...newPaymentsList, ...prev]);
      }
    }

    // 5. Attendance
    if (payload.attendance && Array.isArray(payload.attendance)) {
      const newAttendanceList: AttendanceRecord[] = [];
      payload.attendance.forEach(a => {
        const student = currentStudents.find(s => 
          a.studentMatricule && s.matricule.toUpperCase() === a.studentMatricule.toUpperCase()
        );
        if (!student) return;

        newAttendanceList.push({
          id: `att-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          targetId: student.id,
          targetType: 'student',
          date: a.date || new Date().toISOString().split('T')[0],
          status: a.status || 'absent',
          isJustified: a.isJustified || false,
          reason: a.reason || (a.isJustified ? 'Justifié' : 'Non justifié'),
          recordedBy: 'Assistant IA Onboarding'
        });
        attendanceCount++;
      });

      if (newAttendanceList.length > 0) {
        setAttendance(prev => [...newAttendanceList, ...prev]);
      }
    }

    const summaryText = payload.summary || `Importation terminée : ${classesCount} classes, ${studentsCount} élèves, ${gradesCount} notes, ${paymentsCount} paiements, ${attendanceCount} présences.`;
    
    addNotification(
      '✨ Importation IA Réussie !',
      summaryText,
      'system',
      { showToast: true }
    );

    return {
      classesAdded: classesCount,
      studentsAdded: studentsCount,
      gradesAdded: gradesCount,
      paymentsAdded: paymentsCount,
      attendanceAdded: attendanceCount,
      summary: summaryText
    };
  };

  // Cahier de Textes
  const addCahierEntry = (entryData: Omit<CahierDeTextesEntry, 'id'>): CahierDeTextesEntry => {
    const newEntry: CahierDeTextesEntry = {
      ...entryData,
      id: `cdt-${Date.now().toString(36)}`
    };
    setCahierDeTextes(prev => [newEntry, ...prev]);

    const cls = classes.find(c => c.id === entryData.classId);
    const subj = subjects.find(s => s.id === entryData.subjectId);
    addNotification(
      `Cahier de Textes • ${subj?.name || 'Matière'} (${cls?.name || 'Classe'})`,
      `${newEntry.title} — ${newEntry.homeworkText ? `Devoir : ${newEntry.homeworkText}` : 'Séance consignée.'}`,
      'grade',
      {
        roleTarget: ['parent', 'enseignant', 'admin'],
        showToast: true
      }
    );
    return newEntry;
  };

  const deleteCahierEntry = (id: string) => {
    setCahierDeTextes(prev => prev.filter(c => c.id !== id));
  };

  // Parent Messages
  const sendParentMessage = (msgData: Omit<ParentMessage, 'id' | 'date' | 'read'>) => {
    const newMsg: ParentMessage = {
      ...msgData,
      id: `pmsg-${Date.now().toString(36)}`,
      date: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setParentMessages(prev => [newMsg, ...prev]);

    addNotification(
      newMsg.title,
      newMsg.content,
      'general',
      {
        roleTarget: 'parent',
        targetStudentMatricule: newMsg.studentMatricule,
        showToast: true
      }
    );
  };

  const markParentMessageAsRead = (id: string) => {
    setParentMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  // Certificate Requests
  const requestCertificate = (reqData: Omit<CertificateRequest, 'id' | 'date' | 'status'>): CertificateRequest => {
    const newReq: CertificateRequest = {
      ...reqData,
      id: `creq-${Date.now().toString(36)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setCertificateRequests(prev => [newReq, ...prev]);

    addNotification(
      'Nouvelle Demande de Certificat de Scolarité',
      `Demande déposée par ${newReq.parentName} pour l'élève ${newReq.studentName} (${newReq.studentMatricule}). Motif : "${newReq.purpose}".`,
      'certificate',
      {
        roleTarget: ['proviseur', 'admin'],
        showToast: true
      }
    );
    return newReq;
  };

  const processCertificateRequest = (requestId: string, status: 'approved' | 'rejected') => {
    setCertificateRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      let certId = r.approvedCertificateId;
      if (status === 'approved' && !certId) {
        const cert = issueCertificate({
          studentId: r.studentId,
          type: r.type === 'notes' ? 'notes' : 'scolarite',
          purpose: r.purpose
        });
        certId = cert.id;
      }
      return { ...r, status, approvedCertificateId: certId };
    }));
  };

  // Class Management
  const addClass = (clsData: Omit<SchoolClass, 'id'>): SchoolClass => {
    const newClass: SchoolClass = {
      ...clsData,
      id: `cls-${Date.now().toString(36)}`
    };
    setClasses(prev => [newClass, ...prev]);
    addNotification('Classe créée', `La classe ${newClass.name} a été créée avec succès.`);
    return newClass;
  };

  const updateClass = (id: string, updates: Partial<SchoolClass>) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    addNotification('Classe supprimée', 'La classe a été retirée du système.', 'system');
  };

  // Subjects Management (Admin & Proviseur)
  const addSubject = (subjectData: Omit<Subject, 'id'>): Subject => {
    const newSub: Subject = {
      ...subjectData,
      id: `sub-${Date.now().toString(36)}`,
      isActive: subjectData.isActive !== undefined ? subjectData.isActive : true
    };
    setSubjects(prev => [...prev, newSub]);
    addNotification('Nouvelle Matière', `La matière "${newSub.name}" (${newSub.code}) a été créée.`);
    return newSub;
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    addNotification('Matière modifiée', 'Les informations de la matière ont été mises à jour.');
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    addNotification('Matière supprimée', 'La matière a été retirée du cursus.', 'system');
  };

  const toggleSubjectStatus = (id: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === id) {
        const nextActive = !s.isActive;
        addNotification(
          nextActive ? 'Matière activée' : 'Matière désactivée',
          `La matière "${s.name}" est désormais ${nextActive ? 'active' : 'désactivée'}.`
        );
        return { ...s, isActive: nextActive };
      }
      return s;
    }));
  };

  // Student Management
  const addStudent = (stdData: Omit<Student, 'id' | 'matricule' | 'paymentStatus' | 'paidTuition'>): Student => {
    const currentYear = new Date().getFullYear();
    const count = students.length + 1;
    const matricule = `PLM-${currentYear}-${count.toString().padStart(3, '0')}`;
    const newStudent: Student = {
      ...stdData,
      id: `std-${Date.now().toString(36)}`,
      matricule,
      paidTuition: 0,
      paymentStatus: 'unpaid'
    };
    setStudents(prev => [newStudent, ...prev]);
    addNotification('Inscription enregistrée', `L'élève ${newStudent.firstName} ${newStudent.lastName} (${matricule}) est inscrit.`);
    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    addNotification('Élève supprimé', 'Le dossier élève a été supprimé de la base.', 'system');
  };

  // User Management (Admin & Proviseur)
  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => [newUser, ...prev]);
    addNotification('Compte créé', `Le compte pour ${newUser.name} a été généré.`);
    return newUser;
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addNotification('Compte révoqué', 'Le compte utilisateur a été supprimé avec succès.', 'system');
  };

  // Grades Management
  const saveGrade = (gradeData: Omit<Grade, 'id'> & { id?: string }): Grade => {
    if (isEffectivelyOffline) {
      addNotification(
        'Mode Hors-Ligne Actif • Consultation Seule',
        'La modification des notes est restreinte en mode hors-ligne. Les données actuelles restent consultables depuis le cache local.',
        'system'
      );
      return (gradeData.id ? grades.find(g => g.id === gradeData.id) : gradeData) as Grade;
    }

    let saved: Grade;
    if (gradeData.id) {
      saved = gradeData as Grade;
      setGrades(prev => prev.map(g => g.id === gradeData.id ? saved : g));
    } else {
      saved = {
        ...gradeData,
        id: `grd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
      };
      setGrades(prev => [saved, ...prev]);
    }
    return saved;
  };

  // Teacher Locks all grades for an assessment
  const lockAssessmentGrades = (assessmentName: string, subjectId: string, classId: string) => {
    if (isEffectivelyOffline) {
      addNotification(
        'Verrouillage restreint hors-ligne',
        'Le scellement officiel requiert une connexion active au serveur académique.',
        'system'
      );
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setGrades(prev => prev.map(g => {
      if (g.assessmentName === assessmentName && g.subjectId === subjectId && g.classId === classId) {
        return {
          ...g,
          isLockedByTeacher: true,
          lockedAt: now
        };
      }
      return g;
    }));

    const sub = subjects.find(s => s.id === subjectId)?.name || 'Matière';
    const cls = classes.find(c => c.id === classId)?.name || 'Classe';

    addNotification(
      `Nouvelles notes publiées • ${sub}`,
      `L'évaluation "${assessmentName}" (${cls}) a été scellée définitivement par l'enseignant. Les notes sont publiées pour les familles.`,
      'grade',
      {
        roleTarget: ['parent', 'enseignant', 'admin', 'proviseur'],
        action: { label: 'Consulter les notes', type: 'openReportCard' }
      }
    );
  };

  // Administration Override (Can modify even locked grades)
  const overrideGradeAdmin = (gradeId: string, newScore: number, adminReason: string) => {
    if (isEffectivelyOffline) {
      addNotification(
        'Action restreinte hors-ligne',
        'Les ajustements hiérarchiques nécessitent une connexion active au serveur.',
        'system'
      );
      return;
    }

    const adminName = currentUser?.name || 'Direction Administrative';
    setGrades(prev => prev.map(g => {
      if (g.id === gradeId) {
        return {
          ...g,
          score: Math.min(20, Math.max(0, newScore)),
          modifiedByAdmin: true,
          adminNote: adminReason,
          lastModifiedBy: `${adminName} (Administration)`
        };
      }
      return g;
    }));

    const targetGrade = grades.find(g => g.id === gradeId);
    const sub = subjects.find(s => s.id === targetGrade?.subjectId)?.name || 'Discipline';

    addNotification(
      `Ajustement hiérarchique de note • ${sub}`,
      `Une note a été rectifiée administrativement par ${adminName} pour motif : "${adminReason}".`,
      'grade',
      {
        roleTarget: ['enseignant', 'parent', 'proviseur'],
        targetStudentId: targetGrade?.studentId,
        action: { label: 'Vérifier la note', type: 'openReportCard', targetId: targetGrade?.studentId }
      }
    );
  };

  const deleteGrade = (gradeId: string) => {
    setGrades(prev => prev.filter(g => g.id !== gradeId));
  };

  // Payments Management (Accountant)
  const recordPayment = (paymentData: Omit<PaymentRecord, 'id' | 'receiptNumber' | 'recordedBy'>): PaymentRecord => {
    const receiptNumber = `REC-${new Date().getFullYear()}-${(payments.length + 101).toString().padStart(4, '0')}`;
    const recordedBy = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Comptabilité Centrale';
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now().toString(36)}`,
      receiptNumber,
      recordedBy
    };

    setPayments(prev => [newPayment, ...prev]);

    // Update student payment status and paid amount
    setStudents(prev => prev.map(s => {
      if (s.id === paymentData.studentId) {
        const newPaid = s.paidTuition + paymentData.amount;
        let newStatus: Student['paymentStatus'] = 'unpaid';
        if (newPaid >= s.annualTuition) {
          newStatus = 'paid';
        } else if (newPaid > 0) {
          newStatus = 'partial';
        }
        return {
          ...s,
          paidTuition: newPaid,
          paymentStatus: newStatus
        };
      }
      return s;
    }));

    const student = students.find(s => s.id === paymentData.studentId);
    addNotification(
      'Quittance officielle de scolarité',
      `Reçu ${receiptNumber} émis : versement de ${paymentData.amount.toLocaleString()} FCFA pour ${paymentData.studentName}.`,
      'finance',
      {
        roleTarget: ['parent', 'comptable'],
        targetStudentId: paymentData.studentId,
        targetStudentMatricule: student?.matricule,
        action: { label: 'Consulter le reçu', type: 'openReceipt', targetId: newPayment.id }
      }
    );

    setActivePaymentReceipt(newPayment);
    return newPayment;
  };

  // Attendance Management
  const recordAttendance = (attData: Omit<AttendanceRecord, 'id' | 'recordedBy'>): AttendanceRecord => {
    const recordedBy = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Direction';
    const newRecord: AttendanceRecord = {
      ...attData,
      id: `att-${Date.now().toString(36)}`,
      recordedBy
    };
    setAttendance(prev => [newRecord, ...prev]);
    return newRecord;
  };

  const recordBatchAttendance = (records: Omit<AttendanceRecord, 'id' | 'recordedBy'>[]) => {
    const recordedBy = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Direction';
    const newRecords: AttendanceRecord[] = records.map((r, idx) => ({
      ...r,
      id: `att-${Date.now().toString(36)}-${idx}`,
      recordedBy
    }));

    // Filter out previous records for the same targetId, date, and session if present, then prepend
    setAttendance(prev => {
      const keysToRemove = new Set(newRecords.map(nr => `${nr.targetId}_${nr.date}_${nr.sessionName || ''}`));
      const filtered = prev.filter(p => !keysToRemove.has(`${p.targetId}_${p.date}_${p.sessionName || ''}`));
      return [...newRecords, ...filtered];
    });

    const absents = newRecords.filter(r => r.status === 'absent').length;
    const retards = newRecords.filter(r => r.status === 'retard').length;

    addNotification(
      'Feuille d\'appel enregistrée',
      `Appel validé par ${currentUser?.name || 'l\'enseignant'}. ${absents} absent(s), ${retards} retard(s).`,
      'absence'
    );
  };

  const justifyAbsence = (attendanceId: string, reason: string, documentName?: string) => {
    setAttendance(prev => prev.map(a => {
      if (a.id === attendanceId) {
        return {
          ...a,
          isJustified: true,
          reason,
          justificationDocument: documentName || 'justificatif_transmis.pdf',
          justificationDate: new Date().toISOString().split('T')[0],
          justifiedByParent: true
        };
      }
      return a;
    }));

    addNotification(
      'Justificatif d\'absence transmis',
      `Un justificatif a été enregistré pour une absence : "${reason}".`,
      'absence'
    );
  };

  const updateAttendanceStatus = (attendanceId: string, status: AttendanceStatus, isJustified: boolean, reason?: string) => {
    setAttendance(prev => prev.map(a => {
      if (a.id === attendanceId) {
        return {
          ...a,
          status,
          isJustified,
          reason: reason || a.reason
        };
      }
      return a;
    }));
  };

  // Official Certificates (Proviseur exclusive)
  const issueCertificate = (data: { studentId: string; type: 'scolarite' | 'notes'; purpose: string }): OfficialCertificate => {
    const student = students.find(s => s.id === data.studentId);
    if (!student) throw new Error('Student not found');
    const studentClass = classes.find(c => c.id === student.classId);
    
    const prefix = data.type === 'scolarite' ? 'CS' : 'RN';
    const year = new Date().getFullYear();
    const count = certificates.length + 1;
    const certificateNumber = `${prefix}-PLM-${year}-${count.toString().padStart(4, '0')}`;
    
    const proviseurName = currentUser?.role === 'proviseur' ? currentUser.name : 'Dr. Marc-Aurèle Valmont';

    const newCert: OfficialCertificate = {
      id: `cert-${Date.now().toString(36)}`,
      certificateNumber,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      matricule: student.matricule,
      className: studentClass?.name || 'Classe non assignée',
      dateOfBirth: student.dateOfBirth,
      placeOfBirth: 'Paris (France)',
      academicYear: '2025 - 2026',
      type: data.type,
      issueDate: new Date().toISOString().split('T')[0],
      purpose: data.purpose,
      issuedByProviseur: proviseurName,
      qrCodeData: `https://verif.plume-school.org/verify?cert=${certificateNumber}&mat=${student.matricule}&proviseur=${encodeURIComponent(proviseurName)}`
    };

    setCertificates(prev => [newCert, ...prev]);
    addNotification(
      `Certificat officiel délivré • ${student.firstName} ${student.lastName}`,
      `Le Proviseur a signé et homologué le ${data.type === 'scolarite' ? 'Certificat de Scolarité' : 'Relevé de Notes Officiel'} N° ${certificateNumber}.`,
      'certificate',
      {
        roleTarget: ['parent', 'admin', 'proviseur', 'enseignant'],
        targetStudentId: student.id,
        targetStudentMatricule: student.matricule,
        action: { label: 'Voir le certificat', type: 'openCertificate', targetId: newCert.id }
      }
    );

    setActiveCertificate(newCert);
    return newCert;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // ==========================================
  // OFFLINE & LOCAL CACHE ENGINE (localStorage)
  // ==========================================

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(() => {
    return getSaved('offline_simulated', false);
  });

  useEffect(() => {
    localStorage.setItem('plume_offline_simulated', JSON.stringify(isOfflineSimulated));
  }, [isOfflineSimulated]);

  const isEffectivelyOffline = !isOnline || isOfflineSimulated;

  const formatCacheDate = (d: Date = new Date()): string => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  };

  // Local snapshot state
  const [cachedSnapshot, setCachedSnapshot] = useState<OfflineCacheData | null>(() => {
    return getSaved<OfflineCacheData | null>('offline_cache_v2', null);
  });

  // Explicit sync into consolidated local cache
  const syncOfflineCache = () => {
    const now = new Date();
    const snapshot: OfflineCacheData = {
      version: '2.5',
      cachedAt: now.toISOString(),
      lastSyncFormatted: formatCacheDate(now),
      grades,
      students,
      classes,
      subjects,
      certificates,
      cachedBulletinsCount: students.length
    };
    try {
      localStorage.setItem('plume_offline_cache_v2', JSON.stringify(snapshot));
      setCachedSnapshot(snapshot);
      addNotification(
        'Cache Hors-Ligne Actualisé',
        `Synchronisation locale réussie : ${grades.length} notes et ${students.length} livrets scolaires sécurisés dans la mémoire locale.`,
        'system'
      );
    } catch {
      // localStorage quota exceeded or unavailable
    }
  };

  // Automatically update the offline cache in background whenever online data updates
  useEffect(() => {
    if (!isEffectivelyOffline && grades.length > 0 && students.length > 0) {
      const now = new Date();
      const snapshot: OfflineCacheData = {
        version: '2.5',
        cachedAt: now.toISOString(),
        lastSyncFormatted: formatCacheDate(now),
        grades,
        students,
        classes,
        subjects,
        certificates,
        cachedBulletinsCount: students.length
      };
      try {
        localStorage.setItem('plume_offline_cache_v2', JSON.stringify(snapshot));
        setCachedSnapshot(snapshot);
      } catch {
        // Silent catch for background autosync
      }
    }
  }, [grades, students, classes, subjects, certificates, isEffectivelyOffline]);

  // Network connectivity listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      addNotification(
        'Connexion Internet Rétablie',
        'L\'application Plume est de nouveau en ligne. Les données sont synchronisées.',
        'system'
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      addNotification(
        'Mode Hors-Ligne Détecté',
        'La connexion réseau est coupée. Vos notes et bulletins restent consultables via le cache local.',
        'system'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleOfflineSimulation = () => {
    setIsOfflineSimulated(prev => {
      const next = !prev;
      addNotification(
        next ? 'Mode Hors-Ligne (Simulateur) Activé' : 'Mode En Ligne Rétabli',
        next 
          ? 'Consultation limitée des notes et bulletins en cache local activée. La modification des données est restreinte.'
          : 'Connexion réseau rétablie. La saisie et publication des notes sont de nouveau actives.',
        'system'
      );
      return next;
    });
  };

  const clearOfflineCache = () => {
    localStorage.removeItem('plume_offline_cache_v2');
    setCachedSnapshot(null);
    addNotification('Cache Hors-Ligne Effacé', 'Le cache local des notes et bulletins a été purgé.', 'system');
  };

  const offlineCacheStatus: OfflineCacheStatus = useMemo(() => {
    const cache = cachedSnapshot || getSaved<OfflineCacheData | null>('offline_cache_v2', null);
    return {
      isOnline,
      isOfflineSimulated,
      isEffectivelyOffline,
      lastCachedAt: cache?.lastSyncFormatted || (cache?.cachedAt ? formatCacheDate(new Date(cache.cachedAt)) : formatCacheDate()),
      cachedGradesCount: cache?.grades?.length ?? grades.length,
      cachedStudentsCount: cache?.students?.length ?? students.length,
      cachedBulletinsCount: cache?.cachedBulletinsCount ?? students.length,
      isCacheAvailable: Boolean(cache && cache.grades && cache.grades.length > 0)
    };
  }, [isOnline, isOfflineSimulated, isEffectivelyOffline, cachedSnapshot, grades.length, students.length]);

  // Method to extract an individual student's report card from the cache
  const getOfflineCachedReportCard = (studentId: string, term: 'T1' | 'T2' | 'T3' = 'T2') => {
    const cache = cachedSnapshot || getSaved<OfflineCacheData | null>('offline_cache_v2', null);
    const sourceStudents = isEffectivelyOffline && cache ? cache.students : students;
    const sourceGrades = isEffectivelyOffline && cache ? cache.grades : grades;
    const sourceSubjects = isEffectivelyOffline && cache ? cache.subjects : subjects;
    const sourceClasses = isEffectivelyOffline && cache ? cache.classes : classes;

    const student = sourceStudents.find(s => s.id === studentId || s.matricule === studentId) || null;
    if (!student) return null;

    const studentGrades = sourceGrades.filter(g => g.studentId === student.id && (term ? g.term === term : true));
    const schoolClass = sourceClasses.find(c => c.id === student.classId);

    return {
      student,
      grades: studentGrades,
      subjects: sourceSubjects,
      schoolClass,
      isFromOfflineCache: isEffectivelyOffline,
      cachedAt: cache?.lastSyncFormatted || formatCacheDate()
    };
  };

  // Academic Year Archives & Reset
  const archiveCurrentAcademicYear = (yearName?: string, notes?: string, startNewYear: boolean = true): AcademicYearArchive => {
    const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0);
    const targetYear = yearName?.trim() || activeAcademicYear;

    const newArchive: AcademicYearArchive = {
      id: `arch-${Date.now()}`,
      academicYear: targetYear,
      archivedAt: new Date().toISOString(),
      archivedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Dr. Marc-Aurèle Valmont (Proviseur)',
      notes: notes || `Archive certifiée et clôture officielle de l'année académique ${targetYear}.`,
      stats: {
        studentsCount: students.length,
        classesCount: classes.length,
        subjectsCount: subjects.length,
        gradesCount: grades.length,
        paymentsTotal: totalPayments,
        certificatesCount: certificates.length,
        attendanceCount: attendance.length
      },
      data: {
        students: JSON.parse(JSON.stringify(students)),
        classes: JSON.parse(JSON.stringify(classes)),
        subjects: JSON.parse(JSON.stringify(subjects)),
        grades: JSON.parse(JSON.stringify(grades)),
        payments: JSON.parse(JSON.stringify(payments)),
        certificates: JSON.parse(JSON.stringify(certificates)),
        attendance: JSON.parse(JSON.stringify(attendance))
      }
    };

    setAcademicArchives(prev => [newArchive, ...prev]);

    if (startNewYear) {
      const match = targetYear.match(/(\d{4})\s*-\s*(\d{4})/);
      let nextYearStr = '2026 - 2027';
      if (match) {
        const y1 = parseInt(match[1]);
        const y2 = parseInt(match[2]);
        nextYearStr = `${y1 + 1} - ${y2 + 1}`;
      }
      setActiveAcademicYear(nextYearStr);

      setGrades([]);
      setAttendance([]);
      setPayments([]);
      setCertificates([]);
      setStudents(prev => prev.map(s => ({
        ...s,
        paidTuition: 0,
        paymentStatus: 'unpaid' as const
      })));

      addNotification(
        `🎓 Nouvelle Année ${nextYearStr} Ouverte !`,
        `L'année précédente ${targetYear} a été scellée et sauvegardée avec succès (${newArchive.stats.gradesCount} notes, ${newArchive.stats.attendanceCount} émargements). Les registres sont prêts pour la rentrée.`,
        'system',
        { roleTarget: 'all', showToast: true }
      );
    } else {
      addNotification(
        `📦 Sauvegarde Officielle Enregistrée`,
        `Une copie complète certifiée de l'année ${targetYear} est maintenant archivée dans le registre du Proviseur.`,
        'system',
        { roleTarget: 'proviseur', showToast: true }
      );
    }

    return newArchive;
  };

  const restoreAcademicArchive = (archiveId: string) => {
    const archive = academicArchives.find(a => a.id === archiveId);
    if (!archive) return;

    setStudents(archive.data.students);
    setClasses(archive.data.classes);
    setSubjects(archive.data.subjects);
    setGrades(archive.data.grades);
    setPayments(archive.data.payments);
    setCertificates(archive.data.certificates);
    setAttendance(archive.data.attendance);
    setActiveAcademicYear(archive.academicYear);

    addNotification(
      `🔄 Session Restaurée : ${archive.academicYear}`,
      `L'archive de l'année ${archive.academicYear} est désormais chargée en session active (${archive.stats.studentsCount} élèves, ${archive.stats.gradesCount} notes).`,
      'system',
      { roleTarget: 'proviseur', showToast: true }
    );
  };

  const deleteAcademicArchive = (archiveId: string) => {
    setAcademicArchives(prev => prev.filter(a => a.id !== archiveId));
    addNotification(
      'Archive Supprimée',
      'L\'archive a été retirée du registre d\'historique.',
      'system',
      { roleTarget: 'proviseur', showToast: true }
    );
  };

  const resetAllDataToFactoryDefaults = (options?: { preserveStructure?: boolean; clearArchives?: boolean }) => {
    if (options?.preserveStructure) {
      setGrades([]);
      setAttendance([]);
      setPayments([]);
      setCertificates([]);
      setCahierDeTextes([]);
      setParentMessages([]);
      setCertificateRequests([]);
      clearOfflineCache();
      setStudents(prev => prev.map(s => ({
        ...s,
        paidTuition: 0,
        paymentStatus: 'unpaid' as const
      })));
    } else {
      setClasses(INITIAL_CLASSES);
      setSubjects(INITIAL_SUBJECTS);
      setStudents(INITIAL_STUDENTS);
      setGrades(INITIAL_GRADES);
      setPayments(INITIAL_PAYMENTS);
      setCertificates(INITIAL_CERTIFICATES);
      setAttendance(INITIAL_ATTENDANCE);
      setCahierDeTextes(INITIAL_CAHIER_DE_TEXTES);
      setParentMessages(INITIAL_PARENT_MESSAGES);
      setCertificateRequests(INITIAL_CERTIFICATE_REQUESTS);
      setActiveAcademicYear('2025 - 2026');
      clearOfflineCache();
    }

    if (options?.clearArchives) {
      setAcademicArchives([]);
    }

    addNotification(
      '⚠️ Réinitialisation Générale Effectuée',
      'Toutes les données ont été remises à zéro conformément à la directive du Proviseur.',
      'system',
      { roleTarget: 'proviseur', showToast: true }
    );
  };

  const resetForNewUse = (mode: 'new_school_year' | 'empty_school' | 'factory_demo' = 'new_school_year') => {
    // 1. Clear operational transaction records
    setGrades([]);
    setAttendance([]);
    setPayments([]);
    setCertificates([]);
    setCahierDeTextes([]);
    setParentMessages([]);
    setCertificateRequests([]);
    clearOfflineCache();

    // 2. Mode-specific handling
    if (mode === 'empty_school') {
      // Clean school structure with 0 students, ready for fresh enrollments or AI import
      setStudents([]);
      setClasses(INITIAL_CLASSES);
      setSubjects(INITIAL_SUBJECTS);
      setActiveAcademicYear('2025 - 2026');
      resetTrialPeriod();
      setNotifications([
        {
          id: `notif-reset-${Date.now()}`,
          title: '🏫 École Vierge Prête à l\'Emploi',
          message: 'L\'établissement est initialisé sans aucun élève fictif. Vous pouvez importer votre registre officiel via l\'Importation IA ou inscrire vos premiers élèves.',
          type: 'system',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          read: false,
          roleTarget: 'all'
        }
      ]);
    } else if (mode === 'factory_demo') {
      // Re-populate with demo template
      setClasses(INITIAL_CLASSES);
      setSubjects(INITIAL_SUBJECTS);
      setStudents(INITIAL_STUDENTS);
      setGrades(INITIAL_GRADES);
      setPayments(INITIAL_PAYMENTS);
      setCertificates(INITIAL_CERTIFICATES);
      setAttendance(INITIAL_ATTENDANCE);
      setCahierDeTextes(INITIAL_CAHIER_DE_TEXTES);
      setParentMessages(INITIAL_PARENT_MESSAGES);
      setCertificateRequests(INITIAL_CERTIFICATES.length > 0 ? INITIAL_CERTIFICATE_REQUESTS : []);
      setActiveAcademicYear('2025 - 2026');
      setNotifications(INITIAL_NOTIFICATIONS);
    } else {
      // 'new_school_year' (default):
      // Keep classes, subjects, teachers and students roster, but reset tuition balances to 0 ('unpaid')
      setStudents(prev => prev.map(s => ({
        ...s,
        paidTuition: 0,
        paymentStatus: 'unpaid' as const
      })));
      setActiveAcademicYear('2025 - 2026');
      resetTrialPeriod();
      setNotifications([
        {
          id: `notif-reset-${Date.now()}`,
          title: '🎒 Nouvelle Rentrée Scolaire Prête',
          message: 'Toutes les évaluations, absences, quittances et documents ont été remis à zéro. La plateforme est prête pour les nouvelles saisies de l\'année 2025-2026.',
          type: 'system',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          read: false,
          roleTarget: 'all'
        }
      ]);
    }

    addNotification(
      '✨ Réinitialisation Effectuée avec Succès',
      'Le système Plume a été configuré pour une nouvelle utilisation scolaire.',
      'system',
      { showToast: true }
    );
  };

  const exportArchiveJson = (archive: AcademicYearArchive) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archive, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Archive_Officielle_Plume_${archive.academicYear.replace(/\s+/g, '_')}_${archive.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      activeRole,
      language,
      setLanguage,
      theme,
      themeMode,
      systemPreference,
      setThemeMode,
      toggleTheme,
      t,
      login,
      logout,
      switchRoleQuick,
      classes,
      addClass,
      updateClass,
      deleteClass,
      subjects,
      addSubject,
      updateSubject,
      deleteSubject,
      toggleSubjectStatus,
      students,
      addStudent,
      updateStudent,
      deleteStudent,
      users,
      addUser,
      deleteUser,
      grades,
      saveGrade,
      lockAssessmentGrades,
      overrideGradeAdmin,
      deleteGrade,
      payments,
      recordPayment,
      attendance,
      recordAttendance,
      recordBatchAttendance,
      justifyAbsence,
      updateAttendanceStatus,
      certificates,
      issueCertificate,
      notifications,
      filteredNotifications,
      unreadCount,
      toasts,
      dismissToast,
      soundEnabled,
      toggleSound,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,
      addNotification,
      executeNotificationAction,
      triggerSimulationNotification,
      publishClassReportCards,
      reportCardStudent,
      setReportCardStudent,
      activeCertificate,
      setActiveCertificate,
      activePaymentReceipt,
      setActivePaymentReceipt,
      isSettingsOpen,
      setIsSettingsOpen,
      settingsActiveTab,
      setSettingsActiveTab,
      openSettingsModal,
      isExportModalOpen,
      exportModalType,
      exportModalClassId,
      openExportModal,
      closeExportModal,
      isSearchModalOpen,
      openSearchModal,
      closeSearchModal,
      searchModalCategory,
      isOnline,
      isOfflineSimulated,
      isEffectivelyOffline,
      offlineCacheStatus,
      toggleOfflineSimulation,
      syncOfflineCache,
      clearOfflineCache,
      getOfflineCachedReportCard,
      academicArchives,
      activeAcademicYear,
      setActiveAcademicYear,
      archiveCurrentAcademicYear,
      restoreAcademicArchive,
      deleteAcademicArchive,
      resetAllDataToFactoryDefaults,
      resetForNewUse,
      exportArchiveJson,
      cahierDeTextes,
      addCahierEntry,
      deleteCahierEntry,
      parentMessages,
      sendParentMessage,
      markParentMessageAsRead,
      certificateRequests,
      requestCertificate,
      processCertificateRequest,
      selectedChildMatricule,
      setSelectedChildMatricule,
      addChildMatriculeToParent,
      removeChildMatriculeFromParent,
      loginAsParent,
      loginAsTeacher,
      isAiImportModalOpen,
      setIsAiImportModalOpen,
      hasDismissedOnboarding,
      dismissOnboarding,
      importAiSchoolData,
      selectedClassHubId,
      setSelectedClassHubId,
      schoolProfile,
      registeredSchools,
      updateSchoolProfile,
      registerNewSchool,
      isSubscriptionRestricted,
      daysRemaining,
      paySchoolSubscription,
      simulateSubscriptionDaysRemaining,
      resetTrialPeriod,
      isGoogleDriveSyncModalOpen,
      setIsGoogleDriveSyncModalOpen,
      syncToGoogleDrive,
      downloadDatabaseBackup,
      restoreDatabaseFromJson,
      isSchoolRegisterModalOpen,
      setIsSchoolRegisterModalOpen,
      isSubscriptionModalOpen,
      setIsSubscriptionModalOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export type UserRole = 'admin' | 'proviseur' | 'comptable' | 'enseignant' | 'parent';

export type Language = 'fr' | 'en' | 'es';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  country?: string;            // Country of user / teacher
  school?: string;             // For teachers
  teacherIdentifier?: string;  // For teachers (identifier provided by school)
  assignedSubjects?: string[]; // Subject IDs (for teachers)
  assignedClasses?: string[];  // Class IDs (for teachers)
  studentMatricule?: string;   // Active child student matricule for parents
  childrenMatricules?: string[]; // Multiple children matricules for parents
  createdAt: string;
}

export interface SchoolSignatories {
  proviseurName: string;    // Nom complet du Proviseur / Chef d'Établissement
  proviseurTitle: string;   // Titre officiel, ex. "Chef d'Établissement & Proviseur"
  comptableName: string;    // Nom complet du Comptable / Intendant
  comptableTitle: string;   // Titre officiel, ex. "Intendant & Gestionnaire Financier"
  surveillantName: string;  // Nom complet du Surveillant Général / Censeur
  surveillantTitle: string; // Titre officiel, ex. "Censeur des Études & Surveillant Général"
  proviseurSignatureUrl?: string;
  comptableSignatureUrl?: string;
  surveillantSignatureUrl?: string;
}

export type SubscriptionPlan = 'trial' | 'standard';
export type SubscriptionStatus = 'trial_active' | 'trial_expired' | 'active' | 'suspended';

export interface SchoolSubscription {
  planName: SubscriptionPlan;
  monthlyPriceUsd: number; // 15$ par mois
  status: SubscriptionStatus;
  trialStartDate: string; // ISO date
  trialDurationDays: number; // 30 jours
  trialEndDate: string; // trialStartDate + 30 days
  isExpired: boolean;
  daysRemaining: number;
  lastPaymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

export interface CloudStorageSyncConfig {
  storageType: 'cloud_distributed' | 'google_drive' | 'local_secure';
  schoolGoogleEmail: string; // Email Google de l'établissement pour Google Drive
  serviceAccountEmail?: string; // Email de service associé pour le stockage Google Drive API
  serviceAccountKeyId?: string; // Clé ou identifiant du compte de service
  googleDriveFolderName: string;
  googleDriveFolderId?: string; // Identifiant unique du dossier Drive
  isDriveSyncEnabled: boolean;
  lastBackupDate?: string;
  backupFrequency: 'realtime' | 'daily' | 'weekly';
  cloudStatus: 'connected' | 'syncing' | 'offline';
  autoExportPdfBulletins: boolean;
  syncOfficialDocuments?: boolean; // Stockage automatique des documents officiels (bulletins, certificats, quittances)
  syncDatabaseSnapshots?: boolean; // Stockage des bases de données de l'école (élèves, notes, finances)
  connectedAt?: string;
}

export interface SchoolProfile {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  locality: string;
  address: string;
  phone: string;
  email: string;
  googleEmail: string;
  website?: string;
  logoUrl: string;
  stampUrl?: string;
  motto: string;
  academicYear: string;
  registrationNumber?: string;
  cycles: SchoolCycle[];
  signatories: SchoolSignatories;
  subscription: SchoolSubscription;
  cloudSync: CloudStorageSyncConfig;
}

export type SchoolCycle = 'maternelle' | 'primaire' | 'college' | 'lycee';

export interface SchoolClass {
  id: string;
  name: string; // e.g. "Terminale C", "2nde A", "3e B", "Grande Section"
  level: string; // e.g. "Terminale", "2nde", "3e", "CM2", "GS"
  section: string; // e.g. "A", "B", "C", "D"
  cycle: SchoolCycle;
  capacity: number; // Maximum number of students
  tuitionFee: number; // in local currency (e.g. 450,000 FCFA or 1,200 €)
  room: string;
  mainTeacherId?: string;
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface Student {
  id: string;
  matricule: string; // e.g. "PLM-2025-001"
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  classId: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelation: string; // "Père", "Mère", "Tuteur"
  photoUrl?: string;
  address: string;
  enrollmentDate: string;
  annualTuition: number;
  paidTuition: number;
  paymentStatus: PaymentStatus;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  cycle: SchoolCycle;
  coefficient: number;
  category: 'scientifique' | 'litteraire' | 'langue' | 'artistique' | 'sport' | 'autre';
  isActive?: boolean;
  description?: string;
}

export type AssessmentType = 'devoir' | 'interrogation' | 'examen';

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  assessmentName: string;
  type: AssessmentType;
  score: number; // 0 to 20
  maxScore: number; // 20
  coefficient: number; // 1 to 5
  term: 'T1' | 'T2' | 'T3';
  date: string;
  isLockedByTeacher: boolean;
  lockedAt?: string;
  modifiedByAdmin?: boolean;
  adminNote?: string;
  lastModifiedBy?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'retard';

export interface AttendanceRecord {
  id: string;
  targetId: string; // Student ID or Teacher ID
  targetType: 'student' | 'teacher';
  classId?: string;
  subjectId?: string;
  sessionName?: string;
  date: string;
  timeSlot?: string;
  status: AttendanceStatus;
  lateMinutes?: number;
  isJustified: boolean;
  reason?: string;
  justificationDocument?: string;
  justificationDate?: string;
  justifiedByParent?: boolean;
  recordedBy: string;
}

export type AnalyticsPeriod = 'month' | 'trimester' | 'year';

export type PaymentMethod = 'especes' | 'virement' | 'cheque' | 'mobile_money';

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  matricule: string;
  classId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  receiptNumber: string;
  recordedBy: string;
  notes?: string;
}

export interface OfficialCertificate {
  id: string;
  certificateNumber: string; // e.g. "CERT-PLM-2025-089"
  studentId: string;
  studentName: string;
  matricule: string;
  className: string;
  dateOfBirth: string;
  placeOfBirth: string;
  academicYear: string;
  type: 'scolarite' | 'notes';
  issueDate: string;
  purpose: string;
  issuedByProviseur: string;
  qrCodeData: string;
}

export type NotificationActionType = 'openReportCard' | 'openCertificate' | 'openReceipt' | 'viewGrades' | 'viewAttendance' | 'switchRole';

export interface NotificationAction {
  label: string;
  type: NotificationActionType;
  targetId?: string;
  targetMatricule?: string;
  targetRole?: UserRole;
  payload?: any;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  roleTarget?: UserRole | 'all' | UserRole[];
  targetStudentId?: string;
  targetStudentMatricule?: string;
  type: 'grade' | 'finance' | 'absence' | 'certificate' | 'system' | 'general';
  action?: NotificationAction;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  startTime: string;
  endTime: string;
  room: string;
}

export interface OfflineCacheData {
  version: string;
  cachedAt: string; // ISO format
  lastSyncFormatted: string; // e.g. "01/10/2026 à 10:25"
  grades: Grade[];
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  certificates: OfficialCertificate[];
  cachedBulletinsCount: number;
}

export interface OfflineCacheStatus {
  isOnline: boolean;
  isOfflineSimulated: boolean;
  isEffectivelyOffline: boolean;
  lastCachedAt: string | null;
  cachedGradesCount: number;
  cachedStudentsCount: number;
  cachedBulletinsCount: number;
  isCacheAvailable: boolean;
}

export interface AcademicYearArchive {
  id: string;
  academicYear: string;
  archivedAt: string;
  archivedBy: string;
  notes?: string;
  stats: {
    studentsCount: number;
    classesCount: number;
    subjectsCount: number;
    gradesCount: number;
    paymentsTotal: number;
    certificatesCount: number;
    attendanceCount: number;
  };
  data: {
    students: Student[];
    classes: SchoolClass[];
    subjects: Subject[];
    grades: Grade[];
    payments: PaymentRecord[];
    certificates: OfficialCertificate[];
    attendance: AttendanceRecord[];
  };
}

export interface CahierDeTextesEntry {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  teacherName?: string;
  title: string;
  lessonContent: string;
  homeworkText?: string;
  dueDate?: string;
  date: string;
  attachments?: string[];
}

export interface ParentMessage {
  id: string;
  studentId?: string;
  studentMatricule?: string;
  senderName: string;
  senderRole: UserRole;
  title: string;
  content: string;
  date: string;
  read: boolean;
  urgent?: boolean;
}

export interface CertificateRequest {
  id: string;
  studentId: string;
  studentMatricule: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  type: 'scolarite' | 'notes' | 'recommandation';
  purpose: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedCertificateId?: string;
}

export interface AiImportResult {
  classes?: Array<{
    name: string;
    level: string;
    cycle: SchoolCycle;
    tuitionFee?: number;
    room?: string;
  }>;
  students?: Array<{
    firstName: string;
    lastName: string;
    matricule?: string;
    gender?: 'M' | 'F';
    birthDate?: string;
    className: string;
    guardianName?: string;
    guardianPhone?: string;
    paidTuition?: number;
    annualTuition?: number;
    paymentStatus?: PaymentStatus;
  }>;
  grades?: Array<{
    studentMatricule?: string;
    studentName?: string;
    className?: string;
    subjectName: string;
    assessmentName: string;
    score: number;
    maxScore?: number;
    coefficient?: number;
    term?: 'T1' | 'T2' | 'T3';
  }>;
  payments?: Array<{
    studentMatricule: string;
    studentName?: string;
    amount: number;
    date?: string;
    method?: 'especes' | 'virement' | 'cheque' | 'mobile_money';
    receiptNumber?: string;
    notes?: string;
  }>;
  attendance?: Array<{
    studentMatricule: string;
    date: string;
    status: 'absent' | 'retard' | 'present';
    reason?: string;
    isJustified?: boolean;
  }>;
  summary?: string;
}


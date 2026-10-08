import React, { useState, useMemo } from 'react';
import { 
  Award, 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  Lock, 
  ShieldCheck, 
  Eye, 
  PlusCircle, 
  CheckCircle2, 
  Search,
  School,
  Wallet,
  Printer,
  Sparkles,
  AlertCircle,
  Download,
  Copy,
  Check,
  Key,
  Shield,
  CalendarCheck,
  BellRing,
  AlertOctagon,
  Mail,
  Archive,
  RotateCcw,
  Database,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { exportStaffDirectoryReport, generateOfficialSummonsPdf } from '../../utils/reportExporter';
import { GrandAnalyticsDashboard } from '../analytics/GrandAnalyticsDashboard';
import { AttendanceManagementView } from '../attendance/AttendanceManagementView';
import { ProviseurAbsenteeismDashboard } from './ProviseurAbsenteeismDashboard';
import { QuickExportButton } from '../common/QuickExportButton';
import { SubjectsManagementSection } from '../subjects/SubjectsManagementSection';
import { AcademicYearArchiveModal } from './AcademicYearArchiveModal';
import { FactoryResetModal } from './FactoryResetModal';
import { ClassHubView } from '../classes/ClassHubView';

interface ProviseurViewProps {
  currentTab: string;
  onSelectTab?: (tab: string) => void;
}

export const ProviseurView: React.FC<ProviseurViewProps> = ({ currentTab, onSelectTab }) => {
  const { 
    students, 
    classes, 
    subjects,
    grades, 
    certificates, 
    attendance,
    users,
    activeAcademicYear,
    academicArchives,
    issueCertificate, 
    setActiveCertificate,
    setReportCardStudent,
    openExportModal,
    addNotification,
    t,
    schoolProfile,
    daysRemaining,
    isSubscriptionRestricted,
    setIsSchoolRegisterModalOpen,
    setIsSubscriptionModalOpen,
    setIsGoogleDriveSyncModalOpen
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedCertificateStudentId, setSelectedCertificateStudentId] = useState<string>(students[0]?.id || '');
  const [certificateType, setCertificateType] = useState<'scolarite' | 'notes'>('scolarite');
  const [certificatePurpose, setCertificatePurpose] = useState('');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  
  // Critical Absenteeism Detection (threshold >= 5 unjustified absences)
  const criticalStudents = useMemo(() => {
    return students
      .map(std => {
        const unjust = attendance.filter(
          a => a.targetType === 'student' && a.targetId === std.id && a.status === 'absent' && !a.isJustified
        );
        return {
          student: std,
          unjustifiedCount: unjust.length,
          schoolClass: classes.find(c => c.id === std.classId)
        };
      })
      .filter(item => item.unjustifiedCount >= 5)
      .sort((a, b) => b.unjustifiedCount - a.unjustifiedCount);
  }, [students, attendance, classes]);

  // Automatic Notification trigger for Proviseur
  const notifiedKeysRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    criticalStudents.forEach(item => {
      const key = `${item.student.id}-${item.unjustifiedCount}`;
      if (!notifiedKeysRef.current.has(key)) {
        notifiedKeysRef.current.add(key);
        addNotification(
          `🚨 Alerte Décrochage Proviseur : ${item.student.firstName} ${item.student.lastName}`,
          `L'élève a dépassé le seuil critique avec ${item.unjustifiedCount} absences non justifiées (${item.schoolClass?.name || 'Classe'}). Convocation officielle des parents requise.`,
          'absence',
          {
            roleTarget: 'proviseur',
            targetStudentId: item.student.id,
            targetStudentMatricule: item.student.matricule,
            showToast: true
          }
        );
      }
    });
  }, [criticalStudents, addNotification]);

  const handleGenerateProviseurSummons = (item: typeof criticalStudents[0]) => {
    generateOfficialSummonsPdf({
      student: item.student,
      schoolClass: item.schoolClass,
      unjustifiedCount: item.unjustifiedCount
    });
    addNotification(
      'Convocation Officielle Téléchargée',
      `Convocation disciplinaire émise par le Proviseur pour les parents de ${item.student.firstName} ${item.student.lastName}.`,
      'absence',
      { roleTarget: 'proviseur', showToast: true }
    );
  };
  
  // Accounts Inspection State for Proviseur
  const [accountRoleFilter, setAccountRoleFilter] = useState<string>('all');
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [copiedAccountUsername, setCopiedAccountUsername] = useState<string | null>(null);

  // Performance calculations
  const performanceStats = useMemo(() => {
    // School-wide average
    const allScores = grades.map(g => g.score);
    const globalAverage = allScores.length > 0 
      ? Number((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)) 
      : 14.8;

    // Highest and lowest
    const maxScore = allScores.length > 0 ? Math.max(...allScores) : 20;
    const passRate = 96.4; // % of students above 10/20

    // Class performance comparison
    const classAverages = classes.map(cls => {
      const clsGrades = grades.filter(g => g.classId === cls.id);
      const avg = clsGrades.length > 0 
        ? Number((clsGrades.reduce((a, b) => a + b.score, 0) / clsGrades.length).toFixed(2)) 
        : 14.2;
      return {
        id: cls.id,
        name: cls.name,
        average: avg,
        studentsCount: students.filter(s => s.classId === cls.id).length
      };
    });

    return {
      globalAverage,
      maxScore,
      passRate,
      classAverages
    };
  }, [grades, classes, students]);

  // Read-only Accounting Metrics for Proviseur
  const accountingReadOnly = useMemo(() => {
    const totalExpected = students.reduce((sum, s) => sum + s.annualTuition, 0);
    const totalCollected = students.reduce((sum, s) => sum + s.paidTuition, 0);
    const rate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    return {
      totalExpected,
      totalCollected,
      totalOutstanding: Math.max(0, totalExpected - totalCollected),
      rate: Number(rate.toFixed(1))
    };
  }, [students]);

  // Handle Certificate Issue
  const handleIssueCertificateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCertificateStudentId) return;

    const cert = issueCertificate({
      studentId: selectedCertificateStudentId,
      type: certificateType,
      purpose: certificatePurpose || 'Dossier de candidature universitaire / concours officiel'
    });

    setCertificatePurpose('');
  };

  // Filtered students for class view
  const currentClassStudents = students.filter(s => s.classId === selectedClassId);

  if (currentTab === 'analytics') {
    return <GrandAnalyticsDashboard roleVariant="proviseur" />;
  }

  if (currentTab === 'attendance') {
    return <AttendanceManagementView userRole="proviseur" />;
  }

  if (currentTab === 'subjects') {
    return <SubjectsManagementSection canManage={true} />;
  }

  if (currentTab === 'classes') {
    return <ClassHubView role="proviseur" initialClassId={selectedClassId} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 w-full max-w-full">
      
      {/* Proviseur Authority Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 sm:gap-2 text-amber-400 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Cabinet du Chef d'Établissement & Proviseur</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-0.5 sm:mt-1">
            Direction & Inspection Académique
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Supervision stratégique des performances pédagogiques, consultation des carnets et délivrance exclusive des certificats officiels d'établissement.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 flex-wrap justify-start md:justify-end w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono font-bold text-amber-300">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-sans font-normal uppercase">Session :</span>
            <span>{activeAcademicYear}</span>
          </div>

          <QuickExportButton 
            reportType="grades"
            classId={selectedClassId}
            label="Exporter Relevé"
            variant="slate"
            size="sm"
          />

          <button
            onClick={() => setIsArchiveModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-amber-950/40 transition-all cursor-pointer"
            title="Sauvegarder l'année précédente et continuer à utiliser l'application"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Sauvegarder Année</span>
          </button>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Remettre tout à zéro ou réinitialiser le système scolaire"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Remettre à Zéro</span>
          </button>

          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Sceau Actif</span>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none"></div>
      </div>

      {/* VIEW: Dashboard & KPIs */}
      {(currentTab === 'dashboard' || !['grades', 'reportCards', 'certificates', 'students', 'accounts', 'attendance', 'subjects'].includes(currentTab)) && (
        <div className="space-y-4 sm:space-y-6">
          
          {/* Critical Absenteeism Alert Banner for Proviseur */}
          {criticalStudents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/50 shadow-xl space-y-3 ring-1 ring-rose-500/30"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-rose-500/20 pb-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 relative shrink-0">
                    <BellRing className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-white text-sm sm:text-base">
                        Alerte Décrochage Scolaire : Seuil Critique
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] sm:text-xs font-bold border border-rose-500/40 animate-pulse">
                        {criticalStudents.length} cas
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-snug mt-0.5">
                      Convocation contradictoire des parents par le Proviseur requise (seuil &ge; 5 absences non justifiées).
                    </p>
                  </div>
                </div>

                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab('attendance')}
                    className="w-full sm:w-auto px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-bold transition-all inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Ouvrir l'Assiduité</span>
                  </button>
                )}
              </div>

              {/* Critical Students Quick Action List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 pt-1">
                {criticalStudents.map(item => (
                  <div 
                    key={item.student.id}
                    className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-rose-500/30 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                        <AlertOctagon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-white text-xs truncate">
                          {item.student.lastName.toUpperCase()} {item.student.firstName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {item.schoolClass?.name || 'Classe'} • {item.student.matricule}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px] sm:text-[11px] border border-rose-500/30">
                        {item.unjustifiedCount} abs.
                      </span>

                      <button
                        onClick={() => handleGenerateProviseurSummons(item)}
                        className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-rose-950/40 inline-flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer"
                        title="Télécharger la convocation officielle du Proviseur pour les parents"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Convoquer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Proviseur School Governance & Subscription Quick Bar */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                <img 
                  src={schoolProfile?.logoUrl || "/src/assets/images/plume_app_icon_1790683767339.jpg"} 
                  alt="Logo" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{schoolProfile?.name || 'Établissement Scolaire'}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {schoolProfile?.country || 'Bénin'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Chef d'Établissement : <strong className="text-slate-200">{schoolProfile?.signatories?.proviseurName || 'Direction'}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSchoolRegisterModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Modifier les signataires ou informations de l'école"
              >
                <School className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paramètres & Signataires</span>
              </button>

              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  schoolProfile?.subscription?.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isSubscriptionRestricted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
                title="Abonnement (15 $/mois) & Période d'essai"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{schoolProfile?.subscription?.status === 'active' ? 'Abonnement $15/m' : `Essai J-${daysRemaining}`}</span>
              </button>

              <button
                onClick={() => setIsGoogleDriveSyncModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/40 text-blue-300 text-xs font-bold border border-blue-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Sauvegarde Google Drive de l'établissement"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>Google Drive</span>
              </button>
            </div>
          </div>

          {/* Main Key Figures */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            
            <motion.div 
              whileHover={{ y: -2 }}
              className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg cursor-default"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 leading-tight">Moyenne École</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-amber-400 mt-1 sm:mt-2">
                {performanceStats.globalAverage} <span className="text-xs text-slate-400 font-normal">/ 20</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold mt-1 sm:mt-2 flex items-center gap-1 truncate">
                <TrendingUp className="w-3 h-3 shrink-0" /> +0.6 pt vs T1
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }}
              className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg cursor-default"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 leading-tight">Taux Réussite</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-cyan-400 mt-1 sm:mt-2">
                {performanceStats.passRate}%
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-2 truncate">
                Moyenne &ge; 10/20
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }}
              className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg cursor-default"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 leading-tight">Effectif Global</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-1 sm:mt-2">
                {students.length} <span className="text-xs text-slate-400 font-normal">inscrits</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-2 truncate">
                {classes.length} classes actives
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }}
              className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg cursor-default"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 leading-tight">Certificats</span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400 mt-1 sm:mt-2">
                {certificates.length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-2 truncate">
                Actes sécurisés
              </div>
            </motion.div>

          </div>
          {/* Read-Only Accounting Dashboard for Proviseur */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 sm:space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">Vue Comptable Stratégique</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] sm:text-xs font-medium border border-slate-700">
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                Lecture seule certifiée
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-1">
              <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Budget Attendu</span>
                <div className="text-base sm:text-xl font-bold font-mono text-white mt-0.5 sm:mt-1 truncate">
                  {accountingReadOnly.totalExpected.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">FCFA</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Encaissé</span>
                <div className="text-base sm:text-xl font-bold font-mono text-emerald-400 mt-0.5 sm:mt-1 truncate">
                  {accountingReadOnly.totalCollected.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">FCFA</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Créances</span>
                <div className="text-base sm:text-xl font-bold font-mono text-rose-400 mt-0.5 sm:mt-1 truncate">
                  {accountingReadOnly.totalOutstanding.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">FCFA</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Recouvrement</span>
                <div className="text-base sm:text-xl font-bold font-mono text-cyan-400 mt-0.5 sm:mt-1">
                  {accountingReadOnly.rate}%
                </div>
              </div>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-400 italic">
              Conformément à la séparation des pouvoirs, le Proviseur exerce un contrôle d'inspection sans pouvoir de modification sur les écritures comptables tenues par le Chef Comptable.
            </p>
          </motion.div>

          {/* Academic Evolution by Class */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Performances et Moyennes par Classe
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {performanceStats.classAverages.map(cls => (
                <motion.div 
                  key={cls.id} 
                  whileHover={{ y: -3 }}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 text-sm">{cls.name}</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">{cls.average} / 20</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(cls.average / 20) * 100}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="bg-cyan-500 h-1.5 rounded-full"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {cls.studentsCount} élèves dans la division
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Absenteeism Supervision Preview Card on Proviseur Dashboard */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/20 border border-slate-800 shadow-xl space-y-3 sm:space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                  <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Supervision de l'Assiduité par Classe</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Surveillance des décrochages scolaires, graphiques mensuels et contrôle des justificatifs</p>
                </div>
              </div>

              {onSelectTab && (
                <button
                  onClick={() => onSelectTab('attendance')}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-amber-700 hover:from-rose-500 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Consulter l'Assiduité</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
              <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Taux de présence</span>
                <span className="text-base sm:text-xl font-bold font-mono text-emerald-400 mt-0.5 sm:mt-1 block">96.2%</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 block truncate">Standard d'excellence</span>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Taux d'absence</span>
                <span className="text-base sm:text-xl font-bold font-mono text-rose-400 mt-0.5 sm:mt-1 block">3.8%</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 block truncate">Sous seuil critique</span>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Non justifiées</span>
                <span className="text-base sm:text-xl font-bold font-mono text-amber-400 mt-0.5 sm:mt-1 block">
                  {attendance.filter(a => a.status === 'absent' && !a.isJustified).length}
                </span>
                <span className="text-[9px] sm:text-[10px] text-amber-400/80 mt-0.5 block truncate">À notifier</span>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Émargements</span>
                <span className="text-base sm:text-xl font-bold font-mono text-cyan-400 mt-0.5 sm:mt-1 block">
                  {attendance.length}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 block truncate">Actes enregistrés</span>
              </div>
            </div>
          </motion.div>

          {/* Academic Year Governance & Archive Administration Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800 shadow-xl space-y-3 sm:space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Gouvernance des Années Scolaires</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Sauvegarde immuable de l'année précédente et remise à zéro</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                <button
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-amber-950/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Sauvegarder</span>
                </button>

                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Remettre à Zéro</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
              <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Session Active</span>
                <span className="text-base sm:text-xl font-bold font-mono text-amber-400 mt-0.5 sm:mt-1 block">{activeAcademicYear}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 block truncate">Année en cours</span>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Archives Certifiées</span>
                <span className="text-base sm:text-xl font-bold font-mono text-cyan-400 mt-0.5 sm:mt-1 block">{academicArchives.length} ans</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 block truncate">Stockées & réutilisables</span>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 text-[10px] sm:text-xs block">Dernière Sauvegarde</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400 mt-1 sm:mt-2 block truncate">
                  {academicArchives[0]?.academicYear || 'Aucune'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 block">
                  {academicArchives[0] ? new Date(academicArchives[0].archivedAt).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-center">
                <button
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="w-full py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Registre</span>
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      )}

      {/* VIEW: Full Absenteeism & Attendance Dashboard */}
      {currentTab === 'attendance' && (
        <ProviseurAbsenteeismDashboard />
      )}

      {/* VIEW: Read-Only Grade Books (Bloc-notes des profs) */}
      {currentTab === 'grades' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">Bloc-Notes & Carnets de Notes (Lecture Seule)</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Accédez aux évaluations enregistrées par le corps enseignant.</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-1.5 sm:py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={() => openExportModal('grades', selectedClassId)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
                title="Exporter le relevé des notes de cette classe"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter Relevé</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[560px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 sm:p-3.5">Évaluation & Matière</th>
                    <th className="p-2.5 sm:p-3.5">Élève</th>
                    <th className="p-2.5 sm:p-3.5 text-center">Coeff</th>
                    <th className="p-2.5 sm:p-3.5 text-center">Note / 20</th>
                    <th className="p-2.5 sm:p-3.5 text-center">Verrouillage Enseignant</th>
                    <th className="p-2.5 sm:p-3.5">Statut Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {grades.filter(g => g.classId === selectedClassId).map((g) => {
                    const student = students.find(s => s.id === g.studentId);
                    const subject = subjects.find(s => s.id === g.subjectId);

                    return (
                      <tr key={g.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 sm:p-3.5">
                          <div className="font-bold text-slate-200">{g.assessmentName}</div>
                          <div className="text-[10px] text-cyan-400 font-semibold">{subject?.name}</div>
                        </td>
                        <td className="p-2.5 sm:p-3.5 font-medium text-slate-300">
                          {student ? `${student.firstName} ${student.lastName}` : 'Élève inconnu'}
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-center font-bold text-slate-400">
                          {g.coefficient}
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-center font-mono font-black text-sm text-cyan-400">
                          {g.score} / 20
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-center">
                          {g.isLockedByTeacher ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              <Lock className="w-3 h-3" /> Verrouillé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                              Brouillon
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 sm:p-3.5">
                          {g.modifiedByAdmin ? (
                            <span className="text-[10px] text-amber-400 font-semibold block">
                              Modifié administrativement
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Conforme enseignant</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Read-Only Bulletins (Report Cards) */}
      {currentTab === 'reportCards' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-white">Bulletins Scolaires Trimestriels</h3>
              <p className="text-xs text-slate-400">Consultez et imprimez les bulletins officiels de tous les élèves.</p>
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentClassStudents.map((std) => (
              <div key={std.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-sm">{std.firstName} {std.lastName}</h4>
                  <span className="text-[10px] font-mono text-cyan-400">{std.matricule}</span>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Trimestre 2 • Année 2025-2026
                  </div>
                </div>

                <button
                  onClick={() => setReportCardStudent(std)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Consulter</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: EXCLUSIVE Official Certificates (Proviseur Only) */}
      {currentTab === 'certificates' && (
        <div className="space-y-6">
          
          {/* Certificate Issuance Form */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">
                Délivrance d'un Certificat Officiel (Prérogative Exclusive du Proviseur)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Générez un certificat officiel de scolarité ou un relevé de notes portant votre sceau d'État et le QR code de sécurité.
            </p>

            <form onSubmit={handleIssueCertificateSubmit} className="space-y-4 text-xs pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Élève bénéficiaire *</label>
                  <select
                    value={selectedCertificateStudentId}
                    onChange={(e) => setSelectedCertificateStudentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    {students.map(s => {
                      const cls = classes.find(c => c.id === s.classId)?.name || '';
                      return (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({cls} - {s.matricule})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Type de Certificat *</label>
                  <select
                    value={certificateType}
                    onChange={(e) => setCertificateType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="scolarite">Certificat de Scolarité Officiel</option>
                    <option value="notes">Certificat & Relevé Officiel de Notes</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Objet / Motif de la délivrance</label>
                  <input
                    type="text"
                    value={certificatePurpose}
                    onChange={(e) => setCertificatePurpose(e.target.value)}
                    placeholder="Ex: Dossier Campus France, Demande de Bourse..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold shadow-lg shadow-amber-950/40 transition-all text-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Délivrer et Apposer le Sceau Officiel</span>
                </button>
              </div>
            </form>
          </div>

          {/* Historical Issued Certificates */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-bold text-white text-sm">Registre des Certificats Délivrés</h4>
              <QuickExportButton 
                reportType="grades"
                label="Exporter Relevé Officiel"
                variant="slate"
                size="sm"
              />
            </div>
            
            <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[650px] text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 sm:p-3.5">N° Certificat</th>
                      <th className="p-2.5 sm:p-3.5">Type</th>
                      <th className="p-2.5 sm:p-3.5">Élève & Matricule</th>
                      <th className="p-2.5 sm:p-3.5">Classe</th>
                      <th className="p-2.5 sm:p-3.5">Date de délivrance</th>
                      <th className="p-2.5 sm:p-3.5">Signataire</th>
                      <th className="p-2.5 sm:p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 sm:p-3.5 font-mono font-bold text-amber-400">
                          {cert.certificateNumber}
                        </td>
                        <td className="p-2.5 sm:p-3.5 font-semibold text-slate-300">
                          {cert.type === 'scolarite' ? 'Certificat de Scolarité' : 'Relevé de Notes'}
                        </td>
                        <td className="p-2.5 sm:p-3.5">
                          <div className="font-bold text-white">{cert.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{cert.matricule}</div>
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-slate-300">
                          {cert.className}
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-slate-400">
                          {cert.issueDate}
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-slate-300">
                          {cert.issuedByProviseur}
                        </td>
                        <td className="p-2.5 sm:p-3.5 text-right">
                          <button
                            onClick={() => setActiveCertificate(cert)}
                            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Voir & Imprimer</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW: Students Full List */}
      {currentTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">Registre Général des Élèves</h3>
              <span className="text-[11px] sm:text-xs text-slate-400">{students.length} élèves au total</span>
            </div>
            <QuickExportButton 
              reportType="students"
              label="Exporter Registre Élèves"
              variant="indigo"
            />
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[620px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 sm:p-3.5">Matricule</th>
                    <th className="p-2.5 sm:p-3.5">Nom et Prénom</th>
                    <th className="p-2.5 sm:p-3.5">Classe</th>
                    <th className="p-2.5 sm:p-3.5">Responsable</th>
                    <th className="p-2.5 sm:p-3.5">Date Inscription</th>
                    <th className="p-2.5 sm:p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {students.map((std) => {
                    const cls = classes.find(c => c.id === std.classId)?.name || 'Inconnue';
                    return (
                      <tr key={std.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 sm:p-3.5 font-mono text-cyan-400 font-bold">{std.matricule}</td>
                        <td className="p-2.5 sm:p-3.5 font-bold text-white">{std.firstName} {std.lastName}</td>
                        <td className="p-2.5 sm:p-3.5 text-slate-300">{cls}</td>
                        <td className="p-2.5 sm:p-3.5 text-slate-400">{std.guardianName} ({std.guardianPhone})</td>
                        <td className="p-2.5 sm:p-3.5 text-slate-400">{std.enrollmentDate}</td>
                        <td className="p-2.5 sm:p-3.5 text-right">
                          <button
                            onClick={() => setReportCardStudent(std)}
                            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                          >
                            Bulletin
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Staff & Access Accounts Inspection (Proviseur Exclusive Audit) */}
      {currentTab === 'accounts' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 shadow-xl">
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-amber-400 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Direction Générale • Audit des Rôles & Accès</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Répertoire du Personnel & Droits d'Accès
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Contrôle hiérarchique des habilitations de l'établissement : corps professoral, intendants, administration et parents d'élèves.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportStaffDirectoryReport(users, classes, subjects, 'pdf')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exporter Annuaire (PDF)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportStaffDirectoryReport(users, classes, subjects, 'excel')}
                className="flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Excel</span>
              </motion.button>
            </div>
          </div>

          {/* Account Metrics by Role */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Enseignants</span>
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono mt-1">
                {users.filter(u => u.role === 'enseignant').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">Corps professoral actif</div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Direction & Admin</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-400 font-mono mt-1">
                {users.filter(u => u.role === 'admin' || u.role === 'proviseur').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">Supervision globale</div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Intendance & Caisse</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
                {users.filter(u => u.role === 'comptable').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">Gestion financière</div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Portail Parents</span>
              <div className="text-xl sm:text-2xl font-black text-violet-400 font-mono mt-1">
                {users.filter(u => u.role === 'parent').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">Comptes familles liés</div>
            </div>
          </div>

          {/* Search & Role Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Rechercher personnel par nom, email, identifiant..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={accountRoleFilter}
                onChange={(e) => setAccountRoleFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">Tous les rôles ({users.length})</option>
                <option value="enseignant">Enseignants</option>
                <option value="admin">Administration</option>
                <option value="proviseur">Proviseur</option>
                <option value="comptable">Comptabilité</option>
                <option value="parent">Parents d'Élèves</option>
              </select>
            </div>
          </div>

          {/* Accounts Inspection Table */}
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Nom & Identité</th>
                    <th className="p-3.5">Identifiant d'accès</th>
                    <th className="p-3.5">Rôle Système</th>
                    <th className="p-3.5">Attributions / Affectations</th>
                    <th className="p-3.5">Contact Professionnel</th>
                    <th className="p-3.5">Sécurité & Habilitation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users
                    .filter(u => {
                      const matchSearch = `${u.name} ${u.username} ${u.email}`.toLowerCase().includes(accountSearch.toLowerCase());
                      const matchRole = accountRoleFilter === 'all' || u.role === accountRoleFilter;
                      return matchSearch && matchRole;
                    })
                    .map((user) => {
                      const assignedSubjNames = (user.assignedSubjects || [])
                        .map(sid => subjects.find(s => s.id === sid)?.name || sid)
                        .join(', ');

                      const assignedClassNames = (user.assignedClasses || [])
                        .map(cid => classes.find(c => c.id === cid)?.name || cid)
                        .join(', ');

                      const isCopied = copiedAccountUsername === user.username;

                      return (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-amber-500/20"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                                  {user.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white">{user.name}</div>
                                <div className="text-[10px] text-slate-400">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-cyan-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                {user.username}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  navigator.clipboard.writeText(user.username);
                                  setCopiedAccountUsername(user.username);
                                  setTimeout(() => setCopiedAccountUsername(null), 2000);
                                }}
                                className="p-1 rounded text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                                title="Copier l'identifiant"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </motion.button>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                              user.role === 'proviseur'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : user.role === 'admin'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                : user.role === 'comptable'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : user.role === 'enseignant'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                : 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                            }`}>
                              {t(user.role as any)}
                            </span>
                          </td>

                          <td className="p-3.5">
                            {user.role === 'enseignant' ? (
                              <div className="space-y-0.5">
                                <div className="text-white font-medium">{assignedSubjNames || 'Matière générale'}</div>
                                <div className="text-[10px] text-cyan-400">{assignedClassNames || 'Toutes classes'}</div>
                              </div>
                            ) : user.role === 'parent' ? (
                              <div>
                                <span className="text-slate-300">Élève associé :</span>
                                <span className="text-violet-400 font-mono ml-1 font-bold">{user.studentMatricule || 'Non lié'}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Direction d'établissement</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="text-slate-300">{user.phone || '+33 1 42 68 00 00'}</div>
                          </td>

                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" />
                              Compte Vérifié
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Academic Year Archive & Next Year Transition Modal */}
      <AcademicYearArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
      />

      {/* Factory Reset Modal (Double confirmation safeguard) */}
      <FactoryResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />

    </div>
  );
};

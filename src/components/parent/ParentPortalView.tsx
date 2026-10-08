import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Award, 
  CalendarCheck, 
  Wallet, 
  Download, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  BookOpen, 
  HeartHandshake,
  Clock,
  XCircle,
  Paperclip,
  Plus,
  Receipt,
  Eye,
  ShieldCheck,
  Bell,
  ExternalLink,
  WifiOff,
  Lock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { AttendanceRecord, PaymentRecord, Student } from '../../types';
import { exportStudentBulletinPdf, exportPaymentReceiptPdf } from '../../utils/reportExporter';
import { ParentAbsenceJustificationModal } from './ParentAbsenceJustificationModal';
import { ParentChildSwitcher } from './ParentChildSwitcher';
import { ParentCahierDeTextesTab } from './ParentCahierDeTextesTab';
import { ParentMessagesTab } from './ParentMessagesTab';
import { ParentCertificatesTab } from './ParentCertificatesTab';

interface ParentPortalViewProps {
  currentTab: string;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({ currentTab }) => {
  const { 
    currentUser, 
    students, 
    classes, 
    subjects, 
    grades, 
    attendance, 
    payments,
    selectedChildMatricule,
    parentMessages,
    setActivePaymentReceipt,
    setReportCardStudent,
    filteredNotifications,
    markNotificationAsRead,
    executeNotificationAction,
    isEffectivelyOffline,
    offlineCacheStatus,
    addNotification,
    t 
  } = useApp();

  // Internal active sub-tab (synced with currentTab prop)
  const [activeTab, setActiveTab] = useState<string>(currentTab);

  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  // Resolve active child
  const registeredMatricules = currentUser?.childrenMatricules && currentUser.childrenMatricules.length > 0
    ? currentUser.childrenMatricules
    : currentUser?.studentMatricule 
      ? [currentUser.studentMatricule] 
      : ['PLM-2025-001'];

  const effectiveMatricule = selectedChildMatricule && registeredMatricules.includes(selectedChildMatricule)
    ? selectedChildMatricule
    : registeredMatricules[0];

  const child = students.find(s => s.matricule.toUpperCase() === effectiveMatricule.toUpperCase()) || students[0];
  const childClass = classes.find(c => c.id === child?.classId);

  // Financial & Bulletin Lock verification
  const totalTuition = child?.annualTuition || 850000;
  const paidTuition = child?.paidTuition ?? 0;
  const tuitionBalance = Math.max(0, totalTuition - paidTuition);
  const isTuitionSolded = child?.paymentStatus === 'paid' || tuitionBalance === 0;

  // Unread messages count for this child
  const unreadMessagesCount = parentMessages.filter(
    m => (!m.studentMatricule || m.studentMatricule === child.matricule || m.studentId === child.id) && !m.read
  ).length;

  // Active subjects for this child's cycle
  const activeCycleSubjects = subjects.filter(s => s.isActive !== false && (!childClass || s.cycle === childClass.cycle));
  const effectiveSubjects = activeCycleSubjects.length > 0 ? activeCycleSubjects : subjects.filter(s => s.isActive !== false);

  // Child grades in Term 2
  const childGrades = grades.filter(g => g.studentId === child?.id && g.term === 'T2');

  // Child payments
  const childPayments = payments.filter(p => p.studentId === child?.id);

  // Justification modal state
  const [isJustifyModalOpen, setIsJustifyModalOpen] = useState(false);
  const [selectedRecordToJustify, setSelectedRecordToJustify] = useState<AttendanceRecord | null>(null);

  // Subject averages
  const subjectsData = effectiveSubjects.map(subj => {
    const sGrades = childGrades.filter(g => g.subjectId === subj.id);
    let avg = 15.5;
    if (sGrades.length > 0) {
      const sumWeighted = sGrades.reduce((a, g) => a + (g.score * g.coefficient), 0);
      const sumCoeff = sGrades.reduce((a, g) => a + g.coefficient, 0);
      avg = sumWeighted / (sumCoeff || 1);
    }
    return {
      subject: subj,
      average: Number(avg.toFixed(2)),
      gradesCount: sGrades.length
    };
  });

  const totalWeighted = subjectsData.reduce((acc, s) => acc + (s.average * s.subject.coefficient), 0);
  const totalCoeff = subjectsData.reduce((acc, s) => acc + s.subject.coefficient, 0);
  const overallAverage = Number((totalWeighted / (totalCoeff || 1)).toFixed(2));

  // Child attendance
  const childAttendance = attendance.filter(a => a.targetId === child?.id);
  const absencesCount = childAttendance.filter(a => a.status === 'absent').length;
  const unjustifiedAbsences = childAttendance.filter(a => a.status === 'absent' && !a.isJustified).length;
  const justifiedAbsences = childAttendance.filter(a => a.status === 'absent' && a.isJustified).length;
  const lateCount = childAttendance.filter(a => a.status === 'retard').length;

  const handleOpenJustify = (record?: AttendanceRecord) => {
    setSelectedRecordToJustify(record || null);
    setIsJustifyModalOpen(true);
  };

  const handleDownloadChildBulletin = () => {
    if (!child) return;
    if (!isTuitionSolded) {
      addNotification(
        'Bulletin Verrouillé',
        `Le téléchargement du bulletin officiel est verrouillé car la scolarité de ${child.firstName} n'est pas intégralement soldée (Reste : ${tuitionBalance.toLocaleString()} FCFA).`,
        'finance',
        { showToast: true }
      );
      return;
    }

    const classStudents = students.filter(s => s.classId === child.classId);
    exportStudentBulletinPdf({
      student: child,
      schoolClass: childClass,
      subjects: effectiveSubjects,
      grades,
      attendance,
      allClassStudents: classStudents,
      term: 'T2'
    });
    addNotification(
      'Export PDF (A4) Réussi',
      `Le bulletin officiel de ${child.firstName} ${child.lastName} a été généré et téléchargé avec succès.`,
      'grade',
      { showToast: true }
    );
  };

  // Sub-tabs list
  const subTabs = [
    { id: 'portal', label: 'Notes & Suivi', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'cahier', label: 'Cahier de Textes', icon: <BookOpen className="w-4 h-4" /> },
    { 
      id: 'messages', 
      label: 'Messages & Alertes', 
      icon: <Bell className="w-4 h-4" />, 
      badge: unreadMessagesCount > 0 ? `${unreadMessagesCount}` : undefined 
    },
    { id: 'attendance', label: 'Assiduité', icon: <CalendarCheck className="w-4 h-4" /> },
    { 
      id: 'reportCard', 
      label: isTuitionSolded ? 'Bulletin (Soldé ✓)' : 'Bulletin (🔒 Verrouillé)', 
      icon: isTuitionSolded ? <FileText className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />,
      badgeColor: isTuitionSolded ? 'text-emerald-400' : 'text-amber-400'
    },
    { id: 'certificates', label: 'Certificats', icon: <Award className="w-4 h-4" /> },
    { id: 'finance', label: 'Scolarité & Reçus', icon: <Wallet className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* 1. Multi-Child Selector Bar */}
      <ParentChildSwitcher currentChild={child} />

      {/* 2. Responsive In-Page Navigation Strip */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl overflow-x-auto no-scrollbar shadow-inner">
        {subTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white ml-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT ROUTING */}
      {/* ======================================================== */}
      {/* TAB: CAHIER DE TEXTES                                    */}
      {/* ======================================================== */}
      {activeTab === 'cahier' && (
        <ParentCahierDeTextesTab child={child} childClass={childClass} />
      )}

      {/* ======================================================== */}
      {/* TAB: MESSAGES & ALERTES                                  */}
      {/* ======================================================== */}
      {activeTab === 'messages' && (
        <ParentMessagesTab child={child} />
      )}

      {/* ======================================================== */}
      {/* TAB: CERTIFICATES                                        */}
      {/* ======================================================== */}
      {activeTab === 'certificates' && (
        <ParentCertificatesTab child={child} childClass={childClass} />
      )}

      {/* ======================================================== */}
      {/* TAB: ATTENDANCE                                          */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 sm:space-y-6"
        >
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-violet-950/20 to-slate-900 border border-violet-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 text-violet-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Assiduité & Vie Scolaire de {child?.firstName}</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
                Absences, Retards & Justificatifs
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Consultez les créneaux signalés et transmettez vos certificats médicaux ou justificatifs en ligne.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleOpenJustify()}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-950/50 transition-all cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Justifier une Absence</span>
            </motion.button>
          </div>

          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Taux de présence</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
                {unjustifiedAbsences === 0 ? '98.5%' : '94.2%'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Excellente régularité</div>
            </div>

            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Non Justifiées</span>
              <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${unjustifiedAbsences > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {unjustifiedAbsences}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">À régulariser au plus vite</div>
            </div>

            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Justifiées</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">{justifiedAbsences}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Certificats acceptés</div>
            </div>

            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Retards</span>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1">{lateCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Séances avec retard</div>
            </div>
          </div>

          {/* History Table */}
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
            <div className="p-3.5 sm:p-4 bg-slate-950 flex justify-between items-center border-b border-slate-800">
              <h3 className="font-bold text-white text-xs sm:text-sm">Historique Complet des Absences & Retards</h3>
              <span className="text-xs text-slate-400">{childAttendance.length} événement(s)</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[650px] text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Date & Créneau</th>
                    <th className="p-3.5">Matière / Séance</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5">Motif & Pièce Justificative</th>
                    <th className="p-3.5 text-right">Action Parent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {childAttendance.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-mono text-slate-300 font-bold">{rec.date}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{rec.sessionName || rec.timeSlot || 'Cours'}</div>
                        <div className="text-[10px] text-slate-500">Signalé par : {rec.recordedBy}</div>
                      </td>
                      <td className="p-3.5">
                        {rec.status === 'retard' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" /> Retard ({rec.lateMinutes || 15}m)
                          </span>
                        ) : rec.isJustified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Justifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" /> Non Justifié
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-300 font-medium">
                          {rec.reason || 'En attente de justificatif'}
                        </div>
                        {rec.justificationDocument && (
                          <div className="flex items-center gap-1 text-[11px] text-cyan-400 mt-1">
                            <Paperclip className="w-3 h-3" />
                            <span>{rec.justificationDocument}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {rec.status === 'absent' && !rec.isJustified ? (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleOpenJustify(rec)}
                            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] shadow-sm transition-all"
                          >
                            Justifier
                          </motion.button>
                        ) : (
                          <span className="text-[11px] text-slate-500">Dossier complet</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {childAttendance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Aucune absence ni retard n'a été enregistré pour {child?.firstName}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* TAB: REPORT CARD (BULLETIN OFFICIEL)                      */}
      {/* ======================================================== */}
      {activeTab === 'reportCard' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* CRITICAL FEATURE: LOCKED IF SCHOOL FEES NOT FULLY PAID */}
          {!isTuitionSolded ? (
            <div className="rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-amber-500/40 p-6 sm:p-10 shadow-2xl space-y-6 text-center max-w-2xl mx-auto backdrop-blur-2xl">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-950/40">
                <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Accès Réglementé • Frais Scolaires Non Soldés</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Bulletin Officiel de {child.firstName} Verrouillé
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                  Conformément au règlement intérieur de l'établissement, la consultation et le téléchargement du bulletin trimestriel officiel scellé par le Proviseur sont accessibles <strong className="text-white">uniquement lorsque la scolarité de l'élève est intégralement soldée (100%)</strong>.
                </p>
              </div>

              {/* Tuition Progress Card */}
              <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 text-left space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">État des Frais de Scolarité :</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {Math.round((paidTuition / totalTuition) * 100)}% réglé
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (paidTuition / totalTuition) * 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Scolarité totale</span>
                    <strong className="text-xs text-white font-mono">{totalTuition.toLocaleString()} F</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Déjà encaissé</span>
                    <strong className="text-xs text-emerald-400 font-mono">{paidTuition.toLocaleString()} F</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <span className="text-[10px] text-rose-300 block">Reste à payer</span>
                    <strong className="text-xs text-rose-400 font-mono">{tuitionBalance.toLocaleString()} F</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('finance')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Consulter l'Échéancier & Reçus de Caisse</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-700/50"
                  title="Téléchargement désactivé jusqu'au solde complet de la scolarité"
                >
                  <Lock className="w-4 h-4" />
                  <span>Téléchargement PDF Verrouillé</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Dès validation de votre paiement par l'intendance comptable, le bulletin officiel sera automatiquement déverrouillé.
              </p>
            </div>
          ) : (
            /* UNLOCKED BULLETIN (WHEN TUITION IS 100% SOLDÉ) */
            <>
              {/* Top Banner */}
              <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Scolarité Soldée (100%) • Bulletin Trimestriel Officiel Débloqué</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
                    Bulletin de Notes de {child?.firstName} {child?.lastName}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                    Document officiel homologué par le Conseil de Classe et le Proviseur • Moyenne générale : <strong className="text-emerald-400 font-mono text-sm">{overallAverage} / 20</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadChildBulletin}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                    title="Télécharger le bulletin officiel au format A4"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exporter en PDF (A4)</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setReportCardStudent(child)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Visionneuse Plein Écran</span>
                  </motion.button>
                </div>
              </div>

              {/* Academic Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
                  <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Moyenne Générale</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
                    {overallAverage} <span className="text-xs text-slate-500 font-normal">/ 20</span>
                  </div>
                  <div className="text-[11px] text-emerald-500 mt-1 font-semibold">
                    Félicitations du Conseil de Classe
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
                  <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Classement Division</span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">
                    1ère <span className="text-xs text-slate-500 font-normal">/ 35 élèves</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Major de promotion • {childClass?.name}
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
                  <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Assiduité Trimestrielle</span>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono mt-1">
                    {unjustifiedAbsences === 0 ? '100%' : '95.5%'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {absencesCount} absence(s) dont {justifiedAbsences} justifiée(s)
                  </div>
                </div>
              </div>

              {/* Printable Table */}
              <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
                <div className="p-4 bg-slate-950 flex justify-between items-center border-b border-slate-800">
                  <h3 className="font-bold text-white text-xs sm:text-sm">Relevé Analytique par Matière & Appréciations Pédagogiques</h3>
                  <span className="text-xs text-slate-400 font-mono">{subjectsData.length} disciplines</span>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[700px] text-xs text-left">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Matière</th>
                        <th className="p-3.5 text-center">Coeff</th>
                        <th className="p-3.5 text-center">Moyenne Élève</th>
                        <th className="p-3.5 text-center">Moyenne Classe</th>
                        <th className="p-3.5">Appréciations & Conseils Pédagogiques</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {subjectsData.map(item => (
                        <tr key={item.subject.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3.5 font-bold text-white">
                            <div>{item.subject.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal capitalize">{item.subject.category}</div>
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-300">
                            {item.subject.coefficient}
                          </td>
                          <td className="p-3.5 text-center font-mono font-black text-sm text-cyan-400">
                            {item.average} / 20
                          </td>
                          <td className="p-3.5 text-center font-mono text-slate-400">
                            13.50 / 20
                          </td>
                          <td className="p-3.5 text-slate-300 text-[11px] sm:text-xs">
                            {item.average >= 16 
                              ? "Excellente maîtrise des notions. Rigueur et curiosité intellectuelle exemplaires." 
                              : item.average >= 14 
                              ? "Très bon travail d'ensemble, continuez avec la même constance." 
                              : "Résultats satisfaisants. Poursuivre les efforts."}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* TAB: FINANCE & REÇUS                                     */}
      {/* ======================================================== */}
      {activeTab === 'finance' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Top Banner */}
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Scolarité & Facturation • Année 2025-2026</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
                Frais de Scolarité & Quittances de Caisse
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Consultez vos reçus certifiés et suivez l'état des règlements pour {child?.firstName}.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                isTuitionSolded 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {isTuitionSolded ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isTuitionSolded ? 'Scolarité Soldée à 100%' : 'Règlement Partiel (En cours)'}</span>
              </span>
            </div>
          </div>

          {/* Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Scolarité Annuelle</span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                {totalTuition.toLocaleString()} <span className="text-xs text-slate-400 font-normal">FCFA</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Classe : {childClass?.name}</div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Total Encaissé / Réglé</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
                {paidTuition.toLocaleString()} <span className="text-xs text-slate-400 font-normal">FCFA</span>
              </div>
              <div className="text-[11px] text-emerald-500 mt-1 font-medium">Quittances de caisse certifiées</div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">Reste à Payer</span>
              <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${tuitionBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {tuitionBalance.toLocaleString()} <span className="text-xs text-slate-400 font-normal">FCFA</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {tuitionBalance === 0 ? '✓ Aucun arriéré de paiement' : '⚠️ Échéance en cours pour débloquer le bulletin'}
              </div>
            </div>
          </div>

          {/* Receipts History */}
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-xs sm:text-sm">Historique des Règlements & Quittances Officielles</h3>
                <p className="text-[11px] text-slate-400">Chaque paiement fait l'objet d'un reçu officiel horodaté</p>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[650px] text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">N° Quittance</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Mode de Règlement</th>
                    <th className="p-3.5 text-right">Montant Encaissé</th>
                    <th className="p-3.5">Agent Comptable</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {childPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-emerald-400">
                        {p.receiptNumber}
                      </td>
                      <td className="p-3.5 text-slate-300 font-mono">{p.date}</td>
                      <td className="p-3.5 capitalize font-medium text-slate-200">
                        {p.method === 'virement' ? 'Virement Bancaire' : p.method === 'especes' ? 'Espèces' : p.method}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-white text-sm">
                        {p.amount.toLocaleString()} FCFA
                      </td>
                      <td className="p-3.5 text-slate-400">{p.recordedBy}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActivePaymentReceipt(p)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Voir Reçu</span>
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => exportPaymentReceiptPdf(p, child, childClass)}
                            className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                            title="Télécharger PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {childPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Aucune quittance n'est encore enregistrée pour cet élève.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* TAB: PORTAL (NOTES & PROGRESSION) — DEFAULT              */}
      {/* ======================================================== */}
      {activeTab === 'portal' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Main Hero Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-violet-950/20 to-slate-900 border border-violet-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
          >
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-violet-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Portail Famille & Parents d'Élèves</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
                Suivi Scolaire de {child?.firstName} {child?.lastName}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Classe : <strong className="text-cyan-400">{childClass?.name}</strong> • Matricule : <strong className="text-slate-200 font-mono">{child?.matricule}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleOpenJustify()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-violet-300 border border-violet-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                <span>Justifier Absence</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  if (isTuitionSolded) {
                    setReportCardStudent(child);
                  } else {
                    setActiveTab('reportCard');
                  }
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all cursor-pointer ${
                  isTuitionSolded 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-950/50' 
                    : 'bg-amber-600/80 hover:bg-amber-600 border border-amber-500/50 shadow-amber-950/50'
                }`}
              >
                {isTuitionSolded ? <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span>{isTuitionSolded ? 'Bulletin Officiel (PDF)' : 'Bulletin (🔒 Verrouillé)'}</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Highlights KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            
            {/* Moyenne */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Moyenne Générale</span>
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              </div>
              <div className="my-1.5 sm:my-2">
                <div className="text-xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {overallAverage} <span className="text-[11px] sm:text-xs text-slate-500 font-normal">/ 20</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-emerald-500 font-medium">Félicitations du Conseil</div>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">Trimestre 2 • Validé</span>
            </motion.div>

            {/* Rang */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Rang Division</span>
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              </div>
              <div className="my-1.5 sm:my-2">
                <div className="text-xl sm:text-3xl font-black text-amber-400 font-mono">
                  1ère <span className="text-[11px] sm:text-xs text-slate-500 font-normal">/ 35</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Major de Promotion</div>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">{childClass?.name}</span>
            </motion.div>

            {/* Assiduité */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Assiduité</span>
                <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              </div>
              <div className="my-1.5 sm:my-2">
                <div className="text-xl sm:text-3xl font-black text-cyan-400 font-mono">
                  {unjustifiedAbsences === 0 ? '100%' : '95%'}
                </div>
                <div className="text-[10px] sm:text-[11px] text-cyan-300 font-medium">
                  {unjustifiedAbsences > 0 ? `${unjustifiedAbsences} non justifiée(s)` : 'Aucune absence injustifiée'}
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">{absencesCount} séance(s) signalée(s)</span>
            </motion.div>

            {/* Frais de scolarité */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => setActiveTab('finance')}
              className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between cursor-pointer hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Scolarité</span>
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              </div>
              <div className="my-1.5 sm:my-2">
                <div className={`text-xl sm:text-3xl font-black font-mono ${isTuitionSolded ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isTuitionSolded ? 'Soldé' : `${tuitionBalance.toLocaleString()} F`}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-300 font-medium">
                  {isTuitionSolded ? 'Quittances 100% à jour' : 'Solde partiel à régler'}
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] text-violet-400 font-mono flex items-center gap-1">
                <span>Voir reçus</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </motion.div>
          </div>

          {/* Academic Performance by Subject */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 sm:space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">Moyennes Pédagogiques par Discipline</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">Trimestre 2 • Relevé officiel de {child?.firstName}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  if (isTuitionSolded) setReportCardStudent(child);
                  else setActiveTab('reportCard');
                }}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isTuitionSolded ? 'Voir Bulletin Officiel' : 'Bulletin (🔒 Verrouillé)'}</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {subjectsData.map((item, idx) => (
                <motion.div 
                  key={item.subject.id} 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.04 * idx, duration: 0.25 }}
                  whileHover={{ y: -2 }}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-200 text-xs">{item.subject.name}</span>
                    <span className="text-xs font-mono font-black text-cyan-400">{item.average} / 20</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.average / 20) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 * idx }}
                      className={`h-1.5 rounded-full ${item.average >= 16 ? 'bg-emerald-400' : item.average >= 12 ? 'bg-cyan-400' : 'bg-amber-400'}`}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Coeff: {item.subject.coefficient}</span>
                    <span className="capitalize">{item.subject.category}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Evaluations Detail */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl"
          >
            <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-xs sm:text-sm">Détail des Dernières Évaluations Publiées</h3>
              <span className="text-[11px] text-slate-400">{childGrades.length} note(s) certifiée(s)</span>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[620px] text-xs text-left">
                <thead className="bg-slate-950/50 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Évaluation</th>
                    <th className="p-3.5">Matière</th>
                    <th className="p-3.5 text-center">Coeff</th>
                    <th className="p-3.5 text-center">Note Obtenue</th>
                    <th className="p-3.5">Statut Certification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {childGrades.map((g, idx) => {
                    const subj = subjects.find(s => s.id === g.subjectId);
                    return (
                      <motion.tr 
                        key={g.id} 
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * idx, duration: 0.2 }}
                        className="hover:bg-slate-800/40"
                      >
                        <td className="p-3.5 text-slate-400 font-mono">{g.date}</td>
                        <td className="p-3.5 font-bold text-white">{g.assessmentName}</td>
                        <td className="p-3.5 text-cyan-400">{subj?.name}</td>
                        <td className="p-3.5 text-center font-bold text-slate-300">{g.coefficient}</td>
                        <td className="p-3.5 text-center font-mono font-black text-sm text-cyan-400">
                          {g.score} / 20
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Note certifiée
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Justification Modal */}
      <ParentAbsenceJustificationModal
        isOpen={isJustifyModalOpen}
        onClose={() => setIsJustifyModalOpen(false)}
        child={child}
        preselectedRecord={selectedRecordToJustify}
      />

    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck, 
  Users, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Check, 
  Plus, 
  Calendar,
  Sparkles,
  School,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { exportToCsv } from '../../utils/csvExport';
import { exportAttendanceReport, generateAbsenceJustificatifPdf } from '../../utils/reportExporter';
import { AttendanceRecord, AttendanceStatus } from '../../types';
import { AttendanceTrendsWidget } from './AttendanceTrendsWidget';
import { AttendanceModal } from './AttendanceModal';
import { ChevronDown } from 'lucide-react';
import { QuickExportButton } from '../common/QuickExportButton';

interface AttendanceManagementViewProps {
  userRole?: 'admin' | 'proviseur';
}

export const AttendanceManagementView: React.FC<AttendanceManagementViewProps> = ({ userRole = 'admin' }) => {
  const { 
    attendance, 
    students, 
    classes, 
    users, 
    updateAttendanceStatus, 
    recordAttendance, 
    openExportModal,
    t 
  } = useApp();

  // Filters
  const [targetType, setTargetType] = useState<'student' | 'teacher'>('student');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unjustified' | 'justified' | 'retard'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'month' | 'trimester'>('month');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // New Record Dialog state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState<boolean>(false);
  const [newTargetId, setNewTargetId] = useState<string>(students[0]?.id || '');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('absent');
  const [newIsJustified, setNewIsJustified] = useState<boolean>(false);
  const [newReason, setNewReason] = useState<string>('');

  const handleGenerateJustificatif = (rec: AttendanceRecord) => {
    const std = students.find(s => s.id === rec.targetId);
    if (!std) return;
    const cls = classes.find(c => c.id === (std.classId || rec.classId));
    generateAbsenceJustificatifPdf({
      student: std,
      schoolClass: cls,
      record: rec,
      attendanceHistory: attendance
    });
  };

  // Filter attendance records
  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      // Target Type
      if (a.targetType !== targetType) return false;

      // Class Filter (only for students)
      if (targetType === 'student' && selectedClassId !== 'all') {
        const student = students.find(s => s.id === a.targetId);
        if (student?.classId !== selectedClassId && a.classId !== selectedClassId) return false;
      }

      // Status Filter
      if (statusFilter === 'unjustified' && (a.status !== 'absent' || a.isJustified)) return false;
      if (statusFilter === 'justified' && (!a.isJustified || a.status !== 'absent')) return false;
      if (statusFilter === 'retard' && a.status !== 'retard') return false;

      // Period Filter
      const todayStr = new Date().toISOString().split('T')[0];
      if (periodFilter === 'today' && a.date !== todayStr) return false;
      if (periodFilter === 'month' && !a.date.startsWith('2026-03')) return false;

      // Search Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        if (targetType === 'student') {
          const student = students.find(s => s.id === a.targetId);
          const fullName = `${student?.firstName} ${student?.lastName} ${student?.matricule}`.toLowerCase();
          if (!fullName.includes(query)) return false;
        } else {
          const teacher = users.find(u => u.id === a.targetId);
          const fullName = `${teacher?.name} ${teacher?.email}`.toLowerCase();
          if (!fullName.includes(query)) return false;
        }
      }

      return true;
    });
  }, [attendance, targetType, selectedClassId, statusFilter, periodFilter, searchTerm, students, users]);

  // Global Statistics
  const stats = useMemo(() => {
    const studentRecords = attendance.filter(a => a.targetType === 'student');
    const totalAbsences = studentRecords.filter(a => a.status === 'absent').length;
    const unjustifiedAbsences = studentRecords.filter(a => a.status === 'absent' && !a.isJustified).length;
    const justifiedAbsences = studentRecords.filter(a => a.status === 'absent' && a.isJustified).length;
    const totalRetards = studentRecords.filter(a => a.status === 'retard').length;

    // Approximate overall attendance rate across the school
    const estimatedTotalSessions = Math.max(1, students.length * 40);
    const attendedSessions = estimatedTotalSessions - totalAbsences;
    const attendanceRate = Number(((attendedSessions / estimatedTotalSessions) * 100).toFixed(1));

    return {
      totalAbsences,
      unjustifiedAbsences,
      justifiedAbsences,
      totalRetards,
      attendanceRate
    };
  }, [attendance, students]);

  // Class ranking by attendance
  const classRanking = useMemo(() => {
    return classes.map(c => {
      const classStd = students.filter(s => s.classId === c.id);
      const classStdIds = new Set(classStd.map(s => s.id));
      const classAtt = attendance.filter(a => classStdIds.has(a.targetId) || a.classId === c.id);
      const absCount = classAtt.filter(a => a.status === 'absent').length;
      const rate = Math.max(88, Number((100 - (absCount * 1.8)).toFixed(1)));
      return {
        class: c,
        studentCount: classStd.length,
        absenceCount: absCount,
        rate
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [classes, students, attendance]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Heure / Séance',
      'Type',
      'Matricule / Identifiant',
      'Nom & Prénoms',
      'Classe',
      'Statut',
      'Justifié ?',
      'Motif / Justification',
      'Document Justificatif',
      'Enregistré par'
    ];

    const rows = filteredAttendance.map(a => {
      let name = '';
      let matricule = '';
      let className = '';

      if (a.targetType === 'student') {
        const std = students.find(s => s.id === a.targetId);
        name = `${std?.lastName} ${std?.firstName}`;
        matricule = std?.matricule || '';
        className = classes.find(c => c.id === std?.classId)?.name || '';
      } else {
        const tch = users.find(u => u.id === a.targetId);
        name = tch?.name || '';
        matricule = tch?.id || '';
        className = 'Personnel Enseignant';
      }

      return [
        a.date,
        a.timeSlot || a.sessionName || 'Journée',
        a.targetType === 'student' ? 'Élève' : 'Enseignant',
        matricule,
        name,
        className,
        a.status === 'present' ? 'Présent' : a.status === 'absent' ? 'Absent' : 'Retard',
        a.isJustified ? 'Oui' : 'Non',
        a.reason || 'Aucun motif',
        a.justificationDocument || 'Aucun document',
        a.recordedBy
      ];
    });

    exportToCsv(`plume_assiduite_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  // Add Attendance Entry Handler
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordAttendance({
      targetId: newTargetId,
      targetType: targetType,
      date: newDate,
      timeSlot: '08h00 - 10h00',
      status: newStatus,
      isJustified: newIsJustified,
      reason: newReason || (newStatus === 'absent' ? 'Absence administrative enregistrée' : undefined)
    });
    setShowAddModal(false);
    setNewReason('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            <CalendarCheck className="w-4 h-4" />
            <span>Gestion de la Vie Scolaire • Contrôle d'Assiduité</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Assiduité, Absences & Justificatifs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervision centralisée des présences de l'ensemble de l'établissement (de la Maternelle à la Terminale).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAttendanceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Lancer l'Appel (Modal)</span>
          </motion.button>

          <QuickExportButton 
            reportType="attendance"
            classId={selectedClassId}
            label="Exporter Registre d'Assiduité"
            variant="cyan"
          />

          {userRole === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Saisir une Absence</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase text-slate-400">Taux d'Assiduité Global</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-cyan-400 font-mono mt-2">{stats.attendanceRate}%</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1">Excellent niveau de présence</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase text-slate-400">Absences Non Justifiées</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono mt-2">{stats.unjustifiedAbsences}</div>
          <div className="text-[11px] text-rose-400 mt-1">En attente de justificatif des parents</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase text-slate-400">Absences Justifiées</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-2">{stats.justifiedAbsences}</div>
          <div className="text-[11px] text-slate-400 mt-1">Certificats médicaux & motifs validés</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase text-slate-400">Retards Constatés</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono mt-2">{stats.totalRetards}</div>
          <div className="text-[11px] text-slate-400 mt-1">Enregistrés lors des séances</div>
        </motion.div>
      </div>

      {/* Interactive Attendance Trends Curve Widget */}
      <AttendanceTrendsWidget />

      {/* Target Toggle & Filter Toolbar */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        
        {/* Toggle Student / Staff */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setTargetType('student')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                targetType === 'student' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Élèves ({students.length})
            </button>
            <button
              onClick={() => setTargetType('teacher')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                targetType === 'teacher' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Enseignants & Personnel ({users.filter(u => u.role === 'enseignant').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Période :</span>
            {(['today', 'month', 'trimester', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  periodFilter === p ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === 'today' ? "Aujourd'hui" : p === 'month' ? 'Ce Mois' : p === 'trimester' ? 'Trimestre 2' : 'Toutes'}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {targetType === 'student' && (
            <div>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Toutes les classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Tous les états</option>
              <option value="unjustified">🚨 Absences Non Justifiées</option>
              <option value="justified">✅ Absences Justifiées</option>
              <option value="retard">⏱️ Retards uniquement</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-slate-400 font-mono text-xs">
            {filteredAttendance.length} événement(s) listé(s)
          </div>

        </div>
      </div>

      {/* Main Attendance Records Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 flex justify-between items-center border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">
            Registre d'Assiduité Numérique • {targetType === 'student' ? 'Élèves' : 'Personnel'}
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Plume Security & Compliance Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Date & Séance</th>
                <th className="p-3.5">Bénéficiaire</th>
                <th className="p-3.5">Classe / Rôle</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5">Justification & Pièce</th>
                <th className="p-3.5">Enregistré par</th>
                <th className="p-3.5 text-right">Actions & Justificatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAttendance.map((rec) => {
                let name = '';
                let matricule = '';
                let className = '';

                if (rec.targetType === 'student') {
                  const std = students.find(s => s.id === rec.targetId);
                  name = `${std?.lastName} ${std?.firstName}`;
                  matricule = std?.matricule || '';
                  className = classes.find(c => c.id === std?.classId)?.name || '';
                } else {
                  const tch = users.find(u => u.id === rec.targetId);
                  name = tch?.name || '';
                  matricule = tch?.id || '';
                  className = 'Enseignant';
                }

                return (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                    
                    <td className="p-3.5">
                      <div className="font-mono text-slate-300 font-bold">{rec.date}</div>
                      <div className="text-[11px] text-slate-500">{rec.sessionName || rec.timeSlot || 'Séance'}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-100">{name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{matricule}</div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 font-semibold text-[11px]">
                        {className}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {rec.status === 'present' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Présent
                        </span>
                      ) : rec.status === 'retard' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" /> Retard ({rec.lateMinutes || 15}m)
                        </span>
                      ) : rec.isJustified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Absence Justifiée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Non Justifiée
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="text-slate-300 font-medium">
                        {rec.reason || (rec.status === 'absent' ? 'Motif non communiqué' : '—')}
                      </div>
                      {rec.justificationDocument && (
                        <div className="flex items-center gap-1 text-[11px] text-cyan-400 mt-0.5">
                          <FileText className="w-3 h-3" />
                          <span>{rec.justificationDocument}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {rec.recordedBy}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {rec.status === 'absent' && rec.targetType === 'student' && (
                          <button
                            onClick={() => handleGenerateJustificatif(rec)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            title="Télécharger le document PDF officiel de justification pour les parents"
                          >
                            <Download className="w-3 h-3 text-cyan-400" />
                            <span>Générer justificatif</span>
                          </button>
                        )}

                        {userRole === 'admin' && rec.status === 'absent' && !rec.isJustified && (
                          <button
                            onClick={() => updateAttendanceStatus(rec.id, 'absent', true, 'Justification validée par l\'Administration')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 transition-all cursor-pointer"
                          >
                            Valider motif
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Aucun enregistrement d'assiduité ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Attendance Ranking Widget */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white text-base">Palmarès d'Assiduité par Classe</h3>
            <p className="text-xs text-slate-400">Classement en temps réel basé sur le ratio présence / volume horaire.</p>
          </div>
          <span className="text-xs text-cyan-400 font-mono font-bold">Moyenne établissement: {stats.attendanceRate}%</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classRanking.map((cr, idx) => (
            <motion.div
              key={cr.class.id}
              whileHover={{ y: -2 }}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-500">#{idx + 1}</span>
                  <span className="font-bold text-white text-xs">{cr.class.name}</span>
                </div>
                <span className={`text-xs font-mono font-black ${cr.rate >= 95 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  {cr.rate}%
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full ${cr.rate >= 95 ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                  style={{ width: `${cr.rate}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{cr.studentCount} élèves</span>
                <span>{cr.absenceCount} absence(s) totale(s)</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Admin Add Attendance Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">Enregistrer une Absence Administrative</h3>
                </div>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Élève concerné *</label>
                  <select
                    value={newTargetId}
                    onChange={(e) => setNewTargetId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {students.map(s => {
                      const cName = classes.find(c => c.id === s.classId)?.name;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.lastName} {s.firstName} ({cName} - {s.matricule})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Statut *</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="absent">Absent</option>
                      <option value="retard">En retard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Motif de l'absence / explication</label>
                  <input
                    type="text"
                    placeholder="Ex: Rendez-vous chez l'orthodontiste, grippe..."
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isJustifiedCb"
                    checked={newIsJustified}
                    onChange={(e) => setNewIsJustified(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-950 border-slate-800"
                  />
                  <label htmlFor="isJustifiedCb" className="text-slate-300 font-medium">
                    Justificatif physique reçu et validé par la Direction
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Attendance Modal */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
      />

    </motion.div>
  );
};

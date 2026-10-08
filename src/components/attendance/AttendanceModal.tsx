import React, { useState, useMemo } from 'react';
import { 
  X, 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Save, 
  Users, 
  School, 
  FileText, 
  AlertTriangle,
  ChevronDown,
  Paperclip,
  ShieldCheck,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { INITIAL_SUBJECTS } from '../../data/mockData';
import { AttendanceStatus, SchoolClass, Student } from '../../types';
import { generateAbsenceJustificatifPdf } from '../../utils/reportExporter';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClassId?: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  defaultClassId
}) => {
  const { 
    currentUser, 
    classes, 
    students, 
    attendance, 
    recordBatchAttendance 
  } = useApp();

  // Filter allowed classes
  const assignedClassIds = currentUser?.assignedClasses;
  const allowedClasses = useMemo(() => {
    if (currentUser?.role === 'enseignant' && assignedClassIds && assignedClassIds.length > 0) {
      return classes.filter(c => assignedClassIds.includes(c.id));
    }
    return classes;
  }, [classes, currentUser, assignedClassIds]);

  const assignedSubjectIds = currentUser?.assignedSubjects;
  const allowedSubjects = useMemo(() => {
    if (currentUser?.role === 'enseignant' && assignedSubjectIds && assignedSubjectIds.length > 0) {
      return INITIAL_SUBJECTS.filter(s => assignedSubjectIds.includes(s.id));
    }
    return INITIAL_SUBJECTS;
  }, [currentUser, assignedSubjectIds]);

  // Session selection state
  const [selectedClassId, setSelectedClassId] = useState<string>(
    defaultClassId || allowedClasses[0]?.id || classes[0]?.id || ''
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    allowedSubjects[0]?.id || INITIAL_SUBJECTS[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState<string>('08h00 - 10h00');

  // Search filter inside modal
  const [studentSearch, setStudentSearch] = useState('');

  // Class students
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return classStudents;
    const q = studentSearch.toLowerCase();
    return classStudents.filter(s => 
      s.lastName.toLowerCase().includes(q) || 
      s.firstName.toLowerCase().includes(q) ||
      s.matricule.toLowerCase().includes(q)
    );
  }, [classStudents, studentSearch]);

  // Student Attendance Map
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; lateMinutes: number; reason: string }>>({});

  // Reset or populate map on class / date change
  React.useEffect(() => {
    const map: Record<string, { status: AttendanceStatus; lateMinutes: number; reason: string }> = {};
    classStudents.forEach(s => {
      const existing = attendance.find(a => 
        a.targetId === s.id && 
        a.date === selectedDate && 
        (a.timeSlot === timeSlot || a.classId === selectedClassId)
      );

      if (existing) {
        map[s.id] = {
          status: existing.status,
          lateMinutes: existing.lateMinutes || 0,
          reason: existing.reason || ''
        };
      } else {
        map[s.id] = { status: 'present', lateMinutes: 0, reason: '' };
      }
    });
    setAttendanceMap(map);
  }, [selectedClassId, selectedDate, timeSlot, classStudents]);

  // Quick Action: Mark all present
  const handleMarkAllPresent = () => {
    setAttendanceMap(prev => {
      const next = { ...prev };
      classStudents.forEach(s => {
        next[s.id] = { status: 'present', lateMinutes: 0, reason: '' };
      });
      return next;
    });
  };

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        lateMinutes: status === 'retard' ? (prev[studentId]?.lateMinutes || 10) : 0
      }
    }));
  };

  const handleSetLateMinutes = (studentId: string, minutes: number) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        lateMinutes: minutes
      }
    }));
  };

  const handleSetReason = (studentId: string, reason: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason
      }
    }));
  };

  const handleGenerateJustificatif = (std: Student) => {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    const selectedSubject = INITIAL_SUBJECTS.find(s => s.id === selectedSubjectId);
    generateAbsenceJustificatifPdf({
      student: std,
      schoolClass: selectedClass,
      date: selectedDate,
      timeSlot: timeSlot,
      subjectName: selectedSubject?.name,
      teacherName: currentUser?.name,
      attendanceHistory: attendance
    });
  };

  // Live Statistics
  const stats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    classStudents.forEach(s => {
      const st = attendanceMap[s.id]?.status || 'present';
      if (st === 'present') presentCount++;
      else if (st === 'absent') absentCount++;
      else if (st === 'retard') lateCount++;
    });

    const total = classStudents.length || 1;
    const rate = Math.round((presentCount / total) * 100);

    return { presentCount, absentCount, lateCount, rate, total: classStudents.length };
  }, [attendanceMap, classStudents]);

  // Submit
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = () => {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    const selectedSubject = INITIAL_SUBJECTS.find(s => s.id === selectedSubjectId);

    const records = classStudents.map(s => {
      const data = attendanceMap[s.id] || { status: 'present', lateMinutes: 0, reason: '' };
      return {
        targetId: s.id,
        targetType: 'student' as const,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        sessionName: `${selectedSubject?.name || 'Séance'} • ${timeSlot}`,
        date: selectedDate,
        timeSlot: timeSlot,
        status: data.status,
        lateMinutes: data.status === 'retard' ? data.lateMinutes : undefined,
        isJustified: false,
        reason: data.reason || (data.status === 'absent' ? 'Absence constatée à l\'appel' : undefined),
      };
    });

    recordBatchAttendance(records);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  const currentClass = classes.find(c => c.id === selectedClassId);
  const currentSubject = INITIAL_SUBJECTS.find(s => s.id === selectedSubjectId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 25 }}
          transition={{ type: "spring", damping: 25, stiffness: 320 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6 z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <span>Feuille d'Appel Numérique</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    {currentClass?.name}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Prise des présences en temps réel • {currentSubject?.name} • {selectedDate} ({timeSlot})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllPresent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tous Présents</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Configuration & KPI Bar */}
          <div className="p-5 bg-slate-950/60 border-b border-slate-800/80 space-y-4 shrink-0">
            {/* Pickers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Classe</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                >
                  {allowedClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Matière</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold focus:outline-none focus:border-cyan-500"
                >
                  {allowedSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Créneau</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="08h00 - 10h00">08h00 - 10h00</option>
                  <option value="10h15 - 12h15">10h15 - 12h15</option>
                  <option value="14h00 - 16h00">14h00 - 16h00</option>
                  <option value="16h15 - 18h15">16h15 - 18h15</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Live Stats Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
                  Taux de présence : {stats.rate}%
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                  {stats.presentCount} Présent(s)
                </span>
                <span className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">
                  {stats.absentCount} Absent(s)
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                  {stats.lateCount} Retard(s)
                </span>
              </div>

              <input
                type="text"
                placeholder="Filtrer élève..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-48 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>
          </div>

          {/* Students Roster (Scrollable) */}
          <div className="overflow-y-auto flex-1 p-5 space-y-2.5">
            {filteredStudents.map((std, idx) => {
              const current = attendanceMap[std.id] || { status: 'present', lateMinutes: 0, reason: '' };

              return (
                <motion.div
                  key={std.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">
                      {std.firstName[0]}{std.lastName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs sm:text-sm">
                        {std.lastName} {std.firstName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {std.matricule} • N°{idx + 1}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Selector */}
                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Status Pill Toggle */}
                    <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      
                      {/* Present */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(std.id, 'present')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all ${
                          current.status === 'present'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Présent</span>
                      </button>

                      {/* Late */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(std.id, 'retard')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all ${
                          current.status === 'retard'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Retard</span>
                      </button>

                      {/* Absent */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(std.id, 'absent')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all ${
                          current.status === 'absent'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>
                    </div>

                    {/* Late Minutes or Reason input */}
                    {current.status === 'retard' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Retard :</span>
                        {[5, 10, 15, 30].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSetLateMinutes(std.id, m)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                              current.lateMinutes === m 
                                ? 'bg-amber-500 text-slate-950 font-black' 
                                : 'bg-slate-900 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            +{m}m
                          </button>
                        ))}
                      </div>
                    )}

                    {current.status === 'absent' && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <input
                          type="text"
                          placeholder="Motif constaté..."
                          value={current.reason}
                          onChange={(e) => handleSetReason(std.id, e.target.value)}
                          className="w-32 sm:w-40 px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-rose-300 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleGenerateJustificatif(std)}
                          className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          title="Télécharger le document PDF officiel de justification pour les parents"
                        >
                          <Download className="w-3 h-3 text-cyan-400" />
                          <span>Générer justificatif</span>
                        </button>
                      </div>
                    )}

                  </div>
                </motion.div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                Aucun élève trouvé pour cette sélection.
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Feuille certifiée par {currentUser?.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Annuler
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaved ? 'Enregistré avec succès !' : 'Valider & Transmettre l\'Appel'}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

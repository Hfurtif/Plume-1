import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save, 
  Users, 
  School, 
  BookOpen, 
  Sparkles,
  AlertTriangle,
  ChevronDown,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { INITIAL_SUBJECTS, INITIAL_TIMETABLE } from '../../data/mockData';
import { AttendanceStatus, Student } from '../../types';
import { generateAbsenceJustificatifPdf } from '../../utils/reportExporter';

export const TeacherAttendanceSheet: React.FC = () => {
  const { 
    currentUser, 
    classes, 
    students, 
    attendance, 
    recordBatchAttendance 
  } = useApp();

  // Assigned classes and subjects
  const assignedClassIds = currentUser?.assignedClasses || ['cls-tc', 'cls-td'];
  const assignedSubjectIds = currentUser?.assignedSubjects || ['sub-math', 'sub-phy'];

  const allowedClasses = classes.filter(c => assignedClassIds.includes(c.id));
  const allowedSubjects = INITIAL_SUBJECTS.filter(s => assignedSubjectIds.includes(s.id));

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState<string>(allowedClasses[0]?.id || classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(allowedSubjects[0]?.id || INITIAL_SUBJECTS[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState<string>('08h00 - 10h00');

  // Students in selected class
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Attendance status map: studentId -> { status: AttendanceStatus, lateMinutes: number, reason: string }
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; lateMinutes: number; reason: string }>>(() => {
    const map: Record<string, { status: AttendanceStatus; lateMinutes: number; reason: string }> = {};
    classStudents.forEach(s => {
      map[s.id] = { status: 'present', lateMinutes: 0, reason: '' };
    });
    return map;
  });

  // Reset or initialize when class or date changes
  React.useEffect(() => {
    const map: Record<string, { status: AttendanceStatus; lateMinutes: number; reason: string }> = {};
    classStudents.forEach(s => {
      // Check existing record for this student and date
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

  // Quick action: Mark all present
  const handleMarkAllPresent = () => {
    setAttendanceMap(prev => {
      const next = { ...prev };
      classStudents.forEach(s => {
        next[s.id] = { status: 'present', lateMinutes: 0, reason: '' };
      });
      return next;
    });
  };

  // Update single student
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

  // Save submission
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
        sessionName: `${selectedSubject?.name || 'Cours'} • ${timeSlot}`,
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
    setTimeout(() => setIsSaved(false), 3500);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSubject = INITIAL_SUBJECTS.find(s => s.id === selectedSubjectId);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <CalendarCheck className="w-4 h-4" />
            <span>Feuille d'Appel Numérique • Prise des Présences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Faire l'Appel de la Séance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enregistrez les présences, absences et retards en direct. Les données sont automatiquement transmises à l'Administration et aux Parents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMarkAllPresent}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-cyan-500/30 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Tous Présents</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Valider l'Appel</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Confirmation feedback toast */}
      <AnimatePresence>
        {isSaved && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Feuille d'appel validée avec succès !</strong> {stats.presentCount} présent(s), {stats.absentCount} absent(s), {stats.lateCount} retard(s) enregistrés pour la classe {selectedClass?.name}.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">Synchronisé</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Configuration Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Classe</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
            >
              {allowedClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Matière</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
            >
              {allowedSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Créneau Horaire</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="08h00 - 10h00">08h00 - 10h00</option>
              <option value="10h15 - 12h15">10h15 - 12h15</option>
              <option value="14h00 - 16h00">14h00 - 16h00</option>
              <option value="16h15 - 18h15">16h15 - 18h15</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Date de la séance</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>
      </div>

      {/* Live Attendance Rate Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400">Taux de présence</span>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">{stats.rate}%</div>
          <div className="text-[10px] text-slate-500 mt-1">{stats.total} élèves inscrits</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400">Présents en classe</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{stats.presentCount}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">À l'heure</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400">Absents signalés</span>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">{stats.absentCount}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">À notifier aux familles</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400">Retards enregistrés</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">{stats.lateCount}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">Avec temps de retard</div>
        </motion.div>
      </div>

      {/* Student List Table with Interactive Status Selectors */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">
              Liste d'Appel • {selectedClass?.name} ({classStudents.length} élèves)
            </h3>
            <span className="text-[11px] text-slate-400">
              {selectedSubject?.name} • Séance du {selectedDate} ({timeSlot})
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Cliquez sur le statut pour modifier l'état de présence
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">N°</th>
                <th className="p-3.5">Matricule</th>
                <th className="p-3.5">Nom & Prénoms</th>
                <th className="p-3.5 text-center">Statut d'Appel</th>
                <th className="p-3.5">Détail du Retard / Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {classStudents.map((std, idx) => {
                const current = attendanceMap[std.id] || { status: 'present', lateMinutes: 0, reason: '' };

                return (
                  <tr key={std.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-3.5 font-mono text-slate-400">{std.matricule}</td>
                    <td className="p-3.5 font-bold text-slate-100">
                      {std.lastName} {std.firstName}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Present Button */}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSetStatus(std.id, 'present')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all ${
                            current.status === 'present'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Présent</span>
                        </motion.button>

                        {/* Late Button */}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSetStatus(std.id, 'retard')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all ${
                            current.status === 'retard'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Retard</span>
                        </motion.button>

                        {/* Absent Button */}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSetStatus(std.id, 'absent')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all ${
                            current.status === 'absent'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </motion.button>

                      </div>
                    </td>

                    <td className="p-3.5">
                      {current.status === 'retard' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Retard de :</span>
                          {[5, 10, 15, 20, 30].map(m => (
                            <button
                              key={m}
                              onClick={() => handleSetLateMinutes(std.id, m)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                                current.lateMinutes === m 
                                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                                  : 'bg-slate-950 text-amber-400 border border-amber-500/30 hover:bg-slate-800'
                              }`}
                            >
                              +{m}m
                            </button>
                          ))}
                        </div>
                      ) : current.status === 'absent' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="text"
                            placeholder="Motif constaté (ex: non justifié, mot d'absence...)"
                            value={current.reason}
                            onChange={(e) => handleSetReason(std.id, e.target.value)}
                            className="w-full max-w-xs px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-rose-300 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleGenerateJustificatif(std)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-sm"
                            title="Télécharger le document PDF officiel de justification pour les parents"
                          >
                            <Download className="w-3 h-3 text-cyan-400" />
                            <span>Générer justificatif</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-400/80 font-medium">À l'heure</span>
                      )}
                    </td>

                  </tr>
                );
              })}

              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Aucun élève trouvé dans cette classe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CheckSquare, 
  Lock, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  School, 
  Clock, 
  HelpCircle,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Download,
  Bell,
  Send,
  X,
  WifiOff,
  Filter,
  Search,
  SlidersHorizontal,
  Layers,
  Calendar,
  Keyboard,
  Zap,
  Wand2,
  RotateCcw,
  BarChart3,
  UserCheck,
  UserX,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { INITIAL_TIMETABLE } from '../../data/mockData';
import { Grade, AssessmentType, Student } from '../../types';
import { TeacherAttendanceSheet } from '../attendance/TeacherAttendanceSheet';
import { AttendanceModal } from '../attendance/AttendanceModal';
import { ClassAnalyticsView } from './ClassAnalyticsView';
import { TeacherCahierDeTextesView } from './TeacherCahierDeTextesView';
import { ClassHubView } from '../classes/ClassHubView';
import { CalendarCheck } from 'lucide-react';
import { QuickExportButton } from '../common/QuickExportButton';
import { generateAbsenceJustificatifPdf } from '../../utils/reportExporter';

interface TeacherViewProps {
  currentTab: string;
  onSelectTab?: (tab: string) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({ currentTab, onSelectTab }) => {
  const { 
    currentUser, 
    classes, 
    students, 
    subjects, 
    grades, 
    attendance,
    recordAttendance,
    recordBatchAttendance,
    saveGrade, 
    lockAssessmentGrades, 
    addNotification,
    filteredNotifications,
    markNotificationAsRead,
    executeNotificationAction,
    isEffectivelyOffline,
    offlineCacheStatus,
    openExportModal,
    t 
  } = useApp();

  // Teacher permissions: Filter to only this teacher's assigned classes & subjects
  const assignedClassIds = currentUser?.assignedClasses || ['cls-tc', 'cls-td'];
  const assignedSubjectIds = currentUser?.assignedSubjects || [];

  const allowedClasses = classes.filter(c => assignedClassIds.length === 0 || assignedClassIds.includes(c.id));
  const allowedSubjects = useMemo(() => {
    const active = subjects.filter(s => s.isActive !== false);
    // Strict isolation: Teachers only see the subjects assigned to them
    if (assignedSubjectIds.length > 0) {
      return active.filter(s => assignedSubjectIds.includes(s.id));
    }
    return [];
  }, [subjects, assignedSubjectIds]);

  // Dynamic Filters State (Période, Matière, Niveau)
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'T1' | 'T2' | 'T3'>('T2');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [gradeStatusFilter, setGradeStatusFilter] = useState<'all' | 'missing' | 'below_10' | 'above_16'>('all');
  const [isBulkFillOpen, setIsBulkFillOpen] = useState<boolean>(false);
  const [bulkFillScore, setBulkFillScore] = useState<string>('12');

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Filtered classes according to selected level / cycle
  const filteredClasses = useMemo(() => {
    return allowedClasses.filter(c => {
      if (levelFilter === 'all') return true;
      if (levelFilter === 'college') return c.cycle === 'college';
      if (levelFilter === 'lycee') return c.cycle === 'lycee';
      return (c.level && c.level.toLowerCase().includes(levelFilter.toLowerCase())) ||
             c.name.toLowerCase().includes(levelFilter.toLowerCase());
    });
  }, [allowedClasses, levelFilter]);

  // Current Selection
  const [selectedClassId, setSelectedClassId] = useState<string>(allowedClasses[0]?.id || classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(allowedSubjects[0]?.id || '');

  // Keep selectedClassId valid when filteredClasses change
  useEffect(() => {
    if (filteredClasses.length > 0 && !filteredClasses.some(c => c.id === selectedClassId)) {
      setSelectedClassId(filteredClasses[0].id);
    }
  }, [filteredClasses, selectedClassId]);

  // Keep selectedSubjectId valid when allowedSubjects change
  useEffect(() => {
    if (allowedSubjects.length > 0 && !allowedSubjects.some(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(allowedSubjects[0].id);
    }
  }, [allowedSubjects, selectedSubjectId]);

  // Assessment Details
  const [assessmentName, setAssessmentName] = useState<string>('Contrôle Continu N°2');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('devoir');
  const [assessmentCoeff, setAssessmentCoeff] = useState<number>(3);
  const [assessmentTerm, setAssessmentTerm] = useState<'T1' | 'T2' | 'T3'>('T2');
  const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Attendance Modal state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState<boolean>(false);
  const [modalClassId, setModalClassId] = useState<string | undefined>(undefined);

  // Students in this class
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Check if this assessment has already been entered & if it's locked
  const existingAssessmentGrades = useMemo(() => {
    return grades.filter(g => 
      g.classId === selectedClassId && 
      g.subjectId === selectedSubjectId && 
      g.assessmentName === assessmentName &&
      g.term === assessmentTerm
    );
  }, [grades, selectedClassId, selectedSubjectId, assessmentName, assessmentTerm]);

  const isAssessmentLocked = existingAssessmentGrades.length > 0 && existingAssessmentGrades.every(g => g.isLockedByTeacher);

  // Local state for grade entries: studentId -> score
  const [scoresMap, setScoresMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    classStudents.forEach((s, idx) => {
      const existing = grades.find(g => 
        g.studentId === s.id && 
        g.subjectId === selectedSubjectId && 
        g.classId === selectedClassId && 
        g.assessmentName === assessmentName
      );
      map[s.id] = existing ? existing.score : 12 + (idx % 8);
    });
    return map;
  });

  // Keep map updated when class or assessment changes
  React.useEffect(() => {
    const map: Record<string, number> = {};
    classStudents.forEach((s, idx) => {
      const existing = grades.find(g => 
        g.studentId === s.id && 
        g.subjectId === selectedSubjectId && 
        g.classId === selectedClassId && 
        g.assessmentName === assessmentName
      );
      map[s.id] = existing ? existing.score : 13 + (idx % 7);
    });
    setScoresMap(map);
  }, [selectedClassId, selectedSubjectId, assessmentName, classStudents]);

  // Live Stats
  const liveStats = useMemo(() => {
    const scores = Object.values(scoresMap).filter(v => !isNaN(v));
    if (scores.length === 0) return { avg: 0, min: 0, max: 0 };
    const avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    return { avg, min, max };
  }, [scoresMap]);

  // Existing assessments in this class/subject/period for 1-click loading
  const existingAssessments = useMemo(() => {
    const list = grades.filter(g => 
      g.classId === selectedClassId && 
      (!selectedSubjectId || g.subjectId === selectedSubjectId) &&
      (periodFilter === 'all' || g.term === periodFilter)
    );
    const uniqueMap = new Map<string, { name: string; term: 'T1' | 'T2' | 'T3'; type: AssessmentType; coeff: number; isLocked: boolean }>();
    list.forEach(g => {
      if (!uniqueMap.has(g.assessmentName)) {
        uniqueMap.set(g.assessmentName, {
          name: g.assessmentName,
          term: g.term as 'T1' | 'T2' | 'T3',
          type: g.type,
          coeff: g.coefficient,
          isLocked: g.isLockedByTeacher ?? false
        });
      }
    });
    return Array.from(uniqueMap.values());
  }, [grades, selectedClassId, selectedSubjectId, periodFilter]);

  // In-Grid Absence Management Module
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'absents' | 'presents'>('all');

  const [absentStudentIds, setAbsentStudentIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    attendance.forEach(a => {
      if (a.status === 'absent' && a.classId === selectedClassId && (!selectedSubjectId || a.subjectId === selectedSubjectId)) {
        set.add(a.targetId);
      }
    });
    return set;
  });

  // Sync absent students when class/subject/attendance records update
  useEffect(() => {
    const set = new Set<string>();
    attendance.forEach(a => {
      if (a.status === 'absent' && a.classId === selectedClassId && (!selectedSubjectId || a.subjectId === selectedSubjectId)) {
        set.add(a.targetId);
      }
    });
    setAbsentStudentIds(set);
  }, [selectedClassId, selectedSubjectId, attendance]);

  const toggleStudentAbsence = (student: Student) => {
    if (isAssessmentLocked || isEffectivelyOffline) return;

    const isCurrentlyAbsent = absentStudentIds.has(student.id);
    const nextSet = new Set(absentStudentIds);

    if (isCurrentlyAbsent) {
      nextSet.delete(student.id);
      recordAttendance({
        targetType: 'student',
        targetId: student.id,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        date: todayDateStr,
        timeSlot: assessmentName || 'Évaluation / Contrôle continu',
        status: 'present',
        isJustified: false,
        reason: 'Présent en classe'
      });
      addNotification(
        'Présence Rétablie',
        `${student.firstName} ${student.lastName} marqué(e) présent(e).`,
        'absence',
        { roleTarget: 'enseignant', showToast: true }
      );
    } else {
      nextSet.add(student.id);
      recordAttendance({
        targetType: 'student',
        targetId: student.id,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        date: todayDateStr,
        timeSlot: assessmentName || 'Évaluation / Contrôle continu',
        status: 'absent',
        isJustified: false,
        reason: `Absent lors de l'évaluation "${assessmentName}"`
      });
      // Set grade note to 0 for absent student
      setScoresMap(prev => ({
        ...prev,
        [student.id]: 0
      }));
      addNotification(
        'Absence Signalée',
        `${student.firstName} ${student.lastName} est noté(e) absent(e) au cours de ${selectedSubject?.name || 'Matière'}.`,
        'absence',
        { roleTarget: 'enseignant', showToast: true }
      );
    }
    setAbsentStudentIds(nextSet);
  };

  const handleMarkAllPresent = () => {
    if (isAssessmentLocked || isEffectivelyOffline) return;
    const records = classStudents.map(std => ({
      targetType: 'student' as const,
      targetId: std.id,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      date: todayDateStr,
      timeSlot: assessmentName || 'Évaluation / Contrôle',
      status: 'present' as const,
      isJustified: false,
      reason: 'Présent'
    }));
    recordBatchAttendance(records);
    setAbsentStudentIds(new Set());
    addNotification(
      'Appel Validé - Tous Présents',
      `Tous les élèves de ${selectedClass?.name || 'la classe'} ont été marqués présents.`,
      'absence',
      { roleTarget: 'enseignant', showToast: true }
    );
  };

  const handleSaveAttendanceSession = () => {
    if (isAssessmentLocked || isEffectivelyOffline) return;
    const records = classStudents.map(std => {
      const isAbsent = absentStudentIds.has(std.id);
      return {
        targetType: 'student' as const,
        targetId: std.id,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        date: todayDateStr,
        timeSlot: assessmentName || 'Évaluation / Contrôle',
        status: isAbsent ? ('absent' as const) : ('present' as const),
        isJustified: false,
        reason: isAbsent ? `Absent à l'évaluation "${assessmentName}"` : 'Présent'
      };
    });
    recordBatchAttendance(records);
    addNotification(
      'Feuille d\'Émargement Synchronisée',
      `Registre d'appel enregistré pour ${selectedClass?.name} : ${absentStudentIds.size} absent(s) et ${classStudents.length - absentStudentIds.size} présent(s).`,
      'absence',
      { roleTarget: 'enseignant', showToast: true }
    );
  };

  const handleGenerateJustificatif = (student: Student) => {
    generateAbsenceJustificatifPdf({
      student,
      schoolClass: selectedClass,
      date: todayDateStr,
      timeSlot: assessmentName || 'Évaluation / Contrôle continu',
      subjectName: selectedSubject?.name,
      teacherName: currentUser?.name,
      attendanceHistory: attendance
    });
    addNotification(
      'Justificatif Téléchargé',
      `Bordereau officiel d'absence généré pour les parents de ${student.firstName} ${student.lastName}.`,
      'absence',
      { roleTarget: 'enseignant', showToast: true }
    );
  };

  // Filtered students according to search query, grade status and attendance status
  const displayedStudents = useMemo(() => {
    return classStudents.filter(std => {
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchesName = `${std.firstName} ${std.lastName}`.toLowerCase().includes(q);
        const matchesMat = std.matricule.toLowerCase().includes(q);
        if (!matchesName && !matchesMat) return false;
      }
      if (attendanceFilter === 'absents') {
        if (!absentStudentIds.has(std.id)) return false;
      } else if (attendanceFilter === 'presents') {
        if (absentStudentIds.has(std.id)) return false;
      }
      const score = scoresMap[std.id];
      if (gradeStatusFilter === 'missing') {
        return score === undefined || score === 0 || isNaN(score);
      }
      if (gradeStatusFilter === 'below_10') {
        return score !== undefined && score < 10;
      }
      if (gradeStatusFilter === 'above_16') {
        return score !== undefined && score >= 16;
      }
      return true;
    });
  }, [classStudents, studentSearch, gradeStatusFilter, attendanceFilter, absentStudentIds, scoresMap]);

  // Counts for rapid grading filter badges
  const missingCount = useMemo(() => {
    return classStudents.filter(s => {
      const sc = scoresMap[s.id];
      return sc === undefined || sc === 0 || isNaN(sc);
    }).length;
  }, [classStudents, scoresMap]);

  const below10Count = useMemo(() => {
    return classStudents.filter(s => {
      const sc = scoresMap[s.id];
      return sc !== undefined && sc < 10;
    }).length;
  }, [classStudents, scoresMap]);

  const above16Count = useMemo(() => {
    return classStudents.filter(s => {
      const sc = scoresMap[s.id];
      return sc !== undefined && sc >= 16;
    }).length;
  }, [classStudents, scoresMap]);

  // Bulk set score for displayed students
  const handleApplyBulkScore = () => {
    const val = parseFloat(bulkFillScore);
    if (isNaN(val) || val < 0 || val > 20) return;
    setScoresMap(prev => {
      const updated = { ...prev };
      displayedStudents.forEach(std => {
        updated[std.id] = val;
      });
      return updated;
    });
    setIsBulkFillOpen(false);
    addNotification(
      'Saisie rapide appliquée',
      `La note de ${val}/20 a été attribuée à ${displayedStudents.length} élève(s).`,
      'grade',
      { roleTarget: 'enseignant', showToast: true }
    );
  };

  // Keyboard navigation on grade inputs (Enter / Down Arrow / Up Arrow / Ctrl+S)
  const handleKeyDownOnInput = (e: React.KeyboardEvent, studentIndex: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextStudent = displayedStudents[studentIndex + 1];
      if (nextStudent && inputRefs.current[nextStudent.id]) {
        inputRefs.current[nextStudent.id]?.focus();
        inputRefs.current[nextStudent.id]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevStudent = displayedStudents[studentIndex - 1];
      if (prevStudent && inputRefs.current[prevStudent.id]) {
        inputRefs.current[prevStudent.id]?.focus();
        inputRefs.current[prevStudent.id]?.select();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSaveDraft();
    }
  };

  // Focus first input on global shortcut Ctrl+N
  useEffect(() => {
    const handleFocusInput = () => {
      const first = displayedStudents[0] || classStudents[0];
      if (first && inputRefs.current[first.id]) {
        inputRefs.current[first.id]?.focus();
        inputRefs.current[first.id]?.select();
      }
    };
    window.addEventListener('plume:focus-grades-input', handleFocusInput);
    return () => window.removeEventListener('plume:focus-grades-input', handleFocusInput);
  }, [displayedStudents, classStudents]);

  // Save Draft
  const handleSaveDraft = () => {
    classStudents.forEach(std => {
      const score = scoresMap[std.id] ?? 10;
      const existing = grades.find(g => 
        g.studentId === std.id && 
        g.subjectId === selectedSubjectId && 
        g.classId === selectedClassId && 
        g.assessmentName === assessmentName
      );

      saveGrade({
        id: existing?.id,
        studentId: std.id,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        teacherId: currentUser?.id || 'usr-prof-math',
        assessmentName,
        type: assessmentType,
        score: Math.min(20, Math.max(0, score)),
        maxScore: 20,
        coefficient: assessmentCoeff,
        term: assessmentTerm,
        date: assessmentDate,
        isLockedByTeacher: false
      });
    });

    addNotification(
      'Brouillon de notes sauvegardé',
      `Les notes pour "${assessmentName}" (${selectedSubject?.name || 'Discipline'}) ont été enregistrées localement.`,
      'grade',
      { roleTarget: 'enseignant' }
    );
  };

  // Broadcast Alert to Parents State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    addNotification(
      broadcastTitle,
      broadcastMessage,
      'grade',
      {
        roleTarget: ['parent', 'enseignant', 'admin'],
        action: { label: 'Consulter les notes', type: 'openReportCard' }
      }
    );

    setShowBroadcastModal(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  // Lock Definitively
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);

  const handleConfirmLock = () => {
    classStudents.forEach(std => {
      const score = scoresMap[std.id] ?? 10;
      const existing = grades.find(g => 
        g.studentId === std.id && 
        g.subjectId === selectedSubjectId && 
        g.classId === selectedClassId && 
        g.assessmentName === assessmentName
      );

      saveGrade({
        id: existing?.id,
        studentId: std.id,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        teacherId: currentUser?.id || 'usr-prof-math',
        assessmentName,
        type: assessmentType,
        score: Math.min(20, Math.max(0, score)),
        maxScore: 20,
        coefficient: assessmentCoeff,
        term: assessmentTerm,
        date: assessmentDate,
        isLockedByTeacher: true,
        lockedAt: new Date().toISOString()
      });
    });

    lockAssessmentGrades(assessmentName, selectedSubjectId, selectedClassId);
    setShowLockConfirmModal(false);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Class Analytics view for Teacher (Recharts & at-risk student diagnostic)
  if (currentTab === 'analytics') {
    return <ClassAnalyticsView />;
  }

  // Attendance Sheet view for Teacher (Faire l'appel)
  if (currentTab === 'attendance') {
    return <TeacherAttendanceSheet />;
  }

  // Cahier de Textes & Devoirs for Teacher
  if (currentTab === 'cahier') {
    return <TeacherCahierDeTextesView />;
  }

  // Classes Hub for Teacher (Liste de classe, Notes, Bulletins, Certificats, Présences, tout imprimable)
  if (currentTab === 'classes') {
    return <ClassHubView role="enseignant" initialClassId={selectedClassId} />;
  }

  // Timetable view for Teacher
  if (currentTab === 'timetable') {
    const teacherSchedule = INITIAL_TIMETABLE.filter(s => s.teacherId === currentUser?.id);
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 shadow-xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <Clock className="w-4 h-4" />
            <span>Mon Emploi du Temps Hebdomadaire</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Planning des Cours • {currentUser?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consultez les créneaux horaires, salles assignées et classes prévues cette semaine.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day) => {
              const daySlots = (teacherSchedule.length > 0 ? teacherSchedule : INITIAL_TIMETABLE).filter(s => s.day === day);
              return (
                <motion.div 
                  key={day}
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-cyan-400">{day}</span>
                    <span className="text-[11px] text-slate-500">{daySlots.length} séance(s)</span>
                  </div>
                  <div className="space-y-2">
                    {daySlots.map(slot => {
                      const subj = subjects.find(s => s.id === slot.subjectId);
                      return (
                        <div key={slot.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span>{subj?.name || slot.subjectId}</span>
                            <span className="text-cyan-400 font-mono">{slot.startTime} - {slot.endTime}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                            <span>{classes.find(c => c.id === slot.classId)?.name}</span>
                            <span className="text-slate-500">Salle {slot.room}</span>
                          </div>
                        </div>
                      );
                    })}
                    {daySlots.length === 0 && (
                      <div className="text-xs text-slate-600 italic py-4 text-center">Aucun cours planifié</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      
      {/* Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-cyan-500/30 shadow-xl"
      >
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-cyan-400 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
            <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="truncate">Portail Enseignant • {currentUser?.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-0.5 sm:mt-1">
            Saisie et Verrouillage des Notes
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Accès restreint à vos matières et classes attitrées. Une fois verrouillée, l'évaluation est transmise définitivement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setBroadcastTitle(`Notification Pédagogique • ${selectedSubject?.name || 'Discipline'} (${selectedClass?.name || 'Classe'})`);
              setBroadcastMessage(`M. ${currentUser?.name || 'l\'Enseignant'} vous informe : Les évaluations ont été saisies et sont disponibles.`);
              setShowBroadcastModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold transition-all cursor-pointer shadow-md"
            title="Diffuser une alerte en direct aux familles d'élèves"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
            <span>Alerter Familles</span>
          </motion.button>

          {onSelectTab && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectTab('analytics')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/40 hover:to-blue-600/40 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shadow-md"
              title="Consulter les graphiques analytiques de répartition des notes et élèves en difficulté"
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              <span>Analytique</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setModalClassId(selectedClassId);
              setIsAttendanceModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer shadow-md"
            title="Faire l'appel de cette classe"
          >
            <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span>Faire l'Appel</span>
          </motion.button>

          {isAssessmentLocked ? (
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg"
            >
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Verrouillé</span>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Brouillon</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Dynamic Filters & Assessment Selector Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 sm:space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm">Filtres Dynamiques & Sélection Académique</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400">Affinez par Niveau, Matière et Période</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Période :</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['T1', 'T2', 'T3'] as const).map(tKey => (
                <button
                  key={tKey}
                  onClick={() => {
                    setPeriodFilter(tKey);
                    setAssessmentTerm(tKey);
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    periodFilter === tKey 
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className="sm:hidden">{tKey}</span>
                  <span className="hidden sm:inline">{tKey === 'T1' ? '1er Trimestre' : tKey === 'T2' ? '2ème Trimestre' : '3ème Trimestre'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Level Filter & Class Select */}
          <div>
            <label className="text-slate-300 font-semibold flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Niveau / Cycle</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({filteredClasses.length} classe(s))</span>
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'lycee', label: 'Lycée' },
                { id: 'college', label: 'Collège' },
                { id: 'Terminale', label: 'Tle' },
                { id: '1ère', label: '1ère' },
                { id: '2nde', label: '2nde' }
              ].map(lvl => (
                <button
                  key={lvl.id}
                  onClick={() => setLevelFilter(lvl.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    levelFilter === lvl.id
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {filteredClasses.length === 0 ? (
                <option value="">Aucune classe pour ce niveau</option>
              ) : (
                filteredClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level} - {c.cycle})</option>
                ))
              )}
            </select>
          </div>

          {/* Subject Filter & Select */}
          <div>
            <label className="text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
              <span>Matière Enseignée</span>
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {allowedSubjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectId(s.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    selectedSubjectId === s.id
                      ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.code}
                </button>
              ))}
            </div>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={allowedSubjects.length === 0}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-violet-300 font-bold focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
            >
              {allowedSubjects.length === 0 ? (
                <option value="">Aucune matière attribuée</option>
              ) : (
                allowedSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code}) - Coeff {s.coefficient}</option>
                ))
              )}
            </select>
          </div>

          {/* Assessment Preset Switcher */}
          <div>
            <label className="text-slate-300 font-semibold flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Charger Évaluation</span>
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">({existingAssessments.length} enregistrée(s))</span>
            </label>
            <div className="h-[22px] flex items-center text-[10px] text-slate-500 mb-2">
              {existingAssessments.length > 0 ? 'Charger les notes déjà saisies :' : 'Aucun devoir saisi pour ce trimestre'}
            </div>
            <select
              value={existingAssessments.some(a => a.name === assessmentName) ? assessmentName : ''}
              onChange={(e) => {
                const found = existingAssessments.find(a => a.name === e.target.value);
                if (found) {
                  setAssessmentName(found.name);
                  setAssessmentType(found.type);
                  setAssessmentCoeff(found.coeff);
                  setAssessmentTerm(found.term);
                }
              }}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-medium focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="">-- Choisir une évaluation enregistrée --</option>
              {existingAssessments.map((a, i) => (
                <option key={i} value={a.name}>
                  {a.name} ({a.term} • {a.isLocked ? '🔒 Scellé' : '📝 Brouillon'})
                </option>
              ))}
            </select>
          </div>

          {/* Type of Assessment */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Type & Périodicité</label>
            <div className="h-[22px] flex items-center text-[10px] text-slate-500 mb-2">
              Catégorie d'évaluation
            </div>
            <select
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="devoir">Devoir Surveillé (DS)</option>
              <option value="interrogation">Interrogation Écrite (IE)</option>
              <option value="examen">Examen Trimestriel</option>
            </select>
          </div>
        </div>

        {/* Assessment Title & Coefficient Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800 text-xs">
          <div className="sm:col-span-3">
            <label className="text-slate-300 font-semibold block mb-1">Intitulé de l'Évaluation en cours *</label>
            <input
              type="text"
              required
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              placeholder="Ex: Devoir Surveillé N°2 : Fonctions exponentielles"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Coefficient</label>
            <input
              type="number"
              min="1"
              max="10"
              value={assessmentCoeff}
              onChange={(e) => setAssessmentCoeff(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
      </motion.div>

      {/* Live Statistics Bar for this Assessment */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center transition-all">
          <span className="text-xs text-slate-400">Moyenne de classe actuelle :</span>
          <strong className="text-lg font-mono font-black text-cyan-400">{liveStats.avg} / 20</strong>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center transition-all">
          <span className="text-xs text-slate-400">Note la plus basse :</span>
          <strong className="text-lg font-mono font-bold text-rose-400">{liveStats.min} / 20</strong>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center transition-all">
          <span className="text-xs text-slate-400">Note la plus haute :</span>
          <strong className="text-lg font-mono font-bold text-emerald-400">{liveStats.max} / 20</strong>
        </motion.div>
      </motion.div>

      {/* Warning Box if Locked */}
      <AnimatePresence>
        {isAssessmentLocked && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 overflow-hidden"
          >
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <strong>Évaluation Verrouillée et Certifiée :</strong> Vous avez validé définitivement cette évaluation. Les champs de saisie sont verrouillés. Si un réajustement exceptionnel est requis, veuillez contacter l'Administration pour exercer son droit de modification hiérarchique.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Mode Banner Notice */}
      {isEffectivelyOffline && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Mode Hors-Ligne (Consultation Seule) :</strong> Les notes sont affichées depuis le cache local ({offlineCacheStatus.lastCachedAt}). La saisie et le verrouillage sont temporairement suspendus.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 uppercase tracking-wider shrink-0">
            Lecture Seule
          </span>
        </div>
      )}

      {/* Grade Entry Grid Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl"
      >
        <div className="p-3.5 sm:p-4 bg-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-xs sm:text-sm">
              Grille de Saisie Rapide • {selectedClass?.name} ({displayedStudents.length} / {classStudents.length} élèves)
            </h3>
            <span className="text-[10px] sm:text-[11px] text-slate-400">{selectedSubject?.name} • Coeff {assessmentCoeff} • {periodFilter === 'all' ? 'Toutes périodes' : periodFilter}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            {!isAssessmentLocked && !isEffectivelyOffline && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSaveDraft}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  title="Sauvegarder le brouillon [Ctrl+S]"
                >
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                  <span>Enregistrer</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowLockConfirmModal(true)}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Valider & Verrouiller</span>
                </motion.button>
              </>
            )}

            <QuickExportButton 
              label="Exporter"
              reportType="grades"
              classId={selectedClassId}
              subjectId={selectedSubjectId}
              term={assessmentTerm}
              variant="cyan"
              size="sm"
            />
          </div>
        </div>

        {/* Rapid Grading Toolbar & Dynamic In-Grid Filters */}
        <div className="p-3.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search by Name/Matricule */}
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Filtrer un élève (nom, matricule)..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
              {studentSearch && (
                <button
                  onClick={() => setStudentSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setGradeStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                gradeStatusFilter === 'all'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Tous ({classStudents.length})
            </button>

            <button
              onClick={() => setGradeStatusFilter('missing')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                gradeStatusFilter === 'missing'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300'
              }`}
            >
              À saisir ({missingCount})
            </button>

            <button
              onClick={() => setGradeStatusFilter('below_10')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                gradeStatusFilter === 'below_10'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-300'
              }`}
            >
              En difficulté &lt; 10 ({below10Count})
            </button>

            <button
              onClick={() => setGradeStatusFilter('above_16')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                gradeStatusFilter === 'above_16'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-emerald-300'
              }`}
            >
              Excellence ≥ 16 ({above16Count})
            </button>
          </div>

          {/* Quick Tools & Keyboard Guide Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled={isAssessmentLocked || isEffectivelyOffline}
              onClick={() => setIsBulkFillOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Attribuer une note uniforme à la sélection"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Note uniforme</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800/80 text-[10px] text-slate-400 font-mono">
              <Keyboard className="w-3 h-3 text-cyan-400" />
              <span>[Entrée / ↓] Suivant</span>
            </div>
          </div>
        </div>

        {/* Module Rapide d'Assiduité / Appel en Direct depuis la Grille */}
        <div className="p-3 bg-slate-950/95 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-cyan-400" />
              <span>Module Absences :</span>
            </span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>{classStudents.length - absentStudentIds.size} Présents</span>
              </span>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                absentStudentIds.size > 0 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm' 
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}>
                <UserX className="w-3.5 h-3.5" />
                <span>{absentStudentIds.size} Absents</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Attendance */}
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setAttendanceFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  attendanceFilter === 'all' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous ({classStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('absents')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  attendanceFilter === 'absents' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                Absents ({absentStudentIds.size})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('presents')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  attendanceFilter === 'presents' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                Présents ({classStudents.length - absentStudentIds.size})
              </button>
            </div>

            {/* Quick Bulk Actions */}
            {!isAssessmentLocked && !isEffectivelyOffline && (
              <>
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                  title="Marquer tous les élèves de la classe comme présents"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Tous Présents</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAttendanceSession}
                  className="px-3 py-1 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Enregistrer la feuille d'appel du cours dans le registre officiel"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Valider l'Appel</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-xs text-left">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">N°</th>
                <th className="p-3.5">Matricule</th>
                <th className="p-3.5">Nom & Prénoms</th>
                <th className="p-3.5 text-center">Assiduité / Appel</th>
                <th className="p-3.5 w-36">Note (/20)</th>
                <th className="p-3.5">Appréciation rapide</th>
                <th className="p-3.5">Statut de saisie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-slate-300">Aucun élève ne correspond à vos critères de filtrage</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {studentSearch ? `Recherche : "${studentSearch}" • ` : ''}
                      Filtre statut : {gradeStatusFilter} • Filtre présence : {attendanceFilter}
                    </p>
                    <button
                      onClick={() => {
                        setStudentSearch('');
                        setGradeStatusFilter('all');
                        setAttendanceFilter('all');
                      }}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Réinitialiser les filtres</span>
                    </button>
                  </td>
                </tr>
              ) : (
                displayedStudents.map((std, idx) => {
                  const isAbsent = absentStudentIds.has(std.id);
                  const currentScore = scoresMap[std.id] ?? (isAbsent ? 0 : 10);
                  let badgeColor = 'text-slate-400';
                  if (currentScore >= 16) badgeColor = 'text-emerald-400';
                  else if (currentScore >= 12) badgeColor = 'text-cyan-400';
                  else if (currentScore >= 10) badgeColor = 'text-amber-400';
                  else badgeColor = 'text-rose-400';

                  return (
                    <tr key={std.id} className={`transition-colors ${isAbsent ? 'bg-rose-950/10 hover:bg-rose-950/20' : 'hover:bg-slate-800/30'}`}>
                      <td className="p-3.5 font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3.5 font-mono font-medium text-slate-400">{std.matricule}</td>
                      <td className="p-3.5 font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <span>{std.lastName} {std.firstName}</span>
                          {isAbsent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              ABSENT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Direct In-Grid Absence Checkbox Button & Justificatif Generator */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => toggleStudentAbsence(std)}
                            disabled={isAssessmentLocked || isEffectivelyOffline}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                              isAbsent
                                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 shadow-sm'
                                : 'bg-slate-950 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border-slate-800 hover:border-emerald-500/30'
                            }`}
                            title={isAbsent ? "Coché absent(e) - Cliquer pour repasser présent(e)" : "Cliquer pour marquer l'élève absent(e)"}
                          >
                            {isAbsent ? (
                              <>
                                <UserX className="w-3.5 h-3.5 text-rose-400" />
                                <span>Absent(e)</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-emerald-400/80" />
                                <span>Présent(e)</span>
                              </>
                            )}
                          </button>

                          {isAbsent && (
                            <button
                              type="button"
                              onClick={() => handleGenerateJustificatif(std)}
                              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              title="Générer et télécharger le justificatif d'absence officiel pour les parents"
                            >
                              <Download className="w-3 h-3 text-cyan-400" />
                              <span>Générer justificatif</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Score Input with ABS badge */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <input
                              ref={(el) => { inputRefs.current[std.id] = el; }}
                              type="number"
                              step="0.25"
                              min="0"
                              max="20"
                              disabled={isAssessmentLocked || isEffectivelyOffline}
                              value={currentScore}
                              onKeyDown={(e) => handleKeyDownOnInput(e, idx)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setScoresMap(prev => ({
                                  ...prev,
                                  [std.id]: isNaN(val) ? 0 : val
                                }));
                              }}
                              className={`w-20 p-2 rounded-xl text-center font-mono font-black text-sm border focus:outline-none transition-all ${
                                isAbsent 
                                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                                  : isAssessmentLocked || isEffectivelyOffline
                                  ? 'bg-slate-950/60 border-slate-800/80 text-slate-400 cursor-not-allowed' 
                                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                              }`}
                            />
                            {isAbsent && (
                              <span className="absolute -top-2 right-1 px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-bold tracking-wider shadow-sm pointer-events-none">
                                ABS
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 font-mono">/ 20</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {isAbsent ? (
                          <span className="font-semibold text-rose-400 text-xs flex items-center gap-1">
                            <UserX className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>Absent(e) au devoir</span>
                          </span>
                        ) : (
                          <span className={`font-semibold ${badgeColor}`}>
                            {currentScore >= 16 ? 'Très Bien' :
                             currentScore >= 14 ? 'Bien' :
                             currentScore >= 12 ? 'Assez Bien' :
                             currentScore >= 10 ? 'Passable' : 'Insuffisant'}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {isAssessmentLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verrouillé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" /> Prêt à valider
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}

              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Aucun élève inscrit dans cette classe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Confirmation Modal to Lock Assessment */}
      <AnimatePresence>
        {showLockConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLockConfirmModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Confirmation de Verrouillage Définitif</h3>
                  <p className="text-xs text-slate-400">Règle de conformité académique Plume</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <p>
                  Attention <strong>{currentUser?.name}</strong> :
                </p>
                <p>
                  Vous vous apprêtez à verrouiller définitivement l'évaluation <strong className="text-cyan-400">"{assessmentName}"</strong> pour la classe <strong className="text-white">{selectedClass?.name}</strong>.
                </p>
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium">
                  ⚠️ Une fois validée, vous <strong>NE POURREZ PLUS</strong> modifier aucune note de cette liste. Seule l'Administration dispose de l'autorité hiérarchique pour effectuer une modification ultérieure.
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLockConfirmModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmLock}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all"
                >
                  Confirmer et Verrouiller
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Broadcast Alert to Families Modal */}
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBroadcastModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-slate-900 border border-violet-500/30 rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Diffuser une Alerte aux Familles</h3>
                    <p className="text-xs text-slate-400">Classe : {selectedClass?.name} • {selectedSubject?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Titre de la notification
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Ex: Devoir surveillé de Mathématiques noté"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Message transmis aux parents
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Précisez les consignes, les moyennes ou les documents officiels à consulter..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/30 text-[11px] text-violet-300 flex items-center gap-2">
                  <Send className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>
                    Cette alerte déclenchera immédiatement un toast visuel avec carillon sonore sur l'espace des parents de la classe.
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-950/40 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Diffuser l'alerte</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Fill Modal for Rapid Grading */}
      <AnimatePresence>
        {isBulkFillOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkFillOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Attribution de Note Uniforme</h3>
                    <p className="text-[11px] text-slate-400">Appliquer une note de base à {displayedStudents.length} élève(s)</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBulkFillOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Cette action appliquera instantanément la note aux <strong>{displayedStudents.length} élève(s) affiché(s)</strong> dans la grille. Vous pourrez ensuite ajuster individuellement chaque note.
                </p>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">Note de base à attribuer (/20) :</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={bulkFillScore}
                      onChange={(e) => setBulkFillScore(e.target.value)}
                      className="w-24 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-cyan-400 font-mono font-bold text-base text-center focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex gap-1">
                      {[10, 12, 14, 16].map(quickVal => (
                        <button
                          key={quickVal}
                          type="button"
                          onClick={() => setBulkFillScore(quickVal.toString())}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold transition-colors cursor-pointer"
                        >
                          {quickVal}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkFillOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkScore}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-950/40 transition-colors cursor-pointer"
                >
                  Appliquer aux {displayedStudents.length} élèves
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Attendance Modal */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        defaultClassId={modalClassId}
      />

    </motion.div>
  );
};

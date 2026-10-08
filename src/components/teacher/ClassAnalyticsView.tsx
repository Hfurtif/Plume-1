import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Line, 
  Area, 
  AreaChart 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  School, 
  BookOpen, 
  Award, 
  FileText, 
  Phone, 
  Calendar, 
  ShieldAlert,
  Send,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, Grade } from '../../types';
import { QuickExportButton } from '../common/QuickExportButton';

export const ClassAnalyticsView: React.FC = () => {
  const { 
    currentUser, 
    classes, 
    students, 
    subjects, 
    grades, 
    attendance,
    setReportCardStudent,
    addNotification
  } = useApp();

  // Teacher permissions: Filter to this teacher's assigned classes & subjects
  const assignedClassIds = currentUser?.assignedClasses || ['cls-tc', 'cls-td'];
  const assignedSubjectIds = currentUser?.assignedSubjects || [];

  const allowedClasses = classes.filter(c => assignedClassIds.length === 0 || assignedClassIds.includes(c.id));
  const allowedSubjects = useMemo(() => {
    const active = subjects.filter(s => s.isActive !== false);
    if (assignedSubjectIds.length > 0) {
      return active.filter(s => assignedSubjectIds.includes(s.id));
    }
    return active;
  }, [subjects, assignedSubjectIds]);

  // Selections
  const [selectedClassId, setSelectedClassId] = useState<string>(allowedClasses[0]?.id || classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(allowedSubjects[0]?.id || '');
  const [selectedTerm, setSelectedTerm] = useState<'all' | 'T1' | 'T2' | 'T3'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'critical' | 'borderline'>('all');

  // Contact parent modal state
  const [alertStudent, setAlertStudent] = useState<Student | null>(null);
  const [alertMessage, setAlertMessage] = useState<string>('');

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  // Students in this class
  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Filtered grades for this selection
  const relevantGrades = useMemo(() => {
    return grades.filter(g => {
      const matchClass = g.classId === selectedClassId;
      const matchSubject = !selectedSubjectId || g.subjectId === selectedSubjectId;
      const matchTerm = selectedTerm === 'all' || g.term === selectedTerm;
      return matchClass && matchSubject && matchTerm;
    });
  }, [grades, selectedClassId, selectedSubjectId, selectedTerm]);

  // Student metrics & averages
  const studentMetrics = useMemo(() => {
    return classStudents.map(std => {
      const stdGrades = relevantGrades.filter(g => g.studentId === std.id);
      const totalScore = stdGrades.reduce((sum, g) => sum + (g.score * g.coefficient), 0);
      const totalCoeff = stdGrades.reduce((sum, g) => sum + g.coefficient, 0);
      const avg = totalCoeff > 0 ? Number((totalScore / totalCoeff).toFixed(2)) : 0;
      
      // Absence count in this subject
      const absences = attendance.filter(a => 
        a.targetId === std.id && 
        a.status === 'absent' && 
        (!selectedSubjectId || a.subjectId === selectedSubjectId)
      );

      const latestGrade = stdGrades[stdGrades.length - 1]?.score ?? avg;

      return {
        student: std,
        gradesCount: stdGrades.length,
        average: avg,
        latestGrade,
        absencesCount: absences.length,
        unjustifiedAbsences: absences.filter(a => !a.isJustified).length,
        isAtRisk: avg < 10 && stdGrades.length > 0,
        isCritical: avg < 8 && stdGrades.length > 0,
        isBorderline: avg >= 8 && avg < 10 && stdGrades.length > 0,
        isExcellent: avg >= 15 && stdGrades.length > 0
      };
    });
  }, [classStudents, relevantGrades, attendance, selectedSubjectId]);

  // Global Class Stats
  const classStats = useMemo(() => {
    const studentsWithGrades = studentMetrics.filter(s => s.gradesCount > 0);
    if (studentsWithGrades.length === 0) {
      return {
        classAverage: 0,
        successRate: 0,
        atRiskCount: 0,
        excellentCount: 0,
        minScore: 0,
        maxScore: 0,
        totalGraded: 0
      };
    }

    const avgSum = studentsWithGrades.reduce((acc, s) => acc + s.average, 0);
    const classAverage = Number((avgSum / studentsWithGrades.length).toFixed(2));
    const atRiskCount = studentsWithGrades.filter(s => s.average < 10).length;
    const excellentCount = studentsWithGrades.filter(s => s.average >= 15).length;
    const successRate = Number(((studentsWithGrades.length - atRiskCount) / studentsWithGrades.length * 100).toFixed(1));
    const allAverages = studentsWithGrades.map(s => s.average);
    const minScore = Math.min(...allAverages);
    const maxScore = Math.max(...allAverages);

    return {
      classAverage,
      successRate,
      atRiskCount,
      excellentCount,
      minScore,
      maxScore,
      totalGraded: studentsWithGrades.length
    };
  }, [studentMetrics]);

  // 1. Grade Distribution Data (Histogram BarChart)
  const distributionData = useMemo(() => {
    const buckets = [
      { range: '0 - 5', label: '0-5 (Alerte)', count: 0, color: '#f43f5e', students: [] as string[] },
      { range: '5 - 8', label: '5-8 (Insuffisant)', count: 0, color: '#f97316', students: [] as string[] },
      { range: '8 - 10', label: '8-10 (Fragile)', count: 0, color: '#f59e0b', students: [] as string[] },
      { range: '10 - 12', label: '10-12 (Passable)', count: 0, color: '#0ea5e9', students: [] as string[] },
      { range: '12 - 14', label: '12-14 (Assez Bien)', count: 0, color: '#06b6d4', students: [] as string[] },
      { range: '14 - 16', label: '14-16 (Bien)', count: 0, color: '#10b981', students: [] as string[] },
      { range: '16 - 20', label: '16-20 (Très Bien)', count: 0, color: '#059669', students: [] as string[] }
    ];

    studentMetrics.filter(s => s.gradesCount > 0).forEach(s => {
      const avg = s.average;
      const name = `${s.student.lastName} ${s.student.firstName} (${avg}/20)`;
      if (avg < 5) { buckets[0].count++; buckets[0].students.push(name); }
      else if (avg < 8) { buckets[1].count++; buckets[1].students.push(name); }
      else if (avg < 10) { buckets[2].count++; buckets[2].students.push(name); }
      else if (avg < 12) { buckets[3].count++; buckets[3].students.push(name); }
      else if (avg < 14) { buckets[4].count++; buckets[4].students.push(name); }
      else if (avg < 16) { buckets[5].count++; buckets[5].students.push(name); }
      else { buckets[6].count++; buckets[6].students.push(name); }
    });

    return buckets;
  }, [studentMetrics]);

  // 2. Mastery Levels PieChart Data
  const masteryData = useMemo(() => {
    const atRisk = studentMetrics.filter(s => s.gradesCount > 0 && s.average < 10).length;
    const average = studentMetrics.filter(s => s.gradesCount > 0 && s.average >= 10 && s.average < 13).length;
    const good = studentMetrics.filter(s => s.gradesCount > 0 && s.average >= 13 && s.average < 16).length;
    const master = studentMetrics.filter(s => s.gradesCount > 0 && s.average >= 16).length;

    return [
      { name: 'En Difficulté (<10)', value: atRisk, color: '#f43f5e' },
      { name: 'Passable (10-13)', value: average, color: '#f59e0b' },
      { name: 'Bon Niveau (13-16)', value: good, color: '#06b6d4' },
      { name: 'Excellence (≥16)', value: master, color: '#10b981' }
    ].filter(d => d.value > 0);
  }, [studentMetrics]);

  // 3. Assessment Chronological Progression LineChart
  const assessmentTimelineData = useMemo(() => {
    // Group unique assessments by name
    const assessmentsMap = new Map<string, Grade[]>();
    relevantGrades.forEach(g => {
      if (!assessmentsMap.has(g.assessmentName)) {
        assessmentsMap.set(g.assessmentName, []);
      }
      assessmentsMap.get(g.assessmentName)!.push(g);
    });

    const timeline: Array<{
      name: string;
      moyenne: number;
      min: number;
      max: number;
      type: string;
      term: string;
    }> = [];

    assessmentsMap.forEach((gradeList, name) => {
      const scores = gradeList.map(g => g.score);
      const avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      timeline.push({
        name: name.length > 18 ? name.slice(0, 16) + '...' : name,
        moyenne: avg,
        min: Math.min(...scores),
        max: Math.max(...scores),
        type: gradeList[0]?.type || 'devoir',
        term: gradeList[0]?.term || 'T2'
      });
    });

    return timeline;
  }, [relevantGrades]);

  // Students At-Risk List
  const atRiskStudents = useMemo(() => {
    return studentMetrics
      .filter(s => s.isAtRisk)
      .filter(s => {
        if (difficultyFilter === 'critical') return s.isCritical;
        if (difficultyFilter === 'borderline') return s.isBorderline;
        return true;
      })
      .sort((a, b) => a.average - b.average);
  }, [studentMetrics, difficultyFilter]);

  // Send Alert to Parent
  const handleSendParentAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertStudent || !alertMessage.trim()) return;

    addNotification(
      `Alerte Pédagogique : ${alertStudent.lastName} ${alertStudent.firstName}`,
      `Message du professeur de ${currentSubject?.name || 'Discipline'} : "${alertMessage}"`,
      'grade',
      {
        roleTarget: 'parent',
        targetStudentId: alertStudent.id,
        targetStudentMatricule: alertStudent.matricule,
        showToast: true
      }
    );

    setAlertStudent(null);
    setAlertMessage('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Analytique & Pilotage Pédagogique</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
              Analytique de Classe & Diagnostic des Notes
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Visualisez la distribution statistique des notes, suivez la dynamique de progression et ciblez les élèves en difficulté nécessitant un soutien immédiat.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <QuickExportButton 
              label="Exporter Rapport Analytique"
              reportType="grades"
              classId={selectedClassId}
              subjectId={selectedSubjectId}
              variant="cyan"
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Control & Filter Strip */}
      <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
          <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          <span>Paramètres de Filtrage Analytique</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
          {/* Class Select */}
          <div>
            <label className="text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
              <School className="w-3.5 h-3.5 text-cyan-400" />
              <span>Classe Analysée</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {allowedClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.level} - {c.cycle})</option>
              ))}
            </select>
          </div>

          {/* Subject Select */}
          <div>
            <label className="text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
              <span>Discipline / Matière</span>
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-violet-300 font-bold focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="">Toutes les matières de la classe</option>
              {allowedSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code}) - Coeff {s.coefficient}</option>
              ))}
            </select>
          </div>

          {/* Term Select */}
          <div>
            <label className="text-slate-300 font-semibold flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Période d'Évaluation</span>
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-bold focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="all">Année Complète (Tous trimestres)</option>
              <option value="T1">1er Trimestre (T1)</option>
              <option value="T2">2ème Trimestre (T2)</option>
              <option value="T3">3ème Trimestre (T3)</option>
            </select>
          </div>

          {/* Indicator Info Card */}
          <div className="flex flex-col justify-center p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Population Évaluée</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-mono font-bold text-white">
                {classStats.totalGraded} / {classStudents.length} élèves
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                {classStudents.length > 0 ? `${Math.round((classStats.totalGraded / classStudents.length) * 100)}% notés` : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Moyenne de classe */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
            <span>Moyenne</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-mono font-black text-cyan-400">
              {classStats.classAverage}
            </span>
            <span className="text-slate-500 font-mono text-xs">/ 20</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {classStats.minScore} à {classStats.maxScore} / 20
          </p>
        </motion.div>

        {/* Taux de Réussite */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg"
        >
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
            <span>Réussite (≥ 10)</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-3xl font-mono font-black text-emerald-400">
              {classStats.successRate}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 sm:h-2 rounded-full overflow-hidden mt-2 sm:mt-3">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, classStats.successRate))}%` }} 
            />
          </div>
        </motion.div>

        {/* Élèves en Difficulté (Alerte Pédagogique) */}
        <motion.div 
          whileHover={{ y: -2 }}
          className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border shadow-lg transition-all ${
            classStats.atRiskCount > 0 
              ? 'bg-rose-950/20 border-rose-500/40' 
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
            <span className="font-semibold text-rose-300">En Difficulté</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-mono font-black text-rose-400">
              {classStats.atRiskCount}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">élèves</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-rose-300/80 mt-1 truncate">
            Plan de remédiation
          </p>
        </motion.div>

        {/* Taux d'Excellence */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg"
        >
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
            <span>Excellence (≥ 15)</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-mono font-black text-amber-400">
              {classStats.excellentCount}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">majeurs</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            Tableaux d'honneur
          </p>
        </motion.div>
      </div>

      {/* Main Charts Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Grade Distribution Histogram */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Répartition & Distribution des Notes (/20)</span>
              </h3>
              <p className="text-xs text-slate-400">Histogramme des tranches de notation de la classe</p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Effectif : {classStats.totalGraded} élèves
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="range" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  label={{ value: 'Tranches de notes', position: 'insideBottom', offset: -18, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  allowDecimals={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-1 z-50">
                          <strong className="text-white block font-bold">{data.label}</strong>
                          <p className="text-cyan-400 font-mono font-bold">{data.count} élève(s)</p>
                          {data.students && data.students.length > 0 && (
                            <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] text-slate-300 max-h-32 overflow-y-auto">
                              {data.students.map((st: string, idx: number) => (
                                <div key={idx} className="truncate">• {st}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Alertes (0-8)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Fragile (8-10)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Passable (10-12)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Assez Bien (12-14)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Bien & Très Bien (14-20)</span>
          </div>
        </div>

        {/* Chart 2: Mastery Levels Donut Chart */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Niveaux de Maîtrise</span>
            </h3>
            <p className="text-xs text-slate-400">Proportions par palier de compétences</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={masteryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {masteryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const total = classStats.totalGraded || 1;
                      const pct = ((data.value / total) * 100).toFixed(1);
                      return (
                        <div className="p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs shadow-xl">
                          <span className="text-white font-bold">{data.name}</span>
                          <div className="text-cyan-400 font-mono font-bold mt-0.5">
                            {data.value} élève(s) ({pct}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Items */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
            {masteryData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-mono font-bold text-white">{item.value} élève(s)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Evaluation Progression Timeline */}
      {assessmentTimelineData.length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Progression Chronologique des Évaluations</span>
              </h3>
              <p className="text-xs text-slate-400">Évolution de la moyenne de classe, note maximale et note minimale par devoir</p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {assessmentTimelineData.length} évaluation(s) analysée(s)
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={assessmentTimelineData} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 20]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs space-y-1 shadow-2xl">
                          <strong className="text-white block font-bold">{data.name}</strong>
                          <span className="text-[10px] text-slate-400 block uppercase">Période : {data.term}</span>
                          <div className="text-cyan-400 font-mono font-bold">Moyenne : {data.moyenne} / 20</div>
                          <div className="text-emerald-400 font-mono text-[11px]">Note Max : {data.max} / 20</div>
                          <div className="text-rose-400 font-mono text-[11px]">Note Min : {data.min} / 20</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="moyenne" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                <Line type="monotone" dataKey="max" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                <Line type="monotone" dataKey="min" stroke="#f43f5e" strokeWidth={2} strokeDasharray="3 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-cyan-400 rounded"></span> Moyenne Classe</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-400 rounded border-dashed"></span> Note Maximale</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-rose-400 rounded border-dashed"></span> Note Minimale</span>
          </div>
        </div>
      )}

      {/* Target Section: At-Risk Students Focus Table */}
      <div className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Diagnostic & Plan de Remédiation Pédagogique</span>
            </div>
            <h3 className="font-extrabold text-white text-base sm:text-lg mt-0.5">
              Identification des Élèves en Difficulté (&lt; 10/20)
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Liste prioritaire pour soutien scolaire, convocation des parents ou révision ciblée.
            </p>
          </div>

          {/* Quick Filter buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setDifficultyFilter('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                difficultyFilter === 'all'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Tous (&lt; 10)
            </button>
            <button
              onClick={() => setDifficultyFilter('critical')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                difficultyFilter === 'critical'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'bg-slate-950 text-slate-400 hover:text-rose-300 border border-slate-800'
              }`}
            >
              Critiques (&lt; 8)
            </button>
            <button
              onClick={() => setDifficultyFilter('borderline')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                difficultyFilter === 'borderline'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800'
              }`}
            >
              Fragiles (8 - 9.9)
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[720px] text-xs text-left">
            <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Élève</th>
                <th className="p-3.5">Matricule</th>
                <th className="p-3.5 text-center">Moyenne Matière</th>
                <th className="p-3.5 text-center">Écart Classe</th>
                <th className="p-3.5 text-center">Assiduité (Absences)</th>
                <th className="p-3.5">Contact Parent / Tuteur</th>
                <th className="p-3.5 text-right">Actions Directes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {atRiskStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <p className="font-bold text-slate-200">Félicitations ! Aucun élève dans cette catégorie de difficulté.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tous les élèves évalués atteignent les objectifs minimaux pour cette sélection.
                    </p>
                  </td>
                </tr>
              ) : (
                atRiskStudents.map((item) => {
                  const s = item.student;
                  const diff = Number((item.average - classStats.classAverage).toFixed(2));

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            item.isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {s.firstName[0]}{s.lastName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{s.lastName} {s.firstName}</span>
                            <span className="text-[10px] text-slate-500">Né(e) le {s.dateOfBirth}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-400 font-medium">
                        {s.matricule}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-xl font-mono font-black text-sm border ${
                          item.isCritical 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {item.average} / 20
                        </span>
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-xs text-rose-400">
                        {diff} pts
                      </td>

                      <td className="p-3.5 text-center">
                        {item.absencesCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{item.absencesCount} absence(s)</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium text-[11px]">Régulier</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="text-slate-200 font-semibold block">{s.guardianName}</span>
                          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-cyan-400" />
                            <span>{s.guardianPhone}</span>
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setReportCardStudent(s)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                            title="Consulter le Bulletin Officiel"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setAlertStudent(s);
                              setAlertMessage(`Bonjour M./Mme ${s.guardianName}, nous constatons une baisse de résultats pour ${s.firstName} en ${currentSubject?.name || 'classe'} (Moyenne actuelle : ${item.average}/20). Un créneau d'aide individualisée est recommandé.`);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            title="Envoyer une alerte pédagogique aux parents"
                          >
                            <Send className="w-3 h-3" />
                            <span>Alerter Famille</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert to Parent Modal */}
      <AnimatePresence>
        {alertStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAlertStudent(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Alerte Pédagogique Famille</h3>
                    <p className="text-xs text-slate-400">Élève : {alertStudent.lastName} {alertStudent.firstName} ({alertStudent.matricule})</p>
                  </div>
                </div>
                <button
                  onClick={() => setAlertStudent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendParentAlert} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Destinataire Tuteur Légale :</label>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                    <strong>{alertStudent.guardianName}</strong> • {alertStudent.guardianPhone} ({alertStudent.guardianEmail})
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Message d'accompagnement & convocation :</label>
                  <textarea
                    rows={4}
                    required
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAlertStudent(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmettre l'Alerte</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

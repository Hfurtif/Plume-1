import React, { useState, useMemo } from 'react';
import { 
  School, 
  Users, 
  CheckSquare, 
  FileText, 
  Award, 
  CalendarCheck, 
  Wallet, 
  Printer, 
  Search, 
  Filter, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Plus, 
  Sparkles, 
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { SchoolClass, Student, SchoolCycle, UserRole, Grade } from '../../types';
import { ClassPrintModal, ClassPrintDocumentType } from './ClassPrintModal';
import { AttendanceModal } from '../attendance/AttendanceModal';

interface ClassHubViewProps {
  role?: UserRole;
  initialClassId?: string;
  initialTab?: 'students' | 'grades' | 'bulletins' | 'certificates' | 'attendance' | 'finance';
}

export const ClassHubView: React.FC<ClassHubViewProps> = ({ 
  role = 'admin',
  initialClassId,
  initialTab = 'students'
}) => {
  const { 
    classes, 
    students, 
    subjects, 
    grades, 
    saveGrade,
    attendance, 
    payments, 
    currentUser, 
    setReportCardStudent,
    setActivePaymentReceipt,
    recordPayment,
    selectedClassHubId,
    setSelectedClassHubId,
    addNotification
  } = useApp();

  // Selected Cycle Filter (All, Maternelle, Primaire, Collège, Lycée)
  const [selectedCycle, setSelectedCycle] = useState<SchoolCycle | 'all'>('all');
  const [classSearch, setClassSearch] = useState('');

  // Active Class Selection
  const effectiveClassId = initialClassId || selectedClassHubId || classes[0]?.id || '';
  const currentClass = classes.find(c => c.id === effectiveClassId) || classes[0];

  // Active Sub Tab in Class Hub
  const [activeTab, setActiveTab] = useState<'students' | 'grades' | 'bulletins' | 'certificates' | 'attendance' | 'finance'>(initialTab);

  // Filters inside tabs
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'sub-math');
  const [selectedTerm, setSelectedTerm] = useState<'T1' | 'T2' | 'T3'>('T2');
  const [attendanceViewMode, setAttendanceViewMode] = useState<'sheet' | 'log'>('sheet');

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocumentType, setPrintDocumentType] = useState<ClassPrintDocumentType>('class_list');
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<Student | null>(null);
  const [certTypeForPrint, setCertTypeForPrint] = useState<'scolarite' | 'frequentation' | 'radiation'>('scolarite');

  // Attendance live modal
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  // Quick Payment Modal
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(50000);

  // Filtered Classes list
  const filteredClasses = useMemo(() => {
    let list = classes;
    if (role === 'enseignant' && currentUser?.assignedClasses && currentUser.assignedClasses.length > 0) {
      list = classes.filter(c => currentUser.assignedClasses?.includes(c.id));
      if (list.length === 0) list = classes; // Fallback if none assigned
    }

    if (selectedCycle !== 'all') {
      list = list.filter(c => c.cycle === selectedCycle);
    }

    if (classSearch.trim()) {
      const q = classSearch.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.level.toLowerCase().includes(q));
    }

    return list;
  }, [classes, selectedCycle, classSearch, role, currentUser]);

  // Current class students
  const classStudents = useMemo(() => {
    if (!currentClass) return [];
    return students.filter(s => s.classId === currentClass.id);
  }, [students, currentClass]);

  // Filtered students inside class
  const displayedStudents = useMemo(() => {
    if (!studentSearch.trim()) return classStudents;
    const q = studentSearch.toLowerCase();
    return classStudents.filter(s => 
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.matricule.toLowerCase().includes(q) ||
      s.guardianName.toLowerCase().includes(q)
    );
  }, [classStudents, studentSearch]);

  // Grades for current class
  const classGrades = useMemo(() => {
    if (!currentClass) return [];
    return grades.filter(g => g.classId === currentClass.id);
  }, [grades, currentClass]);

  // Attendance for current class
  const classAttendance = useMemo(() => {
    return attendance.filter(a => classStudents.some(s => s.id === a.targetId));
  }, [attendance, classStudents]);

  // Class statistics
  const classStats = useMemo(() => {
    const totalDue = classStudents.reduce((sum, s) => sum + s.annualTuition, 0);
    const totalCollected = classStudents.reduce((sum, s) => sum + s.paidTuition, 0);
    const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 100;

    const gradesWithScore = classGrades.filter(g => typeof g.score === 'number' && !isNaN(g.score));
    const avgScore = gradesWithScore.length > 0
      ? (gradesWithScore.reduce((sum, g) => sum + g.score, 0) / gradesWithScore.length).toFixed(2)
      : '14.50';

    const paidCount = classStudents.filter(s => s.paymentStatus === 'paid').length;
    const partialCount = classStudents.filter(s => s.paymentStatus === 'partial').length;
    const unpaidCount = classStudents.filter(s => s.paymentStatus === 'unpaid').length;

    return {
      totalDue,
      totalCollected,
      collectionRate,
      avgScore,
      paidCount,
      partialCount,
      unpaidCount
    };
  }, [classStudents, classGrades]);

  // Handle Quick Grade Change
  const handleQuickGradeChange = (studentId: string, subjectId: string, newScore: number) => {
    if (!currentClass) return;
    const subj = subjects.find(s => s.id === subjectId);
    const existing = classGrades.find(g => g.studentId === studentId && g.subjectId === subjectId && g.term === selectedTerm);

    saveGrade({
      id: existing?.id,
      studentId,
      subjectId,
      classId: currentClass.id,
      score: Math.min(20, Math.max(0, newScore)),
      maxScore: 20,
      assessmentName: existing?.assessmentName || `Contrôle Continu (${selectedTerm})`,
      term: selectedTerm,
      date: new Date().toISOString().split('T')[0],
      coefficient: subj?.coefficient || 2,
      teacherId: currentUser?.id || 'usr-prof',
      type: 'devoir',
      isLockedByTeacher: false
    });
  };

  // Open Print Modal helper
  const handleOpenPrint = (type: ClassPrintDocumentType, student?: Student, certType: 'scolarite' | 'frequentation' | 'radiation' = 'scolarite') => {
    setPrintDocumentType(type);
    setSelectedStudentForCert(student || null);
    setCertTypeForPrint(certType);
    setIsPrintModalOpen(true);
  };

  // Handle Quick Payment Submit
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStudent) return;

    recordPayment({
      studentId: paymentStudent.id,
      studentName: `${paymentStudent.firstName} ${paymentStudent.lastName}`,
      matricule: paymentStudent.matricule,
      classId: currentClass.id,
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      method: 'especes',
      notes: `Règlement scolarité classe de ${currentClass?.name}`
    });

    addNotification(
      'Encaissement Validé',
      `${paymentAmount.toLocaleString()} FCFA enregistrés pour ${paymentStudent.firstName} ${paymentStudent.lastName}.`,
      'finance',
      { showToast: true }
    );

    setPaymentStudent(null);
  };

  if (!currentClass) {
    return (
      <div className="p-8 text-center text-slate-400">
        <School className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-base font-bold text-white">Aucune classe disponible</p>
        <p className="text-xs mt-1">Créez une classe ou importez un document scolaire pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 w-full max-w-full">
      
      {/* 1. TOP CYCLE SELECTOR & CLASS CAROUSEL */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4">
        
        {/* Cycle filter pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden md:inline">
              Cycles :
            </span>
            {[
              { id: 'all', label: 'Toutes les Classes' },
              { id: 'maternelle', label: 'Maternelle (PS à GS)' },
              { id: 'primaire', label: 'Primaire (CP à CM2)' },
              { id: 'college', label: 'Collège (6e à 3e)' },
              { id: 'lycee', label: 'Lycée (2nde à Term)' }
            ].map(cycle => (
              <button
                key={cycle.id}
                onClick={() => setSelectedCycle(cycle.id as SchoolCycle | 'all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCycle === cycle.id
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cycle.label}
              </button>
            ))}
          </div>

          {/* Search class */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              placeholder="Chercher une classe..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Classes Horizontal Scroll / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {filteredClasses.map(cls => {
            const isSelected = cls.id === currentClass.id;
            const count = students.filter(s => s.classId === cls.id).length;

            return (
              <motion.button
                key={cls.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedClassHubId(cls.id)}
                className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/50 shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-500/30'
                    : 'bg-slate-950/70 hover:bg-slate-800/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-cyan-500/60'}`} />
                <span>{cls.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count} él.
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVE CLASS HERO BANNER */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Cycle {currentClass.cycle}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">
              {currentClass.level} &bull; Section {currentClass.section}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">
              &bull; Salle : {currentClass.room}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 flex items-center gap-2">
            <span>{currentClass.name}</span>
            <span className="text-sm font-normal text-slate-400 font-mono">
              ({classStudents.length} / {currentClass.capacity} élèves inscrits)
            </span>
          </h1>

          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Toutes les informations pédagogiques, notes, bulletins, certificats officiels, présences et scolarité de cette classe regroupées en un seul endroit.
          </p>
        </div>

        {/* Global Class Actions & Stats */}
        <div className="flex flex-wrap items-center gap-2.5 justify-start md:justify-end">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Moyenne Classe</span>
              <strong className="text-sm font-mono font-black text-cyan-400">{classStats.avgScore} / 20</strong>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block">Recouvrement</span>
              <strong className="text-sm font-mono font-black text-emerald-400">{classStats.collectionRate}%</strong>
            </div>
          </div>

          {/* Quick Print Button */}
          <button
            onClick={() => handleOpenPrint('class_list')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-md"
            title="Imprimer la fiche officielle de classe"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Imprimer</span>
          </button>

          {/* Faire l'appel button */}
          <button
            onClick={() => setIsAttendanceModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-950/40 cursor-pointer"
            title="Faire l'appel pour cette classe"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Faire l'Appel</span>
          </button>
        </div>
      </div>

      {/* 3. CLASS HUB NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto no-scrollbar">
        {[
          { id: 'students', label: '1. Liste de Classe', icon: <Users className="w-4 h-4" />, count: classStudents.length },
          { id: 'grades', label: '2. Les Notes', icon: <CheckSquare className="w-4 h-4" />, badge: 'Saisie' },
          { id: 'bulletins', label: '3. Les Bulletins', icon: <FileText className="w-4 h-4" />, badge: selectedTerm },
          { id: 'certificates', label: '4. Les Certificats', icon: <Award className="w-4 h-4" /> },
          { id: 'attendance', label: '5. Présence & Absences', icon: <CalendarCheck className="w-4 h-4" /> },
          { id: 'finance', label: '6. Scolarité & Finances', icon: <Wallet className="w-4 h-4" />, badge: `${classStats.collectionRate}%` }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: LISTE DE CLASSE */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Rechercher élève, matricule, parent..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {displayedStudents.length} élèves affichés
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenPrint('class_list')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer la Liste de Classe</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 text-center w-12">N°</th>
                    <th className="p-3.5">Matricule & Élève</th>
                    <th className="p-3.5 text-center">Sexe</th>
                    <th className="p-3.5">Date Naissance</th>
                    <th className="p-3.5">Parent / Contact</th>
                    <th className="p-3.5 text-center">Statut Scolarité</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Aucun élève trouvé dans cette classe.
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map((std, idx) => (
                      <tr key={std.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold flex items-center justify-center text-xs">
                              {std.firstName.charAt(0)}{std.lastName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white">{std.lastName.toUpperCase()} {std.firstName}</div>
                              <div className="text-[10px] font-mono text-cyan-400">{std.matricule}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            std.gender === 'F' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {std.gender}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">{std.dateOfBirth}</td>
                        <td className="p-3.5 text-slate-300">
                          <div className="font-medium text-slate-200">{std.guardianName}</div>
                          <div className="text-[10px] text-slate-400">{std.guardianPhone}</div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            std.paymentStatus === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : std.paymentStatus === 'partial'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {std.paymentStatus === 'paid' ? 'Soldé' : std.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setReportCardStudent(std)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs transition-colors cursor-pointer"
                              title="Voir le bulletin de l'élève"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenPrint('certificate', std, 'scolarite')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs transition-colors cursor-pointer"
                              title="Imprimer certificat de scolarité"
                            >
                              <Award className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LES NOTES DE LA CLASSE */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block font-bold uppercase mb-0.5">Trimestre :</label>
                <div className="flex items-center gap-1">
                  {(['T1', 'T2', 'T3'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTerm(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedTerm === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block font-bold uppercase mb-0.5">Matière Active :</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Coeff {s.coefficient})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenPrint('grades_sheet')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer la Grille des Notes</span>
              </button>
            </div>
          </div>

          {/* Grades Grid */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 text-center w-12">N°</th>
                    <th className="p-3.5">Matricule & Élève</th>
                    <th className="p-3.5 text-center w-36">Note Saisie ({selectedTerm}) / 20</th>
                    <th className="p-3.5 text-center w-28">Appréciation</th>
                    <th className="p-3.5 text-center w-32">Statut Verrouillage</th>
                    <th className="p-3.5 text-right">Moyenne Générale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {classStudents.map((std, idx) => {
                    const activeGrade = classGrades.find(g => 
                      g.studentId === std.id && 
                      g.subjectId === selectedSubjectId && 
                      g.term === selectedTerm
                    );
                    const currentScore = activeGrade?.score ?? 14;

                    const studentAllGrades = classGrades.filter(g => g.studentId === std.id);
                    const totalCoeff = studentAllGrades.reduce((sum, g) => sum + g.coefficient, 0);
                    const totalPoints = studentAllGrades.reduce((sum, g) => sum + (g.score * g.coefficient), 0);
                    const generalAvg = totalCoeff > 0 ? (totalPoints / totalCoeff).toFixed(2) : '14.00';

                    return (
                      <tr key={std.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{std.lastName.toUpperCase()} {std.firstName}</div>
                          <div className="text-[10px] font-mono text-cyan-400">{std.matricule}</div>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={currentScore}
                              onChange={(e) => handleQuickGradeChange(std.id, selectedSubjectId, parseFloat(e.target.value) || 0)}
                              className="w-16 p-1.5 text-center font-mono font-black text-sm text-cyan-300 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-cyan-400"
                            />
                            <span className="text-xs text-slate-500 font-bold">/ 20</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-bold text-[11px]">
                          {currentScore >= 16 ? <span className="text-emerald-400">Excellent</span> :
                           currentScore >= 14 ? <span className="text-cyan-400">Bien</span> :
                           currentScore >= 12 ? <span className="text-blue-400">Assez Bien</span> :
                           currentScore >= 10 ? <span className="text-amber-400">Moyen</span> :
                           <span className="text-rose-400">Insuffisant</span>}
                        </td>
                        <td className="p-3.5 text-center">
                          {activeGrade?.isLockedByTeacher ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <Lock className="w-3 h-3" /> Verrouillée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                              <Unlock className="w-3 h-3" /> Modifiable
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-slate-200">
                          {generalAvg} / 20
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

      {/* TAB 3: LES BULLETINS DE LA CLASSE */}
      {activeTab === 'bulletins' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Gestion des Bulletins Trimestriels</h3>
              <p className="text-xs text-slate-400">
                L'accès officiel aux bulletins est conditionné au paiement intégral de la scolarité (Soldé).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenPrint('bulletins_recap')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer les Bulletins (Récapitulatif)</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 text-center w-12">Rang</th>
                    <th className="p-3.5">Matricule & Élève</th>
                    <th className="p-3.5 text-center w-24">Moyenne Gén.</th>
                    <th className="p-3.5 text-center w-28">Mention</th>
                    <th className="p-3.5 text-center w-36">Statut Déblocage</th>
                    <th className="p-3.5 text-right">Action Bulletin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {classStudents.map((std, idx) => {
                    const isSolde = std.paymentStatus === 'paid';
                    const studentAllGrades = classGrades.filter(g => g.studentId === std.id);
                    const totalCoeff = studentAllGrades.reduce((sum, g) => sum + g.coefficient, 0);
                    const totalPoints = studentAllGrades.reduce((sum, g) => sum + (g.score * g.coefficient), 0);
                    const avgNum = totalCoeff > 0 ? (totalPoints / totalCoeff) : 14.5;
                    const avg = avgNum.toFixed(2);
                    const mention = avgNum >= 16 ? 'Très Bien' : avgNum >= 14 ? 'Bien' : avgNum >= 12 ? 'Assez Bien' : 'Passable';

                    return (
                      <tr key={std.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-center font-bold text-cyan-400 font-mono text-sm">{idx + 1}e</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{std.lastName.toUpperCase()} {std.firstName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{std.matricule}</div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-cyan-300 text-sm">
                          {avg} / 20
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-200">
                          {mention}
                        </td>
                        <td className="p-3.5 text-center">
                          {isSolde ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              <Unlock className="w-3 h-3" /> Débloqué (Soldé)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                              <Lock className="w-3 h-3" /> Verrouillé (Impayé)
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setReportCardStudent(std)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                              isSolde 
                                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md' 
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Voir le Bulletin</span>
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

      {/* TAB 4: LES CERTIFICATS SCOLAIRES */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Certificats Scolaires de la Classe</h3>
              <p className="text-xs text-slate-400">
                Délivrance et impression des certificats de scolarité, de fréquentation et de radiation avec sceau officiel.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 text-center w-12">N°</th>
                    <th className="p-3.5">Matricule & Élève</th>
                    <th className="p-3.5">Date Naissance</th>
                    <th className="p-3.5">Parent Responsable</th>
                    <th className="p-3.5 text-right">Générer & Imprimer Certificat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {classStudents.map((std, idx) => (
                    <tr key={std.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{std.lastName.toUpperCase()} {std.firstName}</div>
                        <div className="text-[10px] font-mono text-cyan-400">{std.matricule}</div>
                      </td>
                      <td className="p-3.5 text-slate-300">{std.dateOfBirth}</td>
                      <td className="p-3.5 text-slate-300">{std.guardianName}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenPrint('certificate', std, 'scolarite')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Certif. Scolarité</span>
                          </button>

                          <button
                            onClick={() => handleOpenPrint('certificate', std, 'frequentation')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
                          >
                            <span>Fréquentation</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRÉSENCE & ABSENCES */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAttendanceViewMode('sheet')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  attendanceViewMode === 'sheet' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Feuille d'Émargement
              </button>
              <button
                onClick={() => setAttendanceViewMode('log')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  attendanceViewMode === 'log' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Registre des Absences
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenPrint(attendanceViewMode === 'sheet' ? 'attendance_sheet' : 'absences_log')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {attendanceViewMode === 'sheet' ? "Imprimer la Feuille d'Émargement" : "Imprimer le Registre d'Absences"}
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 text-center w-12">N°</th>
                    <th className="p-3.5">Matricule & Élève</th>
                    {attendanceViewMode === 'sheet' ? (
                      <>
                        <th className="p-3.5 text-center">Lundi</th>
                        <th className="p-3.5 text-center">Mardi</th>
                        <th className="p-3.5 text-center">Mercredi</th>
                        <th className="p-3.5 text-center">Jeudi</th>
                        <th className="p-3.5 text-center">Vendredi</th>
                        <th className="p-3.5 text-center">Émargement</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3.5 text-center">Total Absences</th>
                        <th className="p-3.5 text-center">Justifiées</th>
                        <th className="p-3.5 text-center">Non Justifiées</th>
                        <th className="p-3.5 text-center">Retards</th>
                        <th className="p-3.5 text-right">Statut Assiduité</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {classStudents.map((std, idx) => {
                    const studentRecords = classAttendance.filter(a => a.targetId === std.id);
                    const absences = studentRecords.filter(r => r.status === 'absent');
                    const justified = absences.filter(r => r.isJustified).length;
                    const unjustified = absences.length - justified;
                    const retards = studentRecords.filter(r => r.status === 'retard').length;

                    return (
                      <tr key={std.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{std.lastName.toUpperCase()} {std.firstName}</div>
                          <div className="text-[10px] font-mono text-cyan-400">{std.matricule}</div>
                        </td>

                        {attendanceViewMode === 'sheet' ? (
                          <>
                            <td className="p-3.5 text-center"><div className="w-5 h-5 mx-auto border border-slate-700 rounded" /></td>
                            <td className="p-3.5 text-center"><div className="w-5 h-5 mx-auto border border-slate-700 rounded" /></td>
                            <td className="p-3.5 text-center"><div className="w-5 h-5 mx-auto border border-slate-700 rounded" /></td>
                            <td className="p-3.5 text-center"><div className="w-5 h-5 mx-auto border border-slate-700 rounded" /></td>
                            <td className="p-3.5 text-center"><div className="w-5 h-5 mx-auto border border-slate-700 rounded" /></td>
                            <td className="p-3.5 text-center text-slate-500 italic text-[10px]">Signature</td>
                          </>
                        ) : (
                          <>
                            <td className="p-3.5 text-center font-mono font-bold text-white">{absences.length}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-emerald-400">{justified}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-rose-400">{unjustified}</td>
                            <td className="p-3.5 text-center font-mono text-slate-300">{retards}</td>
                            <td className="p-3.5 text-right font-bold">
                              {unjustified >= 3 ? (
                                <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full text-[10px]">
                                  Alerte absentéisme
                                </span>
                              ) : (
                                <span className="text-emerald-400 text-[10px]">
                                  Régulier
                                </span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FINANCES & SCOLARITÉ */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Recouvrement des Frais Scolaires &bull; {currentClass.name}</h3>
              <p className="text-xs text-slate-400">
                Total dû : {classStats.totalDue.toLocaleString()} FCFA &bull; Collecté : {classStats.totalCollected.toLocaleString()} FCFA
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenPrint('finance_report')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer le Bilan Financier</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 text-center w-12">N°</th>
                    <th className="p-3.5">Matricule & Élève</th>
                    <th className="p-3.5 text-right">Scolarité Due</th>
                    <th className="p-3.5 text-right">Montant Réglé</th>
                    <th className="p-3.5 text-right">Reste à Payer</th>
                    <th className="p-3.5 text-center">Statut</th>
                    <th className="p-3.5 text-right">Action Encaissement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {classStudents.map((std, idx) => {
                    const due = std.annualTuition;
                    const paid = std.paidTuition;
                    const balance = Math.max(0, due - paid);
                    const isSolde = std.paymentStatus === 'paid';

                    return (
                      <tr key={std.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{std.lastName.toUpperCase()} {std.firstName}</div>
                          <div className="text-[10px] font-mono text-cyan-400">{std.matricule}</div>
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-300">{due.toLocaleString()} FCFA</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">{paid.toLocaleString()} FCFA</td>
                        <td className="p-3.5 text-right font-mono font-bold text-rose-400">{balance.toLocaleString()} FCFA</td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isSolde 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : std.paymentStatus === 'partial'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isSolde ? 'Soldé' : std.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {!isSolde ? (
                            <button
                              onClick={() => {
                                setPaymentStudent(std);
                                setPaymentAmount(balance);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                            >
                              Encaisser
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-bold">À jour</span>
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

      {/* 5. PRINT MODAL */}
      <ClassPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentType={printDocumentType}
        schoolClass={currentClass}
        students={students}
        grades={grades}
        subjects={subjects}
        attendance={attendance}
        payments={payments}
        selectedStudent={selectedStudentForCert}
        certificateType={certTypeForPrint}
      />

      {/* 6. ATTENDANCE MODAL */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        defaultClassId={currentClass.id}
      />

      {/* 7. QUICK ENCAISSEMENT MODAL */}
      <AnimatePresence>
        {paymentStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <span>Encaisser Frais de Scolarité</span>
                </div>
                <button onClick={() => setPaymentStudent(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="text-xs space-y-1">
                <div className="text-slate-400">Élève :</div>
                <div className="text-sm font-bold text-white">{paymentStudent.firstName} {paymentStudent.lastName}</div>
                <div className="font-mono text-cyan-400">{paymentStudent.matricule} &bull; {currentClass.name}</div>
              </div>

              <form onSubmit={handleConfirmPayment} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Montant à Encaisser (FCFA)</label>
                  <input
                    type="number"
                    min="1000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStudent(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40"
                  >
                    Valider le Paiement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

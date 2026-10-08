import React, { useState } from 'react';
import { 
  Shield, 
  UserPlus, 
  Users, 
  FileSpreadsheet, 
  CalendarCheck, 
  Clock, 
  Key, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Lock, 
  Eye, 
  Plus, 
  Search, 
  CheckCircle2, 
  Calendar,
  Download,
  BookOpen,
  School,
  Wallet,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { INITIAL_TIMETABLE } from '../../data/mockData';
import { UserAccount, Grade, AttendanceRecord } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { GrandAnalyticsDashboard } from '../analytics/GrandAnalyticsDashboard';
import { AttendanceManagementView } from '../attendance/AttendanceManagementView';
import { SubjectsManagementSection } from '../subjects/SubjectsManagementSection';
import { QuickExportButton } from '../common/QuickExportButton';
import { ClassHubView } from '../classes/ClassHubView';

interface AdminViewProps {
  currentTab: string;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentTab }) => {
  const { 
    users, 
    addUser, 
    deleteUser, 
    students, 
    classes, 
    subjects,
    grades, 
    overrideGradeAdmin, 
    attendance, 
    recordAttendance, 
    setReportCardStudent,
    openExportModal,
    t,
    schoolProfile,
    daysRemaining,
    isSubscriptionRestricted,
    setIsSchoolRegisterModalOpen,
    setIsSubscriptionModalOpen,
    setIsGoogleDriveSyncModalOpen
  } = useApp();

  // Sub tab navigation inside Admin
  const [activeSubTab, setActiveSubTab] = useState<string>('teachers');

  // Sync with currentTab prop from Sidebar
  React.useEffect(() => {
    if (['classes', 'teachers', 'subjects', 'students', 'grades', 'attendance', 'timetable', 'accounts'].includes(currentTab)) {
      setActiveSubTab(currentTab);
    }
  }, [currentTab]);

  // Students Filter State
  const [adminStudentSearch, setAdminStudentSearch] = useState('');
  const [adminStudentClassFilter, setAdminStudentClassFilter] = useState('all');

  // Teacher Generator Form
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['sub-math']);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['cls-tc']);
  const [generatedTeacherResult, setGeneratedTeacherResult] = useState<{
    name: string;
    username: string;
    tempPass: string;
    subjects: string[];
    classes: string[];
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Grade Override Modal
  const [gradeToOverride, setGradeToOverride] = useState<Grade | null>(null);
  const [newScoreInput, setNewScoreInput] = useState<number>(15);
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Attendance Form
  const [attTargetType, setAttTargetType] = useState<'student' | 'teacher'>('student');
  const [attTargetId, setAttTargetId] = useState<string>(students[0]?.id || '');
  const [attStatus, setAttStatus] = useState<'absent' | 'retard'>('absent');
  const [attIsJustified, setAttIsJustified] = useState<boolean>(false);
  const [attReason, setAttReason] = useState<string>('');

  // Delete User Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  // Parent Account Creator Modal
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentStudentMatricule, setParentStudentMatricule] = useState(students[0]?.matricule || '');

  // Handle Teacher Credential Auto-Generation
  const handleGenerateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName) return;

    // Generate clean username e.g. "prof.koffi" or "t.dupont"
    const cleanName = teacherName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const username = `prof.${cleanName.substring(0, 10)}`;
    const tempPass = `Plume@${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = addUser({
      username,
      name: teacherName,
      email: teacherEmail || `${username}@plume-school.org`,
      role: 'enseignant',
      assignedSubjects: selectedSubjects,
      assignedClasses: selectedClasses,
      phone: '+33 6 00 00 00 00'
    });

    setGeneratedTeacherResult({
      name: teacherName,
      username,
      tempPass,
      subjects: selectedSubjects,
      classes: selectedClasses
    });

    setTeacherName('');
    setTeacherEmail('');
  };

  const handleCopyCredentials = () => {
    if (!generatedTeacherResult) return;
    const text = `Identifiants Enseignant Plume\nNom: ${generatedTeacherResult.name}\nIdentifiant: ${generatedTeacherResult.username}\nMot de passe provisoire: ${generatedTeacherResult.tempPass}\nPlateforme: https://plume.education`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle Administrative Grade Override
  const handleConfirmGradeOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeToOverride) return;

    overrideGradeAdmin(gradeToOverride.id, Number(newScoreInput), overrideReason || 'Rectification administrative');
    setGradeToOverride(null);
    setOverrideReason('');
  };

  // Handle Attendance Recording
  const handleRecordAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordAttendance({
      targetId: attTargetId,
      targetType: attTargetType,
      date: new Date().toISOString().split('T')[0],
      status: attStatus,
      isJustified: attIsJustified,
      reason: attReason || (attIsJustified ? 'Justificatif fourni' : 'Non justifié')
    });
    setAttReason('');
  };

  // Handle Create Parent Account
  const handleCreateParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName) return;

    const clean = parentName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    addUser({
      username: `parent.${clean}`,
      name: parentName,
      email: parentEmail || `famille.${clean}@plume-school.org`,
      role: 'parent',
      studentMatricule: parentStudentMatricule
    });

    setIsParentModalOpen(false);
    setParentName('');
    setParentEmail('');
  };

  const teachers = users.filter(u => u.role === 'enseignant');

  if (currentTab === 'analytics') {
    return <GrandAnalyticsDashboard roleVariant="admin" />;
  }

  if (currentTab === 'attendance') {
    return <AttendanceManagementView userRole="admin" />;
  }

  if (currentTab === 'classes' || activeSubTab === 'classes') {
    return <ClassHubView role="admin" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Direction des Études & Administration Centrale</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
            Supervision & Régulation
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-2xl">
            Gestion du personnel enseignant, attribution des accès, régulation hiérarchique des notes et gestion globale de l'assiduité.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* School Settings & Signatories */}
          <button
            onClick={() => setIsSchoolRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            title="Modifier le nom de l'école, le logo et les 3 signataires officiels"
          >
            <School className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Établissement & Signataires</span>
            <span className="sm:hidden">École</span>
          </button>

          {/* Subscription & 30-day Trial Button */}
          <button
            onClick={() => setIsSubscriptionModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              schoolProfile?.subscription?.status === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : isSubscriptionRestricted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            }`}
            title="Gestion de l'abonnement ($15/mois) et de la restriction 30 jours"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{schoolProfile?.subscription?.status === 'active' ? 'Abonnement $15/m' : `Essai J-${daysRemaining}`}</span>
          </button>

          {/* Google Drive Sovereignty Sync */}
          <button
            onClick={() => setIsGoogleDriveSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/40 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-all cursor-pointer"
            title="Sauvegarde et souveraineté des données sur Google Drive"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Google Drive</span>
          </button>

          <QuickExportButton 
            label="Exporter Rapports"
            reportType="classes"
            variant="cyan"
          />

          <button
            onClick={() => setIsParentModalOpen(true)}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/40 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Créer Compte Parent</span>
          </button>
        </div>
      </div>

      {/* Internal Navigation Tabs with animated indicator */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto relative">
        {[
          { id: 'classes', label: 'Espace Classes (Maternelle à Term)', icon: <School className="w-4 h-4" /> },
          { id: 'teachers', label: 'Enseignants & Générateur Accès', icon: <UserPlus className="w-4 h-4" /> },
          { id: 'subjects', label: 'Matières & Coefficients', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'students', label: 'Effectifs Élèves', icon: <Users className="w-4 h-4" /> },
          { id: 'grades', label: 'Régulation des Notes (Override)', icon: <FileSpreadsheet className="w-4 h-4" /> },
          { id: 'attendance', label: 'Assiduité & Absences', icon: <CalendarCheck className="w-4 h-4" /> },
          { id: 'timetable', label: 'Emplois du Temps', icon: <Clock className="w-4 h-4" /> },
          { id: 'accounts', label: 'Comptes Système & Rôles', icon: <Shield className="w-4 h-4" /> }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveSubTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-200 z-10 ${
                isActive
                  ? 'text-indigo-200'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeAdminSubTab"
                  className="absolute inset-0 rounded-xl bg-indigo-500/25 border border-indigo-500/40 shadow-md shadow-indigo-950/40 -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              {tab.icon}
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* SUB-TAB 1: Teacher Management & Auto Credentials Generator */}
      {activeSubTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Generator Form */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Key className="w-4 h-4" />
              <span>Générateur Automatique d'Identifiants</span>
            </div>
            <p className="text-xs text-slate-400">
              Saisissez le nom de l'enseignant, ses matières et ses classes. Le système génère instantanément son identifiant et son mot de passe temporaire.
            </p>

            <form onSubmit={handleGenerateTeacher} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nom complet de l'enseignant *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: M. Patrick Mbarga"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Email professionnel (Optionnel)</label>
                <input
                  type="email"
                  placeholder="p.mbarga@plume-school.org"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Matière(s) enseignée(s) *</label>
                <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {subjects.filter(s => s.isActive !== false).map((s) => (
                    <label key={s.id} className="flex items-center gap-2 p-1 text-slate-300 hover:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSubjects([...selectedSubjects, s.id]);
                          else setSelectedSubjects(selectedSubjects.filter(id => id !== s.id));
                        }}
                        className="rounded accent-indigo-500"
                      />
                      <span>{s.name} ({s.code})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Classe(s) assignée(s) *</label>
                <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {classes.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 p-1 text-slate-300 hover:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedClasses([...selectedClasses, c.id]);
                          else setSelectedClasses(selectedClasses.filter(id => id !== c.id));
                        }}
                        className="rounded accent-indigo-500"
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-950/40"
              >
                Générer les Accès Enseignant
              </button>
            </form>

            {/* Generated Transmission Slip */}
            {generatedTeacherResult && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-in fade-in">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-300">
                  <span>Fiche de transmission d'accès</span>
                  <span className="text-[10px] text-emerald-400">Prêt à transmettre</span>
                </div>
                
                <div className="space-y-1 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200">
                  <div>Identifiant : <strong className="text-cyan-400">{generatedTeacherResult.username}</strong></div>
                  <div>Mot de passe : <strong className="text-amber-400">{generatedTeacherResult.tempPass}</strong></div>
                </div>

                <button
                  onClick={handleCopyCredentials}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 text-xs font-semibold border border-indigo-500/40"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copié dans le presse-papier !' : 'Copier la fiche d\'accès'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Teacher List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-white text-base">Corps Professoral Enregistré ({teachers.length})</h3>
              <QuickExportButton
                label="Exporter Affectations"
                reportType="classes"
                variant="indigo"
                size="sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teachers.map((prof) => {
                const profSubjects = (prof.assignedSubjects || []).map(id => subjects.find(s => s.id === id)?.name).filter(Boolean);
                const profClasses = (prof.assignedClasses || []).map(id => classes.find(c => c.id === id)?.name).filter(Boolean);

                return (
                  <div key={prof.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {prof.avatar ? (
                            <img src={prof.avatar} alt={prof.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-cyan-500/30" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-xs">
                              {prof.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-white text-sm">{prof.name}</h4>
                            <span className="text-[11px] font-mono text-cyan-400">{prof.username}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setUserToDelete(prof)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Supprimer le compte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Matières assignées :</span>
                          <span className="text-slate-200">{profSubjects.join(', ') || 'Non spécifiées'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Classes sous sa charge :</span>
                          <span className="text-slate-200">{profClasses.join(' • ') || 'Toutes les classes'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                      <span>{prof.email}</span>
                      <span>Compte actif</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB: Custom Subjects Management */}
      {activeSubTab === 'subjects' && (
        <SubjectsManagementSection canManage={true} />
      )}

      {/* SUB-TAB: Students Registry & Quick Export */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                <Users className="w-4 h-4" />
                <span>Direction Pédagogique & Registre Central</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">
                Effectifs & Dossiers des Élèves
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Consultez la liste exhaustive des apprenants inscrits et exportez instantanément les listes par classe.
              </p>
            </div>

            <QuickExportButton 
              reportType="students"
              classId={adminStudentClassFilter}
              label="Exporter Liste des Élèves"
              variant="indigo"
            />
          </div>

          {/* Search & Class Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={adminStudentSearch}
                onChange={(e) => setAdminStudentSearch(e.target.value)}
                placeholder="Rechercher par nom, prénom ou matricule..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={adminStudentClassFilter}
                onChange={(e) => setAdminStudentClassFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Toutes les classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                ))}
              </select>

              <span className="text-xs text-slate-400 font-mono pl-2">
                {students.filter(s => {
                  const matchSearch = `${s.firstName} ${s.lastName} ${s.matricule}`.toLowerCase().includes(adminStudentSearch.toLowerCase());
                  const matchClass = adminStudentClassFilter === 'all' || s.classId === adminStudentClassFilter;
                  return matchSearch && matchClass;
                }).length} élève(s)
              </span>
            </div>
          </div>

          {/* Students Table */}
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Matricule</th>
                    <th className="p-3.5">Nom et Prénom</th>
                    <th className="p-3.5">Classe</th>
                    <th className="p-3.5">Responsable Légal</th>
                    <th className="p-3.5">Contact Téléphonique</th>
                    <th className="p-3.5">Statut Paiement</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {students.filter(s => {
                    const matchSearch = `${s.firstName} ${s.lastName} ${s.matricule}`.toLowerCase().includes(adminStudentSearch.toLowerCase());
                    const matchClass = adminStudentClassFilter === 'all' || s.classId === adminStudentClassFilter;
                    return matchSearch && matchClass;
                  }).map((std) => {
                    const cls = classes.find(c => c.id === std.classId)?.name || 'Non affecté';
                    return (
                      <tr key={std.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono text-cyan-400 font-bold">{std.matricule}</td>
                        <td className="p-3.5 font-bold text-white">{std.lastName} {std.firstName}</td>
                        <td className="p-3.5 text-slate-300 font-medium">{cls}</td>
                        <td className="p-3.5 text-slate-300">{std.guardianName}</td>
                        <td className="p-3.5 text-slate-400 font-mono">{std.guardianPhone}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            std.paymentStatus === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : std.paymentStatus === 'partial'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {std.paymentStatus === 'paid' ? 'À Jour' : std.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setReportCardStudent(std)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
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

      {/* SUB-TAB 2: Grade Supervision & Administrative Override */}
      {activeSubTab === 'grades' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300">
            <div>
              <strong>Droit de Rectification Hiérarchique de l'Administration :</strong> Même après le verrouillage définitif par un professeur, la Direction Administrative conserve le pouvoir exclusif d'éditer ou de corriger une note avec enregistrement obligatoire du motif pour traçabilité d'audit.
            </div>
            <QuickExportButton 
              label="Exporter Relevé Notes"
              reportType="grades"
              variant="indigo"
              size="sm"
            />
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[680px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Élève & Classe</th>
                    <th className="p-3.5">Évaluation & Matière</th>
                    <th className="p-3.5 text-center">Note Actuelle</th>
                    <th className="p-3.5 text-center">Verrouillage Enseignant</th>
                    <th className="p-3.5">Statut de Rectification</th>
                    <th className="p-3.5 text-right">Action Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {grades.map((g) => {
                    const student = students.find(s => s.id === g.studentId);
                    const subject = subjects.find(s => s.id === g.subjectId);
                    const cls = classes.find(c => c.id === g.classId);

                    return (
                      <tr key={g.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{student ? `${student.firstName} ${student.lastName}` : 'Élève'}</div>
                          <div className="text-[10px] text-slate-400">{cls?.name} • {student?.matricule}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-medium text-slate-200">{g.assessmentName}</div>
                          <div className="text-[10px] text-cyan-400">{subject?.name} (Coeff {g.coefficient})</div>
                        </td>

                        <td className="p-3.5 text-center font-mono font-black text-sm text-cyan-400">
                          {g.score} / 20
                        </td>

                        <td className="p-3.5 text-center">
                          {g.isLockedByTeacher ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              <Lock className="w-3 h-3" /> Verrouillé par le Prof
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                              Brouillon
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {g.modifiedByAdmin ? (
                            <div className="space-y-0.5">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                Modifiée par l'Admin
                              </span>
                              <div className="text-[10px] text-slate-400 italic">
                                "{g.adminNote}"
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Note d'origine</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setGradeToOverride(g);
                              setNewScoreInput(g.score);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Modifier la note</span>
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

      {/* SUB-TAB 3: Attendance Management */}
      {activeSubTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Attendance Mark Form */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-cyan-400" />
              Enregistrer une Absence ou un Retard
            </h3>

            <form onSubmit={handleRecordAttendanceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Cible</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAttTargetType('student');
                      setAttTargetId(students[0]?.id || '');
                    }}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      attTargetType === 'student' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    Élève
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttTargetType('teacher');
                      setAttTargetId(teachers[0]?.id || '');
                    }}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      attTargetType === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    Enseignant
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Personne concernée</label>
                <select
                  value={attTargetId}
                  onChange={(e) => setAttTargetId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  {attTargetType === 'student' ? (
                    students.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.matricule})</option>
                    ))
                  ) : (
                    teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.username})</option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Type</label>
                  <select
                    value={attStatus}
                    onChange={(e) => setAttStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="absent">Absence</option>
                    <option value="retard">Retard</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Justification</label>
                  <select
                    value={attIsJustified ? 'yes' : 'no'}
                    onChange={(e) => setAttIsJustified(e.target.value === 'yes')}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="no">Non justifiée</option>
                    <option value="yes">Justifiée</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Motif / Observation</label>
                <input
                  type="text"
                  placeholder="Ex: Rendez-vous médical, Maladie, Panne de transport..."
                  value={attReason}
                  onChange={(e) => setAttReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md"
              >
                Valider l'enregistrement
              </button>
            </form>
          </div>

          {/* Attendance Log Table */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-bold text-white text-base">Registre Quotidien d'Assiduité</h3>
            
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Cible & Nom</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Justifié</th>
                    <th className="p-3.5">Motif</th>
                    <th className="p-3.5">Enregistré par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {attendance.map((rec) => {
                    let name = 'Inconnu';
                    if (rec.targetType === 'student') {
                      const s = students.find(x => x.id === rec.targetId);
                      if (s) name = `${s.firstName} ${s.lastName}`;
                    } else {
                      const t = users.find(x => x.id === rec.targetId);
                      if (t) name = t.name;
                    }

                    return (
                      <tr key={rec.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 text-slate-300 font-mono">{rec.date}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{name}</div>
                          <span className="text-[10px] text-cyan-400 capitalize">{rec.targetType}</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`capitalize px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            rec.status === 'absent' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {rec.isJustified ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Oui
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold">Non</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-300 italic">{rec.reason || '—'}</td>
                        <td className="p-3.5 text-slate-400 text-[11px]">{rec.recordedBy}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 4: Timetable */}
      {activeSubTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">Grille Horaire & Emplois du Temps (Terminale C)</h3>
            <span className="text-xs text-cyan-400 font-semibold">Semaine Pédagogique Type</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day) => {
              const daySlots = INITIAL_TIMETABLE.filter(t => t.day === day);

              return (
                <div key={day} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="font-bold text-sm text-cyan-400 border-b border-slate-800 pb-2">
                    {day}
                  </div>

                  <div className="space-y-2">
                    {daySlots.length === 0 ? (
                      <div className="text-[11px] text-slate-500 py-4 text-center">Aucun cours</div>
                    ) : (
                      daySlots.map(slot => {
                        const subj = subjects.find(s => s.id === slot.subjectId);
                        const teacher = users.find(u => u.id === slot.teacherId);

                        return (
                          <div key={slot.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                            <span className="text-[10px] font-mono text-cyan-400 font-semibold block">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <strong className="text-white text-xs block">{subj?.name}</strong>
                            <div className="text-[10px] text-slate-400 flex justify-between">
                              <span>{teacher?.name?.split(' ')[1] || 'Prof'}</span>
                              <span className="font-mono">{slot.room}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: User Accounts & Roles (Administration & Proviseur control) */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-white">Comptes Utilisateurs & Droits d'Accès</h3>
              <p className="text-xs text-slate-400">Seuls l'Administration et le Proviseur peuvent révoquer ou créer des accès.</p>
            </div>
            <button
              onClick={() => setIsParentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nouveau Compte</span>
            </button>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[650px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Utilisateur</th>
                    <th className="p-3.5">Identifiant</th>
                    <th className="p-3.5">Rôle Système</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Créé le</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{u.name}</div>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-400 font-bold">{u.username}</td>
                      <td className="p-3.5">
                        <span className="capitalize px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 text-[10px] font-semibold">
                          {t(u.role as any)}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{u.email}</td>
                      <td className="p-3.5 text-slate-400">{u.createdAt}</td>
                      <td className="p-3.5 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Supprimer ce compte avec confirmation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Override Grade Administrative Form */}
      <AnimatePresence>
        {gradeToOverride && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGradeToOverride(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex justify-between items-center px-6 py-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">Modification Hiérarchique de Note</h3>
                </div>
                <button onClick={() => setGradeToOverride(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleConfirmGradeOverride} className="p-6 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Évaluation concernée :</span>
                  <strong className="text-white text-sm block">{gradeToOverride.assessmentName}</strong>
                  <div className="text-slate-400">Note enregistrée par l'enseignant : <span className="font-bold text-cyan-400">{gradeToOverride.score} / 20</span></div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nouvelle Note Corrigée (sur 20) *</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    required
                    value={newScoreInput}
                    onChange={(e) => setNewScoreInput(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-base focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Motif Administratif Obligatoire *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ex: Rectification suite à réclamation justifiée et validation de copie en commission d'arbitrage..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGradeToOverride(null)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-950/40"
                  >
                    Valider la Rectification
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Create Parent Account */}
      <AnimatePresence>
        {isParentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsParentModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex justify-between items-center px-6 py-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">Créer un Compte Parent</h3>
                </div>
                <button onClick={() => setIsParentModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateParentSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nom des parents / responsables *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: M. et Mme Koffi"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="famille.koffi@gmail.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Matricule de l'enfant rattaché *</label>
                  <select
                    value={parentStudentMatricule}
                    onChange={(e) => setParentStudentMatricule(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.matricule}>
                        {s.firstName} {s.lastName} ({s.matricule})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsParentModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-950/40"
                  >
                    Créer le compte
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for User Account Deletion */}
      <ConfirmationModal
        isOpen={!!userToDelete}
        title="Supprimer le compte utilisateur"
        message={`Attention : vous êtes sur le point de supprimer définitivement le compte de "${userToDelete?.name}" (${userToDelete?.username}). Cet utilisateur ne pourra plus accéder à la plateforme.`}
        onCancel={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
          }
        }}
      />

    </div>
  );
};

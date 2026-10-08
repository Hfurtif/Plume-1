import React, { useState } from 'react';
import { 
  Shield, 
  Award, 
  Wallet, 
  GraduationCap, 
  Users, 
  Phone, 
  School, 
  KeyRound, 
  ArrowRight, 
  Sparkles, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  User,
  BookOpen,
  MapPin,
  Building,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { SUPPORTED_COUNTRIES } from '../../data/mockData';

export const LoginView: React.FC = () => {
  const { 
    login, 
    loginAsParent, 
    loginAsTeacher, 
    students,
    schoolProfile,
    registeredSchools,
    setIsSchoolRegisterModalOpen,
    setIsSubscriptionModalOpen,
    daysRemaining,
    isSubscriptionRestricted
  } = useApp();

  // Mode: 'parent' | 'teacher' | 'staff'
  const [authMode, setAuthMode] = useState<'parent' | 'teacher' | 'staff'>('parent');

  // PARENT FLOW STATES
  const [parentPhone, setParentPhone] = useState('+33 6 12 34 56 78');
  const [parentName, setParentName] = useState('M. Emmanuel Koffi');
  const [matriculeInput, setMatriculeInput] = useState('');
  const [parentMatricules, setParentMatricules] = useState<string[]>(['PLM-2025-001']);
  const [parentError, setParentError] = useState<string | null>(null);

  // TEACHER FLOW STATES
  const [teacherCountry, setTeacherCountry] = useState<string>(schoolProfile?.country || 'Bénin');
  const [teacherPhone, setTeacherPhone] = useState('+229 97 12 34 56');
  const [teacherSchool, setTeacherSchool] = useState(schoolProfile?.name || "Complexe Scolaire Plume Excellence");
  const [teacherIdentifier, setTeacherIdentifier] = useState('PROF-MATH-01');
  const [teacherError, setTeacherError] = useState<string | null>(null);

  // STAFF FLOW STATES (Admin, Proviseur, Comptable)
  const [staffRole, setStaffRole] = useState<UserRole>('admin');
  const [staffUsername, setStaffUsername] = useState('admin');
  const [staffPassword, setStaffPassword] = useState('••••••••');

  // Handle adding child matricule for parent
  const handleAddMatricule = (matriculeToAdd?: string) => {
    const raw = (matriculeToAdd || matriculeInput).trim().toUpperCase();
    if (!raw) return;

    if (parentMatricules.includes(raw)) {
      setParentError(`Le matricule "${raw}" est déjà ajouté à la liste.`);
      return;
    }

    const found = students.find(s => s.matricule.toUpperCase() === raw);
    if (!found) {
      setParentError(`Matricule "${raw}" non trouvé dans la base scolaire. Vérifiez sur le badge ou le certificat.`);
      return;
    }

    setParentMatricules(prev => [...prev, raw]);
    setMatriculeInput('');
    setParentError(null);
  };

  const handleRemoveMatricule = (mat: string) => {
    setParentMatricules(prev => prev.filter(m => m !== mat));
  };

  // Submit Parent Login / Account Creation
  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParentError(null);

    if (parentMatricules.length === 0) {
      setParentError('Veuillez ajouter au moins un matricule d\'élève pour votre enfant.');
      return;
    }

    const result = loginAsParent(parentPhone, parentMatricules, parentName);
    if (!result.success && result.error) {
      setParentError(result.error);
    }
  };

  // Submit Teacher Login
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError(null);

    const result = loginAsTeacher(teacherPhone, teacherSchool, teacherIdentifier, teacherCountry);
    if (!result.success && result.error) {
      setTeacherError(result.error);
    }
  };

  // Submit Staff Login
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(staffRole);
  };

  // Quick suggestions for easy testing
  const sampleChildren = [
    { matricule: 'PLM-2025-001', name: 'Audrey Koffi', class: 'Terminale C', status: 'paid' },
    { matricule: 'PLM-2025-002', name: 'Alexandre Moreau', class: 'Terminale C', status: 'partial' },
    { matricule: 'PLM-2025-003', name: 'Aïssatou Diallo', class: 'Terminale C', status: 'paid' },
    { matricule: 'PLM-2025-004', name: 'Lucas Benali', class: 'Terminale C', status: 'unpaid' }
  ];

  const teacherSuggestions = [
    { name: 'M. Koffi', subj: 'Maths / Phys', phone: '+33 6 52 14 78 99', code: 'PROF-MATH-01' },
    { name: 'Mme Mercier', subj: 'Français / Philo', phone: '+33 6 87 45 12 30', code: 'PROF-LETTRES-02' },
    { name: 'M. Diallo', subj: 'SVT / Info', phone: '+33 6 41 23 99 87', code: 'PROF-SVT-03' }
  ];

  const rolesConfig: { role: UserRole; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { 
      role: 'admin', 
      title: 'Administration', 
      desc: 'Gestion des études, accès, override des notes & emplois du temps', 
      icon: <Shield className="w-4 h-4" />,
      color: 'from-blue-600 to-indigo-600'
    },
    { 
      role: 'proviseur', 
      title: 'Proviseur', 
      desc: 'Haute autorité, inspection générale & certificats officiels exclusifs', 
      icon: <Award className="w-4 h-4" />,
      color: 'from-amber-500 to-amber-700'
    },
    { 
      role: 'comptable', 
      title: 'Comptable', 
      desc: 'Gestion financière, encaissement des frais & paramétrage des classes', 
      icon: <Wallet className="w-4 h-4" />,
      color: 'from-emerald-500 to-teal-600'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 bg-slate-950 text-slate-100 relative overflow-hidden">
      
      {/* Background glowing animated orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.16, 0.1]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.18, 0.1]
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-2xl relative z-10 space-y-4 sm:space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2 px-2">
          <motion.div 
            whileHover={{ scale: 1.08, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-500/20 overflow-hidden cursor-pointer"
          >
            <img 
              src="/src/assets/images/plume_app_icon_1790683767339.jpg" 
              alt="Plume" 
              className="w-full h-full object-cover" 
            />
          </motion.div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
              Plume
            </h1>
            <p className="text-xs sm:text-sm text-cyan-400 font-semibold tracking-wide">
              Système Intégré de Gestion Scolaire
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 max-w-md mx-auto mt-0.5">
              Accédez à votre espace dédié avec votre numéro de téléphone ou identifiant certifié.
            </p>
          </div>
        </div>

        {/* New School Registration Banner / Trial Period Callout */}
        <div className="rounded-2xl p-3.5 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-cyan-950/20">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <span>Vous êtes un nouvel Établissement ?</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Essai 30 Jours Offert
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Inscrivez votre école, téléversez votre logo et définissez les 3 signataires (15 $/mois après 30 jours).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSchoolRegisterModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inscrire une École</span>
          </button>
        </div>

        {/* Main Authentication Card */}
        <div className="rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-4 sm:p-7 backdrop-blur-2xl">
          
          {/* Main 3 Modes Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 bg-slate-950/80 rounded-xl sm:rounded-2xl border border-slate-800 mb-5">
            
            {/* Mode Parent */}
            <button
              type="button"
              onClick={() => setAuthMode('parent')}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                authMode === 'parent'
                  ? 'text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {authMode === 'parent' && (
                <motion.div
                  layoutId="activeAuthModePill"
                  className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/30 -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <Users className="w-4 h-4 shrink-0 text-violet-300" />
              <span className="leading-tight">Mode Parent</span>
            </button>

            {/* Mode Enseignant */}
            <button
              type="button"
              onClick={() => setAuthMode('teacher')}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                authMode === 'teacher'
                  ? 'text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {authMode === 'teacher' && (
                <motion.div
                  layoutId="activeAuthModePill"
                  className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg shadow-cyan-900/30 -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <GraduationCap className="w-4 h-4 shrink-0 text-cyan-300" />
              <span className="leading-tight">Mode Prof</span>
            </button>

            {/* Mode Direction / Staff */}
            <button
              type="button"
              onClick={() => setAuthMode('staff')}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                authMode === 'staff'
                  ? 'text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {authMode === 'staff' && (
                <motion.div
                  layoutId="activeAuthModePill"
                  className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 shadow-lg shadow-amber-900/30 -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <Shield className="w-4 h-4 shrink-0 text-amber-300" />
              <span className="leading-tight">Direction</span>
            </button>

          </div>

          {/* ======================================================== */}
          {/* TAB 1: PARENTS LOGIN / ACCOUNT CREATION                   */}
          {/* ======================================================== */}
          {authMode === 'parent' && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/30 text-xs text-violet-300 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Connexion & Création de Compte Parent</strong>
                  <span>Entrez simplement votre <strong>numéro de téléphone</strong> puis ajoutez le ou les <strong>matricules</strong> de vos enfants pour accéder à leur dossier complet.</span>
                </div>
              </div>

              {parentError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parentError}</span>
                </div>
              )}

              <form onSubmit={handleParentSubmit} className="space-y-3.5">
                {/* 1. Phone number */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    1. Numéro de Téléphone du Parent *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78 ou 07 00 00 00 00"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Votre identifiant principal unique pour vous connecter ou créer votre compte.
                  </span>
                </div>

                {/* 2. Add Student Matricules */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      2. Matricule(s) de vos Enfants * <span className="text-slate-500 font-normal">({parentMatricules.length} ajouté{parentMatricules.length > 1 ? 's' : ''})</span>
                    </label>
                    <span className="text-[10px] text-violet-400 font-medium">Ajout illimité (fratrie)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={matriculeInput}
                        onChange={(e) => {
                          setMatriculeInput(e.target.value);
                          setParentError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMatricule();
                          }
                        }}
                        placeholder="Ex: PLM-2025-001"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddMatricule()}
                      className="px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {/* List of registered children */}
                  <div className="mt-2.5 space-y-1.5">
                    {parentMatricules.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">
                        Aucun matricule encore ajouté. Saisissez le matricule de votre enfant ci-dessus.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {parentMatricules.map(mat => {
                          const std = students.find(s => s.matricule.toUpperCase() === mat.toUpperCase());
                          return (
                            <div 
                              key={mat}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-violet-500/40 text-xs shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <div>
                                <span className="font-bold text-white">
                                  {std ? `${std.firstName} ${std.lastName}` : mat}
                                </span>
                                <span className="font-mono text-cyan-400 text-[10px] ml-1.5 font-bold">
                                  ({mat})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMatricule(mat)}
                                className="p-0.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                                title="Retirer ce matricule"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Suggestions for rapid demo */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-1.5 uppercase font-bold tracking-wider">
                      Suggestions rapides (Cliquer pour ajouter) :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sampleChildren.map(c => {
                        const isAdded = parentMatricules.includes(c.matricule);
                        return (
                          <button
                            key={c.matricule}
                            type="button"
                            disabled={isAdded}
                            onClick={() => handleAddMatricule(c.matricule)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-all flex items-center gap-1.5 ${
                              isAdded
                                ? 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                                : 'bg-slate-950 hover:bg-violet-950/40 border-slate-800 hover:border-violet-500/40 text-slate-300 hover:text-white cursor-pointer'
                            }`}
                          >
                            <span>{c.name}</span>
                            <span className="text-[10px] text-cyan-400">({c.matricule})</span>
                            {c.status === 'paid' ? (
                              <span className="text-[9px] text-emerald-400">✓ Soldé</span>
                            ) : (
                              <span className="text-[9px] text-amber-400">🔒 Partiel</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-violet-950/50 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer"
                >
                  <span>Accéder à mon Espace Parent</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TEACHERS LOGIN                                    */}
          {/* ======================================================== */}
          {authMode === 'teacher' && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300 flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">Espace Enseignants & Corps Professoral</strong>
                  <span>Authentification par téléphone, établissement et identifiant attribué par la direction scolaire.</span>
                </div>
              </div>

              {teacherError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{teacherError}</span>
                </div>
              )}

              <form onSubmit={handleTeacherSubmit} className="space-y-3.5">
                {/* 1. Country Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    1. Pays où vous enseignez *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={teacherCountry}
                      onChange={(e) => {
                        const newCountry = e.target.value;
                        setTeacherCountry(newCountry);
                        const matchedC = SUPPORTED_COUNTRIES.find(c => c.name === newCountry);
                        if (matchedC && !teacherPhone.startsWith(matchedC.dialCode)) {
                          setTeacherPhone(`${matchedC.dialCode} `);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {SUPPORTED_COUNTRIES.map(c => (
                        <option key={c.code} value={c.name} className="bg-slate-900 text-white">
                          {c.flag} {c.name} ({c.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. School */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      2. Établissement Scolaire de Rattachement *
                    </label>
                    {schoolProfile && (
                      <button
                        type="button"
                        onClick={() => setTeacherSchool(schoolProfile.name)}
                        className="text-[10px] text-cyan-400 hover:underline"
                      >
                        Utiliser {schoolProfile.name.split(' ')[0]}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={teacherSchool}
                      onChange={(e) => setTeacherSchool(e.target.value)}
                      placeholder="Ex: Complexe Scolaire Plume Excellence"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  {/* Quick registered school badge */}
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                    <Building className="w-3 h-3 text-cyan-400" />
                    <span>École active : <strong className="text-slate-200">{schoolProfile?.name || 'Plume Excellence'}</strong> ({schoolProfile?.country || 'Bénin'})</span>
                  </div>
                </div>

                {/* 3. Identifier */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    3. Identifiant Donné par l'Établissement *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={teacherIdentifier}
                      onChange={(e) => setTeacherIdentifier(e.target.value)}
                      placeholder="Ex: PROF-MATH-01 ou prof.math"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Attribué par l'administration lors de votre enregistrement dans l'école.
                  </span>
                </div>

                {/* 4. Phone */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    4. Numéro de Téléphone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={teacherPhone}
                      onChange={(e) => setTeacherPhone(e.target.value)}
                      placeholder="+229 97 12 34 56"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Quick teacher test pills */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-1.5 uppercase font-bold tracking-wider">
                    Comptes professeurs pré-configurés (1-clic) :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {teacherSuggestions.map(t => (
                      <button
                        key={t.code}
                        type="button"
                        onClick={() => {
                          setTeacherPhone(t.phone);
                          setTeacherSchool("Lycée d'Excellence Plume");
                          setTeacherIdentifier(t.code);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="font-bold">{t.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">({t.code})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer"
                >
                  <span>Valider et Accéder à mon Espace Professeur</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: DIRECTION & ADMINISTRATION (Staff)                */}
          {/* ======================================================== */}
          {authMode === 'staff' && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-2">
                {rolesConfig.map(r => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => {
                      setStaffRole(r.role);
                      if (r.role === 'admin') setStaffUsername('admin');
                      else if (r.role === 'proviseur') setStaffUsername('proviseur');
                      else if (r.role === 'comptable') setStaffUsername('comptable');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      staffRole === r.role
                        ? 'bg-slate-800 border-cyan-500/50 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex justify-center mb-1">{r.icon}</div>
                    <span className="text-xs font-bold block">{r.title}</span>
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                {rolesConfig.find(r => r.role === staffRole)?.desc}
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Identifiant Direction / Personnel
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer"
                >
                  <span>Connexion Direction ({rolesConfig.find(r => r.role === staffRole)?.title})</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Quick Demo 1-Click Access for Evaluators */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Accès Démo Immédiat en 1 Clic (Évaluateurs) :
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {[
                { role: 'parent', label: 'Parent (Koffi)', icon: <Users className="w-3.5 h-3.5 text-violet-400" /> },
                { role: 'enseignant', label: 'Enseignant (Maths)', icon: <GraduationCap className="w-3.5 h-3.5 text-cyan-400" /> },
                { role: 'proviseur', label: 'Proviseur', icon: <Award className="w-3.5 h-3.5 text-amber-400" /> },
                { role: 'admin', label: 'Administration', icon: <Shield className="w-3.5 h-3.5 text-blue-400" /> },
                { role: 'comptable', label: 'Comptable', icon: <Wallet className="w-3.5 h-3.5 text-emerald-400" /> }
              ].map((r, idx) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => login(r.role as UserRole)}
                  className={`px-2 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                  }`}
                >
                  {r.icon}
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center text-[10px] sm:text-[11px] text-slate-500 font-medium">
          Groupe Scolaire International Plume • Système de Gestion Pédagogique et Financière
        </div>

      </motion.div>
    </div>
  );
};

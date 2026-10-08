import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  Users, 
  GraduationCap, 
  School, 
  UserCheck, 
  Phone, 
  Mail, 
  FileText, 
  Wallet, 
  CalendarCheck, 
  ArrowRight, 
  ChevronRight,
  Shield,
  Sparkles,
  Command,
  CornerDownLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Student, SchoolClass, UserAccount } from '../../types';
import { INITIAL_SUBJECTS } from '../../data/mockData';
import { formatFCFA } from '../../utils/reportExporter';

export type SearchCategory = 'all' | 'students' | 'teachers' | 'parents' | 'classes';

interface GlobalSearchProps {
  className?: string;
  onOpenExportModal?: (type: any, classId?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ 
  className = '',
  onOpenExportModal 
}) => {
  const { 
    students, 
    classes, 
    users, 
    setReportCardStudent,
    setActivePaymentReceipt,
    payments,
    activeRole
  } = useApp();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Selected detail item preview in modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedStudentDetail(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Students search results
  const studentResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return students.filter(s => {
      const clsName = classes.find(c => c.id === s.classId)?.name || '';
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const reverseName = `${s.lastName} ${s.firstName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        reverseName.includes(q) ||
        s.matricule.toLowerCase().includes(q) ||
        clsName.toLowerCase().includes(q) ||
        s.guardianName.toLowerCase().includes(q) ||
        s.guardianPhone.includes(q) ||
        s.guardianEmail.toLowerCase().includes(q)
      );
    });
  }, [students, classes, query]);

  // 2. Teachers search results
  const teacherResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return users.filter(u => {
      if (u.role !== 'enseignant') return false;
      const assignedSubNames = (u.assignedSubjects || [])
        .map(subId => INITIAL_SUBJECTS.find(s => s.id === subId)?.name || '')
        .join(' ')
        .toLowerCase();
      const assignedClsNames = (u.assignedClasses || [])
        .map(cid => classes.find(c => c.id === cid)?.name || '')
        .join(' ')
        .toLowerCase();

      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        assignedSubNames.includes(q) ||
        assignedClsNames.includes(q)
      );
    });
  }, [users, classes, query]);

  // 3. Parents search results (from unique guardian records in students & users)
  const parentResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    
    // Aggregate distinct parents from students list
    const parentMap = new Map<string, {
      guardianName: string;
      guardianPhone: string;
      guardianEmail: string;
      guardianRelation: string;
      children: { name: string; matricule: string; className: string; status: Student['paymentStatus'] }[];
    }>();

    students.forEach(s => {
      const key = `${s.guardianName}_${s.guardianPhone}`.toLowerCase();
      const cls = classes.find(c => c.id === s.classId)?.name || '';
      
      const match = 
        s.guardianName.toLowerCase().includes(q) ||
        s.guardianPhone.includes(q) ||
        s.guardianEmail.toLowerCase().includes(q) ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.matricule.toLowerCase().includes(q);

      if (match) {
        if (!parentMap.has(key)) {
          parentMap.set(key, {
            guardianName: s.guardianName,
            guardianPhone: s.guardianPhone,
            guardianEmail: s.guardianEmail,
            guardianRelation: s.guardianRelation || 'Responsable Légal',
            children: []
          });
        }
        parentMap.get(key)!.children.push({
          name: `${s.firstName} ${s.lastName}`,
          matricule: s.matricule,
          className: cls,
          status: s.paymentStatus
        });
      }
    });

    return Array.from(parentMap.values());
  }, [students, classes, query]);

  // 4. Classes search results
  const classResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return classes.filter(c => {
      const mainTeacher = users.find(u => u.id === c.mainTeacherId)?.name || '';
      return (
        c.name.toLowerCase().includes(q) ||
        c.level.toLowerCase().includes(q) ||
        c.cycle.toLowerCase().includes(q) ||
        c.room.toLowerCase().includes(q) ||
        mainTeacher.toLowerCase().includes(q)
      );
    });
  }, [classes, users, query]);

  // Total result counts
  const counts = {
    all: studentResults.length + teacherResults.length + parentResults.length + classResults.length,
    students: studentResults.length,
    teachers: teacherResults.length,
    parents: parentResults.length,
    classes: classResults.length
  };

  const hasAnyResults = counts.all > 0;

  // Flattened list for keyboard selection
  const flatResults = useMemo(() => {
    const list: Array<{ type: 'student' | 'teacher' | 'parent' | 'class'; data: any }> = [];
    if (activeCategory === 'all' || activeCategory === 'students') {
      studentResults.forEach(data => list.push({ type: 'student', data }));
    }
    if (activeCategory === 'all' || activeCategory === 'teachers') {
      teacherResults.forEach(data => list.push({ type: 'teacher', data }));
    }
    if (activeCategory === 'all' || activeCategory === 'parents') {
      parentResults.forEach(data => list.push({ type: 'parent', data }));
    }
    if (activeCategory === 'all' || activeCategory === 'classes') {
      classResults.forEach(data => list.push({ type: 'class', data }));
    }
    return list;
  }, [activeCategory, studentResults, teacherResults, parentResults, classResults]);

  // Handle arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (flatResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % (flatResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatResults[selectedIndex];
      if (current) {
        handleSelectResult(current.type, current.data);
      }
    }
  };

  const handleSelectResult = (type: string, data: any) => {
    if (type === 'student') {
      setSelectedStudentDetail(data);
    } else if (type === 'class') {
      if (onOpenExportModal) {
        onOpenExportModal('grades', data.id);
      }
      setIsOpen(false);
    }
  };

  const getClassName = (cid: string) => classes.find(c => c.id === cid)?.name || 'Inconnue';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      
      {/* Search Input Bar with Neon Border & Shortcut Indicator */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-cyan-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher élève, enseignant, parent, classe..."
          className="w-full pl-10 pr-24 py-2 sm:py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-inner transition-all"
        />

        {/* Right side controls: Clear & Shortcut */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setSelectedStudentDetail(null);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700/80 rounded-lg shadow-sm">
              <Command className="w-2.5 h-2.5 text-cyan-400" /> K
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Results Panel / Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute left-0 right-0 sm:right-auto sm:w-[580px] md:w-[640px] mt-2 rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl z-50 overflow-hidden origin-top-left"
          >
            {/* Filter Category Chips Header */}
            <div className="flex items-center gap-1.5 p-2.5 bg-slate-950/60 border-b border-slate-800 overflow-x-auto scrollbar-none">
              {[
                { id: 'all' as SearchCategory, label: 'Tous', count: counts.all, icon: <Sparkles className="w-3 h-3 text-cyan-400" /> },
                { id: 'students' as SearchCategory, label: 'Élèves', count: counts.students, icon: <GraduationCap className="w-3 h-3 text-blue-400" /> },
                { id: 'teachers' as SearchCategory, label: 'Enseignants', count: counts.teachers, icon: <UserCheck className="w-3 h-3 text-indigo-400" /> },
                { id: 'parents' as SearchCategory, label: 'Parents', count: counts.parents, icon: <Users className="w-3 h-3 text-purple-400" /> },
                { id: 'classes' as SearchCategory, label: 'Classes', count: counts.classes, icon: <School className="w-3 h-3 text-emerald-400" /> }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedIndex(0);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  {query && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeCategory === cat.id ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {cat.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Results Content Area */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {!query.trim() ? (
                /* Empty state / Quick shortcuts */
                <div className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Recherche Globale Plume</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Commencez à taper pour rechercher en temps réel un élève, un matricule, un enseignant, un parent d'élève ou une classe.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {['PLM-2025', 'Terminale', 'Koffi', 'Mathématiques', 'Diallo'].map(sample => (
                      <button
                        key={sample}
                        onClick={() => {
                          setQuery(sample);
                          inputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 text-[11px] font-medium border border-slate-700/60 transition-colors"
                      >
                        "{sample}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : !hasAnyResults ? (
                /* No Results found */
                <div className="p-8 text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-2">
                    <X className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="text-sm font-bold text-white">Aucun résultat trouvé</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Aucun élève, enseignant, parent ou division ne correspond à <span className="text-cyan-300 font-semibold">"{query}"</span>.
                  </p>
                </div>
              ) : (
                /* Populated Results grouped or filtered */
                <>
                  {/* STUDENTS LIST */}
                  {(activeCategory === 'all' || activeCategory === 'students') && studentResults.length > 0 && (
                    <div className="pt-1">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest text-blue-400 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Élèves ({studentResults.length})</span>
                      </div>
                      <div className="space-y-1">
                        {studentResults.map((std) => {
                          const cls = getClassName(std.classId);
                          const statusColor = 
                            std.paymentStatus === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : std.paymentStatus === 'partial' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                          const statusLabel = 
                            std.paymentStatus === 'paid' ? 'Soldé' : std.paymentStatus === 'partial' ? 'Partiel' : 'Impayé';

                          return (
                            <div
                              key={std.id}
                              onClick={() => setSelectedStudentDetail(std)}
                              className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-800/80 cursor-pointer border border-transparent hover:border-slate-700/60 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-300 shrink-0 shadow-sm">
                                  {std.firstName[0]}{std.lastName[0]}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                      {std.lastName.toUpperCase()} {std.firstName}
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                      {std.matricule}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                                    <span className="text-cyan-400 font-semibold">{cls}</span>
                                    <span>•</span>
                                    <span>Resp: {std.guardianName}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                                  {statusLabel}
                                </span>
                                <div className="p-1.5 rounded-lg text-slate-500 group-hover:text-cyan-400 group-hover:bg-slate-700/50 transition-colors">
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TEACHERS LIST */}
                  {(activeCategory === 'all' || activeCategory === 'teachers') && teacherResults.length > 0 && (
                    <div className="pt-2">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest text-indigo-400 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Enseignants ({teacherResults.length})</span>
                      </div>
                      <div className="space-y-1">
                        {teacherResults.map((t) => {
                          const subjects = (t.assignedSubjects || [])
                            .map(sid => INITIAL_SUBJECTS.find(s => s.id === sid)?.name || '')
                            .filter(Boolean)
                            .join(', ');

                          const classNames = (t.assignedClasses || [])
                            .map(cid => classes.find(c => c.id === cid)?.name || '')
                            .filter(Boolean)
                            .join(', ');

                          return (
                            <div
                              key={t.id}
                              className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
                                  {t.name[0]}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                                      {t.name}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                      @{t.username}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                                    <span className="text-slate-300">{subjects || 'Toutes disciplines'}</span>
                                    {classNames && (
                                      <>
                                        <span>•</span>
                                        <span className="text-cyan-400">Classes : {classNames}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {t.phone && (
                                  <a
                                    href={`tel:${t.phone}`}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                    title={`Appeler ${t.phone}`}
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {t.email && (
                                  <a
                                    href={`mailto:${t.email}`}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                    title={`Écrire à ${t.email}`}
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PARENTS LIST */}
                  {(activeCategory === 'all' || activeCategory === 'parents') && parentResults.length > 0 && (
                    <div className="pt-2">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest text-purple-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Parents d'Élèves ({parentResults.length})</span>
                      </div>
                      <div className="space-y-1">
                        {parentResults.map((p, idx) => (
                          <div
                            key={idx}
                            className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0">
                                {p.guardianName[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                    {p.guardianName}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                    {p.guardianRelation}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  Enfant(s) : {p.children.map(c => `${c.name} (${c.className})`).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {p.guardianPhone && (
                                <a
                                  href={`tel:${p.guardianPhone}`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                  title={`Appeler ${p.guardianPhone}`}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {p.guardianEmail && (
                                <a
                                  href={`mailto:${p.guardianEmail}`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                  title={`Écrire à ${p.guardianEmail}`}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CLASSES LIST */}
                  {(activeCategory === 'all' || activeCategory === 'classes') && classResults.length > 0 && (
                    <div className="pt-2">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5" />
                        <span>Divisions & Classes ({classResults.length})</span>
                      </div>
                      <div className="space-y-1">
                        {classResults.map((cls) => {
                          const enrolled = students.filter(s => s.classId === cls.id).length;
                          const mainTeacher = users.find(u => u.id === cls.mainTeacherId)?.name || 'Non attribué';

                          return (
                            <div
                              key={cls.id}
                              onClick={() => {
                                if (onOpenExportModal) {
                                  onOpenExportModal('grades', cls.id);
                                }
                                setIsOpen(false);
                              }}
                              className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-800/80 cursor-pointer border border-transparent hover:border-slate-700/60 transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-300 shrink-0">
                                  <School className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                                      {cls.name}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                      {cls.cycle.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                                    <span>{cls.room}</span>
                                    <span>•</span>
                                    <span className="text-slate-300">Prof. Principal : {mainTeacher}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-mono font-semibold text-slate-300 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                                  {enrolled} / {cls.capacity} élèves
                                </span>
                                <div className="p-1.5 rounded-lg text-slate-500 group-hover:text-emerald-400 group-hover:bg-slate-700/50 transition-colors">
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Keyboard Navigation Hints */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 text-[10px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">↑↓</kbd> Naviguer
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Entrée</kbd> Sélectionner
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Échap</kbd> Fermer
                </span>
              </div>
              <span className="text-cyan-400 font-semibold hidden sm:inline">
                Plume Search Engine v2.5
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK STUDENT INSPECTOR MODAL (When clicking an élève) */}
      <AnimatePresence>
        {selectedStudentDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-base shadow-lg shadow-cyan-500/10">
                    {selectedStudentDetail.firstName[0]}{selectedStudentDetail.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">
                        {selectedStudentDetail.lastName.toUpperCase()} {selectedStudentDetail.firstName}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 font-bold">
                        {selectedStudentDetail.matricule}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Classe : <span className="text-white font-semibold">{getClassName(selectedStudentDetail.classId)}</span> • Sexe : {selectedStudentDetail.gender === 'M' ? 'Masculin' : 'Féminin'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Financial & Contact Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Statut Financier</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedStudentDetail.paymentStatus === 'paid' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : selectedStudentDetail.paymentStatus === 'partial' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {selectedStudentDetail.paymentStatus.toUpperCase()}
                    </span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {formatFCFA(selectedStudentDetail.paidTuition)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Reste dû : {formatFCFA(Math.max(0, selectedStudentDetail.annualTuition - selectedStudentDetail.paidTuition))}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Responsable Légal</span>
                  <div className="mt-1 font-bold text-white truncate">
                    {selectedStudentDetail.guardianName}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                    {selectedStudentDetail.guardianPhone}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Actions Rapides Directes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setReportCardStudent(selectedStudentDetail);
                      setSelectedStudentDetail(null);
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Consulter le Bulletin</span>
                  </button>

                  {onOpenExportModal && (
                    <button
                      onClick={() => {
                        onOpenExportModal('students', selectedStudentDetail.classId);
                        setSelectedStudentDetail(null);
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span>Rapport Financier</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

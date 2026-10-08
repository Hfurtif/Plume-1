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
  Receipt, 
  CalendarCheck, 
  ArrowRight, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Command,
  CornerDownLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Filter,
  Eye,
  BadgeAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Student, SchoolClass, UserAccount, OfficialCertificate, PaymentRecord } from '../../types';
import { INITIAL_SUBJECTS } from '../../data/mockData';
import { formatFCFA } from '../../utils/reportExporter';

export type SearchCategory = 'all' | 'students' | 'classes' | 'documents' | 'staff' | 'parents';

export interface DocumentSearchResult {
  id: string;
  docType: 'bulletin' | 'certificate' | 'receipt' | 'class_report';
  title: string;
  subtitle: string;
  meta: string;
  badge: string;
  badgeColor: string;
  date?: string;
  student?: Student;
  certificate?: OfficialCertificate;
  payment?: PaymentRecord;
  classId?: string;
  term?: 'T1' | 'T2' | 'T3';
}

export const GlobalSearchModal: React.FC = () => {
  const { 
    isSearchModalOpen, 
    closeSearchModal, 
    searchModalCategory,
    students, 
    classes, 
    users, 
    certificates,
    payments,
    setReportCardStudent,
    setActiveCertificate,
    setActivePaymentReceipt,
    openExportModal,
    activeRole
  } = useApp();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync initial category when modal opens
  useEffect(() => {
    if (isSearchModalOpen) {
      setActiveCategory(searchModalCategory || 'all');
      setQuery('');
      setSelectedIndex(0);
      setSelectedStudentDetail(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isSearchModalOpen, searchModalCategory]);

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

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

  // 2. Classes search results
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

  // 3. Documents search results (Bulletins, Certificats, Quittances, Relevés)
  const documentResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const docs: DocumentSearchResult[] = [];

    // A. Bulletins trimestriels pour chaque élève correspondant
    students.forEach(std => {
      const clsName = classes.find(c => c.id === std.classId)?.name || '';
      const fullName = `${std.firstName} ${std.lastName}`.toLowerCase();
      const match = 
        q.includes('bulletin') || 
        q.includes('note') || 
        fullName.includes(q) || 
        std.matricule.toLowerCase().includes(q) || 
        clsName.toLowerCase().includes(q);

      if (match) {
        // Trimestre 1
        docs.push({
          id: `doc-bul-t1-${std.id}`,
          docType: 'bulletin',
          title: `Bulletin Officiel 1er Trimestre • ${std.lastName} ${std.firstName}`,
          subtitle: `Classe: ${clsName} • Matricule: ${std.matricule}`,
          meta: 'Session T1 • Certifié',
          badge: 'Bulletin T1',
          badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          student: std,
          term: 'T1'
        });
        // Trimestre 2
        docs.push({
          id: `doc-bul-t2-${std.id}`,
          docType: 'bulletin',
          title: `Bulletin Officiel 2ème Trimestre • ${std.lastName} ${std.firstName}`,
          subtitle: `Classe: ${clsName} • Matricule: ${std.matricule}`,
          meta: 'Session T2 • En cours',
          badge: 'Bulletin T2',
          badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          student: std,
          term: 'T2'
        });
      }
    });

    // B. Certificats de scolarité
    certificates.forEach(cert => {
      const match = 
        q.includes('certif') || 
        q.includes('scolar') || 
        cert.certificateNumber.toLowerCase().includes(q) ||
        cert.studentName.toLowerCase().includes(q) ||
        cert.matricule.toLowerCase().includes(q) ||
        cert.className.toLowerCase().includes(q);

      if (match) {
        docs.push({
          id: `doc-cert-${cert.id}`,
          docType: 'certificate',
          title: `Certificat de Scolarité N° ${cert.certificateNumber}`,
          subtitle: `Élève: ${cert.studentName} (${cert.className}) • Année: ${cert.academicYear}`,
          meta: `Émis le ${cert.issueDate} par la Direction`,
          badge: 'Certificat Homologué',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          certificate: cert,
          date: cert.issueDate
        });
      }
    });

    // C. Quittances et Reçus de paiement
    payments.forEach(pay => {
      const match = 
        q.includes('recu') || 
        q.includes('quitt') || 
        q.includes('paiement') || 
        pay.receiptNumber.toLowerCase().includes(q) ||
        pay.studentName.toLowerCase().includes(q) ||
        pay.method.toLowerCase().includes(q) ||
        pay.amount.toString().includes(q);

      if (match) {
        docs.push({
          id: `doc-pay-${pay.id}`,
          docType: 'receipt',
          title: `Quittance N° ${pay.receiptNumber} • ${formatFCFA(pay.amount)}`,
          subtitle: `Élève: ${pay.studentName} • Mode: ${pay.method.toUpperCase()}`,
          meta: `Encaissé le ${pay.date}`,
          badge: 'Reçu Comptable',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          payment: pay,
          date: pay.date
        });
      }
    });

    // D. Relevés et fiches par classe
    classes.forEach(cls => {
      const match = 
        q.includes('releve') || 
        q.includes('export') || 
        q.includes('fiche') || 
        cls.name.toLowerCase().includes(q);

      if (match) {
        docs.push({
          id: `doc-cls-grades-${cls.id}`,
          docType: 'class_report',
          title: `Relevé de Notes & Tableau d'Honneur • ${cls.name}`,
          subtitle: `Niveau: ${cls.level} (${cls.cycle}) • ${cls.room}`,
          meta: 'Rapport officiel PDF',
          badge: 'Relevé de Classe',
          badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          classId: cls.id
        });
      }
    });

    return docs;
  }, [students, classes, certificates, payments, query]);

  // 4. Staff / Enseignants search results
  const staffResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return users.filter(u => {
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
        u.role.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        assignedSubNames.includes(q) ||
        assignedClsNames.includes(q)
      );
    });
  }, [users, classes, query]);

  // 5. Parents search results
  const parentResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
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

  // Total result counts
  const counts = {
    all: studentResults.length + classResults.length + documentResults.length + staffResults.length + parentResults.length,
    students: studentResults.length,
    classes: classResults.length,
    documents: documentResults.length,
    staff: staffResults.length,
    parents: parentResults.length
  };

  const hasAnyResults = counts.all > 0;

  // Flattened list for keyboard selection
  const flatResults = useMemo(() => {
    const list: Array<{ type: 'student' | 'class' | 'document' | 'staff' | 'parent'; data: any }> = [];
    if (activeCategory === 'all' || activeCategory === 'students') {
      studentResults.forEach(data => list.push({ type: 'student', data }));
    }
    if (activeCategory === 'all' || activeCategory === 'classes') {
      classResults.forEach(data => list.push({ type: 'class', data }));
    }
    if (activeCategory === 'all' || activeCategory === 'documents') {
      documentResults.forEach(data => list.push({ type: 'document', data }));
    }
    if (activeCategory === 'all' || activeCategory === 'staff') {
      staffResults.forEach(data => list.push({ type: 'staff', data }));
    }
    if (activeCategory === 'all' || activeCategory === 'parents') {
      parentResults.forEach(data => list.push({ type: 'parent', data }));
    }
    return list;
  }, [activeCategory, studentResults, classResults, documentResults, staffResults, parentResults]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatResults[selectedIndex];
      if (current) {
        handleExecuteResult(current.type, current.data);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearchModal();
    }
  };

  const handleExecuteResult = (type: string, data: any) => {
    if (type === 'student') {
      setSelectedStudentDetail(data);
    } else if (type === 'class') {
      closeSearchModal();
      openExportModal('grades', data.id);
    } else if (type === 'document') {
      const doc = data as DocumentSearchResult;
      closeSearchModal();
      if (doc.docType === 'bulletin' && doc.student) {
        setReportCardStudent(doc.student);
      } else if (doc.docType === 'certificate' && doc.certificate) {
        setActiveCertificate(doc.certificate);
      } else if (doc.docType === 'receipt' && doc.payment) {
        setActivePaymentReceipt(doc.payment);
      } else if (doc.docType === 'class_report' && doc.classId) {
        openExportModal('grades', doc.classId);
      }
    }
  };

  const getClassName = (cid: string) => classes.find(c => c.id === cid)?.name || 'Inconnue';

  if (!isSearchModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSearchModal}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Floating Spotlight Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Top Search Bar */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Search className="w-5 h-5" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un élève, une classe ou un document spécifique (bulletin, certificat, reçu)..."
              className="flex-1 bg-transparent border-none text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-0 font-medium"
            />

            {query ? (
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedStudentDetail(null);
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Effacer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
                <Command className="w-3 h-3 text-cyan-400" />
                <span>K</span>
              </div>
            )}

            <button
              onClick={closeSearchModal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fermer (Échap)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto scrollbar-none text-xs">
            {[
              { id: 'all' as SearchCategory, label: 'Tous', count: counts.all, icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
              { id: 'students' as SearchCategory, label: 'Élèves', count: counts.students, icon: <GraduationCap className="w-3.5 h-3.5 text-cyan-400" /> },
              { id: 'classes' as SearchCategory, label: 'Classes', count: counts.classes, icon: <School className="w-3.5 h-3.5 text-amber-400" /> },
              { id: 'documents' as SearchCategory, label: 'Documents (Bulletins, Certificats, Reçus)', count: counts.documents, icon: <FileText className="w-3.5 h-3.5 text-emerald-400" /> },
              { id: 'staff' as SearchCategory, label: 'Personnel & Enseignants', count: counts.staff, icon: <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> },
              { id: 'parents' as SearchCategory, label: 'Parents', count: counts.parents, icon: <Users className="w-3.5 h-3.5 text-violet-400" /> }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedIndex(0);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                {query && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    activeCategory === cat.id ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Results List / Details Split View */}
          <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-3 space-y-1">
            {!query.trim() ? (
              /* Empty state / Suggestions */
              <div className="py-10 px-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                  <Search className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white">Recherche Globale Instantanée</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                  Accédez à n'importe quel élève, classe ou document officiel (bulletin trimestriel, certificat de scolarité, quittance de paiement) à travers toute l'application.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  <span className="text-[11px] text-slate-500 flex items-center mr-1">Exemples :</span>
                  {[
                    { label: 'Terminale C', type: 'classes' as SearchCategory },
                    { label: 'Bulletin', type: 'documents' as SearchCategory },
                    { label: 'Certificat', type: 'documents' as SearchCategory },
                    { label: 'REC-2025', type: 'documents' as SearchCategory },
                    { label: 'PLM-2025', type: 'students' as SearchCategory },
                    { label: 'Koffi', type: 'students' as SearchCategory }
                  ].map(sample => (
                    <button
                      key={sample.label}
                      onClick={() => {
                        setQuery(sample.label);
                        setActiveCategory(sample.type);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
                    >
                      "{sample.label}"
                    </button>
                  ))}
                </div>
              </div>
            ) : !hasAnyResults ? (
              /* No Results State */
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 mb-2">
                  <Filter className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-white">Aucun résultat trouvé</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Aucun élément ne correspond à <span className="text-cyan-400">"{query}"</span> dans la catégorie sélectionnée.
                </p>
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveCategory('all');
                    inputRef.current?.focus();
                  }}
                  className="mt-4 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold cursor-pointer"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              /* Flat Results List */
              flatResults.map((res, idx) => {
                const isSelected = selectedIndex === idx;

                // 1. Student item
                if (res.type === 'student') {
                  const s = res.data as Student;
                  const cls = classes.find(c => c.id === s.classId);
                  return (
                    <div
                      key={`std-${s.id}`}
                      onClick={() => setSelectedStudentDetail(s)}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-cyan-500/10 border border-cyan-500/30 text-white' 
                          : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">
                              {s.lastName} {s.firstName}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                              {s.matricule}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            Classe : {cls?.name || 'Inconnue'} • Tuteur : {s.guardianName} ({s.guardianPhone})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeSearchModal();
                            setReportCardStudent(s);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 inline-flex items-center gap-1 cursor-pointer"
                          title="Consulter le Bulletin Officiel"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Bulletin</span>
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  );
                }

                // 2. Class item
                if (res.type === 'class') {
                  const c = res.data as SchoolClass;
                  const stdCount = students.filter(s => s.classId === c.id).length;
                  return (
                    <div
                      key={`cls-${c.id}`}
                      onClick={() => handleExecuteResult('class', c)}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-amber-500/10 border border-amber-500/30 text-white' 
                          : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                          <School className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">
                              {c.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                              {c.level} • {c.cycle}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            Salle : {c.room} • Effectif : {stdCount} élèves • Scolarité : {formatFCFA(c.tuitionFee)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                          <span>Relevé de notes</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                }

                // 3. Document item (Bulletin, Certificat, Quittance)
                if (res.type === 'document') {
                  const doc = res.data as DocumentSearchResult;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleExecuteResult('document', doc)}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-white' 
                          : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                          {doc.docType === 'bulletin' ? <FileText className="w-4 h-4" /> :
                           doc.docType === 'certificate' ? <ShieldCheck className="w-4 h-4" /> :
                           doc.docType === 'receipt' ? <Receipt className="w-4 h-4" /> :
                           <Download className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">
                              {doc.title}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${doc.badgeColor}`}>
                              {doc.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {doc.subtitle} • {doc.meta}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ouvrir</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                // 4. Staff item
                if (res.type === 'staff') {
                  const u = res.data as UserAccount;
                  return (
                    <div
                      key={`usr-${u.id}`}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                        isSelected 
                          ? 'bg-indigo-500/10 border border-indigo-500/30 text-white' 
                          : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">
                              {u.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {u.email} • {u.phone || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // 5. Parent item
                if (res.type === 'parent') {
                  const p = res.data;
                  return (
                    <div
                      key={`par-${p.guardianPhone}-${idx}`}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                        isSelected 
                          ? 'bg-purple-500/10 border border-purple-500/30 text-white' 
                          : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">
                              {p.guardianName}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {p.guardianRelation}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            Tél : {p.guardianPhone} • Enfants : {p.children.map((c: any) => `${c.name} (${c.className})`).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })
            )}
          </div>

          {/* Quick Preview Panel for Selected Student */}
          <AnimatePresence>
            {selectedStudentDetail && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-slate-950 border-t border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-500/30">
                      {selectedStudentDetail.firstName[0]}{selectedStudentDetail.lastName[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {selectedStudentDetail.lastName} {selectedStudentDetail.firstName}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {selectedStudentDetail.matricule} • Classe : {getClassName(selectedStudentDetail.classId)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudentDetail(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Date de Naissance</span>
                    <strong className="text-white">{selectedStudentDetail.dateOfBirth}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Scolarité</span>
                    <strong className="text-cyan-400">{formatFCFA(selectedStudentDetail.paidTuition)}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Statut Règlement</span>
                    <strong className={selectedStudentDetail.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}>
                      {selectedStudentDetail.paymentStatus === 'paid' ? 'Soldé' : 'Partiel / En attente'}
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Contact Parent</span>
                    <strong className="text-white truncate block">{selectedStudentDetail.guardianPhone}</strong>
                  </div>
                </div>

                {/* Direct Action Buttons for this Student */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      closeSearchModal();
                      setReportCardStudent(selectedStudentDetail);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950/40 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Consulter le Bulletin Officiel</span>
                  </button>

                  <button
                    onClick={() => {
                      closeSearchModal();
                      const existingCert = certificates.find(c => c.studentId === selectedStudentDetail.id);
                      if (existingCert) {
                        setActiveCertificate(existingCert);
                      } else {
                        // Generate dynamic preview certificate
                        const dynamicCert: OfficialCertificate = {
                          id: `cert-gen-${selectedStudentDetail.id}`,
                          certificateNumber: `CS-2025-${selectedStudentDetail.matricule.slice(-3)}`,
                          studentId: selectedStudentDetail.id,
                          studentName: `${selectedStudentDetail.lastName} ${selectedStudentDetail.firstName}`,
                          matricule: selectedStudentDetail.matricule,
                          className: getClassName(selectedStudentDetail.classId),
                          dateOfBirth: selectedStudentDetail.dateOfBirth,
                          placeOfBirth: 'Abidjan',
                          academicYear: '2025-2026',
                          type: 'scolarite',
                          issueDate: new Date().toISOString().split('T')[0],
                          purpose: 'Inscription & Pièce Officielle',
                          issuedByProviseur: 'Dr. Jean-Marc Touré',
                          qrCodeData: `PLUME-CERT-VERIF:STUDENT=${selectedStudentDetail.matricule}:DATE=${new Date().toISOString()}`
                        };
                        setActiveCertificate(dynamicCert);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Certificat de Scolarité</span>
                  </button>

                  <button
                    onClick={() => {
                      closeSearchModal();
                      const existingPay = payments.find(p => p.studentId === selectedStudentDetail.id);
                      if (existingPay) {
                        setActivePaymentReceipt(existingPay);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dernière Quittance</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer with keyboard shortcuts indicators */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">↓</kbd>
                <span className="ml-1 text-slate-400">Naviguer</span>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">Entrée</kbd>
                <span className="ml-1 text-slate-400">Ouvrir</span>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">Échap</kbd>
                <span className="ml-1 text-slate-400">Fermer</span>
              </span>
            </div>

            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
              Raccourci global : {modKey} + K
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

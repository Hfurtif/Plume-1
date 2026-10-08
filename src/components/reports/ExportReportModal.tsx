import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Users, 
  Wallet, 
  CalendarCheck, 
  School, 
  Check, 
  Filter, 
  Sparkles,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { INITIAL_SUBJECTS } from '../../data/mockData';
import { 
  exportStudentsReport, 
  exportGradesReport, 
  exportAttendanceReport, 
  exportPaymentsReport, 
  exportClassListReport,
  formatFCFA
} from '../../utils/reportExporter';

export type ReportType = 'students' | 'grades' | 'attendance' | 'payments' | 'classes';
export type ExportFormat = 'pdf' | 'excel' | 'csv';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReportType?: ReportType;
  defaultClassId?: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  defaultReportType = 'students',
  defaultClassId
}) => {
  const { 
    students, 
    classes, 
    grades, 
    payments, 
    attendance, 
    users, 
    activeRole 
  } = useApp();

  const [reportType, setReportType] = useState<ReportType>(defaultReportType);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  
  // Filters
  const [classFilter, setClassFilter] = useState<string>(defaultClassId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [termFilter, setTermFilter] = useState<string>('T2');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('2024-09-01');
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0]);

  // Download state feedback
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Sync defaultReportType when opened
  React.useEffect(() => {
    if (isOpen) {
      if (defaultReportType) setReportType(defaultReportType);
      if (defaultClassId) setClassFilter(defaultClassId);
      setHasGenerated(false);
    }
  }, [isOpen, defaultReportType, defaultClassId]);

  // Compute live preview counts
  const previewStats = useMemo(() => {
    switch (reportType) {
      case 'students': {
        const filtered = students.filter(s => {
          const matchClass = classFilter === 'all' || s.classId === classFilter;
          const matchStatus = statusFilter === 'all' || s.paymentStatus === statusFilter;
          return matchClass && matchStatus;
        });
        const totalTuition = filtered.reduce((sum, s) => sum + s.annualTuition, 0);
        const totalCollected = filtered.reduce((sum, s) => sum + s.paidTuition, 0);
        const balance = Math.max(0, totalTuition - totalCollected);
        return {
          count: filtered.length,
          unit: 'élèves',
          primaryMetric: `${formatFCFA(totalCollected)} encaissés`,
          secondaryMetric: `Reste à recouvrer : ${formatFCFA(balance)}`
        };
      }
      case 'grades': {
        const targetClass = classFilter === 'all' ? classes[0] : classes.find(c => c.id === classFilter) || classes[0];
        const classStds = students.filter(s => s.classId === targetClass?.id);
        return {
          count: classStds.length,
          unit: 'élèves évalués',
          primaryMetric: `Trimestre actif : ${termFilter}`,
          secondaryMetric: `Matière : ${subjectFilter === 'all' ? 'Toutes disciplines' : INITIAL_SUBJECTS.find(s => s.id === subjectFilter)?.name || subjectFilter}`
        };
      }
      case 'attendance': {
        const targetStds = classFilter === 'all' ? students : students.filter(s => s.classId === classFilter);
        const relevantAtt = attendance.filter(a => {
          const matchDate = (!dateFrom || a.date >= dateFrom) && (!dateTo || a.date <= dateTo);
          const matchClass = classFilter === 'all' || targetStds.some(s => s.id === a.targetId);
          return matchDate && matchClass;
        });
        const unjustified = relevantAtt.filter(a => a.status === 'absent' && !a.isJustified).length;
        return {
          count: targetStds.length,
          unit: 'élèves suivis',
          primaryMetric: `${relevantAtt.length} enregistrements vie scolaire`,
          secondaryMetric: `${unjustified} absence(s) non justifiée(s)`
        };
      }
      case 'payments': {
        const filtered = payments.filter(p => {
          const matchMethod = paymentMethodFilter === 'all' || p.method === paymentMethodFilter;
          const matchDate = (!dateFrom || p.date >= dateFrom) && (!dateTo || p.date <= dateTo);
          return matchMethod && matchDate;
        });
        const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);
        return {
          count: filtered.length,
          unit: 'transactions comptables',
          primaryMetric: `Total : ${formatFCFA(totalAmount)}`,
          secondaryMetric: `Mode : ${paymentMethodFilter === 'all' ? 'Tous les modes' : paymentMethodFilter}`
        };
      }
      case 'classes': {
        const targetCls = classFilter === 'all' ? classes : classes.filter(c => c.id === classFilter);
        const totalCapacity = targetCls.reduce((sum, c) => sum + c.capacity, 0);
        const totalStudents = students.filter(s => targetCls.some(c => c.id === s.classId)).length;
        return {
          count: targetCls.length,
          unit: 'classes actives',
          primaryMetric: `${totalStudents} inscrits sur ${totalCapacity} places`,
          secondaryMetric: `Taux moyen d'occupation : ${((totalStudents / (totalCapacity || 1)) * 100).toFixed(1)}%`
        };
      }
      default:
        return { count: 0, unit: '', primaryMetric: '', secondaryMetric: '' };
    }
  }, [reportType, classFilter, statusFilter, subjectFilter, termFilter, paymentMethodFilter, dateFrom, dateTo, students, classes, payments, attendance]);

  const handleExport = () => {
    setIsGenerating(true);

    setTimeout(() => {
      try {
        switch (reportType) {
          case 'students':
            exportStudentsReport({
              students,
              classes,
              format: selectedFormat,
              classFilter,
              statusFilter,
              signatoryRole: activeRole === 'proviseur' ? 'Le Proviseur & Chef d\'Établissement' : 'L\'Intendant Comptable Principal'
            });
            break;
          case 'grades':
            exportGradesReport({
              grades,
              students,
              classes,
              subjects: INITIAL_SUBJECTS,
              classId: classFilter === 'all' ? classes[0]?.id : classFilter,
              subjectId: subjectFilter,
              term: termFilter,
              format: selectedFormat
            });
            break;
          case 'attendance':
            exportAttendanceReport({
              attendance,
              students,
              classes,
              classId: classFilter,
              format: selectedFormat,
              dateRange: { from: dateFrom, to: dateTo }
            });
            break;
          case 'payments':
            exportPaymentsReport({
              payments,
              classes,
              format: selectedFormat,
              methodFilter: paymentMethodFilter,
              dateRange: { from: dateFrom, to: dateTo }
            });
            break;
          case 'classes':
            exportClassListReport({
              classes,
              students,
              users,
              classId: classFilter,
              format: selectedFormat
            });
            break;
        }

        setHasGenerated(true);
        setTimeout(() => setHasGenerated(false), 3000);
      } catch (err) {
        console.error('Export error:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 350);
  };

  if (!isOpen) return null;

  const reportTypesConfig = [
    {
      id: 'students' as ReportType,
      label: 'Liste des Élèves',
      sub: 'Effectifs & Statuts de paiement',
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    },
    {
      id: 'grades' as ReportType,
      label: 'Relevé des Notes',
      sub: 'Moyennes, devoirs & examens',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    },
    {
      id: 'attendance' as ReportType,
      label: 'Registre d\'Assiduité',
      sub: 'Présences, absences & retards',
      icon: <CalendarCheck className="w-5 h-5" />,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'payments' as ReportType,
      label: 'Journal des Règlements',
      sub: 'Recettes & caisse comptable',
      icon: <Wallet className="w-5 h-5" />,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      id: 'classes' as ReportType,
      label: 'Fiches de Classes',
      sub: 'Divisions, salles & professeurs',
      icon: <School className="w-5 h-5" />,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto"
      >
        {/* Top Header Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Officiel • Conforme
                  </span>
                  <span className="text-xs text-slate-400">Année 2024-2025</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Centre d'Exportation & Rapports
                </h2>
                <p className="text-xs text-slate-400">
                  Générez des rapports officiels certifiés en formats PDF haute résolution ou tableurs Excel/CSV.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* STEP 1: Choose Report Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>1. Sélectionnez le Type de Rapport</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {reportTypesConfig.map((item) => {
                const isSelected = reportType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReportType(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border ${item.color} mt-0.5`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.sub}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="p-1 rounded-full bg-cyan-500 text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Configure Dynamic Filters */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span>2. Paramètres & Filtres du Rapport</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Périmètre d'extraction
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Class Filter (Applicable to all except payments) */}
              {reportType !== 'payments' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                    Division / Classe
                  </label>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="all">Toutes les classes ({classes.length})</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter for Students */}
              {reportType === 'students' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                    Statut Financier
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="all">Tous les statuts de paiement</option>
                    <option value="paid">Soldé (100% payé)</option>
                    <option value="partial">Partiel (Acompte versé)</option>
                    <option value="unpaid">Impayé (0% versé)</option>
                  </select>
                </div>
              )}

              {/* Subject Filter for Grades */}
              {reportType === 'grades' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                      Matière / Discipline
                    </label>
                    <select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      <option value="all">Toutes les matières (Général)</option>
                      {INITIAL_SUBJECTS.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (Coeff {s.coefficient})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                      Trimestre
                    </label>
                    <select
                      value={termFilter}
                      onChange={(e) => setTermFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      <option value="T1">1er Trimestre (T1)</option>
                      <option value="T2">2ème Trimestre (T2)</option>
                      <option value="T3">3ème Trimestre (T3)</option>
                      <option value="all">Bilan Annuel Global</option>
                    </select>
                  </div>
                </>
              )}

              {/* Payment Method for Payments */}
              {reportType === 'payments' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                    Mode d'Encaissement
                  </label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="all">Tous les modes de règlement</option>
                    <option value="especes">Espèces / Guichet</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque certifié</option>
                    <option value="mobile_money">Mobile Money (MTN / Moov)</option>
                  </select>
                </div>
              )}

              {/* Date Range for Attendance & Payments */}
              {(reportType === 'attendance' || reportType === 'payments') && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                      Date Début
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                      Date Fin
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* STEP 3: Choose Format */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>3. Format de Génération & Téléchargement</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'pdf' as ExportFormat,
                  label: 'PDF Professionnel',
                  sub: 'Haute fidélité, en-tête officiel, sceau républicain & signatures',
                  icon: <FileText className="w-5 h-5 text-rose-400" />,
                  tag: 'Recommandé'
                },
                {
                  id: 'excel' as ExportFormat,
                  label: 'Tableur Excel (.xlsx)',
                  sub: 'Cellules typées, montants calculables & formules SUM',
                  icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
                  tag: 'Comptable'
                },
                {
                  id: 'csv' as ExportFormat,
                  label: 'Fichier CSV (UTF-8)',
                  sub: 'Format universel délimité par points-virgules pour intégrations',
                  icon: <Download className="w-5 h-5 text-amber-400" />,
                  tag: 'Brut'
                }
              ].map(fmt => {
                const isSelected = selectedFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`flex flex-col p-4 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/70 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        {fmt.icon}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {fmt.tag}
                      </span>
                    </div>
                    <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {fmt.label}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {fmt.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  Aperçu du contenu : {previewStats.count} {previewStats.unit}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {previewStats.primaryMetric} • {previewStats.secondaryMetric}
                </span>
              </div>
            </div>

            <div className="text-slate-400 text-[11px] sm:text-right">
              Fichier : <span className="font-mono text-cyan-300 font-semibold">{reportType}.{selectedFormat === 'excel' ? 'xlsx' : selectedFormat}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 p-5 sm:p-6 bg-slate-950/80 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isGenerating || previewStats.count === 0}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${
              hasGenerated 
                ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/40 hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                <span>Génération du document en cours...</span>
              </>
            ) : hasGenerated ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Rapport Téléchargé avec Succès !</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Générer & Télécharger le Rapport</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  ChevronDown, 
  Check, 
  Sparkles,
  Filter,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { 
  exportStudentsReport, 
  exportGradesReport, 
  exportAttendanceReport, 
  exportPaymentsReport, 
  exportClassListReport 
} from '../../utils/reportExporter';

export interface QuickExportButtonProps {
  label?: string;
  reportType: 'students' | 'grades' | 'attendance' | 'payments' | 'classes';
  classId?: string;
  subjectId?: string;
  term?: string;
  statusFilter?: string;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'cyan' | 'emerald' | 'indigo' | 'slate';
  align?: 'left' | 'right';
}

export const QuickExportButton: React.FC<QuickExportButtonProps> = ({
  label = 'Exporter',
  reportType,
  classId,
  subjectId,
  term = 'T2',
  statusFilter = 'all',
  className = '',
  size = 'md',
  variant = 'cyan',
  align = 'right'
}) => {
  const { 
    students, 
    classes, 
    grades, 
    payments, 
    attendance, 
    subjects,
    users, 
    openExportModal,
    activeRole 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [successFormat, setSuccessFormat] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Execute Direct Export
  const handleDirectExport = (format: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true);
    setIsOpen(false);

    setTimeout(() => {
      try {
        switch (reportType) {
          case 'students':
            exportStudentsReport({
              students,
              classes,
              format,
              classFilter: classId || 'all',
              statusFilter,
              signatoryRole: activeRole === 'proviseur' ? 'Le Proviseur & Direction' : 'L\'Intendant Comptable'
            });
            break;
          case 'grades':
            exportGradesReport({
              grades,
              students,
              classes,
              subjects,
              classId: classId || classes[0]?.id,
              subjectId: subjectId || 'all',
              term,
              format
            });
            break;
          case 'attendance':
            exportAttendanceReport({
              attendance,
              students,
              classes,
              classId: classId || 'all',
              format
            });
            break;
          case 'payments':
            exportPaymentsReport({
              payments,
              classes,
              format
            });
            break;
          case 'classes':
            exportClassListReport({
              classes,
              students,
              users,
              classId: classId || 'all',
              format
            });
            break;
        }

        setSuccessFormat(format);
        setTimeout(() => setSuccessFormat(null), 2500);
      } catch (err) {
        console.error('Quick Export Error:', err);
      } finally {
        setIsExporting(false);
      }
    }, 250);
  };

  // Styling variants
  const variantStyles = {
    cyan: 'bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-300 border-cyan-500/30 hover:border-cyan-400/50 shadow-cyan-950/20',
    emerald: 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border-emerald-500/30 hover:border-emerald-400/50 shadow-emerald-950/20',
    indigo: 'bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border-indigo-500/30 hover:border-indigo-400/50 shadow-indigo-950/20',
    slate: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600 shadow-slate-950/20'
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-xs font-semibold'
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`flex items-center gap-2 rounded-xl border shadow-sm transition-all cursor-pointer select-none ${variantStyles[variant]} ${sizeStyles[size]}`}
        title="Exporter rapidement ce tableau (PDF / Excel / CSV)"
      >
        {isExporting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
          />
        ) : successFormat ? (
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}

        <span>
          {isExporting 
            ? 'Export...' 
            : successFormat 
            ? `Exporté (${successFormat.toUpperCase()})` 
            : label}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Futuristic Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} mt-2 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-1.5 z-50 divide-y divide-slate-800/80`}
          >
            {/* Direct Export Formats */}
            <div className="p-1 space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center justify-between">
                <span>Choisir le format</span>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </div>

              {/* Option 1: PDF */}
              <button
                type="button"
                onClick={() => handleDirectExport('pdf')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-800/90 group transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center justify-between">
                    <span>Document PDF</span>
                    <span className="text-[10px] text-rose-400 font-mono">.pdf</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Mise en page officielle & signatures
                  </div>
                </div>
              </button>

              {/* Option 2: Excel (.xlsx) */}
              <button
                type="button"
                onClick={() => handleDirectExport('excel')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-800/90 group transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center justify-between">
                    <span>Tableur Excel</span>
                    <span className="text-[10px] text-emerald-400 font-mono">.xlsx</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Colonnes typées, calculs & totaux
                  </div>
                </div>
              </button>

              {/* Option 3: CSV */}
              <button
                type="button"
                onClick={() => handleDirectExport('csv')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-slate-800/90 group transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center justify-between">
                    <span>Données CSV</span>
                    <span className="text-[10px] text-amber-400 font-mono">.csv</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Format universel (UTF-8 Excel)
                  </div>
                </div>
              </button>
            </div>

            {/* Advanced Export Center Option */}
            <div className="p-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openExportModal(reportType, classId);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-bold transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Centre d'Export & Filtres...</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React from 'react';
import { Sparkles, FileSpreadsheet, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export const AiOnboardingPrompt: React.FC = () => {
  const { 
    hasDismissedOnboarding, 
    dismissOnboarding, 
    setIsAiImportModalOpen,
    activeRole
  } = useApp();

  // Show onboarding prompt for staff roles (admin, proviseur, enseignant, comptable)
  if (hasDismissedOnboarding || activeRole === 'parent') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="no-print relative mx-3 sm:mx-6 mt-3 sm:mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-cyan-950/90 border border-indigo-500/40 shadow-xl overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold text-xs sm:text-sm">
                  Démarrage Rapide &bull; Avez-vous des documents scolaires existants ?
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Nouveau
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                Importez vos fichiers <strong>Excel (.xlsx) ou CSV</strong> (élèves, classes de la maternelle à la terminale, notes, paiements). Notre IA les intègre automatiquement !
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={() => setIsAiImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition-all cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importer avec l'IA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={dismissOnboarding}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Masquer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

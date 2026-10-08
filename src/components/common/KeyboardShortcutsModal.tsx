import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Sparkles, Command, CheckCircle2, ArrowRight } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
  badge?: string;
  action?: () => void;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutItem[];
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerGradeEntry?: () => void;
  onTriggerReportCard?: () => void;
  onTriggerSearch?: () => void;
  onToggleOffline?: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onTriggerGradeEntry,
  onTriggerReportCard,
  onTriggerSearch,
  onToggleOffline
}) => {
  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const categories: ShortcutCategory[] = [
    {
      title: 'Navigation Principale & Actions Rapides',
      shortcuts: [
        {
          keys: [modKey, 'N'],
          description: 'Ouvrir la saisie rapide des notes (Espace Enseignant)',
          badge: 'Indispensable',
          action: onTriggerGradeEntry
        },
        {
          keys: [modKey, 'B'],
          description: 'Ouvrir la consultation des bulletins officiels',
          badge: 'Officiel',
          action: onTriggerReportCard
        },
        {
          keys: [modKey, 'K'],
          description: 'Recherche globale d\'élèves, classes et professeurs',
          action: onTriggerSearch
        },
        {
          keys: [modKey, 'H'],
          description: 'Basculer le mode Hors-Ligne (cache local)',
          action: onToggleOffline
        },
        {
          keys: ['Esc'],
          description: 'Fermer la boîte de dialogue ou le visualiseur actif'
        }
      ]
    },
    {
      title: 'Grille de Saisie Rapide des Notes',
      shortcuts: [
        {
          keys: ['Entrée'],
          description: 'Enregistrer et passer directement à l\'élève suivant'
        },
        {
          keys: ['↓'],
          description: 'Descendre à l\'élève suivant sans quitter le clavier'
        },
        {
          keys: ['↑'],
          description: 'Monter à l\'élève précédent pour corriger'
        },
        {
          keys: [modKey, 'S'],
          description: 'Enregistrer le brouillon de l\'évaluation en cours'
        },
        {
          keys: ['Tab'],
          description: 'Passer au champ de formulaire suivant'
        }
      ]
    },
    {
      title: 'Filtres Dynamiques Disponibles',
      shortcuts: [
        {
          keys: ['Niveau'],
          description: 'Filtre automatique par cycle (Collège / Lycée) et classe'
        },
        {
          keys: ['Période'],
          description: 'Sélection instantanée du trimestre (T1, T2, T3)'
        },
        {
          keys: ['Statut'],
          description: 'Isoler les notes manquantes ou les élèves en difficulté (< 10)'
        }
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>Raccourcis Clavier Experts</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Productivité
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Naviguez et saisissez vos données sans quitter votre clavier
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
            {categories.map((cat, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400/90 flex items-center gap-2">
                  <span>{cat.title}</span>
                  <div className="h-px flex-1 bg-slate-800/80" />
                </h4>

                <div className="space-y-2">
                  {cat.shortcuts.map((sc, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-950 border border-slate-800/70 hover:border-slate-700/80 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 shrink-0">
                          {sc.keys.map((k, kIdx) => (
                            <React.Fragment key={kIdx}>
                              <kbd className="px-2 py-1 text-xs font-mono font-bold bg-slate-800 border border-slate-700 text-cyan-300 rounded-lg shadow-sm">
                                {k}
                              </kbd>
                              {kIdx < sc.keys.length - 1 && (
                                <span className="text-slate-500 text-xs font-bold">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        <span className="text-xs text-slate-300 font-medium">
                          {sc.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {sc.badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {sc.badge}
                          </span>
                        )}
                        {sc.action && (
                          <button
                            onClick={() => {
                              onClose();
                              sc.action?.();
                            }}
                            className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer"
                          >
                            <span>Tester</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Appuyez sur</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 text-[11px] font-mono">?</kbd>
              <span>ou</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 text-[11px] font-mono">{modKey}+/</kbd>
              <span>pour rouvrir ce guide à tout moment.</span>
            </span>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer text-xs"
            >
              Compris
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

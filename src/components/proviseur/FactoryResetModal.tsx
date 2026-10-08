import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Lock, 
  Flame,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FactoryResetModal: React.FC<FactoryResetModalProps> = ({
  isOpen,
  onClose
}) => {
  const { resetAllDataToFactoryDefaults, addNotification } = useApp();

  const [resetType, setResetType] = useState<'annual' | 'factory'>('annual');
  const [clearArchives, setClearArchives] = useState<boolean>(false);
  const [confirmationInput, setConfirmationInput] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim().toUpperCase() === 'REINITIALISER';

  const handleExecuteReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    if (resetType === 'annual') {
      resetAllDataToFactoryDefaults({
        preserveStructure: true,
        clearArchives
      });
    } else {
      resetAllDataToFactoryDefaults({
        preserveStructure: false,
        clearArchives
      });
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setConfirmationInput('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-slate-950 border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-rose-500/20"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  Réinitialisation du Système Scolaire
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider">
                  Zone Critique
                </span>
              </div>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Action d'autorité réservée au Proviseur d'établissement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleExecuteReset} className="p-6 space-y-5">
          
          {/* Warning banner */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold text-white block">Avertissement de Sécurité Majeur :</strong>
              <p className="text-slate-300 leading-relaxed">
                Cette opération remettra les données sélectionnées à zéro. Assurez-vous d'avoir sauvegardé les données de l'année précédente avant de procéder.
              </p>
            </div>
          </div>

          {/* Type of reset */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
              Niveau de réinitialisation souhaité :
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Annual Reset */}
              <label 
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  resetType === 'annual'
                    ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>Rentrée Scolaire</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Remet à zéro uniquement les notes, absences et paiements. <strong>Conserve les élèves, classes et professeurs</strong>.
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="resetType"
                    checked={resetType === 'annual'}
                    onChange={() => setResetType('annual')}
                    className="mt-1 text-amber-500 focus:ring-amber-500"
                  />
                </div>
              </label>

              {/* Option 2: Full Factory Wipe */}
              <label 
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  resetType === 'factory'
                    ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs">
                      <Flame className="w-4 h-4 text-rose-400" />
                      <span>Remise à Zéro Totale</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Restaure l'ensemble de la plateforme dans son état initial d'usine (Factory Reset complet).
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="resetType"
                    checked={resetType === 'factory'}
                    onChange={() => setResetType('factory')}
                    className="mt-1 text-rose-500 focus:ring-rose-500"
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Option: Clear Archives */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-300 block">
                Supprimer également les archives historiques
              </span>
              <span className="text-[11px] text-slate-500">
                Efface toutes les sauvegardes des années passées stockées en mémoire
              </span>
            </div>
            <input
              type="checkbox"
              checked={clearArchives}
              onChange={(e) => setClearArchives(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-950 border-slate-700 cursor-pointer"
            />
          </div>

          {/* Confirmation Keyword Input (Safeguard) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-300">
              Pour confirmer l'opération, veuillez saisir exactement le mot <span className="text-rose-400 font-mono font-black">REINITIALISER</span> :
            </label>
            <input
              type="text"
              required
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="REINITIALISER"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-rose-500/40 text-white font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-rose-500 placeholder-slate-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={!isConfirmed}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-lg ${
                isConfirmed
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Confirmer & Remettre à Zéro</span>
            </button>
          </div>

          {/* Success state feedback */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">Remise à zéro effectuée avec succès !</span>
            </motion.div>
          )}

        </form>

      </motion.div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  Lock, 
  X, 
  AlertCircle, 
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';

interface ParentChildSwitcherProps {
  currentChild: Student;
  onChildChange?: (student: Student) => void;
}

export const ParentChildSwitcher: React.FC<ParentChildSwitcherProps> = ({ currentChild, onChildChange }) => {
  const { 
    currentUser, 
    students, 
    classes, 
    selectedChildMatricule, 
    setSelectedChildMatricule, 
    addChildMatriculeToParent,
    addNotification
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [matriculeInput, setMatriculeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parent's registered child matricules
  const registeredMatricules = currentUser?.childrenMatricules && currentUser.childrenMatricules.length > 0
    ? currentUser.childrenMatricules
    : currentUser?.studentMatricule 
      ? [currentUser.studentMatricule] 
      : ['PLM-2025-001'];

  const handleSelectChild = (matricule: string) => {
    setSelectedChildMatricule(matricule);
    const targetStudent = students.find(s => s.matricule.toUpperCase() === matricule.toUpperCase());
    if (targetStudent && onChildChange) {
      onChildChange(targetStudent);
    }
  };

  const handleAddSubmit = (matriculeToAdd?: string) => {
    const raw = (matriculeToAdd || matriculeInput).trim().toUpperCase();
    if (!raw) return;

    setErrorMsg(null);
    const res = addChildMatriculeToParent(raw);
    if (!res.success) {
      setErrorMsg(res.error || 'Erreur lors de l\'ajout du matricule.');
      return;
    }

    if (res.student) {
      setSelectedChildMatricule(res.student.matricule);
      if (onChildChange) {
        onChildChange(res.student);
      }
      addNotification(
        'Enfant Rattaché avec Succès',
        `${res.student.firstName} ${res.student.lastName} (${res.student.matricule}) a été ajouté à votre espace famille.`,
        'general',
        { showToast: true }
      );
    }

    setMatriculeInput('');
    setIsAddModalOpen(false);
  };

  const sampleSuggestions = [
    { matricule: 'PLM-2025-001', name: 'Audrey Koffi', class: 'Terminale C', status: 'paid' },
    { matricule: 'PLM-2025-002', name: 'Alexandre Moreau', class: 'Terminale C', status: 'partial' },
    { matricule: 'PLM-2025-003', name: 'Aïssatou Diallo', class: 'Terminale C', status: 'paid' },
    { matricule: 'PLM-2025-004', name: 'Lucas Benali', class: 'Terminale C', status: 'unpaid' }
  ];

  return (
    <div className="bg-slate-900/90 border border-violet-500/25 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              Espace Famille • {currentUser?.name || 'Responsable Légal'}
            </span>
            <span className="text-[11px] text-slate-400">
              {registeredMatricules.length} enfant{registeredMatricules.length > 1 ? 's' : ''} rattaché{registeredMatricules.length > 1 ? 's' : ''} • Téléphone : <strong className="text-slate-200 font-mono">{currentUser?.phone || '+33 6 12 34 56 78'}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setIsAddModalOpen(true);
          }}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-violet-400" />
          <span>+ Ajouter un enfant (matricule)</span>
        </button>
      </div>

      {/* Children list pills */}
      <div className="flex items-center gap-2 pt-2.5 overflow-x-auto no-scrollbar">
        {registeredMatricules.map(mat => {
          const std = students.find(s => s.matricule.toUpperCase() === mat.toUpperCase());
          if (!std) return null;
          const cls = classes.find(c => c.id === std.classId);
          const isSelected = std.id === currentChild?.id || std.matricule === currentChild?.matricule;
          const isPaid = std.paymentStatus === 'paid' || (std.annualTuition && std.paidTuition >= std.annualTuition);

          return (
            <button
              key={mat}
              onClick={() => handleSelectChild(mat)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                isSelected 
                  ? 'bg-violet-600/25 border-violet-500 text-white shadow-md shadow-violet-950/40 ring-1 ring-violet-500/50' 
                  : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isSelected ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {std.firstName.charAt(0)}{std.lastName.charAt(0)}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs leading-none">
                    {std.firstName} {std.lastName}
                  </span>
                  {isPaid ? (
                    <span className="text-[10px] text-emerald-400 font-bold" title="Scolarité Soldée (Bulletin Débloqué)">✓</span>
                  ) : (
                    <span className="text-[10px] text-amber-400" title="Scolarité Partielle (Bulletin Verrouillé)">🔒</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                  <span>{cls?.name || 'Classe'}</span>
                  <span>•</span>
                  <span className="text-cyan-400">{std.matricule}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add Child Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-400" />
                  <h3 className="font-bold text-white text-sm">Rattacher un Enfant (Fratrie)</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Saisissez le matricule de votre enfant délivré lors de son inscription pour consulter instantanément ses notes, devoirs, absences et bulletins.
              </p>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleAddSubmit(); }} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Matricule Scolaire de l'Enfant *
                  </label>
                  <input
                    type="text"
                    required
                    value={matriculeInput}
                    onChange={(e) => setMatriculeInput(e.target.value)}
                    placeholder="Ex: PLM-2025-002"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Suggestions */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">
                    Suggestions rapides (Élèves disponibles) :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleSuggestions.map(s => {
                      const alreadyAdded = registeredMatricules.includes(s.matricule);
                      return (
                        <button
                          key={s.matricule}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => handleAddSubmit(s.matricule)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-all flex items-center gap-1 ${
                            alreadyAdded 
                              ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-60' 
                              : 'bg-slate-950 hover:bg-violet-950/40 border-slate-800 hover:border-violet-500/40 text-slate-300 hover:text-white cursor-pointer'
                          }`}
                        >
                          <span>{s.name}</span>
                          <span className="text-cyan-400 text-[10px]">({s.matricule})</span>
                          {s.status === 'paid' ? (
                            <span className="text-[9px] text-emerald-400">✓ Soldé</span>
                          ) : (
                            <span className="text-[9px] text-amber-400">🔒 Partiel</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Valider et Rattacher
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

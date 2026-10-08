import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  CalendarCheck,
  ShieldCheck,
  Paperclip,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { AttendanceRecord, Student } from '../../types';
import { JustificatifUploadUI, UploadedJustificatif } from '../attendance/JustificatifUploadUI';

interface ParentAbsenceJustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Student;
  preselectedRecord?: AttendanceRecord | null;
}

export const ParentAbsenceJustificationModal: React.FC<ParentAbsenceJustificationModalProps> = ({
  isOpen,
  onClose,
  child,
  preselectedRecord
}) => {
  const { attendance, justifyAbsence } = useApp();

  // Child's unjustified absences
  const childUnjustified = attendance.filter(a => a.targetId === child.id && a.status === 'absent' && !a.isJustified);

  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    preselectedRecord?.id || childUnjustified[0]?.id || ''
  );

  const [motiveType, setMotiveType] = useState<string>('medical');
  const [customExplanation, setCustomExplanation] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Update selection if preselectedRecord changes
  React.useEffect(() => {
    if (preselectedRecord) {
      setSelectedRecordId(preselectedRecord.id);
    } else if (childUnjustified.length > 0 && !selectedRecordId) {
      setSelectedRecordId(childUnjustified[0].id);
    }
  }, [preselectedRecord, childUnjustified]);

  // Handle simulated file pick
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setFileSize(`${(file.size / 1024).toFixed(1)} Ko`);
    }
  };

  const handleSimulateDefaultDoc = () => {
    setUploadedFileName(`justificatif_medical_${child.lastName.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
    setFileSize('245 Ko');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;

    const motiveLabels: Record<string, string> = {
      medical: 'Certificat médical / Maladie',
      family: 'Raison familiale impérieuse',
      transport: 'Perturbation des transports scolaires',
      appointment: 'Rendez-vous médical spécialiste',
      other: 'Autre motif impérieux'
    };

    const fullReason = customExplanation.trim() 
      ? `${motiveLabels[motiveType]} : ${customExplanation.trim()}`
      : motiveLabels[motiveType];

    justifyAbsence(selectedRecordId, fullReason, uploadedFileName || 'justificatif_numerique_parent.pdf');

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setUploadedFileName('');
      setCustomExplanation('');
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 25 }}
          transition={{ type: "spring", damping: 25, stiffness: 320 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Justifier une Absence Scolaire</h3>
                <p className="text-xs text-slate-400">Élève : {child.firstName} {child.lastName} ({child.matricule})</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center space-y-3"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Justificatif Transmis avec Succès</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  La Vie Scolaire et la Direction ont été notifiées de votre démarche. Le statut d'assiduité de {child.firstName} a été actualisé.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Absence Selector */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Sélectionner la séance à justifier *
                  </label>
                  {childUnjustified.length > 0 ? (
                    <select
                      value={selectedRecordId}
                      onChange={(e) => setSelectedRecordId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                    >
                      {childUnjustified.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.date} • {a.sessionName || a.timeSlot || 'Séance'} (Absence constatée)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                      Toutes les absences récentes de {child.firstName} sont actuellement déjà justifiées.
                    </div>
                  )}
                </div>

                {/* Motive Type Radio Pills */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-2">
                    Motif principal de l'absence *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'medical', label: '🩺 Maladie / Certificat médical' },
                      { id: 'appointment', label: '🏥 Rendez-vous spécialiste' },
                      { id: 'family', label: '👨‍👩‍👧 Raison familiale majeure' },
                      { id: 'transport', label: '🚌 Panne de transport' },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMotiveType(m.id)}
                        className={`p-2.5 rounded-xl text-left font-medium transition-all ${
                          motiveType === m.id
                            ? 'bg-violet-600/20 text-violet-300 border border-violet-500/50 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explanation text */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Précisions complémentaires des parents (facultatif)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Précisez tout élément utile pour le conseiller d'éducation ou le professeur principal..."
                    value={customExplanation}
                    onChange={(e) => setCustomExplanation(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                {/* File Upload Zone with advanced JustificatifUploadUI */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Pièce justificative (Certificat médical, convocation, attestation PDF ou image)
                  </label>
                  <JustificatifUploadUI
                    onDocumentChange={(doc) => {
                      if (doc) {
                        setUploadedFileName(doc.fileName);
                        setFileSize(doc.fileSize);
                      } else {
                        setUploadedFileName('');
                        setFileSize('');
                      }
                    }}
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Conforme au règlement intérieur Plume</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                    >
                      Fermer
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      type="submit"
                      disabled={!selectedRecordId}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-violet-950/50 cursor-pointer"
                    >
                      Transmettre la justification
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

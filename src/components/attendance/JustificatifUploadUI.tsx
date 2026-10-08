import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Eye, 
  Download, 
  ShieldCheck, 
  FileCheck, 
  Sparkles,
  Paperclip,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface UploadedJustificatif {
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadDate: string;
  uploadedBy: string;
  status: 'pending' | 'verified' | 'certified';
  previewUrl?: string;
  templateType?: string;
}

interface JustificatifUploadUIProps {
  onDocumentChange?: (doc: UploadedJustificatif | null) => void;
  initialDocument?: UploadedJustificatif | null;
  allowValidationActions?: boolean;
}

export const JustificatifUploadUI: React.FC<JustificatifUploadUIProps> = ({
  onDocumentChange,
  initialDocument = null,
  allowValidationActions = false
}) => {
  const [currentDoc, setCurrentDoc] = useState<UploadedJustificatif | null>(initialDocument);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Pre-configured official templates for 1-click demo/quick testing
  const templatePresets = [
    {
      id: 'medical',
      label: '🩺 Certificat Médical',
      fileName: 'certificat_medical_dr_moreau.pdf',
      fileSize: '320 Ko',
      desc: 'Délivré par Dr. Moreau (Médecin agréé) • Dispensé 48h'
    },
    {
      id: 'transport',
      label: '🚌 Attestation Perturbation Transport',
      fileName: 'bulletin_retard_reseau_transport.pdf',
      fileSize: '185 Ko',
      desc: 'Justificatif officiel incident réseau scolaire'
    },
    {
      id: 'family',
      label: '👨‍👩‍👧 Décharge Familiale Écrite',
      fileName: 'lettre_justificative_parents.pdf',
      fileSize: '142 Ko',
      desc: 'Attestation sur l\'honneur signée des responsables légaux'
    }
  ];

  const handleSimulateUpload = (fileName: string, fileSize: string, templateType?: string) => {
    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 100;
        if (prev >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            const newDoc: UploadedJustificatif = {
              fileName,
              fileSize,
              fileType: 'application/pdf',
              uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
              uploadedBy: 'Responsable Légal (Parent)',
              status: 'verified',
              templateType
            };
            setCurrentDoc(newDoc);
            onDocumentChange?.(newDoc);
            setUploadProgress(null);
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleSimulateUpload(file.name, `${(file.size / 1024).toFixed(1)} Ko`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleSimulateUpload(file.name, `${(file.size / 1024).toFixed(1)} Ko`);
    }
  };

  const handleRemove = () => {
    setCurrentDoc(null);
    onDocumentChange?.(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Box or Document Card */}
      {!currentDoc && uploadProgress === null && (
        <div className="space-y-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center relative overflow-hidden ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-lg shadow-cyan-950/40'
                : 'border-slate-700 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-950'
            }`}
          >
            <UploadCloud className={`w-8 h-8 mx-auto mb-2 transition-transform duration-200 ${
              isDragging ? 'text-cyan-400 scale-110' : 'text-slate-400'
            }`} />

            <div className="text-xs text-slate-300 font-medium">
              Glissez et déposez votre justificatif ici ou{' '}
              <label className="text-cyan-400 hover:text-cyan-300 underline font-bold cursor-pointer">
                parcourez vos fichiers
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-[11px] text-slate-500 mt-1">
              Formats acceptés : PDF, PNG, JPG (Poids max recommandé : 5 Mo)
            </p>
          </div>

          {/* Quick Preset Templates */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Ou sélectionnez un modèle de justificatif pré-formaté :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {templatePresets.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSimulateUpload(preset.fileName, preset.fileSize, preset.id)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/80 text-left transition-all group cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                    {preset.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar when uploading */}
      {uploadProgress !== null && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-xl space-y-3"
        >
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
              Téléversement et scellement numérique en cours...
            </span>
            <span className="font-mono font-black text-white">{uploadProgress}%</span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-2 rounded-full"
              style={{ width: `${uploadProgress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* Completed Document Card */}
      {currentDoc && uploadProgress === null && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-xl space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    {currentDoc.fileName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Certifié Conforme
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {currentDoc.fileSize} • Transmis le {currentDoc.uploadDate} • Par {currentDoc.uploadedBy}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Aperçu</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                title="Supprimer ou remplacer le fichier"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Validation Pipeline Tracker */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1. Dépôt Famille Validé</span>
            </div>
            <div className="text-slate-600">→</div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>2. Vérifié Vie Scolaire</span>
            </div>
            <div className="text-slate-600">→</div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>3. Archivé Registre Légal</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Document In-Modal Visual Preview */}
      <AnimatePresence>
        {isPreviewOpen && currentDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-sm text-slate-900">
                    Aperçu Haute Définition du Document
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Realistic Document Paper View */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 font-serif text-xs leading-relaxed text-slate-800 relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                  <div>
                    <h5 className="font-bold text-base font-sans text-slate-950">
                      CABINET MÉDICAL & D'EXPERTISE PÉDIATRIQUE
                    </h5>
                    <p className="text-[11px] font-sans text-slate-500">
                      Dr. Bernard Moreau • Conseil de l'Ordre des Médecins N° 75-48291
                    </p>
                  </div>
                  <div className="text-right font-sans text-[11px] text-slate-600">
                    Paris, le {new Date().toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div className="py-2 space-y-2">
                  <h6 className="font-sans font-black text-center text-sm uppercase tracking-wide text-indigo-950">
                    CERTIFICAT MÉDICAL DE NON-CONTAMINATION & DISPENSE
                  </h6>
                  <p>
                    Je soussigné, Docteur en médecine, certifie avoir examiné ce jour l'enfant élève au <strong>Groupe Scolaire International Plume</strong>.
                  </p>
                  <p>
                    L'état de santé du patient a nécessité un repos strict et une interruption de la scolarité de 48 heures.
                  </p>
                  <p>
                    La reprise normale des cours et activités d'éducation physique est autorisée à l'issue de cette période.
                  </p>
                </div>

                {/* Stamped Watermark */}
                <div className="flex justify-between items-end pt-4 border-t border-slate-200 font-sans">
                  <div className="text-[10px] text-slate-400">
                    Document vérifié par signature électronique SHA-256<br />
                    Matricule d'archivage : PLM-MED-2026-0814
                  </div>

                  <div className="p-3 rounded-xl border-2 border-dashed border-emerald-600/70 text-emerald-700 text-center font-bold text-[11px] rotate-[-4deg]">
                    ✓ CERTIFIÉ CONFORME<br />
                    VIE SCOLAIRE PLUME
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Fermer l'aperçu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

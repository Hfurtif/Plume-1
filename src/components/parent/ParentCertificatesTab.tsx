import React, { useState } from 'react';
import { 
  Award, 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Eye, 
  ShieldCheck,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Student, SchoolClass } from '../../types';

interface ParentCertificatesTabProps {
  child: Student;
  childClass?: SchoolClass;
}

export const ParentCertificatesTab: React.FC<ParentCertificatesTabProps> = ({ child, childClass }) => {
  const { 
    currentUser, 
    certificates, 
    certificateRequests, 
    requestCertificate, 
    setActiveCertificate,
    addNotification 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [certType, setCertType] = useState<'scolarite' | 'notes' | 'recommandation'>('scolarite');
  const [certPurpose, setCertPurpose] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Requests for this child
  const childRequests = certificateRequests.filter(
    r => r.studentId === child.id || r.studentMatricule === child.matricule
  );

  // Existing approved certificates for this child
  const childCertificates = certificates.filter(
    c => c.studentId === child.id || c.matricule === child.matricule
  );

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!certPurpose.trim()) {
      setErrorMsg('Veuillez indiquer le motif ou l\'organisme destinataire de la demande.');
      return;
    }

    requestCertificate({
      studentId: child.id,
      studentMatricule: child.matricule,
      studentName: `${child.firstName} ${child.lastName}`,
      parentName: currentUser?.name || 'Responsable Légal',
      parentPhone: currentUser?.phone || '+33 6 12 34 56 78',
      type: certType,
      purpose: certPurpose.trim()
    });

    addNotification(
      'Demande de Certificat Enregistrée',
      `Votre demande de ${certType === 'scolarite' ? 'Certificat de Scolarité' : 'Relevé de Notes'} pour ${child.firstName} a été transmise au secrétariat du Proviseur.`,
      'certificate',
      { showToast: true }
    );

    setCertPurpose('');
    setIsModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Banner */}
      <div className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Secrétariat Général & Actes Officiels</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
            Demande de Certificats & Attestations
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Sollicitez en ligne un certificat de scolarité ou un relevé de notes officiel certifié avec QR-Code pour {child?.firstName}.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            setErrorMsg(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/50 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Faire une Nouvelle Demande</span>
        </motion.button>
      </div>

      {/* Available Certificates (Already issued) */}
      {childCertificates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Certificats Officiels Scellés & Téléchargeables</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {childCertificates.map(cert => (
              <div 
                key={cert.id}
                className="p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-amber-500/30 shadow-md space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
                    {cert.certificateNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Délivré le {cert.issueDate}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">
                    {cert.type === 'scolarite' ? 'Certificat de Scolarité Officiel' : 'Relevé de Notes Certifié'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Motif : {cert.purpose}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Signé par Dr. Marc-Aurèle Valmont (Proviseur)
                  </span>

                  <button
                    onClick={() => setActiveCertificate(cert)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Voir & Télécharger</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requests History */}
      <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-xs sm:text-sm">
            Historique de vos Demandes de Documents
          </h3>
          <span className="text-[11px] text-slate-400">
            {childRequests.length} demande{childRequests.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {childRequests.map(req => (
            <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white capitalize">
                    {req.type === 'scolarite' ? 'Certificat de Scolarité' : req.type === 'notes' ? 'Relevé de Notes' : 'Attestation'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Déposée le {req.date}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Motif renseigné : "{req.purpose}"
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {req.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Validé & Prêt</span>
                  </span>
                ) : req.status === 'rejected' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Non approuvé</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" />
                    <span>En cours d'instruction</span>
                  </span>
                )}
              </div>
            </div>
          ))}

          {childRequests.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              Aucune demande de certificat n'a été déposée pour {child.firstName}.
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Request */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Demande de Document Officiel</h3>
                    <p className="text-[10px] text-slate-400">Pour l'élève : {child.firstName} {child.lastName} ({child.matricule})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitRequest} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Type de document souhaité *
                  </label>
                  <select
                    value={certType}
                    onChange={(e) => setCertType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="scolarite">Certificat de Scolarité Officiel</option>
                    <option value="notes">Relevé de Notes Trimestriel Certifié</option>
                    <option value="recommandation">Attestation d'Excellence & Assiduité</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Motif précis & Organisme destinataire *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={certPurpose}
                    onChange={(e) => setCertPurpose(e.target.value)}
                    placeholder="Ex: Candidature CPGE / Parcoursup, demande de bourse d'études, dossier de visa consulaire, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Délivrance officielle sous 24h</span>
                  </div>
                  <p>
                    Le certificat sera horodaté, doté d'un QR-Code de vérification anti-fraude et signé électroniquement par le Proviseur.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-950/40 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmettre la demande</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

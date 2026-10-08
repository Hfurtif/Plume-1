import React from 'react';
import { Printer, X, Award, ShieldCheck, QrCode, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { OfficialCertificate } from '../../types';
import { exportCertificatePdf } from '../../utils/reportExporter';

interface CertificateModalProps {
  certificate: OfficialCertificate | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, onClose }) => {
  const { schoolProfile } = useApp();
  if (!certificate) return null;

  const isScolarite = certificate.type === 'scolarite';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportCertificatePdf(certificate);
  };

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

        {/* Certificate Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 z-10"
        >
          {/* Top Control Bar */}
          <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {isScolarite ? 'Certificat Officiel de Scolarité' : 'Relevé Officiel de Notes & Attestation'}
                </h3>
                <p className="text-xs text-amber-400/90 font-mono">
                  Acte N° {certificate.certificateNumber} • Délivré par le Proviseur
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
                title="Télécharger l'acte officiel au format PDF"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger PDF</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold shadow-md transition-all cursor-pointer"
                title="Imprimer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimer</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Printable Certificate Page */}
          <div className="print-page bg-amber-50/20 text-slate-900 p-8 sm:p-14 relative font-serif">
            
            {/* Decorative Security Border */}
            <div className="border-4 border-double border-amber-900/60 p-6 sm:p-10 bg-white shadow-xl relative">
              
              {/* Header / Republic */}
              <div className="text-center pb-6 border-b border-amber-900/30">
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-slate-600 font-sans">
                  RÉPUBLIQUE DU {(schoolProfile?.country || 'BÉNIN').toUpperCase()} • MINISTÈRE DE L'ENSEIGNEMENT
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif tracking-tight mt-1">
                  {(schoolProfile?.name || 'GROUPE SCOLAIRE INTERNATIONAL PLUME').toUpperCase()}
                </h1>
                <p className="text-xs text-slate-600 font-sans tracking-wide mt-0.5">
                  {schoolProfile?.motto || 'Discipline • Travail • Rigueur • Succès'}
                </p>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  {schoolProfile?.registrationNumber ? `Agrément N° ${schoolProfile.registrationNumber} • ` : ''}{schoolProfile?.locality || 'Cotonou'} • Tél: {schoolProfile?.phone || '+229 21 00 00 00'}
                </p>
              </div>

              {/* Document Title */}
              <div className="py-8 text-center">
                <span className="text-xs font-sans font-bold tracking-widest text-amber-800 uppercase px-3 py-1 bg-amber-100 rounded-full border border-amber-300">
                  ACTE OFFICIEL DE DIRECTION
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-wide underline decoration-amber-600/40 decoration-2 underline-offset-8">
                  {isScolarite ? 'CERTIFICAT DE SCOLARITÉ' : 'RELEVÉ OFFICIEL DE NOTES'}
                </h2>
                <div className="text-xs font-sans text-slate-500 mt-2 font-mono">
                  Référence d'enregistrement : <strong className="text-slate-800">{certificate.certificateNumber}</strong>
                </div>
              </div>

              {/* Formal Body Text */}
              <div className="text-sm leading-relaxed sm:text-base text-slate-800 space-y-4 my-4 font-serif text-justify">
                <p>
                  Je soussigné, <strong>{schoolProfile?.signatories?.proviseurName || certificate.issuedByProviseur}</strong>, {schoolProfile?.signatories?.proviseurTitle || 'Proviseur et Chef d\'Établissement'} 
                  du {schoolProfile?.name || 'Groupe Scolaire International Plume'}, certifie par la présente que :
                </p>

                <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-sm space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 text-xs block">Nom et Prénom de l'élève :</span>
                      <strong className="text-slate-900 text-base">{certificate.studentName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">Matricule Scolaire Permanent :</span>
                      <strong className="text-cyan-800 font-mono text-base">{certificate.matricule}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">Date de Naissance :</span>
                      <span className="text-slate-800 font-semibold">{certificate.dateOfBirth}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">Classe Actuelle :</span>
                      <span className="text-slate-900 font-bold">{certificate.className}</span>
                    </div>
                  </div>
                </div>

                <p>
                  Est régulièrement inscrit(e) sur les registres matricules de notre établissement pour 
                  l'année scolaire <strong>{certificate.academicYear}</strong> et suit avec assiduité 
                  l'intégralité des enseignements dispensés dans la section indiquée.
                </p>

                {certificate.purpose && (
                  <p className="italic text-xs text-slate-600 pt-2 font-sans">
                    <strong>Objet de la délivrance :</strong> {certificate.purpose}
                  </p>
                )}

                <p className="pt-2">
                  En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.
                </p>
              </div>

              {/* Verification and Signature Area */}
              <div className="mt-10 pt-6 border-t border-amber-900/30 grid grid-cols-2 items-end">
                
                {/* Left: Security QR Code */}
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 bg-slate-950 p-2 rounded-xl flex items-center justify-center border-2 border-amber-600/50 shadow-inner">
                    <QrCode className="w-16 h-16 text-cyan-400" />
                  </div>
                  <div className="text-[10px] font-sans text-slate-500">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Authentifié
                    </div>
                    <span>Scannez ce QR Code pour vérifier l'authenticité de cet acte</span>
                  </div>
                </div>

                {/* Right: Signature & Proviseur Stamp */}
                <div className="text-right relative">
                  <span className="font-sans text-xs text-slate-500 block">
                    Délivré à {schoolProfile?.locality || 'Cotonou'}, le {certificate.issueDate}
                  </span>
                  <span className="font-sans text-xs font-bold text-slate-800 block mt-1">
                    {schoolProfile?.signatories?.proviseurTitle || 'Le Proviseur / Chef d\'Établissement'}
                  </span>
                  
                  <div className="h-16 flex items-center justify-end font-serif italic text-lg font-bold text-slate-900 pr-4">
                    {schoolProfile?.signatories?.proviseurName || certificate.issuedByProviseur}
                  </div>

                  <div className="absolute right-20 -bottom-2 w-24 h-24 rounded-full border-4 border-amber-800/80 text-amber-900 flex flex-col items-center justify-center transform -rotate-12 pointer-events-none text-[8px] font-black uppercase text-center leading-tight shadow-md bg-amber-500/10">
                    <span>{schoolProfile?.countryCode ? `RÉP. ${(schoolProfile.countryCode)}` : 'ÉTABLISSEMENT'}</span>
                    <span className="text-[10px] font-extrabold text-amber-950 px-1 truncate max-w-[80px]">
                      {schoolProfile?.name ? schoolProfile.name.slice(0, 15) : 'PLUME'}
                    </span>
                    <span className="text-[7px]">SCEAU DIRECTION</span>
                    <span className="text-[6px]">HOMOLOGUÉ</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

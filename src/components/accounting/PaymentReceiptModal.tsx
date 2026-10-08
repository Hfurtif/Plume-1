import React from 'react';
import { Printer, X, CheckCircle2, Receipt, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { exportPaymentReceiptPdf } from '../../utils/reportExporter';

interface PaymentReceiptModalProps {
  payment: PaymentRecord | null;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ payment, onClose }) => {
  const { students, classes } = useApp();
  if (!payment) return null;

  const student = students.find(s => s.id === payment.studentId);
  const studentClass = classes.find(c => c.id === payment.classId);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportPaymentReceiptPdf(payment, student, studentClass);
  };

  const methodLabel: Record<string, string> = {
    especes: 'Espèces (Caisse Centrale)',
    virement: 'Virement Bancaire',
    cheque: 'Chèque Certifié',
    mobile_money: 'Mobile Money / Wave'
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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 25 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 z-10"
        >
          {/* Top Control Bar */}
          <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Quittance Officielle de Paiement</h3>
                <p className="text-xs text-emerald-400 font-mono">Bordereau N° {payment.receiptNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                title="Télécharger la quittance au format PDF"
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
                <Printer className="w-4 h-4 text-emerald-400" />
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

          {/* Printable Receipt */}
          <div className="print-page bg-white text-slate-900 p-8 sm:p-10 font-sans text-xs">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Service de la Gestion Financière & Comptabilité
                </span>
                <h2 className="text-xl font-black text-slate-900">GROUPE SCOLAIRE PLUME</h2>
                <p className="text-[11px] text-slate-600">Reçu de Règlement de Frais de Scolarité</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 text-xs">
                  PAYÉ • SOLDÉ
                </span>
                <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                  {payment.receiptNumber}
                </div>
              </div>
            </div>

            {/* Details Table */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 text-[11px] block">Bénéficiaire / Élève :</span>
                  <strong className="text-slate-900 text-sm">{payment.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Matricule Scolaire :</span>
                  <strong className="text-cyan-800 font-mono text-sm">{payment.matricule}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Date de versement :</span>
                  <span className="text-slate-800 font-semibold">{payment.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Mode de paiement :</span>
                  <span className="text-slate-800 font-semibold">{methodLabel[payment.method] || payment.method}</span>
                </div>
              </div>

              {payment.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 text-[11px] block">Observations :</span>
                  <span className="text-slate-700 italic">{payment.notes}</span>
                </div>
              )}
            </div>

            {/* Amount Box */}
            <div className="bg-emerald-50/70 border-2 border-emerald-600 rounded-xl p-4 flex justify-between items-center mb-6">
              <div>
                <span className="text-emerald-900 font-bold uppercase tracking-wider text-[11px]">
                  Montant total versé :
                </span>
                <div className="text-2xl font-black text-emerald-950 mt-0.5">
                  {payment.amount.toLocaleString()} FCFA
                </div>
              </div>
              <div className="text-right text-emerald-800 font-medium text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Fonds encaissés en trésorerie</span>
              </div>
            </div>

            {/* Cashier stamp & signature */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200">
              <div>
                <span className="text-slate-500 block">Agent Comptable Enregistreur :</span>
                <strong className="text-slate-800 text-xs">{payment.recordedBy}</strong>
              </div>

              <div className="text-right relative">
                <span className="text-slate-500 block">Visa & Cachet de la Caisse Centrale :</span>
                <div className="h-14 flex items-center justify-end font-serif italic text-sm text-slate-800 pr-2">
                  P. Ndongo
                </div>
                <div className="absolute right-12 top-0 w-16 h-16 rounded-full border-2 border-emerald-700/50 text-emerald-700/60 flex items-center justify-center transform -rotate-12 pointer-events-none text-[7px] font-black uppercase text-center leading-tight">
                  COMPTABILITÉ<br/>PLUME
                </div>
              </div>
            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

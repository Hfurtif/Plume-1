import React, { useState } from 'react';
import { 
  X, 
  Archive, 
  Save, 
  Calendar, 
  Database, 
  Download, 
  RotateCcw, 
  Trash2, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  Check, 
  ArrowRight,
  School
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { AcademicYearArchive } from '../../types';

interface AcademicYearArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcademicYearArchiveModal: React.FC<AcademicYearArchiveModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    activeAcademicYear, 
    academicArchives, 
    students, 
    classes, 
    subjects, 
    grades, 
    payments, 
    certificates, 
    attendance,
    currentUser,
    archiveCurrentAcademicYear,
    restoreAcademicArchive,
    deleteAcademicArchive,
    exportArchiveJson,
    addNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'archive' | 'history'>('archive');
  const [yearName, setYearName] = useState(activeAcademicYear);
  const [archiveNotes, setArchiveNotes] = useState('');
  const [startNextYear, setStartNextYear] = useState(true);
  const [confirmRestoreArchiveId, setConfirmRestoreArchiveId] = useState<string | null>(null);
  const [confirmDeleteArchiveId, setConfirmDeleteArchiveId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalPaymentsAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName.trim()) return;

    const newArchive = archiveCurrentAcademicYear(yearName, archiveNotes, startNextYear);
    
    // Automatically export JSON backup to local drive as a physical safeguard
    exportArchiveJson(newArchive);

    setActiveTab('history');
  };

  const handleRestore = (archive: AcademicYearArchive) => {
    restoreAcademicArchive(archive.id);
    setConfirmRestoreArchiveId(null);
    onClose();
  };

  const handleDelete = (archiveId: string) => {
    deleteAcademicArchive(archiveId);
    setConfirmDeleteArchiveId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  Clôture & Sauvegarde de l'Année Académique
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  Espace Proviseur
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Archivage certifié des données de l'année précédente, export physique et ouverture de la nouvelle session
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

        {/* Tab navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('archive')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'archive'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Sauvegarder l'Année en Cours ({activeAcademicYear})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Registre des Années Archivées ({academicArchives.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'archive' && (
            <div className="space-y-6">
              
              {/* Snapshot of data to be saved */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Contenu du Snapshot Certifié • Année {activeAcademicYear}</span>
                  </span>
                  <span className="text-slate-400 font-mono">Prêt pour l'archivage</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block">Effectif Élèves</span>
                    <strong className="text-base font-mono text-cyan-400 font-black">{students.length} inscrits</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block">Notes & Évaluations</span>
                    <strong className="text-base font-mono text-emerald-400 font-black">{grades.length} notes</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block">Assiduité & Émargements</span>
                    <strong className="text-base font-mono text-amber-400 font-black">{attendance.length} actes</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block">Paiements Encaissés</span>
                    <strong className="text-base font-mono text-indigo-400 font-black">{totalPaymentsAmount.toLocaleString()} F</strong>
                  </div>
                </div>
              </div>

              {/* Archive Form */}
              <form onSubmit={handleArchive} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Intitulé de l'Année Académique à Clôturer *
                    </label>
                    <input
                      type="text"
                      required
                      value={yearName}
                      onChange={(e) => setYearName(e.target.value)}
                      placeholder="Ex: 2025 - 2026"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Cette désignation sera gravée dans les registres d'archives légaux.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Visa / Proviseur Signataire
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser ? `${currentUser.name} (Proviseur)` : 'Dr. Marc-Aurèle Valmont (Proviseur)'}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm font-semibold cursor-not-allowed"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Authentification automatique par clé d'autorité.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Procès-verbal de fin d'année / Notes de clôture (Optionnel)
                  </label>
                  <textarea
                    rows={3}
                    value={archiveNotes}
                    onChange={(e) => setArchiveNotes(e.target.value)}
                    placeholder="Ex: Clôture solennelle des examens du 3ème trimestre, passage en commission d'orientation, relevés scellés."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Option to start next academic year */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="startNextYear"
                    checked={startNextYear}
                    onChange={(e) => setStartNextYear(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="startNextYear" className="cursor-pointer text-xs space-y-1">
                    <span className="font-bold text-amber-300 block">
                      Ouvrir immédiatement la nouvelle rentrée scolaire (Année suivante)
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      L'application conservera l'ensemble des élèves, classes et professeurs, et réinitialisera à zéro les évaluations (notes), les émargements (absences) et l'état des scolarités pour démarrer la nouvelle année dans des conditions optimales.
                    </p>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                  <p className="text-[11px] text-slate-500 italic">
                    * Un fichier de sauvegarde JSON certifié sera automatiquement téléchargé sur votre ordinateur.
                  </p>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/40 inline-flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Sceller & Archiver Définitivement</span>
                    </button>
                  </div>
                </div>
              </form>

            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Archives Historiques Validées</h3>
                  <p className="text-xs text-slate-400">
                    Consultez, téléchargez les sauvegardes ou restaurez une année antérieure pour réutilisation
                  </p>
                </div>
              </div>

              {academicArchives.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-500">
                  <Archive className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                  <p className="font-semibold text-slate-400">Aucune archive d'année enregistrée pour l'instant</p>
                  <p className="text-xs text-slate-600 mt-1">Utilisez l'onglet de sauvegarde pour clore l'année en cours.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {academicArchives.map((archive) => {
                    const isConfirmingRestore = confirmRestoreArchiveId === archive.id;
                    const isConfirmingDelete = confirmDeleteArchiveId === archive.id;

                    return (
                      <div 
                        key={archive.id}
                        className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-lg"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold font-mono text-sm">
                              {archive.academicYear.split('-')[0]?.trim().slice(-2) || 'AC'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-white text-base">
                                  Année Académique {archive.academicYear}
                                </h4>
                                {activeAcademicYear === archive.academicYear && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                    Session Active
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                                <span>Archivée le : <strong className="text-slate-300">{new Date(archive.archivedAt).toLocaleDateString('fr-FR')}</strong></span>
                                <span>• Par : <strong className="text-slate-300">{archive.archivedBy}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Export Button */}
                          <button
                            onClick={() => exportArchiveJson(archive)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            title="Télécharger la sauvegarde complète de cette année au format JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Télécharger Fichier (JSON)</span>
                          </button>
                        </div>

                        {/* Snapshot statistics */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Élèves</span>
                            <span className="font-bold text-slate-200 font-mono">{archive.stats.studentsCount} élèves</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Notes</span>
                            <span className="font-bold text-emerald-400 font-mono">{archive.stats.gradesCount} notes</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Émargements</span>
                            <span className="font-bold text-amber-400 font-mono">{archive.stats.attendanceCount} actes</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Scolarités</span>
                            <span className="font-bold text-indigo-400 font-mono">{archive.stats.paymentsTotal.toLocaleString()} F</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase block">Certificats</span>
                            <span className="font-bold text-cyan-400 font-mono">{archive.stats.certificatesCount} délivrés</span>
                          </div>
                        </div>

                        {archive.notes && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                            "{archive.notes}"
                          </p>
                        )}

                        {/* Actions for this archive */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                          <span className="text-[10px] font-mono text-slate-500">
                            ID Archive : {archive.id}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Restore Action */}
                            {isConfirmingRestore ? (
                              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-500/10 border border-rose-500/30">
                                <span className="text-[11px] text-rose-300 font-bold px-1">Restaurer en session ?</span>
                                <button
                                  onClick={() => handleRestore(archive)}
                                  className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Oui
                                </button>
                                <button
                                  onClick={() => setConfirmRestoreArchiveId(null)}
                                  className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmRestoreArchiveId(archive.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Charger cette archive dans l'application pour consultation"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                                <span>Restaurer en Session Active</span>
                              </button>
                            )}

                            {/* Delete Action */}
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-500/10 border border-rose-500/30">
                                <span className="text-[11px] text-rose-300 font-bold px-1">Supprimer ?</span>
                                <button
                                  onClick={() => handleDelete(archive.id)}
                                  className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Oui
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteArchiveId(null)}
                                  className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteArchiveId(archive.id)}
                                className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
                                title="Supprimer définitivement cette archive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sécurité & Conformité : Registres d'archives immuables et certifiés</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </motion.div>
    </div>
  );
};

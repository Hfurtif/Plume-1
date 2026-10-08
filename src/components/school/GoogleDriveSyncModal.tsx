import React, { useState } from 'react';
import { 
  Cloud, 
  CloudRain, 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  X, 
  Server, 
  Laptop, 
  Smartphone, 
  Users, 
  FileSpreadsheet, 
  FileText,
  Mail,
  AlertCircle,
  FolderSync
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export const GoogleDriveSyncModal: React.FC = () => {
  const { 
    isGoogleDriveSyncModalOpen, 
    setIsGoogleDriveSyncModalOpen,
    schoolProfile,
    updateSchoolProfile,
    syncToGoogleDrive,
    downloadDatabaseBackup,
    restoreDatabaseFromJson,
    students,
    grades,
    payments,
    classes,
    openSettingsModal
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [googleEmailInput, setGoogleEmailInput] = useState(schoolProfile.googleEmail || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  if (!isGoogleDriveSyncModalOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncToGoogleDrive();
      setSyncFeedback(`Dernière synchronisation réussie le ${res.timestamp} sur le Google Drive.`);
    } catch {
      setSyncFeedback('Erreur lors de la synchronisation.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveGoogleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim()) return;
    updateSchoolProfile({
      googleEmail: googleEmailInput.trim(),
      cloudSync: {
        ...schoolProfile.cloudSync,
        schoolGoogleEmail: googleEmailInput.trim()
      }
    });
    setIsEditingEmail(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const res = restoreDatabaseFromJson(text);
        if (res.success) {
          setRestoreSuccess(res.message);
        } else {
          setRestoreError(res.message);
        }
      } catch (err: any) {
        setRestoreError(`Erreur de lecture du fichier : ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/50 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Stockage des Données & Google Drive</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Souveraineté 100% Garantie
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Comment les données sont enregistrées, synchronisées et sauvegardées sur votre propre Drive
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsGoogleDriveSyncModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Architecture Explanation Card (Answering the user's specific inquiry) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <FolderSync className="w-4 h-4" />
                <span>Architecture Réseau : Comment fonctionne la synchronisation ?</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Step A: Live Cloud Sync for Multi-User */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Server className="w-4 h-4" />
                    <span>1. Base Cloud Centrale (Multi-Postes & En Direct)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Lorsque l'application est utilisée sur les ordinateurs de l'école, les données sont immédiatement répliquées sur la base cloud sécurisée.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Pourquoi ?</strong> Pour que lorsqu'un parent ou un enseignant se connecte depuis son smartphone ou chez lui, il accède instantanément aux notes, bulletins et paiements mis à jour en temps réel.
                  </p>
                </div>

                {/* Step B: Google Drive Sovereign Backup */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Cloud className="w-4 h-4" />
                    <span>2. Coffre-Fort Google Drive de l'École</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Grâce à l'email Google (<span className="text-amber-300 font-mono">{schoolProfile.googleEmail}</span>), une copie miroir complète et chiffrée de toutes vos données est envoyée directement dans votre Drive.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Sécurité absolue :</strong> Personne d'autre ne peut accéder à ces archives car elles sont hébergées sur le propre espace Google Drive privé de votre établissement !
                  </p>
                </div>
              </div>
            </div>

            {/* School Google Drive Account Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Compte Google Drive de Sauvegarde de l'École
                    </div>
                    <div className="text-xs text-cyan-300 font-mono mt-0.5">
                      {schoolProfile.googleEmail || 'Non configuré'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingEmail(!isEditingEmail)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  {isEditingEmail ? 'Annuler' : 'Modifier le compte Google'}
                </button>
              </div>

              {isEditingEmail && (
                <form onSubmit={handleSaveGoogleEmail} className="pt-2 flex gap-2">
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={e => setGoogleEmailInput(e.target.value)}
                    placeholder="direction.ecole@gmail.com"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-white text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Enregistrer
                  </button>
                </form>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div>
                  <span>Dossier cible sur votre Drive : </span>
                  <span className="text-slate-200 font-mono font-bold">
                    📁 {schoolProfile.cloudSync.googleDriveFolderName}
                  </span>
                </div>
                {schoolProfile.cloudSync.serviceAccountEmail && (
                  <div className="text-[10px] text-emerald-400 font-mono truncate max-w-[260px]">
                    Service : {schoolProfile.cloudSync.serviceAccountEmail}
                  </div>
                )}
              </div>

              {/* Direct Link to Settings Menu for Google Drive Configuration */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Paramétrer le compte de service & autorisations dans les Paramètres :
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsGoogleDriveSyncModalOpen(false);
                    openSettingsModal('googledrive');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-all shrink-0"
                >
                  Ouvrir les Paramètres Drive
                </button>
              </div>
            </div>

            {/* Live Sync Action Center */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-cyan-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Synchroniser maintenant avec Google Drive</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Génère et transmet l'archive de la base (élèves, notes, inscriptions, quittances, bulletins PDF).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  <Cloud className="w-4 h-4" />
                  <span>{isSyncing ? 'Synchronisation en cours...' : 'Lancer la Sauvegarde Drive'}</span>
                </button>
              </div>

              {syncFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{syncFeedback}</span>
                </div>
              )}

              {/* Data metrics */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-cyan-500/20 text-center">
                <div className="p-2 rounded-lg bg-slate-950/60">
                  <div className="text-base font-bold text-white">{students.length}</div>
                  <div className="text-[10px] text-slate-400">Élèves</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60">
                  <div className="text-base font-bold text-cyan-400">{classes.length}</div>
                  <div className="text-[10px] text-slate-400">Classes</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60">
                  <div className="text-base font-bold text-amber-400">{grades.length}</div>
                  <div className="text-[10px] text-slate-400">Notes</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60">
                  <div className="text-base font-bold text-emerald-400">{payments.length}</div>
                  <div className="text-[10px] text-slate-400">Paiements</div>
                </div>
              </div>
            </div>

            {/* Offline & Local PC Backup / Restore */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300">
                Sauvegarde Hors-Ligne & Export Manuel sur l'Ordinateur de l'École
              </div>
              <p className="text-[11px] text-slate-400">
                Vous pouvez également télécharger une copie locale du fichier de données sur clé USB ou disque dur externe pour une sécurité maximale.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={downloadDatabaseBackup}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Télécharger Archive Locale (.JSON)</span>
                </button>

                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-bold border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Restaurer depuis un Fichier</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {restoreSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{restoreSuccess}</span>
                </div>
              )}

              {restoreError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{restoreError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Chiffrement AES-256 • Conforme aux réglementations scolaires
            </span>
            <button
              onClick={() => setIsGoogleDriveSyncModalOpen(false)}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

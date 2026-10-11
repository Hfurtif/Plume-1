import React, { useState } from 'react';
import { 
  Monitor, 
  Download, 
  X, 
  Check, 
  Laptop, 
  Smartphone, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Zap,
  WifiOff,
  Sparkles,
  ArrowRight,
  Server,
  Copy,
  Terminal,
  Layers,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, platformName, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'windows' | 'mac' | 'server' | 'mobile'>('windows');
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Set default tab based on detected platform
  React.useEffect(() => {
    if (platformName === 'mac') setActiveTab('mac');
    else if (platformName === 'android' || platformName === 'ios') setActiveTab('mobile');
    else setActiveTab('windows');
  }, [platformName]);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    const success = await install();
    setIsInstalling(false);
    if (success) {
      onClose();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                  <span>Installer Plume sur PC & Bureau</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                    Windows • Mac • Linux
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Accès direct sans navigateur, mode hors-ligne intégral et performances natives
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

          {/* Modal Body */}
          <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Status Hero Card */}
            {isInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Application déjà installée sur ce PC</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Plume est déjà configuré comme logiciel de bureau sur votre ordinateur. Vous pouvez le lancer directement depuis le Bureau Windows, la barre des tâches ou le menu Démarrer.
                  </p>
                </div>
              </div>
            ) : isInstallable ? (
              /* Direct 1-Click Install Banner when browser supports prompt */
              <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300">Installation Instantanée Détectée</span>
                  </div>
                  <h4 className="text-base font-bold text-white">Installer sur votre PC en 1 clic</h4>
                  <p className="text-xs text-slate-300">
                    Crée automatiquement une icône officielle sur le Bureau et dans la barre des tâches de votre PC.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDirectInstall}
                  disabled={isInstalling}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Download className="w-4 h-4 stroke-[3]" />
                  <span>{isInstalling ? 'Installation en cours...' : 'Installer sur PC maintenant'}</span>
                </motion.button>
              </div>
            ) : null}

            {/* Answer to user's question: Oui c'est possible et voici les 2 modes */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Oui, vous pouvez installer Plume sur n'importe quel PC !
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Plume peut être installé sur votre ordinateur de deux manières différentes selon vos besoins scolaires :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                    <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mode 1 : Application Bureau (PWA)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Pour chaque utilisateur (Comptable, Proviseur, Enseignant). S'installe en 5 secondes via Chrome ou Edge, avec icône sur le bureau et fonctionne 100% hors-ligne.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mode 2 : Serveur Local d'Établissement</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Pour héberger Plume sur le PC central ou serveur de l'école. Tout le personnel y accède via le réseau local (LAN/Wi-Fi) sans dépendre d'Internet.
                  </p>
                </div>
              </div>
            </div>

            {/* Why Install Advantages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Fenêtre Dédiée PC</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  S'exécute comme un logiciel natif Windows, sans barre d'adresse ni onglets parasites de navigateur.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Mode 100% Hors-Ligne</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Saisissez les notes, imprimez les reçus et consultez les dossiers scolaires même en coupure Internet.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Raccourci Bureau</div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Double-cliquez sur l'icône Plume sur votre Bureau pour démarrer instantanément.
                </p>
              </div>
            </div>

            {/* Platform Guides */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Instructions détaillées selon votre configuration
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">
                  Système : {platformName.toUpperCase()}
                </span>
              </div>

              {/* Segmented Platform Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('windows')}
                  className={`py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'windows'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Laptop className="w-4 h-4" />
                  <span>Windows & PC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('mac')}
                  className={`py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'mac'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Mac (macOS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('server')}
                  className={`py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'server'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Server className="w-4 h-4" />
                  <span>Serveur Local</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('mobile')}
                  className={`py-2 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'mobile'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile & Tab</span>
                </button>
              </div>

              {/* Tab 1: Windows & PC */}
              {activeTab === 'windows' && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <strong className="text-white block font-semibold">Sur Google Chrome ou Brave (Windows 10/11) :</strong>
                      <p className="text-slate-300 mt-1">
                        Regardez en haut à droite dans la <strong>barre d'adresse</strong> : cliquez sur la petite icône avec une flèche vers le bas ou un écran <span className="text-cyan-300 font-mono font-bold">"Installer Plume"</span>.
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        <em>Ou bien :</em> Cliquez sur le menu <strong>⋮ (3 points)</strong> en haut à droite &gt; <strong>"Enregistrer et partager"</strong> &gt; <strong>"Installer Plume..."</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <strong className="text-white block font-semibold">Sur Microsoft Edge (Windows) :</strong>
                      <p className="text-slate-300 mt-1">
                        Cliquez sur l'icône d'application dans la barre d'URL ou cliquez sur les <strong>... (3 points)</strong> en haut à droite &gt; <strong>"Applications"</strong> &gt; <strong>"Installer ce site en tant qu'application"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </div>
                    <div>
                      <strong className="text-white block font-semibold">Résultat sur votre PC :</strong>
                      <p className="text-slate-300 mt-0.5">
                        Une icône officielle <strong>Plume</strong> est créée sur votre <strong>Bureau Windows</strong> et dans le <strong>menu Démarrer</strong>. Vous pouvez également faire un clic droit dessus pour l'<strong>Épingler à la barre des tâches</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Mac */}
              {activeTab === 'mac' && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <strong className="text-white block font-semibold">Sur Chrome / Edge pour Mac :</strong>
                      <p className="text-slate-300 mt-1">
                        Cliquez sur l'icône d'installation dans la barre d'URL ou Menu &gt; <strong>"Installer Plume..."</strong>. L'icône est automatiquement ajoutée à votre dossier <strong>Applications</strong> et au <strong>Launchpad</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <strong className="text-white block font-semibold">Sur Safari (macOS Sonoma ou supérieur) :</strong>
                      <p className="text-slate-300 mt-1">
                        Dans la barre de menu Safari en haut de l'écran, cliquez sur <strong>Fichier</strong> &gt; <strong>"Ajouter au Dock..."</strong> &gt; Confirmez le nom <strong>Plume</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Local Server for School */}
              {activeTab === 'server' && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    <strong>Déploiement Autonome sur Serveur Local PC :</strong>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Si votre école dispose d'un ordinateur fixe ou d'un serveur local et souhaite faire tourner Plume sur le réseau interne de l'école (sans connexion internet requise pour les postes clients) :
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Commandes d'installation sur le PC hôte (Node.js 20+) :</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard('git clone https://github.com/Hfurtif/Plume-1.git\ncd Plume-1\nnpm install\nnpm run dev', 'cmd')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedCode === 'cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode === 'cmd' ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1 select-all">
                      <div>git clone https://github.com/Hfurtif/Plume-1.git</div>
                      <div>cd Plume-1</div>
                      <div>npm install</div>
                      <div>npm run dev</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-slate-300 text-[11px]">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0">
                      ℹ
                    </div>
                    <p>
                      Une fois lancé, tous les ordinateurs connectés au Wi-Fi ou au câble Ethernet de l'école peuvent ouvrir Plume via : <strong className="text-white font-mono">http://IP_DU_PC:3000</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 4: Mobile & Tablette */}
              {activeTab === 'mobile' && (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <strong className="text-white block font-semibold">Sur Android (Google Chrome) :</strong>
                      <p className="text-slate-300 mt-1">
                        Appuyez sur les <strong>3 points</strong> en haut à droite &gt; <strong>"Ajouter à l'écran d'accueil"</strong> ou <strong>"Installer l'application"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <strong className="text-white block font-semibold">Sur iPhone / iPad (Safari) :</strong>
                      <p className="text-slate-300 mt-1">
                        Appuyez sur l'icône <strong>Partager</strong> (le carré avec une flèche vers le haut en bas de l'écran) &gt; faites défiler vers le bas &gt; touchez <strong>"Sur l'écran d'accueil"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400">
              Compatible Windows 10/11, macOS, Linux, Chrome OS, Android et iOS
            </span>
            <div className="flex items-center gap-2">
              {isInstallable && (
                <button
                  type="button"
                  onClick={handleDirectInstall}
                  disabled={isInstalling}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isInstalling ? 'Installation...' : 'Installer'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

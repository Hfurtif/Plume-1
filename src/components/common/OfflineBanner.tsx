import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Database, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OfflineBanner: React.FC = () => {
  const { 
    isEffectivelyOffline, 
    isOfflineSimulated, 
    toggleOfflineSimulation, 
    syncOfflineCache, 
    offlineCacheStatus 
  } = useApp();

  if (!isEffectivelyOffline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-amber-950/90 border-b border-amber-500/30 backdrop-blur-md px-4 py-2.5 text-xs text-amber-200 z-30 shadow-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white flex items-center gap-1.5">
                <span>Mode Hors-Ligne Actif</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  {isOfflineSimulated ? 'Simulation' : 'Réseau Coupé'}
                </span>
              </span>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Consultation limitée activée : <strong>{offlineCacheStatus.cachedGradesCount} notes</strong> et <strong>{offlineCacheStatus.cachedBulletinsCount} livrets scolaires</strong> disponibles depuis le cache local (dernière synchro : {offlineCacheStatus.lastCachedAt || 'Aujourd\'hui'}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={syncOfflineCache}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-semibold transition-all cursor-pointer shadow-sm text-[11px]"
              title="Vérifier et sécuriser le cache local"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Rafraîchir Cache</span>
            </motion.button>

            {isOfflineSimulated ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleOfflineSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-white border border-amber-400/40 font-bold transition-all cursor-pointer shadow-sm text-[11px]"
              >
                <span>Repasser En Ligne</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </motion.button>
            ) : (
              <span className="text-[11px] text-amber-300/70 italic hidden md:inline">
                Reconnexion automatique dès le rétablissement
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

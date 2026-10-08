import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle2, 
  Award, 
  FileText, 
  Receipt, 
  CalendarCheck, 
  X, 
  ExternalLink,
  Sparkles,
  Volume2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification } from '../../types';

export const NotificationToastContainer: React.FC = () => {
  const { toasts, dismissToast, executeNotificationAction } = useApp();

  const getTypeConfig = (type: AppNotification['type']) => {
    switch (type) {
      case 'grade':
        return {
          icon: <FileText className="w-5 h-5 text-cyan-400" />,
          borderColor: 'border-cyan-500/40',
          bgGradient: 'from-slate-900/95 via-cyan-950/40 to-slate-900/95',
          glowColor: 'shadow-cyan-500/20',
          badgeText: 'Pédagogie & Notes',
          badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          accentColor: 'bg-cyan-500'
        };
      case 'certificate':
        return {
          icon: <Award className="w-5 h-5 text-amber-400" />,
          borderColor: 'border-amber-500/40',
          bgGradient: 'from-slate-900/95 via-amber-950/40 to-slate-900/95',
          glowColor: 'shadow-amber-500/20',
          badgeText: 'Document Officiel',
          badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          accentColor: 'bg-amber-500'
        };
      case 'finance':
        return {
          icon: <Receipt className="w-5 h-5 text-emerald-400" />,
          borderColor: 'border-emerald-500/40',
          bgGradient: 'from-slate-900/95 via-emerald-950/40 to-slate-900/95',
          glowColor: 'shadow-emerald-500/20',
          badgeText: 'Caisse & Quittance',
          badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          accentColor: 'bg-emerald-500'
        };
      case 'absence':
        return {
          icon: <CalendarCheck className="w-5 h-5 text-violet-400" />,
          borderColor: 'border-violet-500/40',
          bgGradient: 'from-slate-900/95 via-violet-950/40 to-slate-900/95',
          glowColor: 'shadow-violet-500/20',
          badgeText: 'Vie Scolaire & Présence',
          badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
          accentColor: 'bg-violet-500'
        };
      default:
        return {
          icon: <Bell className="w-5 h-5 text-blue-400" />,
          borderColor: 'border-blue-500/40',
          bgGradient: 'from-slate-900/95 via-blue-950/40 to-slate-900/95',
          glowColor: 'shadow-blue-500/20',
          badgeText: 'Notification Plume',
          badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
          accentColor: 'bg-blue-500'
        };
    }
  };

  return (
    <div 
      aria-live="polite" 
      className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-2"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = getTypeConfig(toast.type);

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: -15, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: "spring", damping: 22, stiffness: 350 }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.bgGradient} backdrop-blur-xl border ${config.borderColor} p-4 shadow-2xl ${config.glowColor}`}
            >
              {/* Top Accent Pulsing Glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 6, ease: "linear" }}
                  className={`h-full ${config.accentColor}`}
                />
              </div>

              <div className="flex items-start gap-3 mt-1">
                {/* Icon Container */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shrink-0 shadow-inner">
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${config.badgeColor}`}>
                      {config.badgeText}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {toast.timestamp}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-tight">
                    {toast.title}
                  </h4>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                    {toast.message}
                  </p>

                  {/* Optional Action Button */}
                  {toast.action && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          executeNotificationAction(toast.action!);
                          dismissToast(toast.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <span>{toast.action.label}</span>
                        <ExternalLink className="w-3 h-3 text-cyan-300" />
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

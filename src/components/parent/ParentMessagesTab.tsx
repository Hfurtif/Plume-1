import React from 'react';
import { 
  Bell, 
  Mail, 
  CheckCheck, 
  AlertTriangle, 
  Award, 
  Shield, 
  Wallet, 
  GraduationCap, 
  Clock,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';

interface ParentMessagesTabProps {
  child: Student;
}

export const ParentMessagesTab: React.FC<ParentMessagesTabProps> = ({ child }) => {
  const { parentMessages, markParentMessageAsRead } = useApp();

  // Filter messages for this child or general messages
  const messagesForChild = parentMessages.filter(
    m => !m.studentMatricule || m.studentMatricule === child.matricule || m.studentId === child.id
  );

  const unreadCount = messagesForChild.filter(m => !m.read).length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'proviseur':
        return {
          icon: <Award className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Proviseur',
          classes: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        };
      case 'admin':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-blue-400" />,
          label: 'Direction des Études',
          classes: 'bg-blue-500/10 text-blue-300 border-blue-500/30'
        };
      case 'comptable':
        return {
          icon: <Wallet className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Intendance Comptable',
          classes: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
        };
      case 'enseignant':
        return {
          icon: <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'Professeur',
          classes: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
        };
      default:
        return {
          icon: <Mail className="w-3.5 h-3.5 text-slate-400" />,
          label: 'Établissement',
          classes: 'bg-slate-800 text-slate-300 border-slate-700'
        };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header Banner */}
      <div className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-violet-950/30 to-slate-900 border border-violet-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-violet-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Messagerie & Communications Scolaires</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
            Messages & Alertes de l'Établissement
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Correspondances directes de la Direction, des enseignants et de l'intendance concernant {child?.firstName}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-violet-500/30 text-violet-300 font-mono text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
            <span>{unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3 sm:space-y-4">
        {messagesForChild.map(msg => {
          const badge = getRoleBadge(msg.senderRole);

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all space-y-3 ${
                !msg.read 
                  ? 'bg-slate-900 border-violet-500/40 shadow-lg shadow-violet-950/20' 
                  : 'bg-slate-900/70 border-slate-800 opacity-90'
              }`}
            >
              {/* Top metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${badge.classes}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>

                  {msg.urgent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>Important</span>
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{msg.date}</span>
                  </span>
                </div>

                {!msg.read && (
                  <button
                    onClick={() => markParentMessageAsRead(msg.id)}
                    className="self-end sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Marquer comme lu</span>
                  </button>
                )}
              </div>

              {/* Title & Body */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {msg.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  {msg.content}
                </p>
              </div>

              {/* Sender signature */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                <span>Émis par : <strong className="text-slate-200">{msg.senderName}</strong></span>
                <span className="font-mono text-[10px] text-cyan-400">{child.firstName} ({child.matricule})</span>
              </div>
            </motion.div>
          );
        })}

        {messagesForChild.length === 0 && (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <Mail className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">Aucun message pour le moment</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Les communications de la Direction, les alertes de scolarité et les convocations s'afficheront dans cette boîte de réception.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

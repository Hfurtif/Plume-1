import React, { useState } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Paperclip, 
  CheckCircle2, 
  Download, 
  Search,
  Filter,
  GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Student, SchoolClass } from '../../types';

interface ParentCahierDeTextesTabProps {
  child: Student;
  childClass?: SchoolClass;
}

export const ParentCahierDeTextesTab: React.FC<ParentCahierDeTextesTabProps> = ({ child, childClass }) => {
  const { cahierDeTextes, subjects, addNotification } = useApp();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Entries for this child's class
  const classEntries = cahierDeTextes.filter(c => c.classId === child.classId);

  const filteredEntries = classEntries.filter(entry => {
    const matchSubject = selectedSubjectId === 'all' || entry.subjectId === selectedSubjectId;
    const matchSearch = !searchQuery.trim() ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.lessonContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.homeworkText && entry.homeworkText.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSubject && matchSearch;
  });

  const handleDownloadAttachment = (filename: string) => {
    addNotification(
      'Téléchargement du Document',
      `Le fichier "${filename}" a été téléchargé depuis le cahier de textes.`,
      'general',
      { showToast: true }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Top Banner */}
      <div className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Cahier de Textes & Bloc-notes Numérique</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
            Séances de Cours & Devoirs de {child?.firstName}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Classe : <strong className="text-cyan-400">{childClass?.name}</strong> • Consultez les notions abordées et les devoirs assignés par le corps professoral.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold">
            {classEntries.length} séances archivées
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-between items-stretch sm:items-center">
        {/* Subject Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedSubjectId === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Toutes les matières
          </button>
          {subjects.filter(s => s.isActive !== false).slice(0, 6).map(s => {
            const count = classEntries.filter(e => e.subjectId === s.id).length;
            if (count === 0) return null;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedSubjectId === s.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {s.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une notion..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* List of Entries */}
      <div className="space-y-3 sm:space-y-4">
        {filteredEntries.map(entry => {
          const subj = subjects.find(s => s.id === entry.subjectId);

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3"
            >
              {/* Top Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-[11px]">
                    {subj?.name || 'Matière'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Séance du {entry.date}</span>
                  </span>
                </div>

                <span className="text-[11px] text-slate-400">
                  Enseignant : <strong className="text-slate-200">{entry.teacherName || 'Professeur'}</strong>
                </span>
              </div>

              {/* Title & Lesson Content */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {entry.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {entry.lessonContent}
                </p>
              </div>

              {/* Homework Block */}
              {entry.homeworkText && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                        Travail à Faire / Devoir
                      </span>
                      <p className="text-xs text-amber-100 font-medium mt-0.5">
                        {entry.homeworkText}
                      </p>
                    </div>
                  </div>
                  {entry.dueDate && (
                    <div className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold self-start sm:self-center border border-amber-500/30">
                      À rendre pour le {entry.dueDate}
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {entry.attachments && entry.attachments.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Supports de cours joints :
                  </span>
                  {entry.attachments.map((att, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleDownloadAttachment(att)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{att}</span>
                      <Download className="w-3 h-3 ml-1" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">Aucune séance enregistrée pour cette sélection</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Les leçons et devoirs publiés par les professeurs de {child.firstName} apparaîtront automatiquement ici.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

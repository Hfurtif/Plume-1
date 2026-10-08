import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  Clock, 
  FileText, 
  Paperclip, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  School,
  Search,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export const TeacherCahierDeTextesView: React.FC = () => {
  const { 
    currentUser, 
    classes, 
    subjects, 
    cahierDeTextes, 
    addCahierEntry, 
    deleteCahierEntry, 
    addNotification 
  } = useApp();

  const assignedClassIds = currentUser?.assignedClasses || ['cls-tc', 'cls-td'];
  const teacherClasses = classes.filter(c => assignedClassIds.length === 0 || assignedClassIds.includes(c.id));
  
  const assignedSubjectIds = currentUser?.assignedSubjects || [];
  const teacherSubjects = subjects.filter(s => s.isActive !== false && (assignedSubjectIds.length === 0 || assignedSubjectIds.includes(s.id)));

  // State
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState<boolean>(false);

  // Form State
  const [formClassId, setFormClassId] = useState<string>(teacherClasses[0]?.id || classes[0]?.id || '');
  const [formSubjectId, setFormSubjectId] = useState<string>(teacherSubjects[0]?.id || subjects[0]?.id || '');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formLesson, setFormLesson] = useState<string>('');
  const [formHomework, setFormHomework] = useState<string>('');
  const [formDueDate, setFormDueDate] = useState<string>(
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formAttachment, setFormAttachment] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered Entries
  const filteredEntries = cahierDeTextes.filter(entry => {
    const matchClass = selectedClassFilter === 'all' || entry.classId === selectedClassFilter;
    const matchSearch = !searchQuery.trim() || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.lessonContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.homeworkText && entry.homeworkText.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchClass && matchSearch;
  });

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim() || !formLesson.trim()) {
      setFormError('Veuillez renseigner au moins le titre et le contenu du cours.');
      return;
    }

    const targetClass = classes.find(c => c.id === formClassId);
    const targetSubject = subjects.find(s => s.id === formSubjectId);

    addCahierEntry({
      classId: formClassId,
      subjectId: formSubjectId,
      teacherId: currentUser?.id || 'usr-prof',
      teacherName: currentUser?.name || 'Professeur',
      title: formTitle.trim(),
      lessonContent: formLesson.trim(),
      homeworkText: formHomework.trim() || undefined,
      dueDate: formHomework.trim() ? formDueDate : undefined,
      date: new Date().toISOString().split('T')[0],
      attachments: formAttachment.trim() ? [formAttachment.trim()] : undefined
    });

    addNotification(
      'Cahier de Textes Publié',
      `Séance "${formTitle.trim()}" enregistrée pour la classe ${targetClass?.name || ''} en ${targetSubject?.name || ''}. Visible par les élèves et les parents.`,
      'general',
      { showToast: true }
    );

    // Reset form
    setFormTitle('');
    setFormLesson('');
    setFormHomework('');
    setFormAttachment('');
    setIsNewEntryModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header Banner */}
      <div className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Espace Pédagogique & Devoirs</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
            Cahier de Textes & Bloc-notes de Classe
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Enregistrez les séances effectuées, publiez le travail à faire et transmettez les documents aux élèves et aux parents.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            setFormError(null);
            setIsNewEntryModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Séance / Devoir</span>
        </motion.button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-between items-stretch sm:items-center">
        {/* Class Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedClassFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedClassFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Toutes mes classes ({cahierDeTextes.length})
          </button>
          {teacherClasses.map(c => {
            const count = cahierDeTextes.filter(e => e.classId === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedClassFilter(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedClassFilter === c.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une notion, devoir..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredEntries.map((entry) => {
          const cls = classes.find(c => c.id === entry.classId);
          const subj = subjects.find(s => s.id === entry.subjectId);

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-[11px]">
                    {cls?.name || 'Classe'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium text-[11px]">
                    {subj?.name || 'Matière'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>Séance du {entry.date}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-[11px] text-slate-500">
                    Par {entry.teacherName || 'Professeur'}
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm('Supprimer cette entrée du cahier de textes ?')) {
                        deleteCahierEntry(entry.id);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Supprimer la séance"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Lesson Content */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {entry.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  {entry.lessonContent}
                </p>
              </div>

              {/* Homework block (if any) */}
              {entry.homeworkText && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                        Travail à Faire / Devoir Maison
                      </span>
                      <p className="text-xs text-amber-100 font-medium mt-0.5">
                        {entry.homeworkText}
                      </p>
                    </div>
                  </div>
                  {entry.dueDate && (
                    <div className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold self-start sm:self-center border border-amber-500/30">
                      Pour le {entry.dueDate}
                    </div>
                  )}
                </div>
              )}

              {/* Attachments (if any) */}
              {entry.attachments && entry.attachments.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {entry.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-cyan-400"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{att}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">Aucune séance trouvée</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Utilisez le bouton ci-dessus pour rédiger une nouvelle séance ou publier un devoir pour vos élèves.
            </p>
          </div>
        )}
      </div>

      {/* Modal: New Entry */}
      <AnimatePresence>
        {isNewEntryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Nouvelle Séance de Cours / Devoir</h3>
                    <p className="text-[10px] text-slate-400">Publication immédiate dans l'espace élèves et parents</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewEntryModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateEntry} className="space-y-3.5">
                {/* Class & Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Classe concernée *
                    </label>
                    <select
                      value={formClassId}
                      onChange={(e) => setFormClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {teacherClasses.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Matière *
                    </label>
                    <select
                      value={formSubjectId}
                      onChange={(e) => setFormSubjectId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {teacherSubjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Titre du Cours / Séance *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Théorème des Valeurs Intermédiaires (TVI)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Lesson Content */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Contenu de la Séance & Notions Abordées *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formLesson}
                    onChange={(e) => setFormLesson(e.target.value)}
                    placeholder="Notions enseignées, théorèmes, résumé du cours..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Homework */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Travail à Faire pour les élèves (Optionnel)</span>
                  </div>

                  <textarea
                    rows={2}
                    value={formHomework}
                    onChange={(e) => setFormHomework(e.target.value)}
                    placeholder="Exercices à préparer, lecture, devoir surveillé..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />

                  {formHomework.trim() && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Date d'Échéance / Remise :
                      </label>
                      <input
                        type="date"
                        value={formDueDate}
                        onChange={(e) => setFormDueDate(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Attachment */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Pièce Jointe / Support de Cours (Nom du document PDF)
                  </label>
                  <input
                    type="text"
                    value={formAttachment}
                    onChange={(e) => setFormAttachment(e.target.value)}
                    placeholder="Ex: Fiche_TD_Suites_Numeriques.pdf"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsNewEntryModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950/40 transition-all cursor-pointer"
                  >
                    Publier au Cahier de Textes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

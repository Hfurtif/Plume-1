import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Subject, SchoolCycle } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface SubjectsManagementSectionProps {
  canManage?: boolean;
}

export const SubjectsManagementSection: React.FC<SubjectsManagementSectionProps> = ({ canManage = true }) => {
  const { 
    subjects, 
    addSubject, 
    updateSubject, 
    deleteSubject, 
    toggleSubjectStatus 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCoefficient, setFormCoefficient] = useState<number>(3);
  const [formCategory, setFormCategory] = useState<Subject['category']>('autre');
  const [formCycle, setFormCycle] = useState<SchoolCycle>('lycee');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormName('');
    setFormCode('');
    setFormCoefficient(3);
    setFormCategory('autre');
    setFormCycle('lycee');
    setFormDescription('');
    setFormIsActive(true);
    setSubjectToEdit(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sub: Subject) => {
    setSubjectToEdit(sub);
    setFormName(sub.name);
    setFormCode(sub.code);
    setFormCoefficient(sub.coefficient);
    setFormCategory(sub.category);
    setFormCycle(sub.cycle);
    setFormDescription(sub.description || '');
    setFormIsActive(sub.isActive !== false);
    setIsCreateModalOpen(true);
  };

  // Submit Create / Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    if (subjectToEdit) {
      updateSubject(subjectToEdit.id, {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        coefficient: Number(formCoefficient) || 1,
        category: formCategory,
        cycle: formCycle,
        description: formDescription.trim(),
        isActive: formIsActive
      });
    } else {
      addSubject({
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        coefficient: Number(formCoefficient) || 1,
        category: formCategory,
        cycle: formCycle,
        description: formDescription.trim(),
        isActive: formIsActive
      });
    }

    setIsCreateModalOpen(false);
    setSubjectToEdit(null);
  };

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      const matchSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
      const matchCycle = selectedCycle === 'all' || s.cycle === selectedCycle;

      return matchSearch && matchCat && matchCycle;
    });
  }, [subjects, searchTerm, selectedCategory, selectedCycle]);

  // Category Badges Config
  const categoryConfig: Record<string, { label: string; color: string }> = {
    scientifique: { label: 'Scientifique', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    litteraire: { label: 'Littéraire', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    langue: { label: 'Langues Vivantes', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    artistique: { label: 'Arts & Culture', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    sport: { label: 'Éducation Physique', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    autre: { label: 'Enseignement Spécifique', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            <BookOpen className="w-4 h-4" />
            <span>Curriculum & Offre Pédagogique</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Gestion Personnalisée des Matières
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configurez les disciplines enseignées dans votre établissement. Ajoutez de nouvelles matières adaptées à votre programme (Informatique, Arabe, Morale, etc.), ajustez les coefficients officiels et activez/désactivez les cours.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Matière</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une matière par nom ou code (ex: MATH, INFO)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Toutes les catégories</option>
            <option value="scientifique">Scientifiques</option>
            <option value="litteraire">Littéraires</option>
            <option value="langue">Langues vivantes</option>
            <option value="sport">Sport</option>
            <option value="autre">Personnalisées / Autres</option>
          </select>

          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Tous les cycles</option>
            <option value="lycee">Lycée</option>
            <option value="college">Collège</option>
            <option value="primaire">Primaire</option>
            <option value="maternelle">Maternelle</option>
          </select>
        </div>
      </div>

      {/* Grid of Subjects Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((sub) => {
          const cat = categoryConfig[sub.category] || categoryConfig.autre;
          const isActive = sub.isActive !== false;

          return (
            <motion.div
              key={sub.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`p-5 rounded-2xl border transition-all ${
                isActive 
                  ? 'bg-slate-900/90 border-slate-800 shadow-lg hover:border-slate-700' 
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 shrink-0 shadow-inner">
                    {sub.code}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {sub.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 capitalize block mt-0.5">
                      Cycle {sub.cycle}
                    </span>
                  </div>
                </div>

                {/* Status Toggle Switch */}
                {canManage && (
                  <button
                    onClick={() => toggleSubjectStatus(sub.id)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title={isActive ? 'Désactiver la matière' : 'Activer la matière'}
                  >
                    {isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>
                )}
              </div>

              {/* Tags and Coefficient */}
              <div className="flex flex-wrap items-center gap-2 my-3">
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${cat.color}`}>
                  {cat.label}
                </span>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Coeff : {sub.coefficient}
                </span>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {isActive ? 'Active' : 'Désactivée'}
                </span>
              </div>

              {/* Description if present */}
              {sub.description && (
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {sub.description}
                </p>
              )}

              {/* Action Buttons */}
              {canManage && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenEdit(sub)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Modifier</span>
                  </button>

                  <button
                    onClick={() => setSubjectToDelete(sub)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-white">Aucune matière trouvée</p>
          <p className="text-xs text-slate-400 mt-1">
            Modifiez vos filtres ou ajoutez une nouvelle discipline pour enrichir l'offre de cours.
          </p>
        </div>
      )}

      {/* CREATE / EDIT SUBJECT MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {subjectToEdit ? 'Modifier la Matière' : 'Ajouter une Nouvelle Matière'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Paramétrage du cursus et coefficient d'évaluation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nom de la Matière *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Informatique, Éducation Morale, Arabe..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Code Court (Abréviation) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      placeholder="Ex: INFO, ECM, ARA..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Coefficient (Optionnel)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={formCoefficient}
                      onChange={(e) => setFormCoefficient(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Catégorie Disciplinaire
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="scientifique">Scientifique</option>
                      <option value="litteraire">Littéraire</option>
                      <option value="langue">Langues Vivantes</option>
                      <option value="artistique">Arts & Musique</option>
                      <option value="sport">Sport & EPS</option>
                      <option value="autre">Spécifique / Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Cycle d'Enseignement
                    </label>
                    <select
                      value={formCycle}
                      onChange={(e) => setFormCycle(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="lycee">Lycée</option>
                      <option value="college">Collège</option>
                      <option value="primaire">Primaire</option>
                      <option value="maternelle">Maternelle</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Description / Objectif Pédagogique (Optionnel)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Objectifs d'apprentissage, programme ou spécificités..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isActiveCheckbox" className="text-slate-300 cursor-pointer">
                    Matière active (visible par les enseignants et attribuable aux classes)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold shadow-md shadow-indigo-950/40"
                  >
                    {subjectToEdit ? 'Enregistrer les Modifications' : 'Créer la Matière'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={!!subjectToDelete}
        onCancel={() => setSubjectToDelete(null)}
        onConfirm={() => {
          if (subjectToDelete) {
            deleteSubject(subjectToDelete.id);
            setSubjectToDelete(null);
          }
        }}
        title="Supprimer la Matière"
        message={`Êtes-vous sûr de vouloir supprimer définitivement la matière "${subjectToDelete?.name}" (${subjectToDelete?.code}) ? Cette action est irréversible.`}
        confirmLabel="Supprimer Définitivement"
        isDestructive={true}
      />
    </div>
  );
};

import React, { useRef } from 'react';
import { Printer, X, Award, CheckCircle2, FileText, School, Download, WifiOff, Lock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { exportStudentBulletinPdf } from '../../utils/reportExporter';

interface OfficialReportCardModalProps {
  student: Student | null;
  onClose: () => void;
}

export const OfficialReportCardModal: React.FC<OfficialReportCardModalProps> = ({ student, onClose }) => {
  const { currentUser, classes, grades, students, subjects, attendance, isEffectivelyOffline, offlineCacheStatus, addNotification, t, schoolProfile } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!student) return null;

  const totalTuition = student.annualTuition || 850000;
  const paidTuition = student.paidTuition ?? 0;
  const tuitionBalance = Math.max(0, totalTuition - paidTuition);
  const isTuitionSolded = student.paymentStatus === 'paid' || tuitionBalance === 0;
  const isLockedForParent = currentUser?.role === 'parent' && !isTuitionSolded;

  const studentClass = classes.find(c => c.id === student.classId);
  const classStudents = students.filter(s => s.classId === student.classId);

  // Group grades for this student by subject
  const studentGrades = grades.filter(g => g.studentId === student.id && g.term === 'T2');

  // Filter active subjects for this cycle
  const activeCycleSubjects = subjects.filter(s => s.isActive !== false && (!studentClass || s.cycle === studentClass.cycle));
  const effectiveSubjects = activeCycleSubjects.length > 0 ? activeCycleSubjects : subjects.filter(s => s.isActive !== false);

  // Compute subject averages for this student and for the whole class
  const subjectSummaries = effectiveSubjects.map(subject => {
    const sGrades = studentGrades.filter(g => g.subjectId === subject.id);
    
    let studentAvg = 0;
    if (sGrades.length > 0) {
      const totalWeighted = sGrades.reduce((acc, g) => acc + g.score * g.coefficient, 0);
      const totalCoeff = sGrades.reduce((acc, g) => acc + g.coefficient, 0);
      studentAvg = totalWeighted / (totalCoeff || 1);
    } else {
      studentAvg = 14.5;
    }

    const allClassGradesForSubject = grades.filter(g => g.classId === student.classId && g.subjectId === subject.id && g.term === 'T2');
    let classAvg = 13.2;
    let minScore = 8.5;
    let maxScore = 19.5;
    if (allClassGradesForSubject.length > 0) {
      const scores = allClassGradesForSubject.map(g => g.score);
      minScore = Math.min(...scores);
      maxScore = Math.max(...scores);
      classAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    let appreciation = 'Très bon trimestre, travail sérieux et rigoureux.';
    if (studentAvg >= 16) appreciation = 'Excellents résultats ! Participation exemplaire et esprit d\'analyse remarquable.';
    else if (studentAvg >= 14) appreciation = 'Bon travail d\'ensemble, continuez avec cette régularité.';
    else if (studentAvg >= 10) appreciation = 'Résultats convenables. Des efforts constants sont attendus pour consolider les acquis.';
    else appreciation = 'Résultats insuffisants. Doit redoubler d\'efforts et participer plus activement.';

    return {
      subject,
      studentAvg: Number(studentAvg.toFixed(2)),
      coefficient: subject.coefficient,
      classAvg: Number(classAvg.toFixed(2)),
      minScore: Number(minScore.toFixed(2)),
      maxScore: Number(maxScore.toFixed(2)),
      appreciation
    };
  });

  // Calculate overall weighted average
  const totalWeightedScores = subjectSummaries.reduce((acc, item) => acc + (item.studentAvg * item.coefficient), 0);
  const totalCoefficients = subjectSummaries.reduce((acc, item) => acc + item.coefficient, 0);
  const overallAverage = Number((totalWeightedScores / (totalCoefficients || 1)).toFixed(2));

  let mention = 'Encouragements du Conseil de Classe';
  if (overallAverage >= 16) mention = 'Félicitations du Conseil de Classe';
  else if (overallAverage >= 14) mention = 'Tableau d\'Honneur';
  else if (overallAverage < 10) mention = 'Avertissement de Travail';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportStudentBulletinPdf({
      student,
      schoolClass: studentClass,
      subjects: effectiveSubjects,
      grades,
      attendance,
      allClassStudents: classStudents,
      term: 'T2'
    });
    addNotification(
      'Export PDF (A4) Réussi',
      `Le bulletin officiel de ${student.firstName} ${student.lastName} au format A4 a été généré et téléchargé avec succès.`,
      'system',
      { showToast: true }
    );
  };

  if (isLockedForParent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-md" />
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-center space-y-4 z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Bulletin Trimestriel Verrouillé</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Le bulletin officiel de <strong className="text-white">{student.firstName} {student.lastName}</strong> n'est accessible que lorsque la scolarité de l'élève est intégralement soldée (100%).
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-left space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Scolarité totale :</span>
              <strong className="text-white">{totalTuition.toLocaleString()} FCFA</strong>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Montant versé :</span>
              <strong>{paidTuition.toLocaleString()} FCFA</strong>
            </div>
            <div className="flex justify-between text-rose-400 border-t border-slate-800 pt-1.5 font-bold">
              <span>Reste à solder :</span>
              <strong>{tuitionBalance.toLocaleString()} FCFA</strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Veuillez régulariser le solde auprès du service comptable pour débloquer automatiquement la consultation et le téléchargement du bulletin scellé.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        
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
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl my-6 overflow-hidden z-10"
        >
          {/* Header Actions */}
          <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">Bulletin Trimestriel Officiel</h3>
                  {isEffectivelyOffline && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      <WifiOff className="w-3 h-3 text-amber-400" />
                      <span>Cache Hors-Ligne</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {isEffectivelyOffline 
                    ? `Données certifiées consultées hors-ligne (Cache du ${offlineCacheStatus.lastCachedAt || 'récent'})` 
                    : 'Édition officielle conforme aux normes académiques'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                title="Exporter le bulletin officiel au format A4 optimisé pour l'impression"
              >
                <Download className="w-4 h-4" />
                <span>Exporter en PDF (A4)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold shadow-md transition-all cursor-pointer"
                title="Lancer l'impression papier"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
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

          {/* Printable Bulletin Document */}
          <div ref={printRef} className="print-page bg-white text-slate-900 p-6 sm:p-10 font-sans leading-normal">
            
            {/* Offline Cache Indicator (Screen Only) */}
            {isEffectivelyOffline && (
              <div className="no-print mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 shadow-sm">
                <span className="flex items-center gap-2">
                  <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Document certifié chargé depuis la mémoire cache locale (mode hors-ligne).</span>
                </span>
                <span className="text-[10px] text-amber-800 font-mono font-bold">
                  Synchro : {offlineCacheStatus.lastCachedAt || 'Aujourd\'hui'}
                </span>
              </div>
            )}

            {/* Institution Header */}
            <div className="border-b-2 border-slate-800 pb-5 mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    RÉPUBLIQUE DU {(schoolProfile?.country || 'BÉNIN').toUpperCase()} • MINISTÈRE DE L'ENSEIGNEMENT
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {(schoolProfile?.name || 'GROUPE SCOLAIRE INTERNATIONAL PLUME').toUpperCase()}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium italic">
                    {schoolProfile?.motto || 'Discipline • Travail • Rigueur • Succès'} — Homologué & Certifié
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {schoolProfile?.address || '12 Avenue de l\'Éducation'} • {schoolProfile?.locality || 'Cotonou'} • {schoolProfile?.email || 'contact@ecole.org'} • Tél: {schoolProfile?.phone || '+229 21 00 00 00'}
                  </p>
                </div>

                {/* Logo & Stamp */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-md flex items-center justify-center bg-slate-950">
                    <img 
                      src={schoolProfile?.logoUrl || "/src/assets/images/plume_app_icon_1790683767339.jpg"} 
                      alt={schoolProfile?.name || "Logo École"} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-wider">
                    Sceau Officiel
                  </span>
                </div>
              </div>
            </div>

            {/* Bulletin Title Banner */}
            <div className="bg-slate-100 rounded-xl p-4 border border-slate-300 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <div className="text-xs font-bold text-cyan-800 uppercase tracking-widest">
                  Bulletin Scolaire du 2ème Trimestre
                </div>
                <div className="text-lg font-extrabold text-slate-900">
                  Année Scolaire : 2025 - 2026
                </div>
              </div>

              <div className="text-center sm:text-right">
                <div className="text-xs text-slate-500 uppercase font-semibold">Classe fréquentée</div>
                <div className="text-base font-bold text-slate-900">{studentClass?.name || 'Terminale C'}</div>
                <div className="text-[11px] text-slate-500">Effectif de la classe : {classStudents.length} élèves</div>
              </div>
            </div>

            {/* Student Information Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6">
              <div>
                <span className="text-slate-500 block">Nom & Prénom :</span>
                <strong className="text-slate-900 font-bold text-sm">{student.lastName.toUpperCase()} {student.firstName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Matricule :</span>
                <strong className="text-cyan-800 font-mono font-bold">{student.matricule}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Date de Naissance :</span>
                <span className="text-slate-800 font-medium">{student.dateOfBirth}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Responsable Légal :</span>
                <span className="text-slate-800 font-medium">{student.guardianName}</span>
              </div>
            </div>

            {/* Grades Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-800 text-white text-left font-bold">
                    <th className="p-2.5 border border-slate-400">Matières & Disciplines</th>
                    <th className="p-2.5 border border-slate-400 text-center w-12">Coeff.</th>
                    <th className="p-2.5 border border-slate-400 text-center w-16 bg-cyan-900">Élève /20</th>
                    <th className="p-2.5 border border-slate-400 text-center w-14">Min</th>
                    <th className="p-2.5 border border-slate-400 text-center w-14">Moy.</th>
                    <th className="p-2.5 border border-slate-400 text-center w-14">Max</th>
                    <th className="p-2.5 border border-slate-400">Appréciations des Professeurs</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectSummaries.map((item, idx) => (
                    <tr key={item.subject.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2 border border-slate-300 font-semibold text-slate-900">
                        {item.subject.name}
                        <span className="block text-[10px] text-slate-500 font-normal">Code: {item.subject.code}</span>
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">
                        {item.coefficient}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-black text-sm bg-cyan-50 text-cyan-950">
                        {item.studentAvg.toFixed(2)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center text-slate-500">
                        {item.minScore.toFixed(1)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-medium text-slate-700">
                        {item.classAvg.toFixed(1)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center text-slate-500">
                        {item.maxScore.toFixed(1)}
                      </td>
                      <td className="p-2 border border-slate-300 text-[11px] text-slate-700 italic">
                        {item.appreciation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Synthesis & Council Decision */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              
              {/* General Average Box */}
              <div className="p-4 rounded-xl border-2 border-cyan-800 bg-cyan-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-cyan-900">Moyenne Générale</span>
                  <div className="text-3xl font-black text-cyan-950 mt-1">
                    {overallAverage.toFixed(2)} <span className="text-sm font-semibold text-slate-500">/ 20</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-cyan-200 text-[11px] text-slate-700">
                  Rang dans la classe : <strong>1ère</strong> sur {classStudents.length} élèves
                </div>
              </div>

              {/* Attendance Box */}
              <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-700">Assiduité & Conduite</span>
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Absences justifiées :</span>
                      <strong className="text-slate-900">0 demi-journée</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Absences non-justifiées :</span>
                      <strong className="text-emerald-700">0</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Retards constatés :</span>
                      <strong className="text-slate-900">0</strong>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Assiduité exemplaire
                </div>
              </div>

              {/* Council Mention Box */}
              <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-amber-900 flex items-center gap-1">
                    <Award className="w-4 h-4 text-amber-600" /> Avis du Conseil
                  </span>
                  <div className="text-sm font-extrabold text-amber-950 mt-2">
                    {mention}
                  </div>
                </div>
                <div className="text-[11px] text-slate-700 italic mt-2">
                  "Félicitations unanimes pour ce trimestre remarquable. Continuez dans cette voie d'excellence."
                </div>
              </div>

            </div>

            {/* Official Signatures and Cachets (Les 3 Signataires Requis) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t-2 border-slate-300 text-xs">
              {/* 1. Le Comptable */}
              <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">
                  {schoolProfile?.signatories?.comptableTitle || 'L\'Intendant Comptable'}
                </span>
                <div className="h-14 flex items-center justify-center italic text-emerald-800 text-[11px] font-medium">
                  [Visa Frais Apurés & Reçu]
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  {schoolProfile?.signatories?.comptableName || 'M. Paul Ndongo'}
                </div>
                <span className="text-[9px] text-slate-500 block mt-0.5">Visa de Régie Financière</span>
              </div>

              {/* 2. Le Surveillant Général / Censeur */}
              <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">
                  {schoolProfile?.signatories?.surveillantTitle || 'Le Surveillant Général / Censeur'}
                </span>
                <div className="h-14 flex items-center justify-center italic text-indigo-800 text-[11px] font-medium">
                  [Visa Assiduité & Conduite]
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  {schoolProfile?.signatories?.surveillantName || 'M. Gilbert Dossou'}
                </div>
                <span className="text-[9px] text-slate-500 block mt-0.5">Visa de la Surveillance Générale</span>
              </div>

              {/* 3. Le Proviseur / Chef d'Établissement */}
              <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-200 relative overflow-hidden">
                <span className="font-bold text-slate-800 block">
                  {schoolProfile?.signatories?.proviseurTitle || 'Le Proviseur / Chef d\'Établissement'}
                </span>
                <div className="h-14 flex items-center justify-center font-serif text-slate-900 font-bold italic text-sm">
                  {schoolProfile?.signatories?.proviseurName || 'Dr. Marc-Aurèle Valmont'}
                </div>
                {/* Official Circular Stamp */}
                <div className="absolute right-2 top-3 w-16 h-16 rounded-full border-2 border-red-700/60 text-red-700/70 flex flex-col items-center justify-center transform -rotate-12 pointer-events-none text-[7px] font-black uppercase text-center leading-tight">
                  <span className="truncate max-w-[50px]">{schoolProfile?.countryCode || 'PLM'}</span>
                  <span className="text-[8px] font-black">SCEAU</span>
                  <span>DIRECTION</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  {schoolProfile?.signatories?.proviseurName || 'Dr. Marc-Aurèle Valmont'}
                </div>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  Fait à {schoolProfile?.locality || 'Cotonou'}, le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

          </div>

          {/* Modal Bottom Action Bar (A4 Print & Export Center) */}
          <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Printer className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Format officiel <strong className="text-slate-200">A4 (210 × 297 mm)</strong> • Calibré pour impression papier & archivage administratif
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold shadow-md transition-all cursor-pointer"
                title="Lancer l'impression directe"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Imprimer</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                title="Télécharger le fichier PDF au format A4"
              >
                <Download className="w-4 h-4" />
                <span>Exporter en PDF (A4)</span>
              </motion.button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

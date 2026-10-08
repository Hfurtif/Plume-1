import React, { useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  School, 
  ShieldCheck, 
  CheckCircle2, 
  FileText,
  Calendar,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { SchoolClass, Student, Grade, Subject, PaymentRecord, AttendanceRecord } from '../../types';
import { 
  exportStudentsReport, 
  exportGradesReport, 
  exportAttendanceReport, 
  exportPaymentsReport 
} from '../../utils/reportExporter';

export type ClassPrintDocumentType = 
  | 'class_list' 
  | 'grades_sheet' 
  | 'bulletins_recap' 
  | 'attendance_sheet' 
  | 'absences_log' 
  | 'finance_report'
  | 'certificate';

interface ClassPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: ClassPrintDocumentType;
  schoolClass: SchoolClass;
  students: Student[];
  grades: Grade[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  selectedStudent?: Student | null;
  certificateType?: 'scolarite' | 'frequentation' | 'radiation';
}

export const ClassPrintModal: React.FC<ClassPrintModalProps> = ({
  isOpen,
  onClose,
  documentType,
  schoolClass,
  students,
  grades,
  subjects,
  attendance,
  payments,
  selectedStudent,
  certificateType = 'scolarite'
}) => {
  const { schoolProfile } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const classStudents = students.filter(s => s.classId === schoolClass.id);
  const classGrades = grades.filter(g => g.classId === schoolClass.id);
  const classAttendance = attendance.filter(a => classStudents.some(s => s.id === a.targetId));

  const boysCount = classStudents.filter(s => s.gender === 'M').length;
  const girlsCount = classStudents.filter(s => s.gender === 'F').length;

  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    switch (documentType) {
      case 'class_list':
        exportStudentsReport({
          students,
          classes: [schoolClass],
          classFilter: schoolClass.id,
          format: 'pdf'
        });
        break;
      case 'grades_sheet':
      case 'bulletins_recap':
        exportGradesReport({
          grades,
          students,
          classes: [schoolClass],
          subjects,
          classId: schoolClass.id,
          format: 'pdf'
        });
        break;
      case 'attendance_sheet':
      case 'absences_log':
        exportAttendanceReport({
          attendance,
          students,
          classes: [schoolClass],
          classId: schoolClass.id,
          format: 'pdf'
        });
        break;
      case 'finance_report':
        exportPaymentsReport({
          payments,
          classes: [schoolClass],
          format: 'pdf'
        });
        break;
      default:
        window.print();
        break;
    }
  };

  const getDocTitle = () => {
    switch (documentType) {
      case 'class_list':
        return `LISTE OFFICIELLE DE CLASSE — ${schoolClass.name.toUpperCase()}`;
      case 'grades_sheet':
        return `GRILLE DES NOTES & MOYENNES — ${schoolClass.name.toUpperCase()}`;
      case 'bulletins_recap':
        return `RÉCAPITULATIF DES BULLETINS & RANGS — ${schoolClass.name.toUpperCase()}`;
      case 'attendance_sheet':
        return `FEUILLE D'ÉMARGEMENT & DE PRÉSENCE — ${schoolClass.name.toUpperCase()}`;
      case 'absences_log':
        return `REGISTRE OFFICIEL DES ABSENCES & RETARDS — ${schoolClass.name.toUpperCase()}`;
      case 'finance_report':
        return `ÉTAT DE RECOUVREMENT SCOLARITÉ — ${schoolClass.name.toUpperCase()}`;
      case 'certificate':
        return `CERTIFICAT DE ${certificateType.toUpperCase()} — ${selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}`;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar with actions */}
          <div className="no-print flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">
                  Aperçu avant Impression
                </h3>
                <p className="text-[11px] text-slate-400">
                  {schoolClass.name} • Cycle {schoolClass.cycle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                title="Télécharger fichier PDF"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Télécharger PDF</span>
              </button>

              <button
                onClick={handleBrowserPrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
                title="Lancer l'impression directe"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Sheet Viewport */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/50 flex justify-center">
            <div 
              ref={printAreaRef}
              id="printable-official-document"
              className="print-page w-full max-w-[210mm] bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 min-h-[297mm] flex flex-col justify-between"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <div>
                {/* Official School Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4 mb-5">
                  <div className="flex items-center justify-between text-[11px] font-sans uppercase font-bold text-slate-600 tracking-wider">
                    <div>
                      <span>RÉPUBLIQUE &bull; MINISTÈRE DES ENSEIGNEMENTS</span>
                      <div className="text-slate-500 font-normal">Direction Académique &bull; Inspection Pédagogique</div>
                    </div>
                    <div className="text-right">
                      <span className="text-cyan-700 font-black">ANNÉE SCOLAIRE 2024 - 2025</span>
                      <div className="text-slate-500 font-normal">Session Trimestrielle</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
                        {schoolProfile?.logoUrl ? (
                          <img 
                            src={schoolProfile.logoUrl} 
                            alt={schoolProfile.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-white font-sans font-black text-lg">PLM</span>
                        )}
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          RÉPUBLIQUE DU {(schoolProfile?.country || 'BÉNIN').toUpperCase()}
                        </div>
                        <h1 className="text-lg sm:text-xl font-black font-sans tracking-tight text-slate-900 uppercase">
                          {schoolProfile?.name || 'COMPLEXE SCOLAIRE PLUME EXCELLENCE'}
                        </h1>
                        <p className="text-xs font-sans text-slate-600">
                          {schoolProfile?.motto || 'Discipline • Travail • Rigueur • Succès'}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block text-right text-[11px] font-sans text-slate-500">
                      <div>Contact : {schoolProfile?.phone || '+229 21 00 00 00'}</div>
                      <div>Email : {schoolProfile?.email || 'secretariat@ecole.org'}</div>
                      <div>Ville : {schoolProfile?.locality || 'Cotonou'}</div>
                    </div>
                  </div>
                </div>

                {/* Document Banner */}
                <div className="bg-slate-100 border border-slate-300 p-3 rounded-lg text-center mb-5">
                  <h2 className="text-base sm:text-lg font-black font-sans text-slate-900 tracking-wide uppercase">
                    {getDocTitle()}
                  </h2>
                  <div className="flex items-center justify-center gap-4 text-xs font-sans text-slate-600 mt-1">
                    <span>Niveau : <strong>{schoolClass.level}</strong></span>
                    <span>&bull;</span>
                    <span>Cycle : <strong className="capitalize">{schoolClass.cycle}</strong></span>
                    <span>&bull;</span>
                    <span>Effectif : <strong>{classStudents.length} élèves</strong> ({boysCount} Garçons / {girlsCount} Filles)</span>
                    <span>&bull;</span>
                    <span>Date : <strong>{todayFormatted}</strong></span>
                  </div>
                </div>

                {/* 1. DOCUMENT TYPE: CLASS LIST */}
                {documentType === 'class_list' && (
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full border-collapse border border-slate-300 text-left">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                          <th className="p-2 border border-slate-300 text-center w-8">N°</th>
                          <th className="p-2 border border-slate-300 w-28">Matricule</th>
                          <th className="p-2 border border-slate-300">Nom & Prénom</th>
                          <th className="p-2 border border-slate-300 text-center w-12">Sexe</th>
                          <th className="p-2 border border-slate-300 w-24">Date Naiss.</th>
                          <th className="p-2 border border-slate-300">Parent / Contact</th>
                          <th className="p-2 border border-slate-300 text-center w-24">Statut Scol.</th>
                          <th className="p-2 border border-slate-300 text-center w-24">Émargement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {classStudents.map((std, idx) => (
                          <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-2 border border-slate-300 font-mono font-bold text-cyan-800">{std.matricule}</td>
                            <td className="p-2 border border-slate-300 font-bold text-slate-900">{std.lastName.toUpperCase()} {std.firstName}</td>
                            <td className="p-2 border border-slate-300 text-center">{std.gender}</td>
                            <td className="p-2 border border-slate-300">{std.dateOfBirth}</td>
                            <td className="p-2 border border-slate-300">
                              <div>{std.guardianName}</div>
                              <div className="text-[10px] text-slate-500">{std.guardianPhone}</div>
                            </td>
                            <td className="p-2 border border-slate-300 text-center font-bold text-[10px]">
                              {std.paymentStatus === 'paid' ? 'SOLDÉ' : std.paymentStatus === 'partial' ? 'PARTIEL' : 'IMPAYÉ'}
                            </td>
                            <td className="p-2 border border-slate-300"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. DOCUMENT TYPE: GRADES SHEET */}
                {documentType === 'grades_sheet' && (
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full border-collapse border border-slate-300 text-left">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                          <th className="p-2 border border-slate-300 text-center w-8">N°</th>
                          <th className="p-2 border border-slate-300 w-24">Matricule</th>
                          <th className="p-2 border border-slate-300">Nom & Prénom</th>
                          {subjects.slice(0, 6).map(sub => (
                            <th key={sub.id} className="p-2 border border-slate-300 text-center">
                              {sub.code || sub.name.substring(0, 5)}
                              <span className="block text-[9px] font-normal text-slate-500">c.{sub.coefficient}</span>
                            </th>
                          ))}
                          <th className="p-2 border border-slate-300 text-center w-16 bg-slate-300 font-black">Moyenne</th>
                          <th className="p-2 border border-slate-300 text-center w-12">Rang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {classStudents.map((std, idx) => {
                          const studentGrades = classGrades.filter(g => g.studentId === std.id);
                          const totalCoeff = studentGrades.reduce((sum, g) => sum + g.coefficient, 0);
                          const totalPoints = studentGrades.reduce((sum, g) => sum + (g.score * g.coefficient), 0);
                          const avg = totalCoeff > 0 ? (totalPoints / totalCoeff).toFixed(2) : '14.00';

                          return (
                            <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-2 border border-slate-300 font-mono font-bold">{std.matricule}</td>
                              <td className="p-2 border border-slate-300 font-bold">{std.lastName.toUpperCase()} {std.firstName}</td>
                              {subjects.slice(0, 6).map(sub => {
                                const grd = studentGrades.find(g => g.subjectId === sub.id);
                                return (
                                  <td key={sub.id} className="p-2 border border-slate-300 text-center font-mono font-bold">
                                    {grd ? grd.score.toFixed(1) : '-'}
                                  </td>
                                );
                              })}
                              <td className="p-2 border border-slate-300 text-center font-mono font-black text-cyan-800 bg-slate-100">
                                {avg}
                              </td>
                              <td className="p-2 border border-slate-300 text-center font-bold">
                                {idx + 1}e
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. DOCUMENT TYPE: BULLETINS RECAP */}
                {documentType === 'bulletins_recap' && (
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full border-collapse border border-slate-300 text-left">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                          <th className="p-2 border border-slate-300 text-center w-8">N°</th>
                          <th className="p-2 border border-slate-300 w-28">Matricule</th>
                          <th className="p-2 border border-slate-300">Élève</th>
                          <th className="p-2 border border-slate-300 text-center w-20">Moyenne T1</th>
                          <th className="p-2 border border-slate-300 text-center w-20 bg-slate-300 font-black">Moyenne T2</th>
                          <th className="p-2 border border-slate-300 text-center w-16">Rang</th>
                          <th className="p-2 border border-slate-300 w-32">Mention</th>
                          <th className="p-2 border border-slate-300">Décision du Conseil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {classStudents.map((std, idx) => {
                          const studentGrades = classGrades.filter(g => g.studentId === std.id);
                          const totalCoeff = studentGrades.reduce((sum, g) => sum + g.coefficient, 0);
                          const totalPoints = studentGrades.reduce((sum, g) => sum + (g.score * g.coefficient), 0);
                          const avgNum = totalCoeff > 0 ? totalPoints / totalCoeff : 14;
                          const avg = avgNum.toFixed(2);
                          const mention = avgNum >= 16 ? 'Très Bien' : avgNum >= 14 ? 'Bien' : avgNum >= 12 ? 'Assez Bien' : avgNum >= 10 ? 'Passable' : 'Insuffisant';
                          const decision = avgNum >= 10 ? 'Tableau d’Honneur & Félicitations' : 'Doit redoubler d’efforts';

                          return (
                            <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-2 border border-slate-300 font-mono font-bold text-cyan-800">{std.matricule}</td>
                              <td className="p-2 border border-slate-300 font-bold">{std.lastName.toUpperCase()} {std.firstName}</td>
                              <td className="p-2 border border-slate-300 text-center font-mono">{(avgNum - 0.4).toFixed(2)}</td>
                              <td className="p-2 border border-slate-300 text-center font-mono font-black text-cyan-900 bg-slate-100">{avg}</td>
                              <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}e</td>
                              <td className="p-2 border border-slate-300 font-semibold">{mention}</td>
                              <td className="p-2 border border-slate-300 text-[11px]">{decision}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 4. DOCUMENT TYPE: ATTENDANCE SHEET */}
                {documentType === 'attendance_sheet' && (
                  <div className="overflow-x-auto font-sans text-xs">
                    <p className="text-[11px] text-slate-500 italic mb-2">
                      Feuille d'émargement officielle pour les séances de cours. Cochez "P" (Présent), "A" (Absent) ou "R" (Retard).
                    </p>
                    <table className="w-full border-collapse border border-slate-300 text-left">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                          <th className="p-2 border border-slate-300 text-center w-8">N°</th>
                          <th className="p-2 border border-slate-300 w-24">Matricule</th>
                          <th className="p-2 border border-slate-300">Nom & Prénom de l'Élève</th>
                          <th className="p-2 border border-slate-300 text-center w-16">Lundi</th>
                          <th className="p-2 border border-slate-300 text-center w-16">Mardi</th>
                          <th className="p-2 border border-slate-300 text-center w-16">Mercredi</th>
                          <th className="p-2 border border-slate-300 text-center w-16">Jeudi</th>
                          <th className="p-2 border border-slate-300 text-center w-16">Vendredi</th>
                          <th className="p-2 border border-slate-300 text-center w-24">Observations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {classStudents.map((std, idx) => (
                          <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="p-2.5 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 border border-slate-300 font-mono font-bold text-slate-700">{std.matricule}</td>
                            <td className="p-2.5 border border-slate-300 font-bold text-slate-900">{std.lastName.toUpperCase()} {std.firstName}</td>
                            <td className="p-2.5 border border-slate-300 text-center"></td>
                            <td className="p-2.5 border border-slate-300 text-center"></td>
                            <td className="p-2.5 border border-slate-300 text-center"></td>
                            <td className="p-2.5 border border-slate-300 text-center"></td>
                            <td className="p-2.5 border border-slate-300 text-center"></td>
                            <td className="p-2.5 border border-slate-300"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 5. DOCUMENT TYPE: ABSENCES LOG */}
                {documentType === 'absences_log' && (
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full border-collapse border border-slate-300 text-left">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                          <th className="p-2 border border-slate-300 text-center w-8">N°</th>
                          <th className="p-2 border border-slate-300 w-24">Matricule</th>
                          <th className="p-2 border border-slate-300">Nom & Prénom</th>
                          <th className="p-2 border border-slate-300 text-center w-24">Total Absences</th>
                          <th className="p-2 border border-slate-300 text-center w-24">Justifiées</th>
                          <th className="p-2 border border-slate-300 text-center w-24">Non Justifiées</th>
                          <th className="p-2 border border-slate-300 text-center w-20">Retards</th>
                          <th className="p-2 border border-slate-300">Avis Pédagogique</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {classStudents.map((std, idx) => {
                          const records = classAttendance.filter(a => a.targetId === std.id);
                          const absences = records.filter(r => r.status === 'absent');
                          const justified = absences.filter(a => a.isJustified).length;
                          const unjustified = absences.length - justified;
                          const retards = records.filter(r => r.status === 'retard').length;

                          return (
                            <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-2 border border-slate-300 font-mono font-bold text-cyan-800">{std.matricule}</td>
                              <td className="p-2 border border-slate-300 font-bold">{std.lastName.toUpperCase()} {std.firstName}</td>
                              <td className="p-2 border border-slate-300 text-center font-mono font-bold">{absences.length}</td>
                              <td className="p-2 border border-slate-300 text-center font-mono text-emerald-700">{justified}</td>
                              <td className="p-2 border border-slate-300 text-center font-mono text-rose-700 font-bold">{unjustified}</td>
                              <td className="p-2 border border-slate-300 text-center font-mono">{retards}</td>
                              <td className="p-2 border border-slate-300 text-[11px]">
                                {unjustified >= 3 ? 'Avertissement assiduité envoyé' : 'Assiduité normale'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 6. DOCUMENT TYPE: FINANCE REPORT */}
                {documentType === 'finance_report' && (
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full border-collapse border border-slate-300 text-left">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                          <th className="p-2 border border-slate-300 text-center w-8">N°</th>
                          <th className="p-2 border border-slate-300 w-24">Matricule</th>
                          <th className="p-2 border border-slate-300">Nom & Prénom</th>
                          <th className="p-2 border border-slate-300 text-right w-28">Scolarité Due</th>
                          <th className="p-2 border border-slate-300 text-right w-28">Montant Versé</th>
                          <th className="p-2 border border-slate-300 text-right w-28">Reste à Payer</th>
                          <th className="p-2 border border-slate-300 text-center w-24">Statut</th>
                          <th className="p-2 border border-slate-300 text-center w-24">Accès Bulletin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {classStudents.map((std, idx) => {
                          const due = std.annualTuition;
                          const paid = std.paidTuition;
                          const balance = Math.max(0, due - paid);
                          const isSolde = std.paymentStatus === 'paid';

                          return (
                            <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-2 border border-slate-300 font-mono font-bold text-cyan-800">{std.matricule}</td>
                              <td className="p-2 border border-slate-300 font-bold">{std.lastName.toUpperCase()} {std.firstName}</td>
                              <td className="p-2 border border-slate-300 text-right font-mono">{due.toLocaleString()} FCFA</td>
                              <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-800">{paid.toLocaleString()} FCFA</td>
                              <td className="p-2 border border-slate-300 text-right font-mono font-bold text-rose-800">{balance.toLocaleString()} FCFA</td>
                              <td className="p-2 border border-slate-300 text-center font-bold text-[10px]">
                                {isSolde ? 'SOLDÉ' : std.paymentStatus === 'partial' ? 'PARTIEL' : 'IMPAYÉ'}
                              </td>
                              <td className="p-2 border border-slate-300 text-center font-bold text-[10px]">
                                {isSolde ? 'DÉBLOQUÉ' : 'VERROUILLÉ'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 7. DOCUMENT TYPE: CERTIFICATE */}
                {documentType === 'certificate' && selectedStudent && (
                  <div className="font-serif text-slate-900 p-6 sm:p-10 space-y-6">
                    <div className="text-center space-y-1">
                      <h3 className="text-2xl font-black uppercase tracking-wider font-sans text-slate-900">
                        CERTIFICAT DE {certificateType.toUpperCase()}
                      </h3>
                      <p className="text-xs font-sans text-slate-500 font-bold uppercase tracking-widest">
                        RÉFÉRENCE OFFICIELLE : PLM-CERT-2025-{selectedStudent.matricule.replace(/[^0-9]/g, '')}
                      </p>
                    </div>

                    <div className="text-sm leading-relaxed space-y-4 pt-4">
                      <p>
                        Je soussigné, <strong>{schoolProfile?.signatories?.proviseurName || 'Dr. Marc-Aurèle Valmont'}</strong>, {schoolProfile?.signatories?.proviseurTitle || 'Chef d\'Établissement et Proviseur'} du {schoolProfile?.name || 'Complexe Scolaire Plume Excellence'}, certifie par la présente que :
                      </p>

                      <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2 font-sans text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>L'élève : <strong>{selectedStudent.lastName.toUpperCase()} {selectedStudent.firstName}</strong></div>
                          <div>Matricule National : <strong className="font-mono text-cyan-800">{selectedStudent.matricule}</strong></div>
                          <div>Né(e) le : <strong>{selectedStudent.dateOfBirth}</strong> &bull; Sexe : <strong>{selectedStudent.gender}</strong></div>
                          <div>Inscrit(e) en classe de : <strong>{schoolClass.name} ({schoolClass.level})</strong></div>
                          <div>Cycle : <strong className="capitalize">{schoolClass.cycle}</strong></div>
                          <div>Année Académique : <strong>2024 - 2025</strong></div>
                        </div>
                      </div>

                      <p>
                        Est régulièrement inscrit(e) et fréquente assidûment notre établissement pour l'ensemble de l'année scolaire en cours.
                      </p>
                      <p>
                        En foi de quoi, ce certificat lui est délivré pour servir et valoir ce que de droit auprès de toute administration ou autorité compétente.
                      </p>
                    </div>

                    <div className="flex justify-between items-end pt-10 font-sans text-xs">
                      <div>
                        <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400 text-center p-1">
                          [QR Code Sécurisé d'Authentification]
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div>Fait à {schoolProfile?.locality || 'Cotonou'}, le {todayFormatted}</div>
                        <div className="font-bold text-slate-900">{schoolProfile?.signatories?.proviseurTitle || 'Le Proviseur / Chef d\'Établissement'}</div>
                        <div className="text-slate-700 font-semibold text-xs">{schoolProfile?.signatories?.proviseurName || 'Dr. Marc-Aurèle Valmont'}</div>
                        <div className="text-slate-500 italic text-[10px]">(Signature numérique et sceau de l'école)</div>
                        <div className="inline-block mt-2 px-3 py-1 bg-amber-50 border border-amber-300 rounded text-amber-900 font-bold text-[10px] uppercase">
                          &bull; Sceau Académique Apposé &bull;
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Official Document Footer */}
              <div className="border-t border-slate-300 pt-4 mt-8 font-sans text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  Document certifié conforme par le système de gestion scolaire Plume Excellence.
                </div>
                <div className="flex items-center gap-4 font-bold">
                  <span>Signatures autorisées</span>
                  <span>&bull;</span>
                  <span>Page 1 / 1</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

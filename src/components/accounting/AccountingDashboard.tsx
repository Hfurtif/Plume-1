import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus, 
  School, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  CreditCard, 
  Receipt,
  PlusCircle,
  Eye,
  Trash2,
  DollarSign,
  Download,
  FileText,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { exportToCsv } from '../../utils/csvExport';
import { exportStudentsReport, exportPaymentsReport } from '../../utils/reportExporter';
import { Student, SchoolClass, PaymentMethod } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { GrandAnalyticsDashboard } from '../analytics/GrandAnalyticsDashboard';
import { QuickExportButton } from '../common/QuickExportButton';
import { ClassHubView } from '../classes/ClassHubView';

export const AccountingDashboard: React.FC = () => {
  const { 
    students, 
    classes, 
    payments, 
    addStudent, 
    addClass, 
    deleteClass,
    recordPayment, 
    setActivePaymentReceipt,
    openExportModal,
    t 
  } = useApp();

  // Active sub-tab in Accountant view
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'classes' | 'payments'>('overview');
  const [showStudentExportMenu, setShowStudentExportMenu] = useState(false);
  const [showPaymentExportMenu, setShowPaymentExportMenu] = useState(false);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modals
  const [isRegisterStudentOpen, setIsRegisterStudentOpen] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);

  // Deletion modal
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);

  // Form states for Student Registration
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '2008-05-15',
    gender: 'F' as 'M' | 'F',
    classId: classes[0]?.id || '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelation: 'Père',
    address: 'Paris',
    annualTuition: 850000
  });

  // Form state for Class Creation
  const [newClass, setNewClass] = useState({
    name: '',
    level: 'Terminale',
    section: 'A',
    cycle: 'lycee' as SchoolClass['cycle'],
    capacity: 35,
    tuitionFee: 850000,
    room: 'Bâtiment Principal'
  });

  // Form state for Payment Recording
  const [paymentForm, setPaymentForm] = useState({
    amount: 350000,
    method: 'virement' as PaymentMethod,
    notes: 'Règlement scolarité'
  });

  // Financial Metrics Calculations
  const metrics = useMemo(() => {
    const totalExpected = students.reduce((sum, s) => sum + s.annualTuition, 0);
    const totalCollected = students.reduce((sum, s) => sum + s.paidTuition, 0);
    const totalOutstanding = Math.max(0, totalExpected - totalCollected);
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    const countPaid = students.filter(s => s.paymentStatus === 'paid').length;
    const countPartial = students.filter(s => s.paymentStatus === 'partial').length;
    const countUnpaid = students.filter(s => s.paymentStatus === 'unpaid').length;

    return {
      totalExpected,
      totalCollected,
      totalOutstanding,
      collectionRate: Number(collectionRate.toFixed(1)),
      countPaid,
      countPartial,
      countUnpaid
    };
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = 
        `${s.firstName} ${s.lastName} ${s.matricule} ${s.guardianName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
      const matchStatus = selectedStatusFilter === 'all' || s.paymentStatus === selectedStatusFilter;
      return matchSearch && matchClass && matchStatus;
    });
  }, [students, searchTerm, selectedClassFilter, selectedStatusFilter]);

  // Export handlers
  const handleExportStudents = () => {
    const headers = [
      'Matricule',
      'Nom',
      'Prénom',
      'Classe',
      'Date de Naissance',
      'Responsable Légal',
      'Téléphone',
      'Montant Scolarité',
      'Montant Encaissé',
      'Reste à Payer',
      'Statut'
    ];
    const rows = filteredStudents.map(s => {
      const cls = classes.find(c => c.id === s.classId)?.name || 'Inconnue';
      const balance = Math.max(0, s.annualTuition - s.paidTuition);
      return [
        s.matricule,
        s.lastName,
        s.firstName,
        cls,
        s.dateOfBirth,
        s.guardianName,
        s.guardianPhone,
        s.annualTuition,
        s.paidTuition,
        balance,
        s.paymentStatus.toUpperCase()
      ];
    });
    exportToCsv('Liste_Eleves_Paiements_Plume', headers, rows);
  };

  const handleExportPayments = () => {
    const headers = [
      'N° Reçu',
      'Date',
      'Élève',
      'Matricule',
      'Montant (FCFA)',
      'Mode de Paiement',
      'Enregistré Par',
      'Observations'
    ];
    const rows = payments.map(p => [
      p.receiptNumber,
      p.date,
      p.studentName,
      p.matricule,
      p.amount,
      p.method.toUpperCase(),
      p.recordedBy,
      p.notes || ''
    ]);
    exportToCsv('Journal_Paiements_Plume', headers, rows);
  };

  // Form Submissions
  const handleRegisterStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.firstName || !newStudent.lastName) return;

    addStudent({
      ...newStudent,
      enrollmentDate: new Date().toISOString().split('T')[0]
    });

    setIsRegisterStudentOpen(false);
    // Reset form
    setNewStudent({
      firstName: '',
      lastName: '',
      dateOfBirth: '2008-05-15',
      gender: 'F',
      classId: classes[0]?.id || '',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianRelation: 'Père',
      address: 'Paris',
      annualTuition: 850000
    });
  };

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name) return;

    addClass(newClass);
    setIsCreateClassOpen(false);
    setNewClass({
      name: '',
      level: 'Terminale',
      section: 'A',
      cycle: 'lycee',
      capacity: 35,
      tuitionFee: 850000,
      room: 'Bâtiment Principal'
    });
  };

  const handleOpenPaymentModal = (student: Student) => {
    setSelectedStudentForPayment(student);
    const balance = Math.max(0, student.annualTuition - student.paidTuition);
    setPaymentForm({
      amount: balance > 0 ? balance : 250000,
      method: 'virement',
      notes: `Versement scolarité - ${student.firstName} ${student.lastName}`
    });
    setIsRecordPaymentOpen(true);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment) return;

    recordPayment({
      studentId: selectedStudentForPayment.id,
      studentName: `${selectedStudentForPayment.firstName} ${selectedStudentForPayment.lastName}`,
      matricule: selectedStudentForPayment.matricule,
      classId: selectedStudentForPayment.classId,
      amount: Number(paymentForm.amount),
      date: new Date().toISOString().split('T')[0],
      method: paymentForm.method,
      notes: paymentForm.notes
    });

    setIsRecordPaymentOpen(false);
    setSelectedStudentForPayment(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-400 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Direction Financière & Comptabilité Centrale</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-0.5 sm:mt-1">
            Tableau de Bord Comptable
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-2xl">
            Recouvrement des scolarités, gestion flexible des classes et suivi en temps réel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setIsRegisterStudentOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t('registerStudent')}</span>
          </button>

          <button
            onClick={() => setIsCreateClassOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span>Créer une Classe</span>
          </button>

          <QuickExportButton 
            reportType="payments"
            label="Exporter Rapports"
            variant="emerald"
            size="sm"
          />
        </div>
      </div>

      {/* Financial KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Total Attendu */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group cursor-default"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{t('totalExpected')}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white mt-1.5 sm:mt-2 truncate font-mono">
            {metrics.totalExpected.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">FCFA</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {students.length} élèves inscrits
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        </motion.div>

        {/* Total Encaissé */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group cursor-default"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{t('totalCollected')}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-1.5 sm:mt-2 truncate font-mono">
            {metrics.totalCollected.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">FCFA</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-500/90 font-medium mt-1 truncate">
            {metrics.countPaid} élèves soldés
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        </motion.div>

        {/* Reste à Recouvrer */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group cursor-default"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{t('totalOutstanding')}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-400 mt-1.5 sm:mt-2 truncate font-mono">
            {metrics.totalOutstanding.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">FCFA</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-rose-400/90 font-medium mt-1 truncate">
            {metrics.countPartial} partiels • {metrics.countUnpaid} non réglés
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>
        </motion.div>

        {/* Taux de Recouvrement */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group cursor-default"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{t('collectionRate')}</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-cyan-400 mt-1.5 sm:mt-2 font-mono">
            {metrics.collectionRate}%
          </div>
          
          {/* Progress bar with smooth animation */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 sm:h-2 mt-2 sm:mt-3 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 sm:h-2 rounded-full" 
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
        </motion.div>

      </div>

      {/* Sub-Tab Navigation Bar with animated layout */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto relative">
        {[
          { id: 'overview' as const, label: 'Élèves & Recouvrements', count: students.length },
          { id: 'analytics' as const, label: 'Grand Analytics Financier', count: 'Pro' },
          { id: 'classes' as const, label: 'Classes & Capacités', count: classes.length },
          { id: 'payments' as const, label: 'Journal des Règlements', count: payments.length }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-200 z-10 ${
                isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeAccountingTab"
                  className="absolute inset-0 rounded-xl bg-cyan-500/15 border border-cyan-500/30 shadow-md shadow-cyan-950/30 -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-cyan-500/25 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: Students & Payment Overview */}
        {activeTab === 'overview' && (
          <motion.div 
            key="tab-overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher élève, matricule, parent..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">Toutes les classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="paid">Soldé (Payé)</option>
                  <option value="partial">Paiement Partiel</option>
                  <option value="unpaid">Impayé</option>
                </select>

                <QuickExportButton 
                  reportType="students"
                  classId={selectedClassFilter}
                  statusFilter={selectedStatusFilter}
                  label="Exporter Effectifs"
                  variant="emerald"
                  size="sm"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[750px] text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Matricule & Élève</th>
                      <th className="p-3.5">Classe</th>
                      <th className="p-3.5">Responsable</th>
                      <th className="p-3.5 text-right">Scolarité Annuelle</th>
                      <th className="p-3.5 text-right">Montant Versé</th>
                      <th className="p-3.5 text-right">Reste à Payer</th>
                      <th className="p-3.5 text-center">Statut</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          Aucun élève ne correspond aux critères de recherche.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((std) => {
                        const studentClass = classes.find(c => c.id === std.classId);
                        const balance = Math.max(0, std.annualTuition - std.paidTuition);

                        return (
                          <tr key={std.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-xs">
                                  {std.firstName.charAt(0)}{std.lastName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-200">
                                    {std.firstName} {std.lastName}
                                  </div>
                                  <div className="text-[10px] font-mono text-cyan-400/90">
                                    {std.matricule}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 font-medium text-slate-300">
                              {studentClass?.name || 'Non assigné'}
                            </td>

                            <td className="p-3.5 text-slate-300">
                              <div>{std.guardianName}</div>
                              <div className="text-[10px] text-slate-400">{std.guardianPhone}</div>
                            </td>

                            <td className="p-3.5 text-right font-mono text-slate-300">
                              {std.annualTuition.toLocaleString()} FCFA
                            </td>

                            <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                              {std.paidTuition.toLocaleString()} FCFA
                            </td>

                            <td className="p-3.5 text-right font-mono font-bold text-rose-400">
                              {balance.toLocaleString()} FCFA
                            </td>

                            <td className="p-3.5 text-center">
                              {std.paymentStatus === 'paid' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Soldé
                                </span>
                              )}
                              {std.paymentStatus === 'partial' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                  <AlertCircle className="w-3.5 h-3.5" /> Partiel
                                </span>
                              )}
                              {std.paymentStatus === 'unpaid' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                  Impayé
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleOpenPaymentModal(std)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Encaisser</span>
                              </motion.button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: Grand Analytics */}
        {activeTab === 'analytics' && (
          <motion.div
            key="tab-analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <GrandAnalyticsDashboard roleVariant="comptable" />
          </motion.div>
        )}

        {/* TAB 2: Classes Hub & Recouvrement par Classe */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateClassOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Créer une nouvelle classe</span>
              </motion.button>
            </div>
            <ClassHubView role="comptable" initialTab="finance" />
          </div>
        )}

        {/* TAB 3: Payments Journal */}
        {activeTab === 'payments' && (
          <motion.div 
            key="tab-payments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-white">Journal Général des Règlements</h3>
                <p className="text-xs text-slate-400">Historique complet des quittances et bordereaux d'encaissement.</p>
              </div>
              <QuickExportButton 
                reportType="payments"
                label="Exporter Journal des Règlements"
                variant="emerald"
              />
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[700px] text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">N° Reçu</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Élève & Matricule</th>
                    <th className="p-3.5">Mode</th>
                    <th className="p-3.5 text-right">Montant</th>
                    <th className="p-3.5">Agent Encaisseur</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-cyan-400">
                        {p.receiptNumber}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {p.date}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-200">{p.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.matricule}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {p.method}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                        {p.amount.toLocaleString()} FCFA
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {p.recordedBy}
                      </td>
                      <td className="p-3.5 text-right">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActivePaymentReceipt(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Voir Quittance</span>
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: Register Student Modal */}
      <AnimatePresence>
        {isRegisterStudentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegisterStudentOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex justify-between items-center px-6 py-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Inscrire un Nouvel Élève</h3>
                </div>
                <button onClick={() => setIsRegisterStudentOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleRegisterStudentSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Prénom de l'élève *</label>
                    <input
                      type="text"
                      required
                      value={newStudent.firstName}
                      onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                      placeholder="Ex: Jean"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Nom de famille *</label>
                    <input
                      type="text"
                      required
                      value={newStudent.lastName}
                      onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                      placeholder="Ex: Dupont"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Date de naissance</label>
                    <input
                      type="date"
                      value={newStudent.dateOfBirth}
                      onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Sexe</label>
                    <select
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as 'M' | 'F' })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="F">Féminin (F)</option>
                      <option value="M">Masculin (M)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Classe d'affectation *</label>
                    <select
                      value={newStudent.classId}
                      onChange={(e) => {
                        const selected = classes.find(c => c.id === e.target.value);
                        setNewStudent({ 
                          ...newStudent, 
                          classId: e.target.value,
                          annualTuition: selected ? selected.tuitionFee : newStudent.annualTuition
                        });
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Montant Scolarité Annuelle (FCFA)</label>
                    <input
                      type="number"
                      value={newStudent.annualTuition}
                      onChange={(e) => setNewStudent({ ...newStudent, annualTuition: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-cyan-400 font-bold block mb-3">Coordonnées du Responsable Légal</span>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Nom du parent / tuteur</label>
                      <input
                        type="text"
                        required
                        value={newStudent.guardianName}
                        onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })}
                        placeholder="Ex: M. Jean Dupont"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Téléphone de contact</label>
                      <input
                        type="tel"
                        required
                        value={newStudent.guardianPhone}
                        onChange={(e) => setNewStudent({ ...newStudent, guardianPhone: e.target.value })}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRegisterStudentOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                  >
                    Confirmer l'inscription
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Create Class Modal */}
      <AnimatePresence>
        {isCreateClassOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateClassOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex justify-between items-center px-6 py-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <School className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Créer une Nouvelle Classe / Section</h3>
                </div>
                <button onClick={() => setIsCreateClassOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateClassSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nom complet de la classe *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 2nde C, 3ème Bleue, Petite Section 2..."
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Cycle d'enseignement</label>
                    <select
                      value={newClass.cycle}
                      onChange={(e) => setNewClass({ ...newClass, cycle: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="lycee">Lycée (2nde à Terminale)</option>
                      <option value="college">Collège (6e à 3e)</option>
                      <option value="primaire">Primaire (CP à CM2)</option>
                      <option value="maternelle">Maternelle (PS, MS, GS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Section</label>
                    <input
                      type="text"
                      value={newClass.section}
                      onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                      placeholder="Ex: A, B, C, Scientifique..."
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Capacité maximale (Élèves) *</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      required
                      value={newClass.capacity}
                      onChange={(e) => setNewClass({ ...newClass, capacity: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Frais de scolarité (FCFA)</label>
                    <input
                      type="number"
                      required
                      value={newClass.tuitionFee}
                      onChange={(e) => setNewClass({ ...newClass, tuitionFee: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Salle / Bâtiment</label>
                  <input
                    type="text"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    placeholder="Ex: Salle 204 - Bâtiment Curie"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateClassOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-950/30"
                  >
                    Créer la classe
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Record Payment Modal */}
      <AnimatePresence>
        {isRecordPaymentOpen && selectedStudentForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRecordPaymentOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex justify-between items-center px-6 py-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Enregistrer un Règlement</h3>
                </div>
                <button onClick={() => setIsRecordPaymentOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Élève concerné :</span>
                  <strong className="text-white text-sm block">
                    {selectedStudentForPayment.firstName} {selectedStudentForPayment.lastName}
                  </strong>
                  <span className="text-cyan-400 font-mono text-[11px]">
                    {selectedStudentForPayment.matricule}
                  </span>
                  <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between text-slate-300">
                    <span>Reste à solder :</span>
                    <strong className="text-rose-400 font-mono">
                      {Math.max(0, selectedStudentForPayment.annualTuition - selectedStudentForPayment.paidTuition).toLocaleString()} FCFA
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Montant à encaisser (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Mode de règlement</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="virement">Virement bancaire</option>
                    <option value="especes">Espèces (Caisse)</option>
                    <option value="cheque">Chèque certifié</option>
                    <option value="mobile_money">Mobile Money (Wave / Orange)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Observations / Motif</label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRecordPaymentOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/40"
                  >
                    Émettre la Quittance
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Class Deletion */}
      <ConfirmationModal
        isOpen={!!classToDelete}
        title="Supprimer la classe"
        message={`Êtes-vous sûr de vouloir supprimer définitivement la classe "${classToDelete?.name}" ? Cette action révoquera les associations avec les élèves de cette section.`}
        onCancel={() => setClassToDelete(null)}
        onConfirm={() => {
          if (classToDelete) {
            deleteClass(classToDelete.id);
            setClassToDelete(null);
          }
        }}
      />

    </div>
  );
};

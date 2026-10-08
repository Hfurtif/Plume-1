import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Calendar, 
  Users, 
  Award, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download, 
  Sparkles,
  School,
  GraduationCap,
  CalendarCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { INITIAL_SUBJECTS } from '../../data/mockData';
import { AnalyticsPeriod, UserRole } from '../../types';
import { AttendanceTrendsWidget } from '../attendance/AttendanceTrendsWidget';

interface GrandAnalyticsDashboardProps {
  roleVariant?: 'proviseur' | 'admin' | 'comptable';
}

export const GrandAnalyticsDashboard: React.FC<GrandAnalyticsDashboardProps> = ({ roleVariant }) => {
  const { 
    activeRole, 
    classes, 
    students, 
    grades, 
    payments, 
    attendance, 
    t 
  } = useApp();

  const role = roleVariant || (activeRole === 'comptable' ? 'comptable' : activeRole === 'admin' ? 'admin' : 'proviseur');

  // Period filter
  const [period, setPeriod] = useState<AnalyticsPeriod>('trimester');
  const [selectedSubTab, setSelectedSubTab] = useState<'overview' | 'academic' | 'attendance' | 'finance'>('overview');

  // Academic statistics & distributions
  const academicData = useMemo(() => {
    // Subject averages
    const subjectStats = INITIAL_SUBJECTS.map(subj => {
      const subjGrades = grades.filter(g => g.subjectId === subj.id);
      const avg = subjGrades.length > 0 
        ? Number((subjGrades.reduce((a, b) => a + b.score, 0) / subjGrades.length).toFixed(2))
        : 14.2;
      return {
        subject: subj,
        average: avg,
        evalCount: subjGrades.length
      };
    }).sort((a, b) => b.average - a.average);

    // Class averages & progression
    const classStats = classes.map(c => {
      const classGrades = grades.filter(g => g.classId === c.id);
      const avg = classGrades.length > 0
        ? Number((classGrades.reduce((a, b) => a + b.score, 0) / classGrades.length).toFixed(2))
        : 13.8;
      
      const previousAvg = Math.max(10, Number((avg - (Math.random() * 1.2 - 0.6)).toFixed(2)));
      const delta = Number((avg - previousAvg).toFixed(2));

      return {
        class: c,
        average: avg,
        previousAverage: previousAvg,
        delta,
        studentCount: students.filter(s => s.classId === c.id).length
      };
    }).sort((a, b) => b.average - a.average);

    // Grade distribution buckets (Honor rolls)
    let honors = { excellence: 0, bien: 0, moyen: 0, difficulte: 0 };
    students.forEach(s => {
      const sGrades = grades.filter(g => g.studentId === s.id);
      const avg = sGrades.length > 0
        ? sGrades.reduce((a, b) => a + b.score, 0) / sGrades.length
        : 13.5;
      
      if (avg >= 16) honors.excellence++;
      else if (avg >= 14) honors.bien++;
      else if (avg >= 10) honors.moyen++;
      else honors.difficulte++;
    });

    return { subjectStats, classStats, honors };
  }, [classes, grades, students]);

  // Student demographic distribution by educational cycle
  const cycleDistribution = useMemo(() => {
    const counts = {
      maternelle: 0,
      primaire: 0,
      college: 0,
      lycee: 0
    };

    classes.forEach(c => {
      const stdInClass = students.filter(s => s.classId === c.id).length;
      counts[c.cycle] += stdInClass;
    });

    const total = students.length || 1;

    return [
      { id: 'maternelle', label: 'Maternelle (Petite à Grande Section)', count: counts.maternelle, color: 'from-amber-400 to-orange-500', hex: '#f59e0b', pct: Math.round((counts.maternelle / total) * 100) },
      { id: 'primaire', label: 'Primaire (CP au CM2)', count: counts.primaire, color: 'from-emerald-400 to-teal-500', hex: '#10b981', pct: Math.round((counts.primaire / total) * 100) },
      { id: 'college', label: 'Collège (6e à la 3e)', count: counts.college, color: 'from-cyan-400 to-blue-500', hex: '#06b6d4', pct: Math.round((counts.college / total) * 100) },
      { id: 'lycee', label: 'Lycée (2nde, 1ère, Terminale)', count: counts.lycee, color: 'from-violet-500 to-indigo-600', hex: '#8b5cf6', pct: Math.round((counts.lycee / total) * 100) },
    ];
  }, [classes, students]);

  // Financial statistics
  const financeData = useMemo(() => {
    const totalBilled = students.reduce((acc, s) => acc + (s.annualTuition || 0), 0);
    const totalCollected = students.reduce((acc, s) => acc + (s.paidTuition || 0), 0);
    const totalUnpaid = Math.max(0, totalBilled - totalCollected);
    const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;

    // Monthly collection trend
    const months = [
      { name: 'Sep', amount: 8450000 },
      { name: 'Oct', amount: 5200000 },
      { name: 'Nov', amount: 4100000 },
      { name: 'Déc', amount: 2800000 },
      { name: 'Jan', amount: 9600000 },
      { name: 'Fév', amount: 6400000 },
      { name: 'Mar', amount: 7850000 }
    ];

    // Payment methods
    const methodCounts = { especes: 0, virement: 0, cheque: 0, mobile_money: 0 };
    payments.forEach(p => {
      if (methodCounts[p.method] !== undefined) {
        methodCounts[p.method] += p.amount;
      }
    });

    const totalMethods = Object.values(methodCounts).reduce((a, b) => a + b, 0) || 1;

    const paymentMethodsList = [
      { id: 'virement', label: 'Virement Bancaire Swift', amount: methodCounts.virement, pct: Math.round((methodCounts.virement / totalMethods) * 100), color: 'bg-blue-500' },
      { id: 'especes', label: 'Caisse Centrale (Espèces)', amount: methodCounts.especes, pct: Math.round((methodCounts.especes / totalMethods) * 100), color: 'bg-emerald-500' },
      { id: 'mobile_money', label: 'Mobile Money (Wave / Orange)', amount: methodCounts.mobile_money, pct: Math.round((methodCounts.mobile_money / totalMethods) * 100), color: 'bg-amber-500' },
      { id: 'cheque', label: 'Chèques Certifiés', amount: methodCounts.cheque, pct: Math.round((methodCounts.cheque / totalMethods) * 100), color: 'bg-violet-500' },
    ];

    return { totalBilled, totalCollected, totalUnpaid, collectionRate, months, paymentMethodsList };
  }, [students, payments]);

  // Attendance rate trends (Week by Week)
  const attendanceTrends = [
    { week: 'Semaine 1', rate: 96.8, absents: 12 },
    { week: 'Semaine 2', rate: 95.4, absents: 18 },
    { week: 'Semaine 3', rate: 94.2, absents: 24 },
    { week: 'Semaine 4', rate: 97.5, absents: 9 },
    { week: 'Semaine 5 (Actuelle)', rate: 98.1, absents: 7 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Banner */}
      <div className="p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Grand Analytics & Intelligence Décisionnelle • Plume Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
            Tableau de Bord Analytique Avancé
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Indicateurs de performance académique, suivi du recouvrement financier et dynamiques d'assiduité de l'établissement.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-950/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-800">
          <span className="text-[11px] sm:text-xs text-slate-400 px-1.5 font-medium">Période :</span>
          {(['month', 'trimester', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                period === p 
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'month' ? 'Mois' : p === 'trimester' ? 'Trimestre 2' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      {/* Role-Specific Primary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Metric 1 */}
        <motion.div whileHover={{ y: -3 }} className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 truncate">
              {role === 'comptable' ? 'Total Encaissé' : 'Moyenne École'}
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {role === 'comptable' ? <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black text-white font-mono mt-1 sm:mt-2 truncate">
            {role === 'comptable' 
              ? `${(financeData.totalCollected / 1000000).toFixed(2)} M FCFA` 
              : '14.28 / 20'}
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1 truncate">
            <ArrowUpRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" /> +0.4 pts vs T1
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div whileHover={{ y: -3 }} className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 truncate">
              {role === 'comptable' ? 'Recouvrement' : 'Taux Présence'}
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black text-emerald-400 font-mono mt-1 sm:mt-2 truncate">
            {role === 'comptable' ? `${financeData.collectionRate}%` : '96.8%'}
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1 truncate">
            <ArrowUpRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" /> En bonne voie
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div whileHover={{ y: -3 }} className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 truncate">
              {role === 'comptable' ? 'Reste Dû' : 'Félicitations'}
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black text-amber-400 font-mono mt-1 sm:mt-2 truncate">
            {role === 'comptable' 
              ? `${(financeData.totalUnpaid / 1000000).toFixed(2)} M FCFA` 
              : `${academicData.honors.excellence} élèves`}
          </div>
          <div className="text-[10px] sm:text-[11px] text-amber-400/90 mt-1 truncate">Moyenne &gt; 16/20</div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div whileHover={{ y: -3 }} className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 truncate">Effectif Actif</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black text-violet-400 font-mono mt-1 sm:mt-2 truncate">
            {students.length} élèves
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">{classes.length} classes</div>
        </motion.div>

      </div>

      {/* Row 1: Grade Evolution by Class & Subject Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Performance Comparison by Subject */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base">Moyennes Comparatives par Matière</h3>
              <p className="text-xs text-slate-400">Classement des disciplines sur l'ensemble des classes de l'école.</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-mono font-bold">
              Base /20
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {academicData.subjectStats.map((item, idx) => (
              <div key={item.subject.id} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-bold w-4">{idx + 1}</span>
                    <span className="font-bold text-slate-200">{item.subject.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">({item.subject.code})</span>
                  </div>
                  <span className="font-mono font-black text-cyan-400">{item.average} / 20</span>
                </div>
                
                {/* Animated Horizontal Bar */}
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800/80">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.average / 20) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.08 }}
                    className={`h-full rounded-full bg-gradient-to-r ${
                      item.average >= 16 ? 'from-emerald-500 to-teal-400' :
                      item.average >= 14 ? 'from-cyan-500 to-blue-500' :
                      item.average >= 12 ? 'from-indigo-500 to-cyan-500' : 'from-amber-500 to-orange-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Grade Evolution & Progression by Class */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base">Évolution des Résultats par Classe</h3>
              <p className="text-xs text-slate-400">Progression moyenne entre le Trimestre 1 et le Trimestre 2.</p>
            </div>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Progression Générale
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {academicData.classStats.map((cs, idx) => (
              <div key={cs.class.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                    {cs.class.name.substring(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{cs.class.name}</h4>
                    <span className="text-[10px] text-slate-400">{cs.studentCount} élèves inscrits • Cycle {cs.class.cycle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-mono font-black text-cyan-400">{cs.average} / 20</div>
                    <div className="text-[10px] text-slate-500 font-mono">T1: {cs.previousAverage}</div>
                  </div>

                  <div className={`px-2 py-1 rounded-md text-[11px] font-bold font-mono flex items-center gap-0.5 ${
                    cs.delta >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {cs.delta >= 0 ? '+' : ''}{cs.delta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Demographic Distribution by Educational Cycle + Attendance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Student Distribution by Level / Cycle */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base">Répartition des Effectifs par Cycle</h3>
              <p className="text-xs text-slate-400">Distribution continue de la Maternelle à la Terminale.</p>
            </div>
            <Users className="w-5 h-5 text-slate-500" />
          </div>

          <div className="space-y-4 pt-2">
            {cycleDistribution.map((item, idx) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.label}</span>
                  <span className="font-mono font-bold text-white">{item.count} élèves ({item.pct}%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.9, delay: idx * 0.1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Rate Trends Over Time - Interactive Trends Widget */}
        <AttendanceTrendsWidget />

      </div>

      {/* Row 3: Financial & Collection Analytics (Especially for Comptable and Proviseur) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">Analyse Financière & Recouvrement des Frais de Scolarité</h3>
            <p className="text-xs text-slate-400">Suivi des encaissements mensuels, modes de règlement et créances en cours.</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">Facturé : <strong className="text-white">{(financeData.totalBilled).toLocaleString()} FCFA</strong></span>
            <span className="text-emerald-400">Encaissé : <strong>{(financeData.totalCollected).toLocaleString()} FCFA</strong></span>
          </div>
        </div>

        {/* Monthly Collection Bar Chart */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300">Volume des encaissements par mois (en Millions FCFA)</div>
          <div className="grid grid-cols-7 gap-2 pt-4 items-end h-44 border-b border-slate-800 pb-2">
            {financeData.months.map((m, idx) => {
              const maxAmount = 10000000;
              const heightPct = Math.round((m.amount / maxAmount) * 100);
              return (
                <div key={m.name} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    {(m.amount / 1000000).toFixed(1)}M
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.7, delay: idx * 0.08 }}
                    className="w-full max-w-[42px] bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t-lg shadow-lg hover:brightness-110 transition-all cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-slate-400">{m.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {financeData.paymentMethodsList.map(pm => (
            <div key={pm.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">{pm.label}</span>
                <span className="font-mono font-black text-white">{pm.pct}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div className={`h-full ${pm.color}`} style={{ width: `${pm.pct}%` }} />
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {pm.amount.toLocaleString()} FCFA
              </div>
            </div>
          ))}
        </div>
      </div>

    </motion.div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  CalendarCheck, 
  Clock, 
  AlertTriangle, 
  Users, 
  Sparkles, 
  ChevronRight,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

interface AttendanceTrendsWidgetProps {
  compact?: boolean;
}

export const AttendanceTrendsWidget: React.FC<AttendanceTrendsWidgetProps> = ({ compact = false }) => {
  const { classes, students, attendance } = useApp();

  const [period, setPeriod] = useState<'7d' | '30d' | 'term'>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    rate: number;
    absents: number;
    retards: number;
  } | null>(null);

  // Dynamic trend data based on period
  const trendData = useMemo(() => {
    if (period === '7d') {
      return [
        { label: 'J-6 (Ven)', date: '20 Mars', rate: 96.2, absents: 14, retards: 5 },
        { label: 'J-5 (Lun)', date: '23 Mars', rate: 95.8, absents: 16, retards: 8 },
        { label: 'J-4 (Mar)', date: '24 Mars', rate: 97.4, absents: 10, retards: 4 },
        { label: 'J-3 (Mer)', date: '25 Mars', rate: 98.1, absents: 7, retards: 2 },
        { label: 'J-2 (Jeu)', date: '26 Mars', rate: 96.9, absents: 12, retards: 6 },
        { label: 'J-1 (Ven)', date: '27 Mars', rate: 94.8, absents: 19, retards: 9 },
        { label: 'Auj (Lun)', date: '30 Mars', rate: 98.5, absents: 5, retards: 3 },
      ];
    } else if (period === '30d') {
      return [
        { label: 'Sem 09', date: '02 Mars', rate: 95.5, absents: 18, retards: 10 },
        { label: 'Sem 10', date: '09 Mars', rate: 96.8, absents: 12, retards: 7 },
        { label: 'Sem 11', date: '16 Mars', rate: 94.2, absents: 22, retards: 12 },
        { label: 'Sem 12', date: '23 Mars', rate: 97.1, absents: 11, retards: 5 },
        { label: 'Sem 13', date: '30 Mars', rate: 98.4, absents: 6, retards: 4 },
      ];
    } else {
      return [
        { label: 'Janvier', date: 'Jan 2026', rate: 94.9, absents: 85, retards: 42 },
        { label: 'Février', date: 'Fév 2026', rate: 96.3, absents: 62, retards: 31 },
        { label: 'Mars (En cours)', date: 'Mar 2026', rate: 97.8, absents: 38, retards: 19 },
      ];
    }
  }, [period]);

  // Day of the week pattern
  const dayPatterns = [
    { day: 'Lundi', rate: 97.2, note: 'Excellente reprise', alert: false },
    { day: 'Mardi', rate: 98.4, note: 'Journée la plus assidue', alert: false },
    { day: 'Mercredi', rate: 98.1, note: 'Matinée stable', alert: false },
    { day: 'Jeudi', rate: 96.8, note: 'Normal', alert: false },
    { day: 'Vendredi', rate: 94.6, note: 'Baisse ponctuelle l\'après-midi', alert: true },
  ];

  // SVG dimensions for chart
  const width = 500;
  const height = 150;
  const padding = 25;

  const minRate = 92;
  const maxRate = 100;

  // Calculate coordinates for SVG curve
  const points = useMemo(() => {
    const stepX = (width - padding * 2) / (trendData.length - 1 || 1);
    return trendData.map((d, i) => {
      const x = padding + i * stepX;
      const normalizedY = (d.rate - minRate) / (maxRate - minRate);
      const y = height - padding - normalizedY * (height - padding * 2);
      return { x, y, data: d };
    });
  }, [trendData]);

  // Build SVG path
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i, arr) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    }, '');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    const groundY = height - padding;
    return `${pathD} L ${last.x} ${groundY} L ${first.x} ${groundY} Z`;
  }, [pathD, points]);

  // Average rate for current period
  const avgRate = useMemo(() => {
    const sum = trendData.reduce((acc, d) => acc + d.rate, 0);
    return (sum / trendData.length).toFixed(1);
  }, [trendData]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5"
    >
      {/* Header with Period Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
            <TrendingUp className="w-4 h-4" />
            <span>Attendance Trends • Analytique Prédictive</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-0.5">
            Dynamique d'Assiduité de l'Établissement
          </h3>
          <p className="text-xs text-slate-400">
            Taux moyen de présence : <strong className="text-cyan-400 font-mono">{avgRate}%</strong> sur la période sélectionnée.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
          {[
            { id: '7d' as const, label: '7 Derniers Jours' },
            { id: '30d' as const, label: '30 Derniers Jours' },
            { id: 'term' as const, label: 'Trimestre 2' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === p.id 
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive Curve Area Chart */}
      <div className="relative bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4 overflow-hidden">
        
        {/* Hover Tooltip Float */}
        <AnimatePresence>
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-4 p-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-xl text-xs z-20 pointer-events-none"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{hoveredPoint.date}</span>
                <span className="text-cyan-400 font-mono font-black">{hoveredPoint.rate}%</span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="text-rose-400">{hoveredPoint.absents} absence(s)</span>
                <span>•</span>
                <span className="text-amber-400">{hoveredPoint.retards} retard(s)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vector SVG */}
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-44 overflow-visible"
        >
          <defs>
            <linearGradient id="attendanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
          <line x1={padding} y1={(height - padding * 2) / 2 + padding} x2={width - padding} y2={(height - padding * 2) / 2 + padding} stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#475569" opacity="0.6" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#attendanceGradient)" />

          {/* Line Stroke */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="#22d3ee" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Interactive Data Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#020617"
                stroke="#22d3ee"
                strokeWidth="2.5"
                className="cursor-pointer transition-transform hover:scale-150"
                onMouseEnter={() => setHoveredPoint(p.data)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}
        </svg>

        {/* X-Axis Labels */}
        <div className="flex justify-between px-2 pt-2 text-[10px] font-mono text-slate-400">
          {trendData.map((d, i) => (
            <span key={i} className="hover:text-cyan-300 transition-colors">
              {d.label}
            </span>
          ))}
        </div>
      </div>

      {/* Pattern Breakdown: Days of Week & Alert Banner */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          
          {/* Day of Week Analysis */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Répartition par Jour de la Semaine</span>
            </h4>

            <div className="space-y-1.5 text-xs">
              {dayPatterns.map(d => (
                <div key={d.day} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{d.day}</span>
                    <span className="text-[10px] text-slate-500">{d.note}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${d.alert ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${d.rate}%` }} />
                    </div>
                    <span className={`font-mono font-bold ${d.alert ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {d.rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights & Best Performing Classes */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Indice de Vigilance Pédagogique</span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Le taux d'assiduité global dépasse le seuil cible d'excellence (<strong>96.0%</strong>). Une légère baisse de présence est identifiée le vendredi après-midi (94.6%), principalement compensée par les cours du matin.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs space-y-1">
              <div className="flex justify-between items-center text-[11px] text-cyan-300 font-bold">
                <span>Top Classe la plus Assidue</span>
                <span className="font-mono text-emerald-400 font-black">98.5%</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Terminale C (35 élèves) • 0 absence injustifiée enregistrée cette semaine.
              </p>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
};

import React, { useState } from 'react';
import { 
  CreditCard, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Smartphone, 
  Download, 
  X, 
  Sparkles, 
  Calendar, 
  Receipt,
  HelpCircle,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export const SubscriptionModal: React.FC = () => {
  const { 
    isSubscriptionModalOpen, 
    setIsSubscriptionModalOpen,
    schoolProfile,
    daysRemaining,
    isSubscriptionRestricted,
    paySchoolSubscription,
    simulateSubscriptionDaysRemaining,
    resetTrialPeriod
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card' | 'virement' | 'paypal'>('mobile_money');
  const [mobileOperator, setMobileOperator] = useState<'wave' | 'mtn' | 'orange' | 'moov'>('wave');
  const [phoneNumber, setPhoneNumber] = useState('+229 97 00 11 22');
  const [payerName, setPayerName] = useState('Direction de l\'Établissement');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<string | null>(null);

  if (!isSubscriptionModalOpen) return null;

  const subscription = schoolProfile.subscription;
  const isPaidActive = subscription.status === 'active';

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const res = paySchoolSubscription({
        method: paymentMethod === 'mobile_money' 
          ? `Mobile Money (${mobileOperator.toUpperCase()} - ${phoneNumber})` 
          : paymentMethod === 'card' 
          ? 'Carte Bancaire (Visa/Mastercard)' 
          : paymentMethod === 'paypal' 
          ? 'PayPal' 
          : 'Virement Bancaire',
        payerName
      });

      setIsProcessing(false);
      setPaymentSuccessReceipt(res.receiptNumber);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-cyan-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Abonnement de l'Établissement</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isPaidActive 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isSubscriptionRestricted
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {isPaidActive 
                      ? 'Abonnement Actif (15 $/mois)' 
                      : isSubscriptionRestricted 
                      ? 'Période Expirée (Restreint)' 
                      : `Essai Gratuit (J-${daysRemaining})`}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {schoolProfile.name} • {schoolProfile.country}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSubscriptionModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Status Summary Banner */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isPaidActive
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : isSubscriptionRestricted
                ? 'bg-rose-950/30 border-rose-500/40'
                : 'bg-cyan-950/20 border-cyan-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isPaidActive 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : isSubscriptionRestricted 
                    ? 'bg-rose-500/20 text-rose-400' 
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {isPaidActive ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isSubscriptionRestricted ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-200">
                    {isPaidActive 
                      ? 'Abonnement mensuel en règle' 
                      : isSubscriptionRestricted 
                      ? 'Restriction active : Période de 30 jours expirée' 
                      : `Période d'essai de 30 jours en cours (${daysRemaining} jours restants)`}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tarif standard de la plateforme : <strong className="text-white">15 $ / mois</strong> (environ 9 000 FCFA ou 15 €)
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xl font-black text-white">15 USD</div>
                <div className="text-[10px] text-slate-400">/ mois / école</div>
              </div>
            </div>

            {/* Success Receipt view if just paid */}
            {paymentSuccessReceipt && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Paiement de 15 $ Enregistré avec Succès !
                </h4>
                <p className="text-xs text-slate-300">
                  Votre établissement est actif pour les 30 prochains jours.
                </p>
                <div className="text-xs font-mono text-emerald-300 font-bold bg-slate-950/60 py-1 px-3 rounded-lg inline-block">
                  Quittance N° {paymentSuccessReceipt}
                </div>
              </div>
            )}

            {/* Payment Form (if not already paid or renewal) */}
            <form onSubmit={handlePay} className="space-y-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Régler l'abonnement mensuel (15 $/mois)
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
                  { id: 'card', label: 'Carte Bancaire', icon: CreditCard },
                  { id: 'virement', label: 'Virement', icon: Receipt },
                  { id: 'paypal', label: 'PayPal', icon: Wallet }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === item.id 
                          ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10 font-bold' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Money Options */}
              {paymentMethod === 'mobile_money' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-300">
                    Sélectionnez votre opérateur Mobile Money :
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'wave', label: 'Wave', color: 'from-sky-500 to-blue-600' },
                      { id: 'mtn', label: 'MTN MoMo', color: 'from-amber-500 to-yellow-600' },
                      { id: 'orange', label: 'Orange', color: 'from-orange-500 to-amber-600' },
                      { id: 'moov', label: 'Moov Flooz', color: 'from-blue-600 to-cyan-600' }
                    ].map(op => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setMobileOperator(op.id as any)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          mobileOperator === op.id 
                            ? 'bg-slate-800 border-cyan-400 text-white shadow-sm' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Numéro Mobile Money du payeur (Proviseur / Comptable)
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="+229 97 00 00 00"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Card Options */}
              {paymentMethod === 'card' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Numéro de Carte Visa / Mastercard
                    </label>
                    <input
                      type="text"
                      defaultValue="4242 •••• •••• 4242"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Expiration
                      </label>
                      <input
                        type="text"
                        defaultValue="12/28"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        defaultValue="•••"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Payment Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Validation du paiement de 15 $...' : 'Valider le paiement de 15 $ (Renouvellement 30 jours)'}
              </button>
            </form>

            {/* Test & Simulation Sandbox (for testing 30-day trial & expiration restriction) */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <PlayCircle className="w-4 h-4" />
                <span>Console de Test & Simulation (30 Jours & Restriction)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Vous pouvez simuler l'état d'expiration pour vérifier comment l'application restreint l'accès ou affiche les alertes :
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => simulateSubscriptionDaysRemaining(30)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 text-[11px] font-bold border border-slate-800 hover:border-emerald-500/40 transition-colors"
                >
                  Simuler J-30 (Début)
                </button>
                <button
                  type="button"
                  onClick={() => simulateSubscriptionDaysRemaining(3)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-bold border border-slate-800 hover:border-amber-500/40 transition-colors"
                >
                  Simuler J-3 (Alerte)
                </button>
                <button
                  type="button"
                  onClick={() => simulateSubscriptionDaysRemaining(0)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 text-[11px] font-bold border border-slate-800 hover:border-rose-500/40 transition-colors"
                >
                  Simuler Expiré (Restreint)
                </button>
                <button
                  type="button"
                  onClick={resetTrialPeriod}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[11px] font-bold border border-slate-800 hover:border-cyan-500/40 transition-colors"
                >
                  Reset Essai (30J)
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
            Facturation automatisée • Sans engagement • Paiement 100% sécurisé
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

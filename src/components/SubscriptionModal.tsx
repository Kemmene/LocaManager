import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SubscriptionPlan, Subscription } from '../types';
import { formatFCFA } from '../utils/formatters';
import confetti from 'canvas-confetti';
import { 
  X, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Crown, 
  CreditCard, 
  Smartphone, 
  Building2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Download, 
  Printer, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  AlertCircle,
  QrCode,
  Calendar,
  Layers,
  Zap,
  PhoneCall
} from 'lucide-react';

interface SubscriptionModalProps {
  onClose: () => void;
  initialPlan?: SubscriptionPlan | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ 
  onClose,
  initialPlan 
}) => {
  const { 
    currentUser, 
    subscriptionPlans, 
    subscriptions, 
    processSubscriptionPayment 
  } = useApp();

  // Find user's active subscription and current plan
  const userSub = subscriptions.find(s => s.user_id === currentUser.id && s.statut === 'actif');
  const currentPlan = subscriptionPlans.find(p => p.id === currentUser.abonnement_id) || subscriptionPlans[0];

  // Steps: 'plans' -> 'checkout' -> 'processing' -> 'invoice'
  const [step, setStep] = useState<'plans' | 'checkout' | 'processing' | 'invoice'>(
    initialPlan ? 'checkout' : 'plans'
  );

  // Selected plan for checkout
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    initialPlan || currentPlan || subscriptionPlans[1]
  );

  // Billing duration in months: 1, 3, 6, 12 or custom
  const [durationMonths, setDurationMonths] = useState<number>(6); // Default 6 months

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'mtn_momo' | 'orange_money' | 'carte_bancaire' | 'virement'>(
    'mtn_momo'
  );

  // Form fields
  const [phoneNumber, setPhoneNumber] = useState<string>(currentUser.phonenumber || '+237 6');
  const [accountHolder, setAccountHolder] = useState<string>(currentUser.name || '');
  const [cardNumber, setCardNumber] = useState<string>('4215 •••• •••• 8910');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvc, setCardCvc] = useState<string>('312');

  // Interactive UI states
  const [showCriteriaComparison, setShowCriteriaComparison] = useState<boolean>(false);
  const [processingCountdown, setProcessingCountdown] = useState<number>(3);
  const [paidSubscription, setPaidSubscription] = useState<Subscription | null>(null);

  // Compute discount percentages
  const getDiscountPercent = (months: number): number => {
    if (months >= 12) return 17; // ~2 months free
    if (months >= 6) return 10;
    if (months >= 3) return 5;
    return 0;
  };

  const discountPercent = getDiscountPercent(durationMonths);
  const rawSubtotal = selectedPlan.prix_fcfa * durationMonths;
  const discountAmount = Math.round((rawSubtotal * discountPercent) / 100);
  const totalToPay = rawSubtotal - discountAmount;

  // Compute expiration preview
  const computeExpiryDate = (months: number): string => {
    const today = new Date();
    let baseDate = new Date();
    if (userSub && userSub.date_expiration && new Date(userSub.date_expiration) > today) {
      baseDate = new Date(userSub.date_expiration);
    }
    const target = new Date(baseDate);
    target.setMonth(target.getMonth() + months);
    return target.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSelectPlanAndProceed = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep('checkout');
  };

  const handleTriggerPayment = () => {
    setStep('processing');
    setProcessingCountdown(3);

    // Countdown simulation
    const interval = setInterval(() => {
      setProcessingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          completePayment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completePayment = () => {
    let modeLabel = 'MTN Mobile Money Cameroun';
    let details = phoneNumber;
    if (paymentMethod === 'orange_money') {
      modeLabel = 'Orange Money Cameroun';
      details = phoneNumber;
    } else if (paymentMethod === 'carte_bancaire') {
      modeLabel = 'Carte Bancaire Visa/Mastercard';
      details = cardNumber;
    } else if (paymentMethod === 'virement') {
      modeLabel = 'Virement Bancaire DISCOM';
      details = 'Banque Afriland Cameroun';
    }

    const newSub = processSubscriptionPayment({
      planId: selectedPlan.id,
      dureeMois: durationMonths,
      modePaiement: modeLabel,
      telephoneOuDetails: details,
      montantPaye: totalToPay,
      remise: discountAmount
    });

    setPaidSubscription(newSub);
    setStep('invoice');

    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore if confetti fails
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        id="subscription-modal-container"
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Top Banner */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Forfaits & Abonnement Bailleur
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  DISCOM Cameroun
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gérez vos logements et quittances sans limite avec nos plans adaptés au marché locatif
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="close-subscription-modal-btn"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/60">

          {/* ========================================================================= */}
          {/* STEP 1: PLANS SELECTION & CRITERIA COMPARISON                             */}
          {/* ========================================================================= */}
          {step === 'plans' && (
            <div className="space-y-6">
              {/* Header explanation & current status */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Votre formule actuelle
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <span>{currentPlan.nom}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Actif
                      </span>
                    </h4>
                  </div>
                </div>

                {userSub?.date_expiration && (
                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Date d'échéance :</span>
                    <span className="text-xs font-bold text-slate-800">
                      {new Date(userSub.date_expiration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {/* 3 First Months 100% Free Announcement */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-yellow-400 text-slate-900 text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-xs">
                        Offre Spéciale DISCOM
                      </span>
                      <span className="text-xs text-emerald-200 font-semibold">Tous les 4 forfaits éligibles</span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black tracking-tight mt-1">
                      LES 3 PREMIERS MOIS SONT TOTALEMENT GRATUITS
                    </h4>
                    <p className="text-xs text-white/90">
                      Profitez de 90 jours d'accès complet sans engagement pour digitaliser votre patrimoine locatif.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-3.5 py-2 bg-white text-emerald-800 text-xs font-black rounded-xl shadow-xs inline-block">
                    0 FCFA pendant 3 mois
                  </span>
                </div>
              </div>

              {/* Title & subtitle */}
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Forfaits SaaS Indexés sur le Chiffre d'Affaires
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Choisissez le palier correspondant aux loyers encaissés par mois. Tarifs transparents en FCFA.
                </p>
              </div>

              {/* Plans Grid (4 Tiers) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                {subscriptionPlans.map((plan) => {
                  const isCurrent = plan.id === currentPlan.id;
                  const isPopular = plan.is_popular;

                  return (
                    <div
                      key={plan.id}
                      id={`plan-card-${plan.id}`}
                      className={`
                        relative bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between
                        ${isPopular 
                          ? 'border-indigo-600 shadow-md ring-2 ring-indigo-600/10' 
                          : isCurrent 
                          ? 'border-emerald-500 shadow-2xs' 
                          : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                        }
                      `}
                    >
                      {/* Popular / Best value badge */}
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs flex items-center gap-1 whitespace-nowrap">
                          <Sparkles className="w-3 h-3" />
                          <span>Recommandé Pro</span>
                        </div>
                      )}

                      {isCurrent && !isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs whitespace-nowrap">
                          Votre formule actuelle
                        </div>
                      )}

                      <div>
                        {/* Plan Header */}
                        <div className="pt-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded block w-fit mb-1 border border-indigo-100">
                            {plan.tranche_ca_label || 'Paliers CA'}
                          </span>
                          <h4 className="font-extrabold text-base text-slate-900">{plan.nom}</h4>
                          <p className="text-xs text-slate-500 min-h-[32px] mt-1 leading-relaxed">
                            {plan.description}
                          </p>
                        </div>

                        {/* Price Display */}
                        <div className="my-3 pb-3 border-b border-slate-100">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-indigo-900 tracking-tight">
                              {formatFCFA(plan.prix_fcfa)}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">/ mois</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                              3 mois offerts
                            </span>
                            <span className="text-[10px] text-slate-500">puis mensualité</span>
                          </div>
                        </div>

                        {/* Capacity indicators (Key Criteria) */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">Biens gérés :</span>
                            <span className="font-bold text-slate-900">
                              {plan.max_logements >= 999 ? 'Illimités' : `Jusqu'à ${plan.max_logements} biens`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">Logements & Unités :</span>
                            <span className="font-bold text-slate-900">
                              {plan.max_pieces >= 999 ? 'Illimités' : `Jusqu'à ${plan.max_pieces} logements`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">Support DISCOM :</span>
                            <span className="font-bold text-indigo-700">
                              {plan.criteres_detail?.support_niveau || 'Prioritaire'}
                            </span>
                          </div>
                        </div>

                        {/* Feature list */}
                        <div className="space-y-1.5 mb-5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Avantages SaaS inclus :
                          </span>
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {plan.features.slice(0, 4).map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-tight">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          id={`select-plan-btn-${plan.id}`}
                          onClick={() => handleSelectPlanAndProceed(plan)}
                          className={`
                            w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer
                            ${isPopular 
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' 
                              : isCurrent 
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }
                          `}
                        >
                          <span>{isCurrent ? 'Prolonger / Renouveler' : `Choisir ${plan.nom}`}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison table toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  id="toggle-criteria-table-btn"
                  onClick={() => setShowCriteriaComparison(prev => !prev)}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>
                    {showCriteriaComparison 
                      ? 'Masquer le tableau comparatif complet des critères' 
                      : 'Afficher le comparatif détaillé des critères de location (Quittances, Alertes, Baux)'
                    }
                  </span>
                  {showCriteriaComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Expanded Comparison Table */}
                {showCriteriaComparison && (
                  <div className="mt-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                            <th className="py-3 px-4">Critères & Services DISCOM</th>
                            {subscriptionPlans.map(p => (
                              <th key={p.id} className="py-3 px-3 text-center">
                                <span className="block font-bold">{p.nom}</span>
                                <span className="text-[10px] text-indigo-700 font-semibold">{formatFCFA(p.prix_fcfa)}/m</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          <tr>
                            <td className="py-3 px-4 font-semibold text-slate-800">Paliers de Chiffre d'Affaires</td>
                            {subscriptionPlans.map(p => (
                              <td key={p.id} className="py-3 px-3 text-center font-bold text-slate-900">
                                {p.tranche_ca_label}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-slate-800">Période d'essai 100% offerte</td>
                            {subscriptionPlans.map(p => (
                              <td key={p.id} className="py-3 px-3 text-center text-emerald-700 font-bold">
                                3 mois gratuits
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-slate-800">Nombre maximum de Biens (Villas, Immeubles, Studios)</td>
                            {subscriptionPlans.map(p => (
                              <td key={p.id} className="py-3 px-3 text-center font-bold text-slate-800">
                                {p.max_logements >= 999 ? 'Illimité' : `${p.max_logements} biens`}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-slate-800">Logements contenus (Appartements & Pièces)</td>
                            {subscriptionPlans.map(p => (
                              <td key={p.id} className="py-3 px-3 text-center font-bold text-slate-800">
                                {p.max_pieces >= 999 ? 'Illimité' : `${p.max_pieces} logements`}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-slate-800">Quittances de loyer certifiées QR Code DISCOM</td>
                            {subscriptionPlans.map(p => (
                              <td key={p.id} className="py-3 px-3 text-center text-emerald-600 font-bold">
                                Illimitées
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-slate-800">Gérants Adjoints & Accréditations d'équipe</td>
                            {subscriptionPlans.map(p => (
                              <td key={p.id} className="py-3 px-3 text-center font-semibold text-slate-700">
                                {p.id === 'plan_ca_starter' ? '1 Gérant' : p.id === 'plan_ca_business' ? '3 Gérants' : 'Illimité'}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-slate-800">Support & Assistance DISCOM</td>
                            {subscriptionPlans.map(p => (
                              <td key={p.id} className="py-3 px-3 text-center font-bold text-indigo-700">
                                {p.criteres_detail?.support_niveau || 'Prioritaire 7j/7'}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: CHECKOUT (DURATION & PAYMENT METHOD SELECTION)                    */}
          {/* ========================================================================= */}
          {step === 'checkout' && (
            <div className="space-y-6">
              {/* Back button & title */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('plans')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour aux forfaits</span>
                </button>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500">Plan sélectionné :</span>
                  <span className="font-bold text-xs sm:text-sm text-indigo-700 ml-1">
                    {selectedPlan.nom} ({formatFCFA(selectedPlan.prix_fcfa)}/mois)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Duration Selector & Payment Mode (7 cols) */}
                <div className="lg:col-span-7 space-y-6">

                  {/* 1. DURATION SELECTOR (MONTHLY & MULTI-MONTHS) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>1. Choisissez la durée de votre abonnement</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Facturation mensuelle avec remises progressives pour plusieurs mois
                        </p>
                      </div>
                    </div>

                    {/* Duration Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { months: 1, label: '1 Mois', discount: 0, badge: 'Standard' },
                        { months: 3, label: '3 Mois', discount: 5, badge: '-5%' },
                        { months: 6, label: '6 Mois', discount: 10, badge: '-10% Éco' },
                        { months: 12, label: '12 Mois (1 An)', discount: 17, badge: '2 mois offerts !' },
                      ].map((item) => {
                        const isSelected = durationMonths === item.months;

                        return (
                          <button
                            key={item.months}
                            type="button"
                            id={`duration-btn-${item.months}m`}
                            onClick={() => setDurationMonths(item.months)}
                            className={`
                              relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between
                              ${isSelected 
                                ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/20 text-indigo-950' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }
                            `}
                          >
                            {item.discount > 0 && (
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded self-start mb-1 ${
                                item.months === 12 
                                  ? 'bg-amber-500 text-white' 
                                  : 'bg-emerald-600 text-white'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                            {item.discount === 0 && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                                {item.badge}
                              </span>
                            )}

                            <div>
                              <span className="font-extrabold text-sm block">{item.label}</span>
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                {formatFCFA(Math.round((selectedPlan.prix_fcfa * item.months * (100 - item.discount)) / 100))}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Months Input option */}
                    <div className="pt-2 flex items-center gap-3 text-xs border-t border-slate-100">
                      <span className="text-slate-600 font-medium">Ou saisissez un nombre de mois personnalisé :</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          id="custom-months-input"
                          min={1}
                          max={36}
                          value={durationMonths}
                          onChange={(e) => setDurationMonths(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 px-2.5 py-1 text-center font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
                        />
                        <span className="text-slate-500">mois</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. PAYMENT METHOD SELECTION */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>2. Moyen de paiement (Cameroun & International)</span>
                    </h4>

                    {/* Payment choices */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* MTN Mobile Money */}
                      <div
                        onClick={() => setPaymentMethod('mtn_momo')}
                        id="payment-method-mtn"
                        className={`
                          p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3
                          ${paymentMethod === 'mtn_momo' 
                            ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                          }
                        `}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 font-black flex items-center justify-center text-[10px] shrink-0 shadow-2xs">
                          MTN
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">MTN Mobile Money</span>
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1 rounded font-mono font-bold">*126#</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Cameroun (Validation instantanée par code PIN)
                          </p>
                        </div>
                      </div>

                      {/* Orange Money */}
                      <div
                        onClick={() => setPaymentMethod('orange_money')}
                        id="payment-method-orange"
                        className={`
                          p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3
                          ${paymentMethod === 'orange_money' 
                            ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                          }
                        `}
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-500 text-white font-black flex items-center justify-center text-[10px] shrink-0 shadow-2xs">
                          OM
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">Orange Money</span>
                            <span className="text-[10px] bg-orange-100 text-orange-900 px-1 rounded font-mono font-bold">*150#</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Cameroun (Notification push sécurisée)
                          </p>
                        </div>
                      </div>

                      {/* Carte Bancaire */}
                      <div
                        onClick={() => setPaymentMethod('carte_bancaire')}
                        id="payment-method-card"
                        className={`
                          p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3
                          ${paymentMethod === 'carte_bancaire' 
                            ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                          }
                        `}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black flex items-center justify-center text-[10px] shrink-0 shadow-2xs">
                          VISA
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">Carte Bancaire</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Visa, Mastercard, UBA, Ecobank
                          </p>
                        </div>
                      </div>

                      {/* Virement Bancaire */}
                      <div
                        onClick={() => setPaymentMethod('virement')}
                        id="payment-method-transfer"
                        className={`
                          p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3
                          ${paymentMethod === 'virement' 
                            ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                          }
                        `}
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 shadow-2xs">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">Virement Bancaire</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Afriland First Bank, SGBC, BICEC
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Inputs corresponding to selected method */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      {(paymentMethod === 'mtn_momo' || paymentMethod === 'orange_money') && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Numéro de téléphone {paymentMethod === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}
                          </label>
                          <div className="relative">
                            <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="tel"
                              id="payment-phone-input"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="+237 6XX XX XX XX"
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>
                              {paymentMethod === 'mtn_momo'
                                ? 'Vous recevrez une invite pour taper votre code secret MTN Mobile Money.'
                                : 'Une notification de débit sera envoyée sur votre compte Orange Money.'
                              }
                            </span>
                          </p>
                        </div>
                      )}

                      {paymentMethod === 'carte_bancaire' && (
                        <div className="space-y-2.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de carte</label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Expiration</label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">CVC</label>
                              <input
                                type="password"
                                maxLength={4}
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'virement' && (
                        <div className="text-xs text-slate-600 space-y-1">
                          <p className="font-bold text-slate-800">Coordonnées DISCOM Cameroun :</p>
                          <p>Banque : <span className="font-mono font-bold">Afriland First Bank Cameroun</span></p>
                          <p>IBAN / RIB : <span className="font-mono font-bold">CM21 10005 00001 01234567890 45</span></p>
                          <p>Titulaire : <span className="font-semibold">DISCOM TECHNOLOGY SARL</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Order Summary & Pay Action (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-0">
                    <h4 className="font-extrabold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                      <span>Récapitulatif de la commande</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {durationMonths} mois
                      </span>
                    </h4>

                    {/* Breakdown items */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Formule souscrite :</span>
                        <span className="font-bold text-slate-900">{selectedPlan.nom}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Prix mensuel de base :</span>
                        <span className="font-semibold text-slate-800">{formatFCFA(selectedPlan.prix_fcfa)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Durée sélectionnée :</span>
                        <span className="font-bold text-slate-900">{durationMonths} mois</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Sous-total brut :</span>
                        <span className="font-semibold text-slate-800">{formatFCFA(rawSubtotal)}</span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between text-emerald-700 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100 font-semibold">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Remise multi-mois ({discountPercent}%) :</span>
                          </span>
                          <span>- {formatFCFA(discountAmount)}</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Total Net à Payer</span>
                          <span className="text-[10px] text-slate-400">Toutes taxes comprises (TTC)</span>
                        </div>
                        <span className="text-2xl font-black text-indigo-900 tracking-tight">
                          {formatFCFA(totalToPay)}
                        </span>
                      </div>
                    </div>

                    {/* Coverage dates banner */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1 text-slate-800 font-bold">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Période de validité :</span>
                      </div>
                      <p>
                        Votre forfait sera actif jusqu'au <strong className="text-indigo-900">{computeExpiryDate(durationMonths)}</strong>.
                      </p>
                    </div>

                    {/* Pay Button */}
                    <button
                      type="button"
                      id="proceed-payment-submit-btn"
                      onClick={handleTriggerPayment}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Payer {formatFCFA(totalToPay)} maintenant</span>
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Paiement 100% sécurisé et certifié par DISCOM Cameroun</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: PROCESSING / PHONE USSD PUSH CONFIRMATION                         */}
          {/* ========================================================================= */}
          {step === 'processing' && (
            <div className="py-12 px-4 max-w-md mx-auto text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                <Smartphone className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">
                  Validation du paiement en cours...
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Une requête de débit sécurisée de <strong>{formatFCFA(totalToPay)}</strong> a été transmise à 
                  <strong> {paymentMethod === 'mtn_momo' ? 'MTN MoMo' : paymentMethod === 'orange_money' ? 'Orange Money' : 'la passerelle bancaire'}</strong>.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 text-left space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <PhoneCall className="w-4 h-4 text-amber-700 animate-bounce" />
                  <span>Action requise sur votre téléphone ({phoneNumber})</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Veuillez consulter l'écran de votre téléphone et saisir votre <strong>code secret Mobile Money</strong> pour confirmer la transaction.
                </p>
                <div className="text-[10px] text-amber-700 font-mono">
                  Échéance dans {processingCountdown} seconde{processingCountdown > 1 ? 's' : ''}...
                </div>
              </div>

              <button
                type="button"
                id="manual-confirm-payment-btn"
                onClick={completePayment}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                J'ai validé le code secret sur mon téléphone
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: OFFICIAL DISCOM INVOICE & RECEIPT                                 */}
          {/* ========================================================================= */}
          {step === 'invoice' && paidSubscription && (
            <div className="space-y-6">
              {/* Success Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
                      Paiement confirmé & Abonnement actif !
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Votre compte bénéficie immédiatement de tous les avantages du <strong>{selectedPlan.nom}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Terminer
                  </button>
                </div>
              </div>

              {/* Printable Official DISCOM Invoice Card */}
              <div 
                id="discom-official-invoice"
                className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-sm space-y-6 max-w-3xl mx-auto"
              >
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-sm">
                        LM
                      </div>
                      <span className="font-black text-lg tracking-tight text-slate-900">
                        DISCOM SAAS CAMEROUN
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Gestion Locative & Immobilière Professionnelle
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Siège : Akwa, Douala • Bastos, Yaoundé • Tél : +237 699 00 00 00
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      NIF : M0123456789 • RCCM : RC/DLA/2024/B/189
                    </p>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full inline-block">
                      ACQUITTÉ & ENREGISTRÉ
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      FACTURE D'ABONNEMENT
                    </h3>
                    <p className="text-xs font-mono font-bold text-indigo-700">
                      N° {paidSubscription.facture_numero}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Date : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Landlord & Transaction Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Bénéficiaire / Propriétaire :
                    </span>
                    <p className="font-bold text-slate-900 text-sm">{currentUser.name}</p>
                    <p className="text-slate-600">{currentUser.entreprise || 'Bailleur Particulier'}</p>
                    <p className="text-slate-500">{currentUser.email}</p>
                    <p className="text-slate-500">{currentUser.phonenumber}</p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Détails de la transaction :
                    </span>
                    <p className="font-mono font-semibold text-slate-800">Réf : {paidSubscription.reference_transaction}</p>
                    <p className="text-slate-600">Mode : {paidSubscription.mode_paiement}</p>
                    <p className="text-slate-600">Compte : {paidSubscription.telephone_paiement}</p>
                    <p className="text-emerald-700 font-bold">Statut : Validé par opérateur</p>
                  </div>
                </div>

                {/* Invoice Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5">Description de la prestation</th>
                        <th className="py-2.5 text-center">Durée</th>
                        <th className="py-2.5 text-right">Prix Unitaire</th>
                        <th className="py-2.5 text-right">Montant Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-3 pr-2">
                          <span className="font-bold text-slate-900 block">
                            Abonnement SaaS DISCOM - {selectedPlan.nom}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Capacité : {selectedPlan.max_logements >= 999 ? 'Illimitée' : `${selectedPlan.max_logements} logements`}, quittances certifiées PDF & WhatsApp
                          </span>
                          <span className="text-[10px] text-indigo-700 font-medium block">
                            Période couverte : Du {paidSubscription.date_debut} au {paidSubscription.date_expiration}
                          </span>
                        </td>
                        <td className="py-3 text-center font-semibold">{paidSubscription.duree_mois || 1} mois</td>
                        <td className="py-3 text-right">{formatFCFA(selectedPlan.prix_fcfa)}</td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {formatFCFA(selectedPlan.prix_fcfa * (paidSubscription.duree_mois || 1))}
                        </td>
                      </tr>

                      {paidSubscription.remise_fcfa && paidSubscription.remise_fcfa > 0 && (
                        <tr className="text-emerald-700">
                          <td colSpan={3} className="py-2 text-right font-semibold">
                            Remise engagement multi-mois :
                          </td>
                          <td className="py-2 text-right font-bold">
                            - {formatFCFA(paidSubscription.remise_fcfa)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900 text-slate-900">
                        <td colSpan={3} className="py-3 text-right font-extrabold text-sm">
                          Total Réglé (FCFA TTC) :
                        </td>
                        <td className="py-3 text-right font-black text-base text-indigo-900">
                          {formatFCFA(paidSubscription.montant_paye_fcfa)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Stamp, QR code & Electronic certification */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 p-1 flex items-center justify-center shrink-0">
                      <QrCode className="w-12 h-12 text-slate-700" />
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <span className="font-bold text-slate-700 block">Certificat Électronique DISCOM</span>
                      <p>Validation cryptographique certifiée</p>
                      <p className="font-mono">ID: {paidSubscription.id}</p>
                    </div>
                  </div>

                  {/* Stamp */}
                  <div className="border-2 border-emerald-600 rounded-xl px-4 py-2 text-center text-emerald-700 rotate-[-2deg] bg-emerald-50/50 shadow-2xs">
                    <span className="text-[10px] font-black uppercase tracking-wider block">DISCOM CAMEROUN</span>
                    <span className="text-xs font-black block">PAYÉ PAR MOBILE MONEY</span>
                    <span className="text-[9px] block text-emerald-600">{paidSubscription.date_debut}</span>
                  </div>
                </div>

                {/* Notice */}
                <p className="text-[10px] text-slate-400 text-center pt-2">
                  Ce document tient lieu de reçu officiel et de facture acquittée pour la comptabilité du bailleur conformément au droit commercial OHADA.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  id="print-sub-receipt-btn"
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger / Imprimer la facture</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const message = `Bonjour, voici le reçu de mon abonnement DISCOM (${selectedPlan.nom} - ${paidSubscription.duree_mois} mois) : Facture N° ${paidSubscription.facture_numero} pour un montant de ${formatFCFA(paidSubscription.montant_paye_fcfa)}.`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Partager sur WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Retour au tableau de bord
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

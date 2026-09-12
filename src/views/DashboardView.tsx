import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  CheckCircle, 
  Wallet, 
  AlertOctagon, 
  TrendingUp, 
  Download, 
  DollarSign, 
  FileText, 
  Wrench, 
  ChevronRight, 
  PieChart as PieIcon, 
  ArrowRight,
  Sparkles,
  CalendarClock,
  CreditCard,
  DoorOpen,
  Users,
  Crown,
  Plus,
  UserPlus,
  ShieldCheck,
  CheckSquare,
  Square,
  UserCheck,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { formatFCFA, formatDateFR } from '../utils/formatters';

interface DashboardViewProps {
  onOpenNewHousing?: () => void;
  onOpenNewPiece?: () => void;
  onOpenNewLease?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewHousing,
  onOpenNewPiece,
  onOpenNewLease
}) => {
  const { 
    logements, 
    pieces, 
    locataires, 
    paiements, 
    setActiveTab, 
    currentUser,
    setIsPlanModalOpen,
    subscriptionPlans,
    subscriptions,
    gerantsAdjoints,
    createGerantAdjoint,
    updateGerantAdjoint
  } = useApp();

  const [isCreateGerantModalOpen, setIsCreateGerantModalOpen] = useState(false);
  const [gerantName, setGerantName] = useState('');
  const [gerantEmail, setGerantEmail] = useState('');
  const [gerantPhone, setGerantPhone] = useState('');
  const [gerantPassword, setGerantPassword] = useState('');
  const [gerantPermissions, setGerantPermissions] = useState({
    gestion_biens: true,
    gestion_logements: true,
    gestion_locataires: true,
    gestion_baux: true,
    enregistrement_paiements: true,
    generation_quittances: true,
    acces_rapports: true,
  });
  const [gerantModalError, setGerantModalError] = useState<string | null>(null);
  const [gerantModalSuccess, setGerantModalSuccess] = useState<string | null>(null);

  const handleCreateGerantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGerantModalError(null);

    if (!gerantName.trim() || !gerantEmail.trim() || !gerantPhone.trim()) {
      setGerantModalError('Veuillez renseigner le nom, l\'email et le numéro de téléphone.');
      return;
    }

    const result = createGerantAdjoint({
      name: gerantName,
      email: gerantEmail,
      phonenumber: gerantPhone,
      password: gerantPassword || 'passer123',
      permissions: gerantPermissions
    });

    if (result.success) {
      setGerantModalSuccess(`Le compte Gérant pour "${gerantName}" a été créé avec succès !`);
      setTimeout(() => {
        setIsCreateGerantModalOpen(false);
        setGerantModalSuccess(null);
        setGerantName('');
        setGerantEmail('');
        setGerantPhone('');
        setGerantPassword('');
      }, 1500);
    } else {
      setGerantModalError(result.error || 'Erreur lors de la création du compte.');
    }
  };

  const userSub = subscriptions.find(s => s.user_id === currentUser.id && s.statut === 'actif');
  const currentPlan = subscriptionPlans.find(p => p.id === currentUser.abonnement_id) || subscriptionPlans[1];

  const [timeRange, setTimeRange] = useState<'6mois' | 'annee'>('6mois');

  // Filter active housing
  const activeLogements = logements.filter(l => !l.is_archived);
  const totalLogementsCount = activeLogements.length;

  const totalPieces = pieces.length;
  const occupiedPieces = pieces.filter(p => p.statut === 'occupee').length;
  const occupancyRate = totalPieces > 0 ? Math.round((occupiedPieces / totalPieces) * 100) : 0;

  // Tenant counts
  const totalLocataires = locataires.length;
  const activeLocataires = locataires.filter(l => l.statut === 'actif').length;
  const locatairesWithArrears = locataires.filter(l => (l.arrieres_montant || 0) > 0);
  const totalArrearsCount = locatairesWithArrears.length;
  const totalArrearsAmount = locatairesWithArrears.reduce((sum, l) => sum + (l.arrieres_montant || 0), 0);
  const locatairesAJourCount = activeLocataires - totalArrearsCount;

  // Payments for current month (March 2026)
  const currentMonthStr = '2026-03';
  const currentMonthPaiements = paiements.filter(p => p.mois_concerne === currentMonthStr);
  const totalEncaisseMois = currentMonthPaiements
    .filter(p => p.statut === 'paye' || p.statut === 'partiel')
    .reduce((sum, p) => sum + p.montant_recu, 0);

  const totalAttenduMois = currentMonthPaiements.reduce((sum, p) => sum + p.montant_attendu, 0);
  const recoveryRate = totalAttenduMois > 0 ? Math.round((totalEncaisseMois / totalAttenduMois) * 100) : 100;

  // Vacant units
  const vacantUnitsCount = pieces.filter(p => p.statut === 'libre').length;

  // Payment modes breakdown data for circular pie chart
  const paymentModesData = React.useMemo(() => {
    const validPayments = paiements.filter(p => p.statut === 'paye' || p.statut === 'partiel');
    const counts: Record<string, { montant: number; count: number; label: string; color: string }> = {
      'orange_money': { montant: 0, count: 0, label: 'Orange Money (*150#)', color: '#ea580c' },
      'mtn_momo': { montant: 0, count: 0, label: 'MTN MoMo (*126#)', color: '#eab308' },
      'mobile_money': { montant: 0, count: 0, label: 'Autre Mobile Money', color: '#f97316' },
      'virement': { montant: 0, count: 0, label: 'Virement Bancaire', color: '#2563eb' },
      'especes': { montant: 0, count: 0, label: 'Espèces / Cash', color: '#10b981' },
      'cheque': { montant: 0, count: 0, label: 'Chèque Bancaire', color: '#8b5cf6' },
    };

    validPayments.forEach(p => {
      const mode = p.mode_paiement;
      const op = p.operateur_mobile?.toLowerCase() || '';

      if (mode === 'mobile_money' || op.includes('orange') || op.includes('mtn')) {
        if (op.includes('orange') || op.includes('om')) {
          counts['orange_money'].montant += p.montant_recu;
          counts['orange_money'].count += 1;
        } else if (op.includes('mtn') || op.includes('momo')) {
          counts['mtn_momo'].montant += p.montant_recu;
          counts['mtn_momo'].count += 1;
        } else {
          counts['mobile_money'].montant += p.montant_recu;
          counts['mobile_money'].count += 1;
        }
      } else if (counts[mode]) {
        counts[mode].montant += p.montant_recu;
        counts[mode].count += 1;
      } else {
        counts['especes'].montant += p.montant_recu;
        counts['especes'].count += 1;
      }
    });

    const totalEncaisseAll = Object.values(counts).reduce((sum, c) => sum + c.montant, 0) || 1;

    return Object.entries(counts)
      .filter(([_, data]) => data.montant > 0 || data.count > 0)
      .map(([key, data]) => ({
        id: key,
        name: data.label,
        value: data.montant,
        count: data.count,
        percentage: Math.round((data.montant / totalEncaisseAll) * 100),
        color: data.color
      }));
  }, [paiements]);

  // Fallback data if no payments yet
  const displayPaymentModes = paymentModesData.length > 0 ? paymentModesData : [
    { id: 'orange_money', name: 'Orange Money (*150#)', value: 1650000, count: 8, percentage: 48, color: '#ea580c' },
    { id: 'mtn_momo', name: 'MTN MoMo (*126#)', value: 980000, count: 5, percentage: 29, color: '#eab308' },
    { id: 'virement', name: 'Virement Bancaire', value: 520000, count: 2, percentage: 15, color: '#2563eb' },
    { id: 'especes', name: 'Espèces / Cash', value: 275000, count: 2, percentage: 8, color: '#10b981' }
  ];

  // Revenue evolution data
  const monthlyRevenueData = [
    { mois: 'Oct', attendu: 2600000, encaisse: 2450000, label: 'Octobre 2025' },
    { mois: 'Nov', attendu: 2750000, encaisse: 2700000, label: 'Novembre 2025' },
    { mois: 'Déc', attendu: 2900000, encaisse: 2850000, label: 'Décembre 2025' },
    { mois: 'Jan', attendu: 2900000, encaisse: 2700000, label: 'Janvier 2026' },
    { mois: 'Fév', attendu: 3045000, encaisse: 2970000, label: 'Février 2026' },
    { mois: 'Mar', attendu: totalAttenduMois || 3045000, encaisse: totalEncaisseMois || 2975000, label: 'Mars 2026 (En cours)' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Row with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Tableau de Bord & Supervision
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
              <Sparkles className="w-3 h-3" /> {currentUser.entreprise || currentUser.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi temps réel du parc immobilier à Douala et Yaoundé, recouvrement des loyers et alertes
          </p>
        </div>

        {currentUser.role === 'bailleur' && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {gerantsAdjoints && gerantsAdjoints.length >= 1 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled
                  id="btn-creer-gerant-adjoint-disabled"
                  className="px-3.5 py-2 bg-slate-100 text-slate-400 border border-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-not-allowed opacity-80"
                  title="Limite atteinte : Le compte Bailleur est limité à un seul (1) Gérant actif. Le bouton est automatiquement désactivé."
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Gérant Actif (1/1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gerants')}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Accéder à la gestion détaillée des accès et permissions du Gérant"
                >
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Gérer les accès</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-creer-gerant-adjoint"
                onClick={() => setIsCreateGerantModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Créer un Gérant</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Landlord Subscription Status Banner */}
      {currentUser.role === 'bailleur' && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-xl shadow-xs border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  Formule Active : {currentPlan.nom} ({formatFCFA(currentPlan.prix_fcfa)}/mois)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Valide
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Biens : <strong className="text-white">{totalLogementsCount}</strong> / {currentPlan.max_logements >= 999 ? 'Illimités' : currentPlan.max_logements}
                </span>
                <span>•</span>
                <span>
                  Logements : <strong className="text-white">{totalPieces}</strong> / {currentPlan.max_pieces >= 999 ? 'Illimités' : currentPlan.max_pieces}
                </span>
                <span>•</span>
                <span>
                  Échéance : <strong className="text-indigo-200">
                    {userSub?.date_expiration ? new Date(userSub.date_expiration).toLocaleDateString('fr-FR') : 'Accès illimité'}
                  </strong>
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gérant Session Banner */}
      {currentUser.role === 'gerant_adjoint' && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-xl shadow-xs border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  Espace Gérant — Session Déléguée
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Parité d'accès active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Vous disposez de l'ensemble des prérogatives de gestion locative. Toutes vos actions sont tracées et visibles par le Bailleur dans son journal d'activités.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Encaissé ce mois */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Encaissé ce mois
              </span>
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-lg font-extrabold text-emerald-700 block mt-2">
              {formatFCFA(totalEncaisseMois)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Sur {formatFCFA(totalAttenduMois)} ({recoveryRate}%)
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-emerald-700 font-semibold">Recouvrement</span>
            <span className="font-bold text-slate-700">{recoveryRate}%</span>
          </div>
        </div>

        {/* 2. Taux d'occupation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Occupation
              </span>
              <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-lg font-extrabold text-slate-800 block mt-2">
              {occupancyRate}%
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {occupiedPieces} occupés / {totalPieces} lots
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">{vacantUnitsCount} vacants</span>
            <button onClick={() => setActiveTab('pieces')} className="text-indigo-600 font-semibold hover:underline cursor-pointer">
              Logements
            </button>
          </div>
        </div>

        {/* 3. Nombre de Locataires (Demandé explicitement) */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs flex flex-col justify-between ring-1 ring-indigo-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                Total Locataires
              </span>
              <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-lg font-extrabold text-indigo-900">
                {activeLocataires}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                actifs ({totalLocataires} total)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {locatairesAJourCount} à jour · {totalArrearsCount} en retard
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-indigo-600 font-semibold">{totalLocataires} enregistrés</span>
            <button onClick={() => setActiveTab('locataires')} className="text-indigo-600 font-bold hover:underline cursor-pointer">
              Gérer
            </button>
          </div>
        </div>

        {/* 4. Arriérés / Impayés */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Impayés
              </span>
              <div className="w-7 h-7 rounded-md bg-red-50 text-red-600 flex items-center justify-center">
                <AlertOctagon className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-lg font-extrabold text-red-700 block mt-2">
              {formatFCFA(totalArrearsAmount)}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {totalArrearsCount} locataire(s) retardataires
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-red-700 font-semibold">Relances</span>
            <button onClick={() => setActiveTab('echeancier')} className="text-red-700 font-bold hover:underline cursor-pointer">
              Relancer
            </button>
          </div>
        </div>

        {/* 5. Patrimoine géré */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Patrimoine
              </span>
              <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                <DoorOpen className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-lg font-extrabold text-slate-800 block mt-2">
              {totalLogementsCount} Biens
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {totalPieces} logements locatifs
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Immeubles, Villas</span>
            <button onClick={() => setActiveTab('logements')} className="text-indigo-600 font-semibold hover:underline cursor-pointer">
              Biens
            </button>
          </div>
        </div>
      </div>

      {/* Dual Analytics Grid: Revenue Evolution (Bars) & Payment Modes (Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Revenue Evolution (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Évolution des Recettes Locatives (FCFA)
                </h2>
                <p className="text-[11px] text-slate-400">Comparatif des encaissements réels vs attendus sur 6 mois</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                +18.5% croissance
              </span>
            </div>

            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000000}M`} />
                  <Tooltip formatter={(val: any) => [formatFCFA(Number(val)), 'Montant']} />
                  <Bar dataKey="attendu" name="Attendu" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="encaisse" name="Encaissé" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 mt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-300" />
              <span>Loyers Attendus</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-600" />
              <span>Loyers Encaissés Réellement</span>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Modes Circular Diagram (Pie Chart) (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-indigo-600" />
                  <span>Statistiques par Mode de Paiement</span>
                </h2>
                <p className="text-[11px] text-slate-400">Répartition des encaissements (Mobile Money, Virement, Cash)</p>
              </div>
            </div>

            {/* Circular Pie Chart */}
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPaymentModes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {displayPaymentModes.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [
                      `${formatFCFA(Number(val))}`, 
                      'Montant encaissé'
                    ]} 
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Centered label inside donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Encaissé</span>
                <span className="text-xs font-extrabold text-slate-800">
                  {formatFCFA(displayPaymentModes.reduce((sum, d) => sum + d.value, 0))}
                </span>
              </div>
            </div>

            {/* Detailed Legend & Breakdown */}
            <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
              {displayPaymentModes.map((mode) => (
                <div key={mode.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: mode.color }} 
                    />
                    <span className="font-semibold text-slate-700">{mode.name}</span>
                    <span className="text-[10px] text-slate-400">({mode.count} trans.)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{formatFCFA(mode.value)}</span>
                    <span className="text-[10px] text-indigo-600 font-bold ml-1.5">({mode.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Passerelles actives : Orange Money & MTN MoMo</span>
            <button 
              onClick={() => setActiveTab('paiements')} 
              className="text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Voir détails paiements</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Créer un Gérant */}
      {isCreateGerantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden my-4">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-indigo-200">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    Créer un Gérant
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Limite stricte : 1 seul Gérant par compte Bailleur
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateGerantModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGerantSubmit} className="p-4 sm:p-5 space-y-4">
              {gerantModalError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{gerantModalError}</span>
                </div>
              )}

              {gerantModalSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{gerantModalSuccess}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nom complet du Gérant : *
                  </label>
                  <input
                    type="text"
                    value={gerantName}
                    onChange={(e) => setGerantName(e.target.value)}
                    placeholder="Ex: Jean-Paul Kamga"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email de connexion : *
                    </label>
                    <input
                      type="email"
                      value={gerantEmail}
                      onChange={(e) => setGerantEmail(e.target.value)}
                      placeholder="gerant@domaine.cm"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Téléphone mobile : *
                    </label>
                    <input
                      type="tel"
                      value={gerantPhone}
                      onChange={(e) => setGerantPhone(e.target.value)}
                      placeholder="+237 699 00 00 00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mot de passe initial :
                  </label>
                  <input
                    type="password"
                    value={gerantPassword}
                    onChange={(e) => setGerantPassword(e.target.value)}
                    placeholder="Par défaut : passer123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Configuration des accès et permissions */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-bold text-slate-900 text-xs">
                      Attribution des Accès & Périmètre :
                    </label>
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                      Parité totale par défaut
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    NB : Le Gérant possède par défaut tous les mêmes accès que vous (le Bailleur). Vous pouvez cocher ou décocher chaque accès pour lui donner ou lui retirer des autorisations :
                  </p>

                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {[
                      { key: 'gestion_biens', label: 'Gestion des Biens & Immeubles' },
                      { key: 'gestion_logements', label: 'Gestion des Logements & Pièces' },
                      { key: 'gestion_locataires', label: 'Gestion des Locataires' },
                      { key: 'gestion_baux', label: 'Gestion des Baux & Contrats' },
                      { key: 'enregistrement_paiements', label: 'Enregistrement des Paiements' },
                      { key: 'generation_quittances', label: 'Génération & Téléchargement des Quittances' },
                      { key: 'acces_rapports', label: 'Consultation des Rapports Financiers' },
                    ].map((perm) => {
                      const isChecked = gerantPermissions[perm.key as keyof typeof gerantPermissions];
                      return (
                        <label
                          key={perm.key}
                          className="flex items-center justify-between p-1.5 rounded hover:bg-white cursor-pointer transition-colors"
                        >
                          <span className="text-xs font-medium text-slate-700">{perm.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setGerantPermissions(prev => ({
                                ...prev,
                                [perm.key]: e.target.checked
                              }));
                            }}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateGerantModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Confirmer la Création</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Paiement, PaymentMode, Subscription } from '../types';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  FileText, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Building, 
  User, 
  X,
  Smartphone,
  Check,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  TrendingUp,
  ExternalLink,
  Users,
  Calendar
} from 'lucide-react';
import { formatFCFA, formatDateFR, formatMonthYear } from '../utils/formatters';

export const PaiementsView: React.FC = () => {
  const { 
    paiements, 
    locataires, 
    logements, 
    pieces, 
    baux, 
    subscriptions,
    subscriptionPlans,
    allUsers,
    quickTogglePayment, 
    recordPayment, 
    setSelectedQuittancePaiement,
    currentUser 
  } = useApp();

  // State for Landlord view
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-03');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedLogementFilter, setSelectedLogementFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paye' | 'partiel' | 'impaye'>('all');
  const [sortBy, setSortBy] = useState<'bien_logement_locataire' | 'bien' | 'logement_locataire' | 'statut' | 'montant'>('bien_logement_locataire');

  // Manual payment modal state (Landlord) - Ordered by 1- Bien, 2- Logement - Nom Locataire Occupant
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [paymentTypeOption, setPaymentTypeOption] = useState<'standard' | 'tranche' | 'multi_mois'>('standard');
  const [recordBienId, setRecordBienId] = useState<string>(logements[0]?.id || '');
  const [recordPieceId, setRecordPieceId] = useState<string>('');
  const [selectedLocataireId, setSelectedLocataireId] = useState(locataires[0]?.id || '');
  const [recordMontant, setRecordMontant] = useState(300000);
  const [recordMode, setRecordMode] = useState<PaymentMode>('mtn_money');
  const [ticketNumero, setTicketNumero] = useState<string>(() => `TK-202603-${Math.floor(1000 + Math.random() * 9000)}`);
  const [recordRef, setRecordRef] = useState('');
  const [recordComment, setRecordComment] = useState('');

  // Transaction reference calculation function of (Payment Mode and Ticket Number)
  const computeTransactionRef = (mode: string, ticketNum: string) => {
    const modeKey = mode.toUpperCase().replace(/\s+/g, '_');
    return `${modeKey}-${ticketNum}`;
  };

  const generateNewTicketNum = () => {
    const num = `TK-${selectedMonth.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketNumero(num);
    setRecordRef(computeTransactionRef(recordMode, num));
  };

  // Installment (Tranche) specific fields
  const [trancheNumero, setTrancheNumero] = useState<number>(1);
  const [trancheDateLimite, setTrancheDateLimite] = useState<string>('2026-03-25');

  // Multiple-month specific fields
  const [multiMoisCount, setMultiMoisCount] = useState<number>(3);
  const [recordDatePaiement, setRecordDatePaiement] = useState<string>(new Date().toISOString().split('T')[0]);

  // State for SuperAdmin Subscriptions view
  const [subFilterStatus, setSubFilterStatus] = useState<'all' | 'actif' | 'expire' | 'en_attente'>('all');
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedBailleurId, setSelectedBailleurId] = useState(allUsers.find(u => u.role === 'bailleur')?.id || '');
  const [selectedPlanId, setSelectedPlanId] = useState('plan_pro');
  const [renewMethod, setRenewMethod] = useState('MTN Mobile Money Cameroun');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active tenants for landlord
  const activeLocataires = locataires.filter(l => l.statut === 'actif');

  // Navigate months
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  // -------------------------------------------------------------
  // SUPERADMIN VIEW : GESTION DES PAIEMENTS D'ABONNEMENTS BAILLEURS
  // -------------------------------------------------------------
  if (currentUser.role === 'superadmin') {
    const bailleurs = allUsers.filter(u => u.role === 'bailleur');
    
    // SaaS Metrics
    const totalAbonnesActifs = subscriptions.filter(s => s.statut === 'actif').length;
    const totalRevenusAbonnements = subscriptions.reduce((sum, s) => sum + s.montant_paye_fcfa, 0);
    const forfaitsProCount = subscriptions.filter(s => s.plan_id === 'plan_pro').length;
    const forfaitsStarterCount = subscriptions.filter(s => s.plan_id === 'plan_starter').length;

    const filteredSubscriptions = subscriptions.filter(sub => {
      if (subFilterStatus !== 'all' && sub.statut !== subFilterStatus) return false;
      const user = allUsers.find(u => u.id === sub.user_id);
      if (searchFilter && !user?.name.toLowerCase().includes(searchFilter.toLowerCase()) && !user?.entreprise?.toLowerCase().includes(searchFilter.toLowerCase())) {
        return false;
      }
      return true;
    });

    const handleConfirmRenewal = (e: React.FormEvent) => {
      e.preventDefault();
      const bailleur = allUsers.find(u => u.id === selectedBailleurId);
      const plan = subscriptionPlans.find(p => p.id === selectedPlanId);
      setToastMessage(`Abonnement ${plan?.nom} activé avec succès pour ${bailleur?.name} via ${renewMethod} !`);
      setIsRenewModalOpen(false);
      setTimeout(() => setToastMessage(null), 5000);
    };

    return (
      <div className="space-y-6">
        {/* Header SuperAdmin */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h1 className="text-xl font-bold tracking-tight">
                Paiements & Abonnements DISCOM SaaS
              </h1>
            </div>
            <p className="text-xs text-slate-300">
              Gestion des souscriptions, encaissements des forfaits et renouvellements des bailleurs au Cameroun
            </p>
          </div>

          <button 
            onClick={() => setIsRenewModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer un Règlement de Forfait</span>
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Global SaaS Subscriptions KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Encaissé Abonnements
            </span>
            <span className="text-xl font-extrabold text-emerald-700 block mt-1">
              {formatFCFA(totalRevenusAbonnements)}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +24% vs trimestre précédent
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Bailleurs Abonnés Actifs
            </span>
            <span className="text-xl font-extrabold text-slate-800 block mt-1">
              {totalAbonnesActifs} Bailleurs
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Sur {bailleurs.length} bailleurs enregistrés
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Répartition des Forfaits
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                Pro : {forfaitsProCount}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded">
                Starter : {forfaitsStarterCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1.5 block">
              Panier moyen : 35 000 FCFA/mois
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Passerelles Utilisées
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                MTN MoMo (62%)
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-orange-50 text-orange-800 border border-orange-200 rounded">
                Orange Money (38%)
              </span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text"
              placeholder="Rechercher un bailleur, une entreprise ou un numéro de reçu..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={subFilterStatus}
              onChange={(e) => setSubFilterStatus(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Abonnements Actifs</option>
              <option value="expire">Abonnements Expirés</option>
            </select>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Historique des Souscriptions & Renouvellements ({filteredSubscriptions.length})
            </h2>
            <span className="text-xs text-slate-500 font-medium">DISCOM SaaS Cameroun</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Bailleur Abonné</th>
                  <th className="py-2.5 px-3">Forfait</th>
                  <th className="py-2.5 px-3 text-right">Montant Réglé</th>
                  <th className="py-2.5 px-3 text-center">Période de Validité</th>
                  <th className="py-2.5 px-3">Moyen de Paiement</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSubscriptions.map((sub) => {
                  const user = allUsers.find(u => u.id === sub.user_id);
                  const plan = subscriptionPlans.find(p => p.id === sub.plan_id);
                  const isExpired = sub.statut === 'expire';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                            alt="" 
                            className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" 
                          />
                          <div>
                            <p className="font-bold text-slate-800">{user?.name || 'Bailleur'}</p>
                            <p className="text-[11px] text-slate-500">{user?.entreprise} • {user?.ville || 'Douala'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {plan?.nom || 'Forfait'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatFCFA(sub.montant_paye_fcfa)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        <span className="block">{formatDateFR(sub.date_debut)}</span>
                        <span className="text-[11px] text-slate-400 font-medium">au {formatDateFR(sub.date_expiration)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-medium flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          {sub.mode_paiement}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          sub.statut === 'actif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sub.statut === 'actif' ? 'Actif' : 'Expiré'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedBailleurId(sub.user_id);
                            setSelectedPlanId(sub.plan_id);
                            setIsRenewModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          Renouveler
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Renew SuperAdmin */}
        {isRenewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-base text-slate-800">
                  Enregistrer un Règlement de Forfait SaaS
                </h3>
                <button 
                  onClick={() => setIsRenewModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmRenewal} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Bailleur Bénéficiaire :
                  </label>
                  <select 
                    value={selectedBailleurId}
                    onChange={(e) => setSelectedBailleurId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {bailleurs.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.entreprise || 'Particulier'}) - {b.ville}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Forfait DISCOM :
                    </label>
                    <select 
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      {subscriptionPlans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nom} - {formatFCFA(p.prix_fcfa)}/mois
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Moyen de Règlement :
                    </label>
                    <select 
                      value={renewMethod}
                      onChange={(e) => setRenewMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="MTN Mobile Money Cameroun">MTN Mobile Money (*126#)</option>
                      <option value="Orange Money Cameroun">Orange Money (*150#)</option>
                      <option value="Virement Afriland First Bank">Virement Afriland First Bank</option>
                      <option value="Virement SGBC Cameroun">Virement SGBC Cameroun</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsRenewModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Valider l'Abonnement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // BAILLEUR VIEW : SUIVI DES PAIEMENTS DE LOYERS & QUITTANCES
  // -------------------------------------------------------------
  const currentMonthPaiements = paiements.filter(p => p.mois_concerne === selectedMonth);
  const totalEncaisse = currentMonthPaiements
    .filter(p => p.statut === 'paye' || p.statut === 'partiel')
    .reduce((sum, p) => sum + p.montant_recu, 0);

  const totalAttendu = currentMonthPaiements.reduce((sum, p) => sum + p.montant_attendu, 0);
  const totalImpayes = Math.max(0, totalAttendu - totalEncaisse);

  // Insolvency calculations per property (Bien) for the selected period
  const getBienInsolvencyStats = (bienId: string) => {
    const pays = currentMonthPaiements.filter(p => p.logement_id === bienId);
    const insolvents = pays.filter(p => p.statut === 'impaye' || p.statut === 'partiel');
    const insolventCount = insolvents.length;
    const arrieres = insolvents.reduce((sum, p) => sum + (p.montant_attendu - p.montant_recu), 0);
    const totalUnits = pieces.filter(p => p.logement_id === bienId).length;
    return {
      insolventCount,
      totalUnits,
      arrieres,
      isInsolvent: insolventCount > 0
    };
  };

  const totalLogementsInsolvablesMonth = currentMonthPaiements.filter(
    p => p.statut === 'impaye' || p.statut === 'partiel'
  ).length;

  const selectedBien = logements.find(l => l.id === selectedLogementFilter);
  const selectedBienStats = selectedBien ? getBienInsolvencyStats(selectedBien.id) : null;

  // Compute consecutive months for multiple-month payments
  const computeConsecutiveMonths = (startMonth: string, count: number): string[] => {
    const result: string[] = [];
    const [y, m] = startMonth.split('-').map(Number);
    for (let i = 0; i < count; i++) {
      const d = new Date(y, m - 1 + i, 1);
      result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return result;
  };

  // Compute consecutive period starting from payment day (not 1st of the week/month)
  const computePeriodDates = (paymentDateStr: string, count: number) => {
    if (!paymentDateStr || count <= 0) {
      const today = new Date().toISOString().split('T')[0];
      return {
        startDateStr: today,
        endDateStr: today,
        display: `1 Mois`,
        displayLong: `1 Mois`
      };
    }

    const startDate = new Date(paymentDateStr);
    const validStartDate = isNaN(startDate.getTime()) ? new Date() : startDate;

    // End date is count months ahead minus 1 day
    const endDate = new Date(validStartDate);
    endDate.setMonth(endDate.getMonth() + count);
    endDate.setDate(endDate.getDate() - 1);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startDay = pad(validStartDate.getDate());
    const startMonth = pad(validStartDate.getMonth() + 1);
    const startYear = validStartDate.getFullYear();

    const endDay = pad(endDate.getDate());
    const endMonth = pad(endDate.getMonth() + 1);
    const endYear = endDate.getFullYear();

    const frenchMonthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const display = `Du ${startDay}/${startMonth}/${startYear} au ${endDay}/${endMonth}/${endYear} (${count} ${count > 1 ? 'Mois' : 'Mois'})`;
    const displayLong = `Du ${validStartDate.getDate()} ${frenchMonthNames[validStartDate.getMonth()]} ${startYear} au ${endDate.getDate()} ${frenchMonthNames[endDate.getMonth()]} ${endYear} (${count} Mois)`;

    return {
      startDateStr: `${startYear}-${startMonth}-${startDay}`,
      endDateStr: `${endYear}-${endMonth}-${endDay}`,
      display,
      displayLong
    };
  };

  const computePeriodDisplayString = (paymentDateStr: string, count: number) => {
    return computePeriodDates(paymentDateStr, count).display;
  };

  const plannedMultiMonths = computeConsecutiveMonths(selectedMonth, multiMoisCount);

  // Filtered payments
  const filteredPaiements = currentMonthPaiements.filter(p => {
    if (statusFilter !== 'all' && p.statut !== statusFilter) return false;
    if (selectedLogementFilter !== 'all' && p.logement_id !== selectedLogementFilter) return false;
    if (searchFilter) {
      const loc = locataires.find(l => l.id === p.locataire_id);
      const log = logements.find(l => l.id === p.logement_id);
      const piece = pieces.find(item => item.id === p.piece_id);
      const str = `${loc?.nom_complet || ''} ${log?.nom || ''} ${piece?.nom || ''} ${p.reference_recu || ''}`.toLowerCase();
      if (!str.includes(searchFilter.toLowerCase())) return false;
    }
    return true;
  });

  // Sorting logic: 1- Bien, 2- Logement-Nom Locataire Occupant
  const sortedPaiements = [...filteredPaiements].sort((a, b) => {
    const locA = locataires.find(l => l.id === a.locataire_id);
    const locB = locataires.find(l => l.id === b.locataire_id);
    const logA = logements.find(l => l.id === a.logement_id);
    const logB = logements.find(l => l.id === b.logement_id);
    const pieceA = pieces.find(p => p.id === a.piece_id);
    const pieceB = pieces.find(p => p.id === b.piece_id);

    if (sortBy === 'bien_logement_locataire') {
      const bienComp = (logA?.nom || '').localeCompare(logB?.nom || '');
      if (bienComp !== 0) return bienComp;
      const pieceAStr = `${pieceA?.numero || ''} ${pieceA?.nom || ''}`.trim();
      const pieceBStr = `${pieceB?.numero || ''} ${pieceB?.nom || ''}`.trim();
      const pieceComp = pieceAStr.localeCompare(pieceBStr);
      if (pieceComp !== 0) return pieceComp;
      return (locA?.nom_complet || '').localeCompare(locB?.nom_complet || '');
    }

    if (sortBy === 'bien') {
      const bienComp = (logA?.nom || '').localeCompare(logB?.nom || '');
      if (bienComp !== 0) return bienComp;
      return (pieceA?.nom || '').localeCompare(pieceB?.nom || '');
    }

    if (sortBy === 'logement_locataire') {
      const keyA = `${pieceA?.nom || ''} - ${locA?.nom_complet || ''}`.toLowerCase();
      const keyB = `${pieceB?.nom || ''} - ${locB?.nom_complet || ''}`.toLowerCase();
      return keyA.localeCompare(keyB);
    }

    if (sortBy === 'statut') {
      const score = (s: string) => (s === 'impaye' ? 0 : s === 'partiel' ? 1 : 2);
      return score(a.statut) - score(b.statut);
    }

    if (sortBy === 'montant') {
      return b.montant_recu - a.montant_recu;
    }

    return 0;
  });

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = locataires.find(l => l.id === selectedLocataireId);
    if (!loc) return;

    const selectedPiece = pieces.find(p => p.id === recordPieceId);
    const bail = baux.find(b => b.locataire_id === loc.id && b.statut === 'actif');
    const loyerMensuelBase = bail 
      ? (bail.montant_loyer_fcfa + bail.montant_charges_fcfa) 
      : selectedPiece 
      ? (selectedPiece.loyer_reference + (selectedPiece.charges_incluses || 0)) 
      : 300000;

    let loyerTotalAttendu = loyerMensuelBase;
    let moisSoldesArray: string[] | undefined = undefined;
    let moisSoldesLabelsStr: string | undefined = undefined;
    let soldeRestantCalculated = 0;
    const periodData = computePeriodDates(recordDatePaiement, multiMoisCount);

    if (paymentTypeOption === 'multi_mois') {
      loyerTotalAttendu = loyerMensuelBase * multiMoisCount;
      moisSoldesArray = plannedMultiMonths;
      moisSoldesLabelsStr = periodData.display;
    } else if (paymentTypeOption === 'tranche') {
      soldeRestantCalculated = Math.max(0, loyerTotalAttendu - recordMontant);
    }

    let statut: 'paye' | 'partiel' | 'impaye' = 'paye';
    if (recordMontant < loyerTotalAttendu && recordMontant > 0) statut = 'partiel';
    else if (recordMontant === 0) statut = 'impaye';

    const currentTicketNo = ticketNumero || `TK-${selectedMonth.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalTxRef = computeTransactionRef(recordMode, currentTicketNo);

    const newPayId = `pay_${Date.now()}`;
    const newPay: Paiement = {
      id: newPayId,
      bailleur_id: currentUser.id,
      locataire_id: loc.id,
      piece_id: selectedPiece?.id || loc.piece_id,
      piece_ids: selectedPiece ? [selectedPiece.id] : (loc.piece_ids || (bail?.piece_ids ? bail.piece_ids : undefined)),
      logement_id: recordBienId || loc.logement_id,
      mois_concerne: selectedMonth,
      annee: parseInt(selectedMonth.split('-')[0]),
      montant_attendu: loyerTotalAttendu,
      montant_recu: recordMontant,
      date_paiement: recordDatePaiement || new Date().toISOString().split('T')[0],
      periode_debut: paymentTypeOption === 'multi_mois' ? periodData.startDateStr : undefined,
      periode_fin: paymentTypeOption === 'multi_mois' ? periodData.endDateStr : undefined,
      nb_mois_regles: paymentTypeOption === 'multi_mois' ? multiMoisCount : 1,
      mode_paiement: recordMode,
      operateur_mobile: recordMode === 'mtn_money' ? 'MTN Mobile Money Cameroun' : recordMode === 'orange_money' ? 'Orange Money Cameroun' : undefined,
      statut: statut,
      reference_recu: finalTxRef,
      quittance_numero: currentTicketNo,
      date_creation: new Date().toISOString().split('T')[0],
      commentaire: recordComment || (paymentTypeOption === 'tranche' 
        ? `Acompte Tranche ${trancheNumero}. Solde restant: ${formatFCFA(soldeRestantCalculated)}.` 
        : paymentTypeOption === 'multi_mois' 
        ? `Paiement groupé de ${multiMoisCount} mois (${periodData.display}).` 
        : undefined),
      type_paiement: paymentTypeOption,
      tranche_numero: paymentTypeOption === 'tranche' ? trancheNumero : undefined,
      tranche_total_prevu: paymentTypeOption === 'tranche' ? loyerTotalAttendu : undefined,
      tranche_solde_restant: paymentTypeOption === 'tranche' ? soldeRestantCalculated : undefined,
      tranche_date_limite: paymentTypeOption === 'tranche' ? trancheDateLimite : undefined,
      mois_soldes: moisSoldesArray,
      mois_soldes_labels: moisSoldesLabelsStr
    };

    recordPayment(newPay);
    setIsRecordModalOpen(false);
    
    // Propose the quittance modal automatically
    if (statut === 'paye' || statut === 'partiel') {
      setSelectedQuittancePaiement(newPay);
    }
  };

  const handleOpenRecordModal = () => {
    const defaultBien = logements[0]?.id || '';
    setRecordBienId(defaultBien);
    const bienPieces = pieces.filter(p => p.logement_id === defaultBien);
    const firstPiece = bienPieces[0];
    const occupant = firstPiece ? (
      locataires.find(l => 
        l.id === firstPiece.current_locataire_id || 
        l.piece_id === firstPiece.id || 
        (l.piece_ids && l.piece_ids.includes(firstPiece.id))
      ) || locataires.find(l => {
        const b = baux.find(lease => lease.locataire_id === l.id && lease.statut === 'actif');
        return b && (b.piece_id === firstPiece.id || (b.piece_ids && b.piece_ids.includes(firstPiece.id)));
      })
    ) : null;

    setRecordPieceId(firstPiece?.id || '');
    const activeOccupant = occupant || activeLocataires[0];
    setSelectedLocataireId(activeOccupant?.id || '');

    const newTicket = `TK-${selectedMonth.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketNumero(newTicket);
    setRecordRef(computeTransactionRef(recordMode, newTicket));

    const b = activeOccupant ? baux.find(item => item.locataire_id === activeOccupant.id && item.statut === 'actif') : null;
    const monthly = b 
      ? (b.montant_loyer_fcfa + b.montant_charges_fcfa) 
      : firstPiece 
      ? (firstPiece.loyer_reference + (firstPiece.charges_incluses || 0)) 
      : 300000;
    setRecordMontant(monthly);

    setIsRecordModalOpen(true);
  };

  const handleDirectWhatsAppShare = (pay: Paiement) => {
    setSelectedQuittancePaiement(pay);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Paiements, Quittances & Reçus WhatsApp
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Validation des encaissements, téléchargement de reçus certifiés et transmission directe WhatsApp aux locataires
          </p>
        </div>

        <button 
          onClick={handleOpenRecordModal}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Enregistrer un Paiement</span>
        </button>
      </div>

      {/* Month Navigation & Summary Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
          <button 
            onClick={handlePrevMonth}
            className="p-1 hover:bg-white rounded text-slate-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-xs uppercase text-slate-800 tracking-wide min-w-[130px] text-center">
            {formatMonthYear(selectedMonth)}
          </span>

          <button 
            onClick={handleNextMonth}
            className="p-1 hover:bg-white rounded text-slate-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Metrics Pill */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Encaissé
            </span>
            <span className="font-extrabold text-xs text-emerald-700">
              {formatFCFA(totalEncaisse)}
            </span>
          </div>

          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Attendu
            </span>
            <span className="font-extrabold text-xs text-slate-800">
              {formatFCFA(totalAttendu)}
            </span>
          </div>

          <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-md">
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
              Arriérés
            </span>
            <span className="font-extrabold text-xs text-red-700">
              {formatFCFA(totalImpayes)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Sorting Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Rechercher par locataire, bien, pièce, réf. transaction..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter by Bien with Insolvency indicator */}
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedLogementFilter}
              onChange={(e) => setSelectedLogementFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Tous les biens ({logements.length})</option>
              {logements.map(l => {
                const st = getBienInsolvencyStats(l.id);
                return (
                  <option key={l.id} value={l.id}>
                    {l.nom} {st.insolventCount > 0 ? `(⚠️ ${st.insolventCount} insolvable${st.insolventCount > 1 ? 's' : ''})` : '(✓ À jour)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Selector: Tri par Bien, Logement-NomLocataire, Statut, Montant */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none cursor-pointer font-medium"
            >
              <option value="bien_logement_locataire">Tri dans l'ordre : 1- Bien, 2- Logement - Nom Locataire</option>
              <option value="bien">Trier par : Bien uniquement</option>
              <option value="logement_locataire">Trier par : Logement - Nom Locataire</option>
              <option value="statut">Trier par : Statut d'insolvabilité</option>
              <option value="montant">Trier par : Montant Reçu</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="paye">Payé & Acquitté</option>
            <option value="partiel">Paiement Partiel / Tranche</option>
            <option value="impaye">Impayé / Insolvable</option>
          </select>
        </div>
      </div>

      {/* Insolvency Tag Banner (Étiquette mentionnant le nombre de logements insolvables à la période donnée) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700">
            {selectedBien ? `Bien : ${selectedBien.nom}` : 'Patrimoine Global :'}
          </span>

          {selectedBien ? (
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 ${
              selectedBienStats?.isInsolvent 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {selectedBienStats?.isInsolvent ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>
                    Étiquette : <strong>{selectedBienStats.insolventCount}</strong> logement(s) insolvable(s) sur ce bien en {formatMonthYear(selectedMonth)} • Arriérés cumulés : <strong>{formatFCFA(selectedBienStats.arrieres)}</strong>
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Étiquette : 0 logement insolvable • 100% des logements de ce bien sont à jour en {formatMonthYear(selectedMonth)}
                  </span>
                </>
              )}
            </span>
          ) : (
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 ${
              totalLogementsInsolvablesMonth > 0 
                ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {totalLogementsInsolvablesMonth > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    Étiquette : <strong>{totalLogementsInsolvablesMonth}</strong> logement(s) insolvable(s) identifié(s) à la période de {formatMonthYear(selectedMonth)} • Arriérés totaux : <strong>{formatFCFA(totalImpayes)}</strong>
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Étiquette : Tous les biens et logements sont solvables et soldés pour {formatMonthYear(selectedMonth)}
                  </span>
                </>
              )}
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Tri actif : <span className="font-bold text-indigo-700">
            {sortBy === 'bien' 
              ? 'Bien immobilier' 
              : sortBy === 'logement_locataire' 
              ? 'Logement - Nom Locataire' 
              : sortBy === 'statut' 
              ? 'Statut d\'insolvabilité' 
              : 'Montant encaissé'}
          </span> • <strong>{sortedPaiements.length}</strong> ligne(s) affichée(s)
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Bien & Locataire</th>
                <th className="py-2.5 px-3">Logement / Unité(s)</th>
                <th className="py-2.5 px-3 text-right">Loyer Attendu</th>
                <th className="py-2.5 px-3 text-right">Montant Reçu</th>
                <th className="py-2.5 px-3">Mode & Modalités</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
                <th className="py-2.5 px-4 text-right">Reçu & Quittance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedPaiements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun paiement trouvé pour ce mois ou selon ces critères de tri.
                  </td>
                </tr>
              ) : (
                sortedPaiements.map((pay) => {
                  const loc = locataires.find(l => l.id === pay.locataire_id);
                  const log = logements.find(l => l.id === pay.logement_id);
                  const piece = pieces.find(p => p.id === pay.piece_id);
                  const isPaid = pay.statut === 'paye';
                  const isPartial = pay.statut === 'partiel';
                  const isTranche = pay.type_paiement === 'tranche' || isPartial;
                  const isMultiMois = pay.type_paiement === 'multi_mois' || (pay.mois_soldes && pay.mois_soldes.length > 1);

                  // Support for multiple occupied units
                  const allOccupiedPieces = pieces.filter(p => 
                    (pay.piece_ids && pay.piece_ids.includes(p.id)) ||
                    p.id === pay.piece_id ||
                    (loc?.piece_ids && loc.piece_ids.includes(p.id))
                  );

                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={loc?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                            alt="" 
                            className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" 
                          />
                          <div>
                            <p className="font-bold text-slate-800">{loc?.nom_complet || 'Locataire'}</p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              <span className="text-indigo-900 font-bold">{log?.nom}</span> • {loc?.telephone_principal}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">
                          {allOccupiedPieces.length > 1 
                            ? allOccupiedPieces.map(p => p.nom).join(' + ')
                            : (piece?.nom || 'Logement')}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          {piece?.type} • Étage {piece?.etage ?? 0} {allOccupiedPieces.length > 1 && `(${allOccupiedPieces.length} logements occupés)`}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {formatFCFA(pay.montant_attendu)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatFCFA(pay.montant_recu)}
                      </td>

                      <td className="py-3 px-3">
                        {isPaid || isPartial ? (
                          <div>
                            <span className="font-medium text-slate-800 capitalize block">
                              {pay.mode_paiement === 'mtn_money' ? 'MTN Money' :
                               pay.mode_paiement === 'orange_money' ? 'Orange Money' :
                               pay.mode_paiement === 'mobile_money' ? 'Mobile Money' :
                               pay.mode_paiement === 'virement' ? 'Virement Bancaire' :
                               pay.mode_paiement === 'especes' ? 'Espèces' :
                               pay.mode_paiement === 'cheque' ? 'Chèque' :
                               pay.mode_paiement} {pay.operateur_mobile && !['mtn_money', 'orange_money'].includes(pay.mode_paiement) ? `(${pay.operateur_mobile.replace(' Cameroun', '')})` : ''}
                            </span>
                            
                            {/* Installment Badge */}
                            {isTranche && (
                              <div className="mt-0.5">
                                <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-[9px] font-bold">
                                  Tranche {pay.tranche_numero || 1} • Reste: {formatFCFA(pay.tranche_solde_restant || Math.max(0, pay.montant_attendu - pay.montant_recu))}
                                </span>
                              </div>
                            )}

                            {/* Multi-Month Badge */}
                            {isMultiMois && (
                              <div className="mt-0.5">
                                <span className="inline-block px-1.5 py-0.5 bg-indigo-100 text-indigo-900 rounded text-[9px] font-bold">
                                  {pay.mois_soldes?.length || 3} mois soldés : {pay.mois_soldes_labels || pay.mois_soldes?.map(m => formatMonthYear(m)).join(', ')}
                                </span>
                              </div>
                            )}

                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {pay.reference_recu || formatDateFR(pay.date_paiement)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-red-500 italic text-[11px] font-semibold">
                            ⚠️ En attente / Non réglé
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => quickTogglePayment(pay.locataire_id, pay.mois_concerne, pay.montant_attendu)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            isPaid 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : isPartial
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title="Cliquez pour basculer le statut"
                        >
                          {isPaid && <Check className="w-3 h-3" />}
                          {isPaid ? 'Payé' : isPartial ? 'Partiel (Tranche)' : 'Impayé (Insolvable)'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp receipt action */}
                          <button
                            onClick={() => handleDirectWhatsAppShare(pay)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                            title="Envoyer le reçu officiel par WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          {/* Quittance Modal View */}
                          <button
                            onClick={() => setSelectedQuittancePaiement(pay)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                            title="Voir et imprimer la quittance certifiée"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Quittance</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Modal with Installment & Multiple-Month support */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-5 border border-slate-200 my-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-slate-800">
                  Enregistrer un Règlement de Loyer
                </h3>
                <p className="text-[11px] text-slate-500">
                  Règlement standard, paiement en tranche (acompte) ou paiement multiple-mois
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Payment Type Selection (Standard, Tranche, Multi-Mois) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Modalité du Règlement :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTypeOption('standard');
                      const loc = locataires.find(l => l.id === selectedLocataireId);
                      const b = baux.find(item => item.locataire_id === loc?.id && item.statut === 'actif');
                      if (b) setRecordMontant(b.montant_loyer_fcfa + b.montant_charges_fcfa);
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      paymentTypeOption === 'standard' 
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs block">Mois Unique</span>
                    <span className="text-[10px] text-slate-500">1 mois de loyer standard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTypeOption('tranche');
                      const loc = locataires.find(l => l.id === selectedLocataireId);
                      const b = baux.find(item => item.locataire_id === loc?.id && item.statut === 'actif');
                      const total = b ? (b.montant_loyer_fcfa + b.montant_charges_fcfa) : 300000;
                      setRecordMontant(Math.round(total / 2));
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      paymentTypeOption === 'tranche' 
                        ? 'border-amber-600 bg-amber-50/70 text-amber-900 shadow-xs' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs block">En Tranche</span>
                    <span className="text-[10px] text-slate-500">Acompte & solde échelonné</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTypeOption('multi_mois');
                      const loc = locataires.find(l => l.id === selectedLocataireId);
                      const b = baux.find(item => item.locataire_id === loc?.id && item.statut === 'actif');
                      const total = b ? (b.montant_loyer_fcfa + b.montant_charges_fcfa) : 300000;
                      setRecordMontant(total * multiMoisCount);
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      paymentTypeOption === 'multi_mois' 
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs block">Multiple-Mois</span>
                    <span className="text-[10px] text-slate-500">Avance groupée de loyers</span>
                  </button>
                </div>
              </div>

              {/* Hierarchical Selection: 1- Bien, 2- Logement - Nom Locataire Occupant */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                {/* 1 - Bien */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    Bien Immobilier :
                  </label>
                  <select 
                    value={recordBienId}
                    onChange={(e) => {
                      const newBienId = e.target.value;
                      setRecordBienId(newBienId);
                      const bienPieces = pieces.filter(p => p.logement_id === newBienId);
                      const firstP = bienPieces[0];
                      if (firstP) {
                        setRecordPieceId(firstP.id);
                        const occ = locataires.find(l => 
                          l.id === firstP.current_locataire_id || 
                          l.piece_id === firstP.id || 
                          (l.piece_ids && l.piece_ids.includes(firstP.id))
                        ) || locataires.find(l => {
                          const b = baux.find(lease => lease.locataire_id === l.id && lease.statut === 'actif');
                          return b && (b.piece_id === firstP.id || (b.piece_ids && b.piece_ids.includes(firstP.id)));
                        });
                        setSelectedLocataireId(occ?.id || '');
                        const b = occ ? baux.find(item => item.locataire_id === occ.id && item.statut === 'actif') : null;
                        const monthly = b ? (b.montant_loyer_fcfa + b.montant_charges_fcfa) : (firstP.loyer_reference + (firstP.charges_incluses || 0));
                        if (paymentTypeOption === 'multi_mois') {
                          setRecordMontant(monthly * multiMoisCount);
                        } else if (paymentTypeOption === 'tranche') {
                          setRecordMontant(Math.round(monthly / 2));
                        } else {
                          setRecordMontant(monthly);
                        }
                      } else {
                        setRecordPieceId('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                  >
                    {logements.map(b => (
                      <option key={b.id} value={b.id}>
                        🏢 {b.nom} ({b.ville}{b.pays ? `, ${b.pays}` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2 - Logement - Nom Locataire Occupant */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    Logement — Nom Locataire Occupant :
                  </label>
                  {pieces.filter(p => p.logement_id === recordBienId).length === 0 ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 font-medium">
                      Aucun logement/lot enregistré sous ce bien.
                    </div>
                  ) : (
                    <select 
                      value={`${recordPieceId}__${selectedLocataireId}`}
                      onChange={(e) => {
                        const [pId, lId] = e.target.value.split('__');
                        setRecordPieceId(pId);
                        setSelectedLocataireId(lId);
                        const p = pieces.find(item => item.id === pId);
                        const b = lId ? baux.find(item => item.locataire_id === lId && item.statut === 'actif') : null;
                        const monthly = b ? (b.montant_loyer_fcfa + b.montant_charges_fcfa) : p ? (p.loyer_reference + (p.charges_incluses || 0)) : 300000;
                        if (paymentTypeOption === 'multi_mois') {
                          setRecordMontant(monthly * multiMoisCount);
                        } else if (paymentTypeOption === 'tranche') {
                          setRecordMontant(Math.round(monthly / 2));
                        } else {
                          setRecordMontant(monthly);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                    >
                      {pieces
                        .filter(p => p.logement_id === recordBienId)
                        .map(p => {
                          const occ = locataires.find(l => 
                            l.id === p.current_locataire_id || 
                            l.piece_id === p.id || 
                            (l.piece_ids && l.piece_ids.includes(p.id))
                          ) || locataires.find(l => {
                            const b = baux.find(lease => lease.locataire_id === l.id && lease.statut === 'actif');
                            return b && (b.piece_id === p.id || (b.piece_ids && b.piece_ids.includes(p.id)));
                          });
                          const compositeKey = `${p.id}__${occ?.id || ''}`;
                          return (
                            <option key={compositeKey} value={compositeKey}>
                              🚪 {p.numero} ({p.nom}) — 👤 {occ ? occ.nom_complet : 'Sans occupant actif'} • Loyer: {formatFCFA(p.loyer_reference + (p.charges_incluses || 0))}
                            </option>
                          );
                        })}
                    </select>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Filtré par bien : même si un locataire a plusieurs logements, chaque logement et son occupant sont isolés.
                  </p>
                </div>
              </div>

              {/* Specific Options for Multiple-Months (Période & Saisie du nombre de mois) */}
              {paymentTypeOption === 'multi_mois' && (
                <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-indigo-950 block mb-1">
                        Date de paiement (Début de la période) :
                      </label>
                      <input
                        type="date"
                        value={recordDatePaiement}
                        onChange={(e) => setRecordDatePaiement(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-md text-xs font-semibold text-slate-900 shadow-xs focus:outline-none focus:border-indigo-600"
                        required
                      />
                      <span className="text-[10px] text-slate-500">
                        La période de loyer commence exactement à ce jour
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-indigo-950 block mb-1">
                        Nombre de mois à payer (La période) :
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={48}
                          value={multiMoisCount}
                          onChange={(e) => {
                            const count = Math.max(1, Math.min(48, Number(e.target.value) || 1));
                            setMultiMoisCount(count);
                            const loc = locataires.find(l => l.id === selectedLocataireId);
                            const b = baux.find(item => item.locataire_id === loc?.id && item.statut === 'actif');
                            const monthly = b ? (b.montant_loyer_fcfa + b.montant_charges_fcfa) : 300000;
                            setRecordMontant(monthly * count);
                          }}
                          className="w-full px-3 py-1.5 bg-white border-2 border-indigo-400 rounded-md text-sm font-extrabold text-indigo-900 text-center shadow-xs focus:outline-none focus:border-indigo-600"
                          placeholder="Ex: 3"
                        />
                        <span className="text-xs font-bold text-indigo-900 whitespace-nowrap">Mois</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Nombre de mois consécutifs réglés
                      </span>
                    </div>
                  </div>

                  {/* Case en dessous : Affichage automatique de la période calculée (sans lister les mois individuels) */}
                  <div className="bg-white p-3 rounded-lg border border-indigo-200 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                      Période couverte pour ce logement :
                    </span>
                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-md font-mono text-xs font-bold text-indigo-950 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{computePeriodDisplayString(recordDatePaiement, multiMoisCount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Specific Options for Installment (Tranche) */}
              {paymentTypeOption === 'tranche' && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg space-y-2.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 mb-1">
                        Numéro de tranche :
                      </label>
                      <select
                        value={trancheNumero}
                        onChange={(e) => setTrancheNumero(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs font-bold text-amber-900 cursor-pointer"
                      >
                        <option value={1}>Tranche 1 (Premier acompte)</option>
                        <option value={2}>Tranche 2 (Deuxième acompte)</option>
                        <option value={3}>Tranche 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 mb-1">
                        Échéance solde restant :
                      </label>
                      <input 
                        type="date"
                        value={trancheDateLimite}
                        onChange={(e) => setTrancheDateLimite(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Dynamic calculation of remaining balance */}
                  {(() => {
                    const loc = locataires.find(l => l.id === selectedLocataireId);
                    const b = baux.find(item => item.locataire_id === loc?.id && item.statut === 'actif');
                    const totalLoyer = b ? (b.montant_loyer_fcfa + b.montant_charges_fcfa) : 300000;
                    const restant = Math.max(0, totalLoyer - recordMontant);
                    return (
                      <div className="bg-white p-2 rounded border border-amber-200 text-xs flex justify-between items-center">
                        <span className="text-slate-600">Loyer mensuel total : <strong>{formatFCFA(totalLoyer)}</strong></span>
                        <span className="text-amber-800 font-bold">
                          Solde restant dû : <strong className="text-red-600">{formatFCFA(restant)}</strong>
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Amount and Payment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Montant Encaissé (FCFA) :
                  </label>
                  <input 
                    type="number"
                    value={recordMontant}
                    onChange={(e) => setRecordMontant(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-extrabold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mode de Paiement :
                  </label>
                  <select 
                    value={recordMode}
                    onChange={(e) => {
                      const newM = e.target.value as PaymentMode;
                      setRecordMode(newM);
                      setRecordRef(computeTransactionRef(newM, ticketNumero));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="mtn_money">MTN Money (MTN MoMo)</option>
                    <option value="orange_money">Orange Money (Orange Money)</option>
                    <option value="virement">Virement Bancaire (Afriland, SGBC...)</option>
                    <option value="especes">Espèces contre Reçu physique</option>
                    <option value="cheque">Chèque Bancaire</option>
                  </select>
                </div>
              </div>

              {/* Ticket de Quittance & Dynamic Transaction Reference */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      Numéro du Ticket de Quittance :
                    </label>
                    <button 
                      type="button"
                      onClick={generateNewTicketNum}
                      className="text-[10px] text-indigo-700 hover:text-indigo-900 font-semibold underline cursor-pointer"
                    >
                      Générer nouveau numéro
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={ticketNumero}
                    onChange={(e) => {
                      const num = e.target.value;
                      setTicketNumero(num);
                      setRecordRef(computeTransactionRef(recordMode, num));
                    }}
                    placeholder="Ex: TK-202603-4921"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      Référence de la Transaction :
                    </label>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                      ⚡ Automatique (Moyen + N° Reçu)
                    </span>
                  </div>
                  <input 
                    type="text"
                    value={computeTransactionRef(recordMode, ticketNumero)}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-xs font-mono font-extrabold text-indigo-900 shadow-xs cursor-default"
                  />
                  <p className="text-[11px] text-indigo-800 mt-1 font-medium">
                    ⚡ Générée automatiquement : <strong>{computeTransactionRef(recordMode, ticketNumero)}</strong> (Moyen : {recordMode.toUpperCase()} + N° Reçu : {ticketNumero}).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Commentaire ou Notes particulières :
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Versement effectué par le conjoint, accord solde le 20..."
                  value={recordComment}
                  onChange={(e) => setRecordComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enregistrer & Générer la Quittance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

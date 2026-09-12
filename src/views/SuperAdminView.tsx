import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SubscriptionPlan, UserAccount } from '../types';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Search, 
  Building, 
  FileText, 
  Settings,
  Sparkles,
  X,
  Smartphone,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Filter,
  Check,
  Printer,
  Download,
  Share2,
  Crown,
  Lock,
  ArrowRight,
  LogOut,
  Layers,
  ArrowUpDown,
  FileSearch,
  Key,
  UserPlus,
  Edit3,
  Plus,
  FileCheck
} from 'lucide-react';
import { formatFCFA, formatDateFR } from '../utils/formatters';

export const SuperAdminView: React.FC = () => {
  const { 
    allUsers, 
    logements, 
    pieces, 
    locataires,
    baux,
    occupationHistory,
    paiements, 
    subscriptionPlans, 
    subscriptions, 
    updateSubscriptionPlan, 
    switchUser,
    deleteUser,
    setActiveTab,
    disconnectUserByAdmin,
    addSubscriberByAdmin,
    updateSubscriberByAdmin
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'subscribers' | 'plans' | 'users' | 'traceability' | 'system'>('subscribers');
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Search & Filters for Subscribers
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'plan_starter' | 'plan_pro' | 'plan_entreprise'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'expire'>('all');

  // Search, Cross-filters & Sorting for Traceability (Propriétaire, Locataire, Bien, Logement)
  const [traceProprietaireFilter, setTraceProprietaireFilter] = useState<string>('all');
  const [traceLocataireFilter, setTraceLocataireFilter] = useState<string>('all');
  const [traceBienFilter, setTraceBienFilter] = useState<string>('all');
  const [traceLogementFilter, setTraceLogementFilter] = useState<string>('all');
  const [traceStatusFilter, setTraceStatusFilter] = useState<'all' | 'actif' | 'resilie'>('all');
  const [traceSearchQuery, setTraceSearchQuery] = useState<string>('');
  const [traceSortBy, setTraceSortBy] = useState<'date_desc' | 'date_asc' | 'proprietaire' | 'locataire' | 'bien' | 'loyer_desc' | 'loyer_asc'>('date_desc');

  // Deletion state
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Receipt modal state
  const [viewingReceipt, setViewingReceipt] = useState<{ user: UserAccount; sub?: any; plan?: SubscriptionPlan } | null>(null);

  // Add Subscriber State
  const [isAddSubscriberModalOpen, setIsAddSubscriberModalOpen] = useState(false);
  const [addSubscriberForm, setAddSubscriberForm] = useState({
    name: '',
    email: '',
    phonenumber: '',
    entreprise: '',
    ville: 'Douala',
    planId: 'plan_ca_starter',
    dureeMois: 1,
    modePaiement: 'MTN Mobile Money Cameroun',
    password: ''
  });
  const [addSubscriberError, setAddSubscriberError] = useState<string | null>(null);

  // Edit Subscriber State
  const [subscriberToEdit, setSubscriberToEdit] = useState<{ user: UserAccount; sub?: any; plan?: SubscriptionPlan } | null>(null);
  const [editSubscriberForm, setEditSubscriberForm] = useState({
    name: '',
    email: '',
    phonenumber: '',
    entreprise: '',
    ville: '',
    planId: '',
    statut: 'actif' as 'actif' | 'expire',
    date_expiration: ''
  });
  const [editSubscriberError, setEditSubscriberError] = useState<string | null>(null);

  // Platform wide metrics
  const bailleursList = allUsers.filter(u => u.role === 'bailleur');
  const totalBailleurs = bailleursList.length;
  const totalLocataires = allUsers.filter(u => u.role === 'locataire').length;
  const totalHousing = logements.length;
  const totalUnits = pieces.length;

  // Active subscriptions count & MRR
  const activeSubs = subscriptions.filter(s => s.statut === 'actif');
  const expiredSubs = subscriptions.filter(s => s.statut === 'expire');
  
  const mrrSaaS = subscriptions.reduce((sum, sub) => {
    if (sub.statut === 'actif') {
      const plan = subscriptionPlans.find(p => p.id === sub.plan_id);
      return sum + (plan?.prix_fcfa || 0);
    }
    return sum;
  }, 0);

  const totalCollectedSubscriptions = subscriptions.reduce((sum, sub) => {
    return sum + (sub.montant_paye_fcfa || 0);
  }, 0);

  // Filtered subscribers
  const filteredBailleurs = bailleursList.filter((user) => {
    const sub = subscriptions.find(s => s.user_id === user.id);
    const planId = sub?.plan_id || user.abonnement_id;
    const statut = sub?.statut || 'actif';

    // Search query match
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.phonenumber.toLowerCase().includes(q) ||
      (user.entreprise && user.entreprise.toLowerCase().includes(q)) ||
      (user.ville && user.ville.toLowerCase().includes(q)) ||
      (sub?.facture_numero && sub.facture_numero.toLowerCase().includes(q)) ||
      (sub?.reference_transaction && sub.reference_transaction.toLowerCase().includes(q))
    );

    // Plan filter match
    const matchesPlan = planFilter === 'all' || planId === planFilter;

    // Status filter match
    const matchesStatus = statusFilter === 'all' || statut === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleAddSubscriberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubscriberError(null);

    if (!addSubscriberForm.name.trim() || !addSubscriberForm.email.trim() || !addSubscriberForm.phonenumber.trim()) {
      setAddSubscriberError('Veuillez renseigner le nom complet, l\'email et le numéro de téléphone.');
      return;
    }

    const res = addSubscriberByAdmin({
      name: addSubscriberForm.name.trim(),
      email: addSubscriberForm.email.trim().toLowerCase(),
      phonenumber: addSubscriberForm.phonenumber.trim(),
      entreprise: addSubscriberForm.entreprise.trim(),
      ville: addSubscriberForm.ville.trim(),
      planId: addSubscriberForm.planId,
      dureeMois: Number(addSubscriberForm.dureeMois) || 1,
      modePaiement: addSubscriberForm.modePaiement,
      password: addSubscriberForm.password.trim() || 'password123'
    });

    if (!res.success) {
      setAddSubscriberError(res.error || 'Erreur lors de la création de l\'abonné.');
      return;
    }

    setIsAddSubscriberModalOpen(false);
    setActionToast(`L'abonné "${addSubscriberForm.name}" a été créé et activé avec succès.`);
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleEditSubscriberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberToEdit) return;
    setEditSubscriberError(null);

    if (!editSubscriberForm.name.trim() || !editSubscriberForm.email.trim()) {
      setEditSubscriberError('Le nom et l\'adresse email sont obligatoires.');
      return;
    }

    const res = updateSubscriberByAdmin(subscriberToEdit.user.id, {
      name: editSubscriberForm.name.trim(),
      email: editSubscriberForm.email.trim().toLowerCase(),
      phonenumber: editSubscriberForm.phonenumber.trim(),
      entreprise: editSubscriberForm.entreprise.trim(),
      ville: editSubscriberForm.ville.trim(),
      planId: editSubscriberForm.planId,
      statut: editSubscriberForm.statut,
      date_expiration: editSubscriberForm.date_expiration
    });

    if (!res.success) {
      setEditSubscriberError(res.error || 'Erreur lors de la modification de l\'abonné.');
      return;
    }

    setSubscriberToEdit(null);
    setActionToast(`Le profil et abonnement de "${editSubscriberForm.name}" ont été mis à jour.`);
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleSavePlanEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    updateSubscriptionPlan(editingPlan.id, editingPlan);
    setEditingPlan(null);
    setActionToast(`Le forfait "${editingPlan.nom}" et ses clauses ont été mis à jour avec succès.`);
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    setTimeout(() => {
      const res = deleteUser(userToDelete.id);
      setIsDeleting(false);
      setUserToDelete(null);

      if (res.success) {
        setActionToast(res.message || `L'abonné a été supprimé avec succès.`);
        setTimeout(() => setActionToast(null), 5000);
      } else {
        alert(res.error || 'Erreur lors de la suppression.');
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {actionToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight">
              Administration DISCOM SaaS Cameroun
            </h1>
          </div>
          <p className="text-xs text-slate-300">
            Contrôle total des abonnés, encaissements SaaS (MoMo / Orange Money), facturation et gestion des utilisateurs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Serveur Opérationnel</span>
          </span>
        </div>
      </div>

      {/* Global SaaS Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            MRR SaaS (Revenus d'abonnements)
          </span>
          <span className="text-xl font-extrabold text-emerald-700 block mt-1">
            {formatFCFA(mrrSaaS || 180000)} /mois
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +18.4% ce trimestre
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Abonnés Bailleurs Inscrits
          </span>
          <span className="text-xl font-extrabold text-slate-800 block mt-1">
            {totalBailleurs} Bailleurs
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {activeSubs.length} formule active · {expiredSubs.length} à renouveler
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Encaissé (Abonnements)
          </span>
          <span className="text-xl font-extrabold text-indigo-700 block mt-1">
            {formatFCFA(totalCollectedSubscriptions || 1390000)}
          </span>
          <span className="text-[11px] text-indigo-600 mt-1 block">
            MTN MoMo, Orange Money & Banques
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Parc Total Sous Gestion
          </span>
          <span className="text-xl font-extrabold text-slate-800 block mt-1">
            {totalHousing} Biens / {totalUnits} Logements
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totalLocataires} locataires sous contrat
          </span>
        </div>
      </div>

      {/* SuperAdmin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'subscribers', label: `Gestion des Abonnés (${totalBailleurs})`, icon: Crown },
          { id: 'traceability', label: 'Traçabilité & Historique d\'Occupation', icon: Building },
          { id: 'plans', label: 'Forfaits & Tarifs SaaS', icon: CreditCard },
          { id: 'users', label: `Tous les Utilisateurs (${allUsers.length})`, icon: Users },
          { id: 'system', label: 'Passerelles MTN/Orange & Système', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`
                px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: SUBSCRIBERS DIRECTORY & MANAGEMENT             */}
      {/* ========================================================= */}
      {activeSubTab === 'subscribers' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="superadmin-search-subscribers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, email, téléphone, ville ou N° facture..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters and Add button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  id="filter-plan-select"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="all">Tous les forfaits</option>
                  <option value="plan_starter">Starter (15 000 FCFA)</option>
                  <option value="plan_pro">Pro (35 000 FCFA)</option>
                  <option value="plan_entreprise">Entreprise (75 000 FCFA)</option>
                </select>

                <select
                  id="filter-status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="actif">Abonnements Actifs</option>
                  <option value="expire">Abonnements Expirés</option>
                </select>
              </div>

              {/* Add subscriber button */}
              <button
                type="button"
                id="btn-superadmin-ajouter-abonne"
                onClick={() => {
                  setAddSubscriberForm({
                    name: '',
                    email: '',
                    phonenumber: '',
                    entreprise: '',
                    ville: 'Douala',
                    planId: subscriptionPlans[0]?.id || 'plan_ca_starter',
                    dureeMois: 1,
                    modePaiement: 'MTN Mobile Money Cameroun',
                    password: ''
                  });
                  setAddSubscriberError(null);
                  setIsAddSubscriberModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Ajouter un Abonné</span>
              </button>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Répertoire des Abonnés Bailleurs DISCOM ({filteredBailleurs.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">
                Paiement préalable validé à la création de compte
              </span>
            </div>

            {filteredBailleurs.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold">Aucun abonné ne correspond à vos critères de recherche.</p>
                <p className="text-slate-400 mt-1">Essayez de réinitialiser vos filtres ou la barre de recherche.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredBailleurs.map((user) => {
                  const sub = subscriptions.find(s => s.user_id === user.id);
                  const plan = subscriptionPlans.find(p => p.id === (sub?.plan_id || user.abonnement_id)) || subscriptionPlans[1];
                  const userLogements = logements.filter(l => l.user_id === user.id);
                  const userPiecesCount = pieces.filter(p => userLogements.some(l => l.id === p.logement_id)).length;
                  const isExpired = sub?.statut === 'expire';

                  return (
                    <div 
                      key={user.id} 
                      className="p-4 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left: User Identity & Contact */}
                      <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                        <img 
                          src={user.avatar_url} 
                          alt="" 
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0" 
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900">{user.name}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Bailleur
                            </span>
                            {user.emailVerified && (
                              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5" title="Compte vérifié">
                                <CheckCircle2 className="w-3 h-3" /> Vérifié
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                            {user.entreprise || 'Gestion Immobilière'}
                          </p>
                          
                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span>📧 {user.email}</span>
                            <span>📞 {user.phonenumber}</span>
                            <span>📍 {user.ville || 'Douala'}, {user.pays || 'Cameroun'}</span>
                            <span className="text-slate-400">📅 Inscrit le : {user.created_at}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Subscription & Financials */}
                      <div className="flex flex-wrap items-center gap-4 lg:gap-6 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                        {/* Forfait Badge */}
                        <div className="min-w-[130px]">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Forfait SaaS</span>
                          <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1 mt-0.5">
                            <Crown className="w-3 h-3 text-amber-500" />
                            {plan.nom}
                          </span>
                          <span className="text-[11px] text-indigo-600 font-medium block">
                            {formatFCFA(plan.prix_fcfa)}/mois
                          </span>
                        </div>

                        {/* Statut & Expiration */}
                        <div className="min-w-[120px]">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Statut Abonnement</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                            isExpired 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                            {isExpired ? 'Expiré' : 'Actif'}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {sub?.date_expiration ? `Jusqu'au ${sub.date_expiration}` : 'Accès illimité'}
                          </span>
                        </div>

                        {/* Payment Details */}
                        <div className="min-w-[130px]">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Règlement Effectué</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">
                            {formatFCFA(sub?.montant_paye_fcfa || plan.prix_fcfa)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {sub?.mode_paiement || 'MTN Mobile Money'}
                          </span>
                        </div>

                        {/* Quotas / Properties */}
                        <div className="min-w-[100px]">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Parc Actif</span>
                          <span className="text-xs font-bold text-slate-800 block mt-0.5">
                            {userLogements.length} biens · {userPiecesCount} logements
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Max: {plan.max_logements >= 999 ? '∞' : plan.max_logements}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end lg:self-center border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                        {/* Edit Subscriber */}
                        <button 
                          type="button"
                          id={`btn-edit-subscriber-${user.id}`}
                          onClick={() => {
                            setSubscriberToEdit({ user, sub, plan });
                            setEditSubscriberForm({
                              name: user.name,
                              email: user.email,
                              phonenumber: user.phonenumber,
                              entreprise: user.entreprise || '',
                              ville: user.ville || 'Douala',
                              planId: sub?.plan_id || user.abonnement_id || subscriptionPlans[0]?.id || 'plan_ca_starter',
                              statut: (sub?.statut === 'expire' ? 'expire' : 'actif') as 'actif' | 'expire',
                              date_expiration: sub?.date_expiration || new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0]
                            });
                            setEditSubscriberError(null);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Modifier les coordonnées et l'abonnement de ce propriétaire"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Modifier</span>
                        </button>

                        {/* Switch to this Landlord */}
                        <button 
                          type="button"
                          onClick={() => switchUser(user.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Se connecter en tant que ce bailleur pour tester"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Tester Espace</span>
                        </button>

                        {/* SuperAdmin Disconnect Landlord Session */}
                        <button 
                          type="button"
                          id={`btn-disconnect-subscriber-${user.id}`}
                          onClick={() => {
                            const res = disconnectUserByAdmin(user.id);
                            setActionToast(res.message || `Session de ${user.name} clôturée et verrouillée.`);
                            setTimeout(() => setActionToast(null), 4000);
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Déconnecter et verrouiller la session de ce propriétaire (Sécurité DISCOM)"
                        >
                          <LogOut className="w-3.5 h-3.5 text-amber-700" />
                          <span>Déconnecter</span>
                        </button>

                        {/* View Receipt / Invoice */}
                        <button 
                          type="button"
                          onClick={() => setViewingReceipt({ user, sub, plan })}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Voir la facture DISCOM"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* DELETE SUBSCRIBER BUTTON */}
                        <button 
                          type="button"
                          id={`btn-delete-subscriber-${user.id}`}
                          onClick={() => setUserToDelete(user)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Supprimer cet abonné de la plateforme"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB: TRACEABILITY & HOUSING OCCUPATION HISTORY        */}
      {/* ========================================================= */}
      {activeSubTab === 'traceability' && (() => {
        // Build complete occupation data by cross-referencing baux, pieces, logements, locataires and users
        const activeOccupations = baux.map(bail => {
          const locataire = locataires.find(l => l.id === bail.locataire_id);
          const pieceIds = (bail.piece_ids && bail.piece_ids.length > 0) ? bail.piece_ids : [bail.piece_id];
          const occupiedPieces = pieces.filter(p => pieceIds.includes(p.id));
          const primaryPiece = occupiedPieces[0] || pieces.find(p => p.id === bail.piece_id);
          const bien = logements.find(l => l.id === bail.logement_id) || logements.find(l => l.id === primaryPiece?.logement_id);
          const proprietaire = allUsers.find(u => u.id === (bien?.user_id || locataire?.user_id)) || allUsers.find(u => u.role === 'bailleur');

          return {
            id: `occ_active_${bail.id}`,
            bailId: bail.id,
            statut: bail.statut === 'actif' ? 'actif' : 'resilie',
            type: 'bail_actif',
            proprietaireId: proprietaire?.id || '',
            proprietaireNom: proprietaire?.name || 'Bailleur Inconnu',
            proprietaireEmail: proprietaire?.email || '',
            proprietaireTel: proprietaire?.phonenumber || '',
            proprietaireEntreprise: proprietaire?.entreprise || '',
            locataireId: locataire?.id || bail.locataire_id,
            locataireNom: locataire?.nom_complet || 'Locataire',
            locataireCni: locataire?.cni_passeport || '',
            locataireTel: locataire?.telephone_principal || '',
            locatairePhoto: locataire?.photo_url || '',
            bienId: bien?.id || '',
            bienNom: bien?.nom || 'Bien non défini',
            bienVille: bien?.ville || '',
            bienAdresse: bien?.adresse || '',
            pieceIds,
            pieces: occupiedPieces.length > 0 ? occupiedPieces : (primaryPiece ? [primaryPiece] : []),
            isMultiPieces: pieceIds.length > 1,
            dateDebut: bail.date_debut,
            dateFin: bail.date_echeance_reelle || bail.date_echeance_theorique,
            dureeMois: bail.duree_mois,
            loyer: bail.montant_loyer_fcfa,
            charges: bail.montant_charges_fcfa || 0,
            totalMensuel: bail.montant_loyer_fcfa + (bail.montant_charges_fcfa || 0),
            motifSortie: bail.motif_resiliation || ''
          };
        });

        // Historical freed occupations from occupationHistory
        const historicalOccupations = occupationHistory.map(hist => {
          const piece = pieces.find(p => p.id === hist.piece_id);
          const bien = logements.find(l => l.id === piece?.logement_id);
          const proprietaire = allUsers.find(u => u.id === bien?.user_id) || allUsers.find(u => u.role === 'bailleur');
          const existingLoc = locataires.find(l => 
            l.nom_complet.toLowerCase() === hist.locataire_nom.toLowerCase() || 
            (l.cni_passeport && hist.locataire_cni && l.cni_passeport === hist.locataire_cni)
          );

          return {
            id: `occ_hist_${hist.id}`,
            bailId: '',
            statut: 'resilie' as const,
            type: 'historique',
            proprietaireId: proprietaire?.id || '',
            proprietaireNom: proprietaire?.name || 'Bailleur Inconnu',
            proprietaireEmail: proprietaire?.email || '',
            proprietaireTel: proprietaire?.phonenumber || '',
            proprietaireEntreprise: proprietaire?.entreprise || '',
            locataireId: existingLoc?.id || '',
            locataireNom: hist.locataire_nom,
            locataireCni: hist.locataire_cni,
            locataireTel: existingLoc?.telephone_principal || '',
            locatairePhoto: existingLoc?.photo_url || '',
            bienId: bien?.id || '',
            bienNom: bien?.nom || 'Bien non défini',
            bienVille: bien?.ville || '',
            bienAdresse: bien?.adresse || '',
            pieceIds: [hist.piece_id],
            pieces: piece ? [piece] : [],
            isMultiPieces: false,
            dateDebut: hist.date_debut,
            dateFin: hist.date_fin,
            dureeMois: 0,
            loyer: hist.loyer_mensuel,
            charges: 0,
            totalMensuel: hist.loyer_mensuel,
            motifSortie: hist.motif_sortie || 'Fin de bail / Départ régularisé'
          };
        });

        const allOccupations = [...activeOccupations, ...historicalOccupations];

        // Apply filters: Propriétaire, Locataire, Bien, Logement, Statut, Search
        const filteredOccupations = allOccupations.filter(item => {
          // Propriétaire filter
          if (traceProprietaireFilter !== 'all' && item.proprietaireId !== traceProprietaireFilter) {
            return false;
          }

          // Locataire filter
          if (traceLocataireFilter !== 'all') {
            if (item.locataireId !== traceLocataireFilter && !item.locataireNom.toLowerCase().includes(traceLocataireFilter.toLowerCase())) {
              return false;
            }
          }

          // Bien filter
          if (traceBienFilter !== 'all' && item.bienId !== traceBienFilter) {
            return false;
          }

          // Logement (Pièce) filter
          if (traceLogementFilter !== 'all' && !item.pieceIds.includes(traceLogementFilter)) {
            return false;
          }

          // Status filter
          if (traceStatusFilter !== 'all' && item.statut !== traceStatusFilter) {
            return false;
          }

          // Free text search query
          if (traceSearchQuery.trim()) {
            const q = traceSearchQuery.toLowerCase().trim();
            const pieceMatch = item.pieces.some(p => p.nom.toLowerCase().includes(q) || p.numero.toLowerCase().includes(q));
            const matches = 
              item.proprietaireNom.toLowerCase().includes(q) ||
              item.proprietaireEntreprise.toLowerCase().includes(q) ||
              item.locataireNom.toLowerCase().includes(q) ||
              item.locataireCni.toLowerCase().includes(q) ||
              item.locataireTel.toLowerCase().includes(q) ||
              item.bienNom.toLowerCase().includes(q) ||
              item.bienVille.toLowerCase().includes(q) ||
              pieceMatch;
            if (!matches) return false;
          }

          return true;
        });

        // Apply sorting
        filteredOccupations.sort((a, b) => {
          if (traceSortBy === 'date_desc') {
            return new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime();
          }
          if (traceSortBy === 'date_asc') {
            return new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime();
          }
          if (traceSortBy === 'proprietaire') {
            return a.proprietaireNom.localeCompare(b.proprietaireNom);
          }
          if (traceSortBy === 'locataire') {
            return a.locataireNom.localeCompare(b.locataireNom);
          }
          if (traceSortBy === 'bien') {
            return a.bienNom.localeCompare(b.bienNom);
          }
          if (traceSortBy === 'loyer_desc') {
            return b.totalMensuel - a.totalMensuel;
          }
          if (traceSortBy === 'loyer_asc') {
            return a.totalMensuel - b.totalMensuel;
          }
          return 0;
        });

        // Dynamic lists for filter dropdowns based on selections
        const filteredLogementsList = traceProprietaireFilter === 'all' 
          ? logements 
          : logements.filter(l => l.user_id === traceProprietaireFilter);

        const filteredPiecesList = traceBienFilter === 'all'
          ? pieces
          : pieces.filter(p => p.logement_id === traceBienFilter);

        const multiPieceCount = filteredOccupations.filter(o => o.isMultiPieces).length;
        const activeCount = filteredOccupations.filter(o => o.statut === 'actif').length;
        const historicalCount = filteredOccupations.filter(o => o.statut === 'resilie').length;

        return (
          <div className="space-y-5">
            {/* Header & Description */}
            <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-bold tracking-tight">
                    Traçabilité & Registre d'Occupation du Patrimoine
                  </h2>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Consultez précisément l'historique complet : <strong>qui a occupé quelle(s) pièce(s) dans quel bien</strong> pour chaque propriétaire. Supporte les locataires occupant un ou plusieurs logements.
                </p>
              </div>

              {/* KPI Mini Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Occupants Actifs</span>
                  <span className="text-sm font-extrabold text-emerald-400">{activeCount}</span>
                </div>
                <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Multi-Logements</span>
                  <span className="text-sm font-extrabold text-indigo-400">{multiPieceCount}</span>
                </div>
                <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Historique Résilié</span>
                  <span className="text-sm font-extrabold text-slate-300">{historicalCount}</span>
                </div>
              </div>
            </div>

            {/* Filter Panel: Propriétaire, Locataire, Bien, Logement, Statut, Tri */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Filtres Multicritères : Propriétaire · Locataire · Bien · Logement</span>
                </div>

                {(traceProprietaireFilter !== 'all' || traceLocataireFilter !== 'all' || traceBienFilter !== 'all' || traceLogementFilter !== 'all' || traceStatusFilter !== 'all' || traceSearchQuery) && (
                  <button
                    onClick={() => {
                      setTraceProprietaireFilter('all');
                      setTraceLocataireFilter('all');
                      setTraceBienFilter('all');
                      setTraceLogementFilter('all');
                      setTraceStatusFilter('all');
                      setTraceSearchQuery('');
                      setTraceSortBy('date_desc');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>

              {/* 4 Main Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Propriétaire Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-indigo-600" />
                    <span>1. Propriétaire (Bailleur) :</span>
                  </label>
                  <select
                    value={traceProprietaireFilter}
                    onChange={(e) => {
                      setTraceProprietaireFilter(e.target.value);
                      setTraceBienFilter('all');
                      setTraceLogementFilter('all');
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Tous les Propriétaires ({bailleursList.length})</option>
                    {bailleursList.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.entreprise ? `(${b.entreprise})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Bien Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Building className="w-3 h-3 text-emerald-600" />
                    <span>2. Bien (Immeuble / Villa) :</span>
                  </label>
                  <select
                    value={traceBienFilter}
                    onChange={(e) => {
                      setTraceBienFilter(e.target.value);
                      setTraceLogementFilter('all');
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Tous les Biens ({filteredLogementsList.length})</option>
                    {filteredLogementsList.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.nom} ({l.ville})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Logement / Lot Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-amber-600" />
                    <span>3. Logement / Pièce (Lot) :</span>
                  </label>
                  <select
                    value={traceLogementFilter}
                    onChange={(e) => setTraceLogementFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Tous les Logements ({filteredPiecesList.length})</option>
                    {filteredPiecesList.map(p => {
                      const log = logements.find(l => l.id === p.logement_id);
                      return (
                        <option key={p.id} value={p.id}>
                          N° {p.numero} - {p.nom} [{p.type}] ({log?.nom})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 4. Locataire Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3 text-purple-600" />
                    <span>4. Locataire :</span>
                  </label>
                  <select
                    value={traceLocataireFilter}
                    onChange={(e) => setTraceLocataireFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Tous les Locataires ({locataires.length})</option>
                    {locataires.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.nom_complet} ({l.telephone_principal})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Second Row: Search bar, Status filter & Sorting */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Recherche textuelle : locataire, CNI, nom de bien..."
                    value={traceSearchQuery}
                    onChange={(e) => setTraceSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                  />
                </div>

                <div>
                  <select
                    value={traceStatusFilter}
                    onChange={(e) => setTraceStatusFilter(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Tous les états d'occupation</option>
                    <option value="actif">Occupants Actifs (Bail en cours)</option>
                    <option value="resilie">Anciens Occupants (Historique / Libéré)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={traceSortBy}
                      onChange={(e) => setTraceSortBy(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="date_desc">Trier par : Date d'entrée (récente)</option>
                      <option value="date_asc">Trier par : Date d'entrée (ancienne)</option>
                      <option value="proprietaire">Trier par : Propriétaire (A-Z)</option>
                      <option value="locataire">Trier par : Nom Locataire (A-Z)</option>
                      <option value="bien">Trier par : Nom du Bien (A-Z)</option>
                      <option value="loyer_desc">Trier par : Loyer (Plus élevé)</option>
                      <option value="loyer_asc">Trier par : Loyer (Plus accessible)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Grid / Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>{filteredOccupations.length} enregistrement(s) d'occupation trouvé(s)</span>
                <span>Affichage détaillé par Contrat & Unité</span>
              </div>

              {filteredOccupations.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-xs">
                  <FileSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">Aucune occupation trouvée</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Aucun logement ou locataire ne correspond à la combinaison de filtres sélectionnée.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredOccupations.map((occ) => {
                    const isActive = occ.statut === 'actif';

                    return (
                      <div 
                        key={occ.id} 
                        className={`bg-white rounded-xl border transition-all shadow-xs overflow-hidden ${
                          isActive 
                            ? 'border-slate-200 hover:border-indigo-300' 
                            : 'border-slate-200/80 bg-slate-50/50 opacity-90'
                        }`}
                      >
                        {/* Card Header: Status + Property + Landlord */}
                        <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isActive 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                              {isActive ? 'Occupation En Cours' : 'Historique Libéré / Résilié'}
                            </span>

                            {occ.isMultiPieces && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold border border-indigo-200">
                                <Layers className="w-3 h-3" />
                                <span>Multi-Logements ({occ.pieceIds.length} lots)</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">Propriétaire :</span>
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5 text-indigo-600" />
                              {occ.proprietaireNom} {occ.proprietaireEntreprise ? `(${occ.proprietaireEntreprise})` : ''}
                            </span>
                            {occ.proprietaireId && (
                              <button
                                onClick={() => {
                                  switchUser(occ.proprietaireId);
                                  setActiveTab('biens');
                                }}
                                className="ml-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                                title="Voir l'espace de gestion de ce propriétaire"
                              >
                                Accéder
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Card Body: 3 Columns (Locataire, Bien & Logement(s), Conditions financières) */}
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Col 1: Locataire Identity */}
                          <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Locataire Occupant
                            </span>
                            <div className="flex items-start gap-3">
                              <img
                                src={occ.locatairePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                alt=""
                                className="w-10 h-10 rounded-full border border-slate-200 object-cover shrink-0"
                              />
                              <div>
                                <p className="font-bold text-slate-900 text-[13px]">{occ.locataireNom}</p>
                                <p className="text-slate-500 text-[11px] font-mono mt-0.5">CNI : {occ.locataireCni || 'Non renseignée'}</p>
                                <p className="text-slate-600 text-[11px] mt-0.5">{occ.locataireTel || 'Sans téléphone'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Bien & Logements Occupés */}
                          <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Bien Parent & Logement(s) Loué(s)
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[13px]">
                                <Building className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{occ.bienNom}</span>
                                <span className="text-[11px] text-slate-500 font-normal">({occ.bienVille})</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{occ.bienAdresse}</p>
                            </div>

                            {/* Detailed units list */}
                            <div className="mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                              <span className="text-[10px] font-bold text-slate-600 block">
                                {occ.pieces.length > 1 ? `Lots occupés sous ce bail (${occ.pieces.length}) :` : 'Logement occupé :'}
                              </span>
                              {occ.pieces.map(p => (
                                <div key={p.id} className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-slate-800">
                                    N° {p.numero} - {p.nom} ({p.type})
                                  </span>
                                  <span className="text-slate-500 font-medium">
                                    {formatFCFA(p.loyer_reference)}/m
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Col 3: Dates & Finances */}
                          <div className="space-y-2 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Calendrier & Données Financières
                              </span>
                              <div className="space-y-1 text-[11px] text-slate-600">
                                <div className="flex justify-between">
                                  <span>Date d'entrée :</span>
                                  <strong className="text-slate-800">{formatDateFR(occ.dateDebut)}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>{isActive ? 'Échéance prévue :' : 'Date de libération :'}</span>
                                  <strong className="text-slate-800">{formatDateFR(occ.dateFin)}</strong>
                                </div>
                                {!isActive && occ.motifSortie && (
                                  <div className="mt-1 p-1.5 bg-amber-50 text-amber-900 rounded border border-amber-200 text-[10px]">
                                    <strong>Motif de départ :</strong> {occ.motifSortie}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Loyer Mensuel Total</span>
                                <span className="text-sm font-extrabold text-indigo-700">{formatFCFA(occ.totalMensuel)}</span>
                              </div>
                              {occ.charges > 0 && (
                                <span className="text-[10px] text-slate-500">
                                  dont {formatFCFA(occ.charges)} charges
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* SUB-TAB 2: PLANS & PRICING CONFIGURATION                  */}
      {/* ========================================================= */}
      {activeSubTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Grille Tarifaire des Forfaits SaaS DISCOM
            </h2>
            <span className="text-xs text-slate-500">
              Devise officielle : FCFA (XAF) · Zone CEMAC Cameroun
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-slate-800">{plan.nom}</h3>
                    {plan.is_popular && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        Populaire
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-extrabold text-slate-900 mt-2">
                    {formatFCFA(plan.prix_fcfa)} <span className="text-xs font-normal text-slate-400">/mois</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {plan.description}
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Clauses contractuelles */}
                  {plan.clauses && plan.clauses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Clauses Contractuelles ({plan.clauses.length})</span>
                      </div>
                      <ul className="space-y-1.5">
                        {plan.clauses.map((clause, cIdx) => (
                          <li key={cIdx} className="text-[11px] text-slate-500 flex items-start gap-1.5 leading-tight">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>{clause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setEditingPlan(plan)}
                    className="w-full py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier le Tarif & Clauses</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: ALL PLATFORM USERS (SUPERADMIN, BAILLEURS, ETC)*/}
      {/* ========================================================= */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Répertoire Global de Tous les Utilisateurs Inscrits ({allUsers.length})
            </h2>
            <span className="text-xs text-slate-500">
              Gestion centralisée des rôles et comptes
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Utilisateur</th>
                <th className="py-2.5 px-3">Rôle</th>
                <th className="py-2.5 px-3">Ville / Pays</th>
                <th className="py-2.5 px-3">Email & Téléphone</th>
                <th className="py-2.5 px-3">Forfait</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allUsers.map((u) => {
                const sub = subscriptions.find(s => s.user_id === u.id);
                const plan = subscriptionPlans.find(p => p.id === (sub?.plan_id || u.abonnement_id));
                const isSuperAdmin = u.role === 'superadmin';

                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          {u.entreprise && <div className="text-[10px] text-slate-400">{u.entreprise}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 uppercase text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        u.role === 'superadmin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : u.role === 'bailleur' 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {u.ville || 'Douala'}, {u.pays || 'Cameroun'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.phonenumber}</div>
                    </td>
                    <td className="py-3 px-3">
                      {plan ? (
                        <span className="font-semibold text-indigo-700 text-[11px]">{plan.nom}</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => switchUser(u.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium cursor-pointer"
                          title="Bascule immédiate vers ce compte"
                        >
                          Bascule
                        </button>

                        {isSuperAdmin ? (
                          <span 
                            className="p-1 text-slate-300 cursor-not-allowed" 
                            title="Compte SuperAdmin protégé contre la suppression"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Supprimer cet utilisateur"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: SYSTEM & PAYMENT GATEWAYS                      */}
      {/* ========================================================= */}
      {activeSubTab === 'system' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Configuration des Passerelles de Paiement Cameroun
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-amber-200 rounded-xl bg-amber-50/50">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-700" />
                <span className="font-bold text-xs text-amber-900">MTN Mobile Money (MoMo API Cameroun)</span>
              </div>
              <span className="text-[11px] text-amber-700 mt-1 block">
                Statut : Opérationnel (*126#) • Code Marchand DISCOM SARL
              </span>
              <p className="text-[10px] text-slate-500 mt-2">
                Notification instantanée de débit et confirmation par code secret PIN.
              </p>
            </div>

            <div className="p-4 border border-orange-200 rounded-xl bg-orange-50/50">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-orange-700" />
                <span className="font-bold text-xs text-orange-900">Orange Money Cameroun API</span>
              </div>
              <span className="text-[11px] text-orange-700 mt-1 block">
                Statut : Opérationnel (*150#) • Code Marchand DISCOM SARL
              </span>
              <p className="text-[10px] text-slate-500 mt-2">
                Notification push USSD instantanée pour la zone CEMAC.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION MODAL                                 */}
      {/* ========================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-slate-900 text-center">
              Confirmer la Suppression Définitive
            </h3>

            <p className="text-xs text-slate-600 mt-2 text-center leading-relaxed">
              Êtes-vous absolument certain de vouloir supprimer l'abonné{' '}
              <strong className="text-slate-900 font-bold">{userToDelete.name}</strong> ({userToDelete.email}) ?
            </p>

            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-red-900">
                <Trash2 className="w-3.5 h-3.5" /> Conséquences de cette action :
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-red-700 pl-1">
                <li>Le compte abonné sera immédiatement révoqué.</li>
                <li>Son abonnement SaaS et ses droits d'accès seront annulés.</li>
                <li>Ses logements, baux et quittances associés seront effacés.</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              
              <button
                type="button"
                id="btn-confirm-user-deletion"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Suppression en cours...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer Définitivement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW RECEIPT / INVOICE MODAL                              */}
      {/* ========================================================= */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  Facture SaaS DISCOM #{viewingReceipt.sub?.facture_numero || 'FACT-DISCOM-2026-001'}
                </h3>
              </div>
              <button onClick={() => setViewingReceipt(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex justify-between items-start bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">DISCOM SARL Cameroun</span>
                  <span className="text-[11px] text-slate-500">Plateforme Locative Numérique</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">RC/DLA/2024/B/1892 · Douala, Cameroun</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    ACQUITTÉE
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Date : {viewingReceipt.sub?.date_debut || '2026-01-01'}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-slate-700">Abonné Facturé :</div>
                <div className="text-slate-800 font-semibold">{viewingReceipt.user.name}</div>
                <div className="text-slate-500 text-[11px]">{viewingReceipt.user.entreprise || 'Bailleur Indépendant'}</div>
                <div className="text-slate-500 text-[11px]">{viewingReceipt.user.email} · {viewingReceipt.user.phonenumber}</div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Forfait : {viewingReceipt.plan?.nom || 'Professionnel'}</span>
                  <span>{formatFCFA(viewingReceipt.sub?.montant_paye_fcfa || 35000)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Mode de paiement :</span>
                  <span>{viewingReceipt.sub?.mode_paiement || 'MTN Mobile Money'}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Référence transaction :</span>
                  <span className="font-mono">{viewingReceipt.sub?.reference_transaction || 'TXN-MOMO-849201'}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Validité :</span>
                  <span>Jusqu'au {viewingReceipt.sub?.date_expiration || '2027-01-01'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD SUBSCRIBER                                   */}
      {/* ========================================================= */}
      {isAddSubscriberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Ajouter un Nouvel Abonné Bailleur</h3>
                  <p className="text-[11px] text-slate-400">Création manuelle de compte et activation immédiate</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddSubscriberModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addSubscriberError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{addSubscriberError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubscriberSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom complet * :</label>
                  <input
                    type="text"
                    required
                    value={addSubscriberForm.name}
                    onChange={(e) => setAddSubscriberForm({ ...addSubscriberForm, name: e.target.value })}
                    placeholder="Ex: Paul Nguema"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adresse Email * :</label>
                  <input
                    type="email"
                    required
                    value={addSubscriberForm.email}
                    onChange={(e) => setAddSubscriberForm({ ...addSubscriberForm, email: e.target.value })}
                    placeholder="ex: paul.nguema@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone * :</label>
                  <input
                    type="text"
                    required
                    value={addSubscriberForm.phonenumber}
                    onChange={(e) => setAddSubscriberForm({ ...addSubscriberForm, phonenumber: e.target.value })}
                    placeholder="Ex: +237 699 00 11 22"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ville :</label>
                  <input
                    type="text"
                    value={addSubscriberForm.ville}
                    onChange={(e) => setAddSubscriberForm({ ...addSubscriberForm, ville: e.target.value })}
                    placeholder="Ex: Douala, Yaoundé..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Entreprise / Société :</label>
                  <input
                    type="text"
                    value={addSubscriberForm.entreprise}
                    onChange={(e) => setAddSubscriberForm({ ...addSubscriberForm, entreprise: e.target.value })}
                    placeholder="Ex: SCI Le Littoral"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mot de passe initial :</label>
                  <input
                    type="text"
                    value={addSubscriberForm.password}
                    onChange={(e) => setAddSubscriberForm({ ...addSubscriberForm, password: e.target.value })}
                    placeholder="Par défaut: password123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Paramètres de l'Abonnement Initial
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Forfait souscrit :</label>
                    <select
                      value={addSubscriberForm.planId}
                      onChange={(e) => setAddSubscriberForm({ ...addSubscriberForm, planId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 cursor-pointer"
                    >
                      {subscriptionPlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom} - {formatFCFA(p.prix_fcfa)}/m
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Durée (Mois) :</label>
                    <select
                      value={addSubscriberForm.dureeMois}
                      onChange={(e) => setAddSubscriberForm({ ...addSubscriberForm, dureeMois: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 cursor-pointer"
                    >
                      <option value={1}>1 Mois</option>
                      <option value={3}>3 Mois (Trimestriel)</option>
                      <option value={6}>6 Mois (Semestriel)</option>
                      <option value={12}>12 Mois (Annuel)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mode de règlement :</label>
                  <select
                    value={addSubscriberForm.modePaiement}
                    onChange={(e) => setAddSubscriberForm({ ...addSubscriberForm, modePaiement: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 cursor-pointer"
                  >
                    <option value="MTN Mobile Money Cameroun">MTN Mobile Money Cameroun</option>
                    <option value="Orange Money Cameroun">Orange Money Cameroun</option>
                    <option value="Espèces / Caisse DISCOM">Espèces / Caisse DISCOM</option>
                    <option value="Virement bancaire CEMAC">Virement bancaire CEMAC</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddSubscriberModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Créer & Activer l'Abonné
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT SUBSCRIBER                                  */}
      {/* ========================================================= */}
      {subscriberToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Modifier le Profil Abonné</h3>
                  <p className="text-[11px] text-slate-400">{subscriberToEdit.user.name} ({subscriberToEdit.user.email})</p>
                </div>
              </div>
              <button 
                onClick={() => setSubscriberToEdit(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSubscriberError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{editSubscriberError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubscriberSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom complet * :</label>
                  <input
                    type="text"
                    required
                    value={editSubscriberForm.name}
                    onChange={(e) => setEditSubscriberForm({ ...editSubscriberForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adresse Email * :</label>
                  <input
                    type="email"
                    required
                    value={editSubscriberForm.email}
                    onChange={(e) => setEditSubscriberForm({ ...editSubscriberForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone :</label>
                  <input
                    type="text"
                    value={editSubscriberForm.phonenumber}
                    onChange={(e) => setEditSubscriberForm({ ...editSubscriberForm, phonenumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ville :</label>
                  <input
                    type="text"
                    value={editSubscriberForm.ville}
                    onChange={(e) => setEditSubscriberForm({ ...editSubscriberForm, ville: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Entreprise / Raison Sociale :</label>
                <input
                  type="text"
                  value={editSubscriberForm.entreprise}
                  onChange={(e) => setEditSubscriberForm({ ...editSubscriberForm, entreprise: e.target.value })}
                  placeholder="Bailleur Indépendant ou Nom SCI"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Gestion de l'Abonnement et Accès
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Forfait attribué :</label>
                    <select
                      value={editSubscriberForm.planId}
                      onChange={(e) => setEditSubscriberForm({ ...editSubscriberForm, planId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 cursor-pointer"
                    >
                      {subscriptionPlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom} ({formatFCFA(p.prix_fcfa)}/m)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Statut d'accès :</label>
                    <select
                      value={editSubscriberForm.statut}
                      onChange={(e) => setEditSubscriberForm({ ...editSubscriberForm, statut: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 cursor-pointer"
                    >
                      <option value="actif">Actif (Accès total)</option>
                      <option value="expire">Expiré / Suspendu (Bloqué)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date d'expiration de l'abonnement :</label>
                  <input
                    type="date"
                    value={editSubscriberForm.date_expiration}
                    onChange={(e) => setEditSubscriberForm({ ...editSubscriberForm, date_expiration: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSubscriberToEdit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: EDIT PLAN & CLAUSES                              */}
      {/* ========================================================= */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-5 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Paramétrage du Forfait : {editingPlan.nom}</h3>
                  <p className="text-[11px] text-slate-400">Modifier le tarif, quotas et clauses contractuelles</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingPlan(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanEdit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom du forfait :</label>
                  <input 
                    type="text" 
                    value={editingPlan.nom} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, nom: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarif mensuel (FCFA) :</label>
                  <input 
                    type="number" 
                    value={editingPlan.prix_fcfa} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, prix_fcfa: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description générale :</label>
                <textarea 
                  rows={2}
                  value={editingPlan.description} 
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tranche CA :</label>
                  <input 
                    type="text" 
                    value={editingPlan.tranche_ca_label} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, tranche_ca_label: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Biens (Logements) :</label>
                  <input 
                    type="number" 
                    value={editingPlan.max_logements} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_logements: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Pièces / Lots :</label>
                  <input 
                    type="number" 
                    value={editingPlan.max_pieces} 
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_pieces: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              {/* CLAUSES CONTRACTUELLES EDIT SECTION */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-800">
                      Clauses Contractuelles du Forfait ({(editingPlan.clauses || []).length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentClauses = editingPlan.clauses || [];
                      setEditingPlan({
                        ...editingPlan,
                        clauses: [...currentClauses, '']
                      });
                    }}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une clause</span>
                  </button>
                </div>

                {(!editingPlan.clauses || editingPlan.clauses.length === 0) ? (
                  <p className="text-[11px] text-slate-400 italic py-2">
                    Aucune clause contractuelle spécifique définie pour ce forfait.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {editingPlan.clauses.map((clause, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-400 mt-1 shrink-0">
                          {idx + 1}.
                        </span>
                        <textarea
                          rows={2}
                          value={clause}
                          onChange={(e) => {
                            const updated = [...(editingPlan.clauses || [])];
                            updated[idx] = e.target.value;
                            setEditingPlan({ ...editingPlan, clauses: updated });
                          }}
                          placeholder="Énoncé de la clause contractuelle ou condition de service..."
                          className="flex-1 text-xs text-slate-800 leading-relaxed bg-transparent border-none p-0 focus:outline-none resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingPlan.clauses || []).filter((_, i) => i !== idx);
                            setEditingPlan({ ...editingPlan, clauses: updated });
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Supprimer cette clause"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setEditingPlan(null)} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Enregistrer les Modifications & Clauses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

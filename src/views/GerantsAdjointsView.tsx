import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ActiviteGerantType, UserAccount } from '../types';
import { 
  Users, 
  UserPlus, 
  Shield, 
  CheckCircle2, 
  X, 
  Mail, 
  Phone, 
  Lock, 
  Building2, 
  FileText, 
  CreditCard, 
  Trash2, 
  ExternalLink,
  Sparkles,
  AlertCircle,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  UserCheck,
  DollarSign,
  Edit3,
  Sliders,
  Check,
  KeyRound
} from 'lucide-react';
import { formatFCFA, formatDateFR } from '../utils/formatters';

export const GerantsAdjointsView: React.FC = () => {
  const { 
    currentUser, 
    gerantsAdjoints, 
    createGerantAdjoint, 
    updateGerantAdjoint,
    deleteGerantAdjoint,
    switchUser,
    activitesGerant,
    addActiviteGerant,
    effectiveOwnerId
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for creating Gérant Adjoint
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('+237 6');
  const [password, setPassword] = useState<string>('');
  const [createPermissions, setCreatePermissions] = useState({
    gestion_biens: true,
    gestion_logements: true,
    gestion_locataires: true,
    gestion_baux: true,
    enregistrement_paiements: true,
    generation_quittances: true,
    acces_rapports: true,
  });

  // Form states for editing Gérant Adjoint
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editStatut, setEditStatut] = useState<'actif' | 'suspendu' | 'inactif'>('actif');
  const [editPermissions, setEditPermissions] = useState({
    gestion_biens: true,
    gestion_logements: true,
    gestion_locataires: true,
    gestion_baux: true,
    enregistrement_paiements: true,
    generation_quittances: true,
    acces_rapports: true,
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Activity filter & search states
  const [selectedActionFilter, setSelectedActionFilter] = useState<'all' | ActiviteGerantType>('all');
  const [searchActivityQuery, setSearchActivityQuery] = useState<string>('');

  const currentGerant = gerantsAdjoints[0] || null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('+237 6');
    setPassword('');
    setCreatePermissions({
      gestion_biens: true,
      gestion_logements: true,
      gestion_locataires: true,
      gestion_baux: true,
      enregistrement_paiements: true,
      generation_quittances: true,
      acces_rapports: true,
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (gerant: UserAccount) => {
    setEditName(gerant.name);
    setEditEmail(gerant.email);
    setEditPhone(gerant.phonenumber);
    setEditPassword('');
    setEditStatut(gerant.statut_compte || 'actif');
    setEditPermissions({
      gestion_biens: gerant.permissions?.gestion_biens ?? true,
      gestion_logements: gerant.permissions?.gestion_logements ?? true,
      gestion_locataires: gerant.permissions?.gestion_locataires ?? true,
      gestion_baux: gerant.permissions?.gestion_baux ?? true,
      enregistrement_paiements: gerant.permissions?.enregistrement_paiements ?? true,
      generation_quittances: gerant.permissions?.generation_quittances ?? true,
      acces_rapports: gerant.permissions?.acces_rapports ?? true,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Veuillez renseigner le nom, l\'email et le numéro de téléphone.' });
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phonenumber: phone.trim(),
      password: password.trim() || 'password123',
      permissions: createPermissions
    };

    const res = createGerantAdjoint(payload);

    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'Erreur lors de la création du compte.' });
      return;
    }

    // Backend sync
    try {
      await fetch('/api/gerants-adjoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          bailleur_id: effectiveOwnerId
        })
      });
    } catch (err) {
      console.warn('API sync error:', err);
    }

    setFeedbackMsg({ 
      type: 'success', 
      text: `Le compte Gérant pour "${name}" a été créé avec succès avec les accès configurés.` 
    });
    setIsModalOpen(false);
    resetForm();
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGerant) return;

    const updates: Partial<UserAccount> = {
      name: editName.trim() || currentGerant.name,
      email: editEmail.trim().toLowerCase() || currentGerant.email,
      phonenumber: editPhone.trim() || currentGerant.phonenumber,
      statut_compte: editStatut,
      permissions: editPermissions
    };

    if (editPassword.trim()) {
      updates.password = editPassword.trim();
    }

    updateGerantAdjoint(currentGerant.id, updates);

    // Sync with backend API
    try {
      await fetch('/api/gerants-adjoints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentGerant.id,
          ...updates
        })
      });
    } catch (err) {
      console.warn('API update sync error:', err);
    }

    addActiviteGerant({
      gerant_id: currentGerant.id,
      gerant_nom: updates.name || currentGerant.name,
      bailleur_id: effectiveOwnerId,
      action_type: 'modification_acces',
      titre: 'Mise à jour des accès & permissions',
      description: `Le bailleur a modifié les droits d'accès délégués du Gérant ${updates.name || currentGerant.name}.`,
      statut: 'succes'
    });

    setFeedbackMsg({
      type: 'success',
      text: `Les accès et informations du Gérant "${updates.name}" ont été mis à jour avec succès.`
    });
    setIsEditModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDeleteGerant = async (id: string, gerantName: string) => {
    deleteGerantAdjoint(id);

    // Sync with backend API
    try {
      await fetch(`/api/gerants-adjoints?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete sync error:', err);
    }

    setDeleteConfirmId(null);
    setFeedbackMsg({ 
      type: 'success', 
      text: `Le compte Gérant pour "${gerantName}" a été définitivement supprimé.` 
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activitesGerant.filter(act => {
      const matchesType = selectedActionFilter === 'all' || act.action_type === selectedActionFilter;
      const q = searchActivityQuery.toLowerCase().trim();
      const matchesQuery = !q || (
        act.titre.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q) ||
        (act.locataire_nom && act.locataire_nom.toLowerCase().includes(q)) ||
        (act.quittance_numero && act.quittance_numero.toLowerCase().includes(q)) ||
        (act.reference && act.reference.toLowerCase().includes(q)) ||
        (act.logement_nom && act.logement_nom.toLowerCase().includes(q))
      );
      return matchesType && matchesQuery;
    });
  }, [activitesGerant, selectedActionFilter, searchActivityQuery]);

  // Activity stats calculation
  const totalOperations = activitesGerant.length;
  const totalEncaisseGerant = activitesGerant
    .filter(a => a.action_type === 'enregistrement_paiement' && a.montant_fcfa)
    .reduce((sum, a) => sum + (a.montant_fcfa || 0), 0);
  const quittancesEmisesCount = activitesGerant.filter(a => a.action_type === 'generation_quittance').length;

  const permissionList = [
    { key: 'gestion_biens', label: 'Gestion des Biens / Immeubles', desc: 'Ajout, modification et consultation des immeubles et villas' },
    { key: 'gestion_logements', label: 'Gestion des Logements & Pièces', desc: 'Création et découpage des unités, fixation des loyers' },
    { key: 'gestion_locataires', label: 'Gestion des Locataires & Dossiers', desc: 'Enregistrement, arriérés, modification et suppression des locataires' },
    { key: 'gestion_baux', label: 'Gestion des Baux & Contrats', desc: 'Rédaction, renouvellement et résiliation des contrats de bail' },
    { key: 'enregistrement_paiements', label: 'Enregistrement des Paiements', desc: 'Encaissements Mobile Money (MTN, Orange) et espèces' },
    { key: 'generation_quittances', label: 'Émission des Quittances', desc: 'Génération et téléchargement des quittances certifiées PDF' },
    { key: 'acces_rapports', label: 'Accès aux Rapports & Bilans', desc: 'Consultation des statistiques de revenus et bilans financiers' }
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Gérant & Activités Déléguées
            </h1>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-extrabold uppercase tracking-wider border border-indigo-100">
              Espace Bailleur
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez votre unique Gérant (Ajouter / Supprimer) et surveillez en temps réel toutes ses actions et opérations financières.
          </p>
        </div>

        {currentGerant ? (
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Gérant Actif (1/1)</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            id="btn-ajouter-gerant-adjoint-top"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Ajouter un Gérant</span>
          </button>
        )}
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compte Gérant</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              currentGerant ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {currentGerant ? '1/1 Actif' : '0/1 Disponible'}
            </span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800 block mt-1">
            {currentGerant ? currentGerant.name : 'Aucun'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {currentGerant ? `Connecté avec ${currentGerant.email}` : 'Cliquez sur Ajouter pour déléguer'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Opérations Réalisées</span>
          <span className="text-2xl font-extrabold text-indigo-700 block mt-1">
            {totalOperations} Activités
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {quittancesEmisesCount} quittances officielles générées
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Encaissé par le Gérant</span>
          <span className="text-2xl font-extrabold text-emerald-700 block mt-1">
            {formatFCFA(totalEncaisseGerant)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Règlements Orange & MTN Mobile Money</span>
        </div>
      </div>

      {/* SECTION 1: Compte Gérant (Ajouter & Supprimer uniquement) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Compte du Gérant
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Délégation exclusive sous la supervision de {currentUser.name}
          </span>
        </div>

        {!currentGerant ? (
          <div className="p-8 sm:p-12 text-center text-slate-500">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 mb-1">Aucun Gérant enregistré</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
              En tant que Bailleur, vous pouvez créer un compte Gérant unique. Ce compte aura par défaut tous les mêmes accès que vous pour gérer les biens, enregistrer les loyers et émettre les quittances.
            </p>
            <button
              type="button"
              id="btn-ajouter-gerant-adjoint-empty"
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm shadow-indigo-600/20 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Ajouter le Gérant</span>
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-start gap-3.5">
                <img
                  src={currentGerant.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                  alt={currentGerant.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-slate-900">{currentGerant.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Rôle : Gérant
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentGerant.statut_compte === 'suspendu' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {currentGerant.statut_compte === 'suspendu' ? 'Suspendu' : 'Actif'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {currentGerant.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {currentGerant.phonenumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Créé le {formatDateFR(currentGerant.created_at)} • Accès configurables par rapport à vos droits de Bailleur</span>
                  </p>
                </div>
              </div>

              {/* Boutons d'actions : Modifier les accès, Tester Espace, Supprimer */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {/* Modifier les accès */}
                <button
                  type="button"
                  id="btn-modifier-acces-gerant"
                  onClick={() => handleOpenEditModal(currentGerant)}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Modifier les accès et informations du Gérant"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Modifier les Accès</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchUser(currentGerant.id)}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Basculer vers l'espace de ce Gérant pour prévisualiser ses actions"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tester Espace</span>
                </button>

                {deleteConfirmId === currentGerant.id ? (
                  <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-lg border border-red-200">
                    <span className="text-[11px] text-red-700 font-bold px-1">Confirmer ?</span>
                    <button
                      type="button"
                      id="btn-confirmer-suppression-gerant"
                      onClick={() => handleDeleteGerant(currentGerant.id, currentGerant.name)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Oui, supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="btn-supprimer-gerant-adjoint"
                    onClick={() => setDeleteConfirmId(currentGerant.id)}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title="Supprimer définitivement le compte du Gérant"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visualisation détaillée des permissions accordées */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Accès accordés au Gérant par rapport à vos droits de Bailleur :
                </span>
                <button
                  onClick={() => handleOpenEditModal(currentGerant)}
                  className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold hover:underline cursor-pointer"
                >
                  Ajuster les permissions &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                {permissionList.map((p) => {
                  const isGranted = (currentGerant.permissions as any)?.[p.key] ?? true;
                  return (
                    <div 
                      key={p.key}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        isGranted 
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isGranted ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className={`text-[11px] font-semibold ${isGranted ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                          {p.label}
                        </span>
                      </div>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        isGranted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isGranted ? 'Autorisé' : 'Restreint'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Visualisation de TOUTES les activités faites par le Gérant */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Journal d'Audit & Historique des Activités du Gérant
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Traçabilité complète de chaque action effectuée par le Gérant (paiements encaissés, quittances, baux signés, lots attribués).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchActivityQuery}
                onChange={(e) => setSearchActivityQuery(e.target.value)}
                placeholder="Filtrer par locataire, quittance..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="px-5 py-2.5 border-b border-slate-100 bg-white flex items-center gap-1.5 flex-wrap overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filtres :
          </span>
          {[
            { id: 'all', label: `Toutes (${activitesGerant.length})` },
            { id: 'enregistrement_paiement', label: 'Encaissements' },
            { id: 'generation_quittance', label: 'Quittances' },
            { id: 'creation_bail', label: 'Baux & Contrats' },
            { id: 'attribution_logement', label: 'Attributions de lots' },
            { id: 'connexion', label: 'Connexions & Sessions' },
          ].map((tab) => {
            const isSelected = selectedActionFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedActionFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Activities List */}
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              Aucune activité ne correspond à vos critères de recherche.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Les nouvelles actions réalisées par le Gérant apparaîtront automatiquement ici en temps réel.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((act) => {
              const isPayment = act.action_type === 'enregistrement_paiement';
              const isReceipt = act.action_type === 'generation_quittance';
              const isLease = act.action_type === 'creation_bail';
              const isHousing = act.action_type === 'attribution_logement';

              return (
                <div key={act.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Action Icon Badge */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isPayment 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                        : isReceipt 
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' 
                          : isLease 
                            ? 'bg-purple-50 text-purple-600 border border-purple-200' 
                            : isHousing 
                              ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {isPayment ? (
                        <DollarSign className="w-4 h-4" />
                      ) : isReceipt ? (
                        <Receipt className="w-4 h-4" />
                      ) : isLease ? (
                        <FileText className="w-4 h-4" />
                      ) : isHousing ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {act.titre}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isPayment 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isReceipt 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : isLease 
                                ? 'bg-purple-100 text-purple-800' 
                                : isHousing 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-slate-200 text-slate-700'
                        }`}>
                          {act.action_type.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          • {formatDateFR(act.date)} à {act.heure}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-0.5">
                        {act.description}
                      </p>

                      {/* Details pill row */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                          👤 Auteur : {act.gerant_nom} (Gérant)
                        </span>
                        {act.locataire_nom && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-medium border border-purple-100">
                            Locataire : {act.locataire_nom}
                          </span>
                        )}
                        {act.logement_nom && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium border border-blue-100">
                            Immeuble : {act.logement_nom}
                          </span>
                        )}
                        {act.quittance_numero && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold border border-indigo-100">
                            N° {act.quittance_numero}
                          </span>
                        )}
                        {act.reference && (
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded font-mono text-[10px] border border-slate-200">
                            Réf : {act.reference}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial amount or status */}
                  <div className="flex md:flex-col items-end justify-between md:justify-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {act.montant_fcfa ? (
                      <span className="font-extrabold text-sm sm:text-base text-emerald-700">
                        +{formatFCFA(act.montant_fcfa)}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        Action système
                      </span>
                    )}
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Validé
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Ajouter le Gérant
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Limite stricte : 1 seul compte Gérant par Bailleur
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-indigo-800">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  Règle de Parité des Accès DISCOM
                </p>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Le compte sera nommé <strong>« Gérant »</strong> (et non « Bailleur »). Il bénéficie par défaut de l'ensemble de vos accès (logements, baux, quittances, encaissements) et toutes ses opérations sont enregistrées dans votre journal d'activités.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nom complet du Gérant : *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Pauline Mbarga"
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="gerant@entreprise.cm"
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+237 690 00 00 00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mot de passe initial de connexion :
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Par défaut : password123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Sélection des accès par rapport aux droits du bailleur */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Accès autorisés par rapport à vos droits de Bailleur :
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCreatePermissions({
                        gestion_biens: true,
                        gestion_logements: true,
                        gestion_locataires: true,
                        gestion_baux: true,
                        enregistrement_paiements: true,
                        generation_quittances: true,
                        acces_rapports: true,
                      })}
                      className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Tout autoriser
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setCreatePermissions({
                        gestion_biens: false,
                        gestion_logements: false,
                        gestion_locataires: false,
                        gestion_baux: false,
                        enregistrement_paiements: false,
                        generation_quittances: false,
                        acces_rapports: false,
                      })}
                      className="text-[10px] text-slate-500 font-bold hover:underline cursor-pointer"
                    >
                      Tout restreindre
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {permissionList.map(p => (
                    <label 
                      key={p.key}
                      className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(createPermissions as any)[p.key]}
                        onChange={(e) => setCreatePermissions(prev => ({ ...prev, [p.key]: e.target.checked }))}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">{p.label}</span>
                        <span className="text-[10px] text-slate-500 block">{p.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  id="btn-confirmer-creation-gerant"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Confirmer la création</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: MODIFIER les accès et informations du Gérant Adjoint */}
      {isEditModalOpen && currentGerant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Sliders className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Modifier les Accès du Gérant
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Ajustez les permissions du gérant par rapport à vos propres accès de Bailleur
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Infos générales */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nom complet : *
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Statut du compte :
                    </label>
                    <select
                      value={editStatut}
                      onChange={(e) => setEditStatut(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="actif">Actif (Accès autorisé)</option>
                      <option value="suspendu">Suspendu (Accès bloqué)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email de connexion : *
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Téléphone mobile : *
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nouveau mot de passe (laisser vide pour ne pas modifier) :
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Laisser vide si inchangé"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Toggles des accès délégués */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Permissions déléguées par rapport à vos accès :
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditPermissions({
                        gestion_biens: true,
                        gestion_logements: true,
                        gestion_locataires: true,
                        gestion_baux: true,
                        enregistrement_paiements: true,
                        generation_quittances: true,
                        acces_rapports: true,
                      })}
                      className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Tout autoriser
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setEditPermissions({
                        gestion_biens: false,
                        gestion_logements: false,
                        gestion_locataires: false,
                        gestion_baux: false,
                        enregistrement_paiements: false,
                        generation_quittances: false,
                        acces_rapports: false,
                      })}
                      className="text-[10px] text-slate-500 font-bold hover:underline cursor-pointer"
                    >
                      Tout restreindre
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {permissionList.map(p => (
                    <label 
                      key={p.key}
                      className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(editPermissions as any)[p.key]}
                        onChange={(e) => setEditPermissions(prev => ({ ...prev, [p.key]: e.target.checked }))}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">{p.label}</span>
                        <span className="text-[10px] text-slate-500 block">{p.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  id="btn-sauvegarder-modifs-gerant"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer les modifications d&apos;accès</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

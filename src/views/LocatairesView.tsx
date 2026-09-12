import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Locataire, Bail } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  UserCheck, 
  ChevronRight, 
  X, 
  LogOut, 
  Download, 
  Share2, 
  ShieldAlert,
  Clock,
  Sparkles,
  MessageCircle,
  Edit2,
  Trash2,
  AlertCircle,
  Building,
  User,
  Check
} from 'lucide-react';
import { formatFCFA, formatDateFR, formatMonthYear } from '../utils/formatters';
import { LocataireLeaseModal } from '../components/LocataireLeaseModal';

interface LocatairesViewProps {
  onOpenNewLease: () => void;
}

export const LocatairesView: React.FC<LocatairesViewProps> = ({ onOpenNewLease }) => {
  const { 
    locataires, 
    baux, 
    pieces, 
    logements, 
    paiements, 
    resilierBail, 
    updateLocataire,
    deleteLocataire,
    setSelectedQuittancePaiement,
    currentUser 
  } = useApp();

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'en_retard' | 'resilie'>('all');
  const [selectedLocataireDetail, setSelectedLocataireDetail] = useState<Locataire | null>(null);
  const [selectedLocataireForLease, setSelectedLocataireForLease] = useState<Locataire | null>(null);
  const [resiliationModalBail, setResiliationModalBail] = useState<Bail | null>(null);

  // Edit tenant modal state
  const [locataireToEdit, setLocataireToEdit] = useState<Locataire | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Locataire>>({});

  // Delete tenant confirm state
  const [locataireToDelete, setLocataireToDelete] = useState<Locataire | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Resiliation form state
  const [resilDate, setResilDate] = useState(new Date().toISOString().split('T')[0]);
  const [resilMotif, setResilMotif] = useState('Déménagement');
  const [resilEtatLieux, setResilEtatLieux] = useState('Conforme, bon état général');
  const [cautionRestituee, setCautionRestituee] = useState(0);
  const [retenueCaution, setRetenueCaution] = useState(0);
  const [motifRetenue, setMotifRetenue] = useState('');

  // Filter locataires
  const filteredLocataires = locataires.filter(loc => {
    if (statusFilter === 'actif' && loc.statut !== 'actif') return false;
    if (statusFilter === 'resilie' && loc.statut !== 'resilie') return false;
    if (statusFilter === 'en_retard' && (loc.arrieres_montant || 0) <= 0) return false;

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchName = loc.nom_complet.toLowerCase().includes(q);
      const matchPhone = loc.telephone_principal.includes(q);
      const matchEmail = loc.email.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail) return false;
    }
    return true;
  });

  const handleOpenEditModal = (loc: Locataire) => {
    setLocataireToEdit(loc);
    setEditFormData({
      nom_complet: loc.nom_complet,
      type_personne: loc.type_personne || 'personne_physique',
      raison_sociale: loc.raison_sociale || '',
      niu: loc.niu || '',
      nom_gerant: loc.nom_gerant || '',
      telephone_gerant: loc.telephone_gerant || '',
      telephone_principal: loc.telephone_principal,
      telephone_secondaire: loc.telephone_secondaire || '',
      email: loc.email,
      cni_passeport: loc.cni_passeport,
      profession: loc.profession || '',
      employeur: loc.employeur || '',
      contact_urgence_nom: loc.contact_urgence_nom || '',
      contact_urgence_telephone: loc.contact_urgence_telephone || '',
      statut: loc.statut,
      is_ancien: loc.is_ancien || false,
      arrieres_montant: loc.arrieres_montant || 0,
      arrieres_details: loc.arrieres_details || '',
      date_entree_initiale: loc.date_entree_initiale || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locataireToEdit) return;

    const updated = {
      ...editFormData,
      nom_complet: editFormData.nom_complet?.trim() || locataireToEdit.nom_complet,
      arrieres_montant: Number(editFormData.arrieres_montant) || 0
    };

    updateLocataire(locataireToEdit.id, updated);

    // Sync with backend API
    try {
      await fetch('/api/locataires', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: locataireToEdit.id, ...updated })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }

    setFeedbackMsg({
      type: 'success',
      text: `Les informations de ${updated.nom_complet} ont été mises à jour avec succès.`
    });
    setLocataireToEdit(null);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleConfirmDelete = async () => {
    if (!locataireToDelete) return;
    const name = locataireToDelete.nom_complet;
    const id = locataireToDelete.id;

    deleteLocataire(id);

    // Sync with backend API
    try {
      await fetch(`/api/locataires?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete sync warning:', err);
    }

    setLocataireToDelete(null);
    if (selectedLocataireDetail?.id === id) {
      setSelectedLocataireDetail(null);
    }
    setFeedbackMsg({
      type: 'success',
      text: `Le locataire "${name}" a été définitivement supprimé et les lots associés ont été libérés.`
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleOpenResiliation = (bail: Bail) => {
    setResiliationModalBail(bail);
    setCautionRestituee(bail.caution_versee_fcfa || 0);
    setRetenueCaution(0);
    setMotifRetenue('');
  };

  const handleConfirmResiliation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resiliationModalBail) return;

    resilierBail(
      resiliationModalBail.id,
      resilDate,
      resilMotif,
      resilEtatLieux,
      {
        caution_initiale: resiliationModalBail.caution_versee_fcfa || 0,
        retenues_reparations: retenueCaution,
        loyers_impayes_deduits: 0,
        montant_restitue: cautionRestituee,
        date_reglement: resilDate,
        remarques: motifRetenue || 'Règlement final validé.'
      }
    );

    setResiliationModalBail(null);
    setSelectedLocataireDetail(null);
  };

  const handleDirectWhatsApp = (loc: Locataire) => {
    const cleanPhone = loc.telephone_principal.replace(/\D/g, '');
    const hasArrears = (loc.arrieres_montant || 0) > 0;
    const text = hasArrears 
      ? `Bonjour ${loc.nom_complet}, sauf erreur de notre part, votre loyer accuse un solde impayé de ${formatFCFA(loc.arrieres_montant || 0)}. Merci de bien vouloir régulariser via MTN MoMo ou Orange Money. Cordialement, ${currentUser.name}.`
      : `Bonjour ${loc.nom_complet}, nous vous confirmons la bonne prise en compte de vos règlements de loyer. Merci de votre confiance ! Cordialement, ${currentUser.name}.`;
    
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Locataires & Contrats de Bail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Répertoire complet des locataires, gestion des créations, modifications, suppressions et arriérés.
          </p>
        </div>

        <button 
          onClick={onOpenNewLease}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Nouveau Locataire & Bail</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Rechercher par nom, téléphone (+237), email..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'actif', label: 'Actifs' },
            { id: 'en_retard', label: 'En retard' },
            { id: 'resilie', label: 'Résiliés' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`
                px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer
                ${statusFilter === st.id 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }
              `}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Locataire & Contact</th>
              <th className="py-2.5 px-3">Bien & Logement</th>
              <th className="py-2.5 px-3">Profession / Employeur</th>
              <th className="py-2.5 px-3 text-right">Loyer Mensuel</th>
              <th className="py-2.5 px-3 text-center">Statut / Impayés</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredLocataires.map((loc) => {
              const piece = pieces.find(p => p.id === loc.piece_id);
              const logement = logements.find(l => l.id === loc.logement_id);
              const bail = baux.find(b => b.locataire_id === loc.id && b.statut === 'actif');
              const hasArrears = (loc.arrieres_montant || 0) > 0;

              return (
                <tr 
                  key={loc.id} 
                  onClick={() => setSelectedLocataireForLease(loc)}
                  className="hover:bg-indigo-50/60 transition-colors cursor-pointer group"
                  title="Cliquez pour ouvrir le dossier, ajouter un logement ou générer/télécharger le contrat de bail PDF"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                        {loc.type_personne === 'personne_morale' ? (
                          <span className="text-sm">🏢</span>
                        ) : (
                          <img 
                            src={loc.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                            alt="" 
                            className="w-full h-full rounded-full object-cover" 
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">{loc.nom_complet}</p>
                          {loc.is_ancien && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-extrabold uppercase border border-amber-200">
                              Ancien
                            </span>
                          )}
                          {loc.type_personne === 'personne_morale' && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-extrabold uppercase">
                              Entreprise
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {loc.type_personne === 'personne_morale' && loc.niu && (
                            <span className="font-mono text-indigo-900 font-bold">NIU: {loc.niu} • </span>
                          )}
                          {loc.telephone_principal} • {loc.email}
                        </p>
                        {loc.type_personne === 'personne_morale' && loc.nom_gerant && (
                          <p className="text-[10px] text-slate-500">
                            Gérant : <strong className="text-slate-700">{loc.nom_gerant}</strong> ({loc.telephone_gerant || loc.telephone_secondaire})
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 block">{piece?.nom || 'Unité'}</span>
                    <span className="text-[11px] text-slate-500">{logement?.nom}</span>
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    {loc.profession_employeur || loc.profession || 'Professionnel'}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {bail ? formatFCFA(bail.montant_loyer_fcfa + bail.montant_charges_fcfa) : '—'}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {hasArrears ? (
                      <div>
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full block whitespace-nowrap">
                          Impayé : {formatFCFA(loc.arrieres_montant || 0)}
                        </span>
                        {loc.arrieres_details && (
                          <span className="text-[9px] text-red-600 mt-0.5 block line-clamp-1 max-w-[130px] mx-auto" title={loc.arrieres_details}>
                            {loc.arrieres_details}
                          </span>
                        )}
                      </div>
                    ) : loc.statut === 'actif' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        À jour
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                        Résilié
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Direct WhatsApp Action */}
                      <button 
                        onClick={() => handleDirectWhatsApp(loc)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        title="Envoyer un message ou relance WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      <button 
                        onClick={() => setSelectedLocataireForLease(loc)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="Ouvrir le contrat de bail, ajouter un logement ou télécharger le PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden md:inline">Bail</span>
                      </button>

                      {/* Modifier le locataire */}
                      <button 
                        onClick={() => handleOpenEditModal(loc)}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        title="Modifier les données du locataire"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden lg:inline">Modifier</span>
                      </button>

                      {/* Supprimer le locataire */}
                      <button 
                        onClick={() => setLocataireToDelete(loc)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        title="Supprimer ce locataire et libérer ses lots"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span className="hidden lg:inline">Supprimer</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Tenant Modal */}
      {locataireToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#0b1c30] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#6cf8bb]" />
                <h3 className="font-bold text-sm">Modifier le locataire : {locataireToEdit.nom_complet}</h3>
              </div>
              <button 
                onClick={() => setLocataireToEdit(null)} 
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Type selector */}
              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-700 text-xs mr-2">Type :</span>
                <button
                  type="button"
                  onClick={() => setEditFormData(prev => ({ ...prev, type_personne: 'personne_physique' }))}
                  className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
                    editFormData.type_personne === 'personne_physique'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <User className="w-3 h-3" />
                  Personne physique
                </button>
                <button
                  type="button"
                  onClick={() => setEditFormData(prev => ({ ...prev, type_personne: 'personne_morale' }))}
                  className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
                    editFormData.type_personne === 'personne_morale'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <Building className="w-3 h-3" />
                  Personne morale (Entreprise)
                </button>
              </div>

              {/* Company specific fields */}
              {editFormData.type_personne === 'personne_morale' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Raison sociale *</label>
                    <input
                      type="text"
                      value={editFormData.raison_sociale || ''}
                      onChange={(e) => setEditFormData(prev => ({ 
                        ...prev, 
                        raison_sociale: e.target.value,
                        nom_complet: e.target.value
                      }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NIU *</label>
                    <input
                      type="text"
                      value={editFormData.niu || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, niu: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nom du Gérant *</label>
                    <input
                      type="text"
                      value={editFormData.nom_gerant || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, nom_gerant: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Téléphone du Gérant *</label>
                    <input
                      type="text"
                      value={editFormData.telephone_gerant || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, telephone_gerant: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              )}

              {/* Common name input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editFormData.type_personne === 'personne_morale' ? 'Nom affiché' : 'Nom complet *'}
                </label>
                <input
                  type="text"
                  value={editFormData.nom_complet || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, nom_complet: e.target.value }))}
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone Principal *</label>
                  <input
                    type="tel"
                    value={editFormData.telephone_principal || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, telephone_principal: e.target.value }))}
                    required
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone Secondaire</label>
                  <input
                    type="tel"
                    value={editFormData.telephone_secondaire || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, telephone_secondaire: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNI / Passeport</label>
                  <input
                    type="text"
                    value={editFormData.cni_passeport || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, cni_passeport: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Profession & Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Profession / Employeur</label>
                  <input
                    type="text"
                    value={editFormData.profession || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, profession: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statut du dossier</label>
                  <select
                    value={editFormData.statut || 'actif'}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, statut: e.target.value as any }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="actif">Actif</option>
                    <option value="resilie">Résilié</option>
                    <option value="archive">Archivé</option>
                  </select>
                </div>
              </div>

              {/* Ancienneté & Arriérés */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900">Ancienneté & Arriérés :</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-amber-900 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editFormData.is_ancien)}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, is_ancien: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    Locataire ancien (déjà présent avant informatisation)
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Arriérés actuels (FCFA)</label>
                    <input
                      type="number"
                      min="0"
                      value={editFormData.arrieres_montant ?? 0}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, arrieres_montant: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date d&apos;entrée initiale</label>
                    <input
                      type="date"
                      value={editFormData.date_entree_initiale || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, date_entree_initiale: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Détails des arriérés</label>
                    <input
                      type="text"
                      value={editFormData.arrieres_details || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, arrieres_details: e.target.value }))}
                      placeholder="Ex: Loyer impayé Janvier"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setLocataireToEdit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {locataireToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-5 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Supprimer le locataire ?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Êtes-vous sûr de vouloir supprimer définitivement <strong className="text-slate-900">{locataireToDelete.nom_complet}</strong> ?
              </p>
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-3 text-left">
                ⚠️ Cette action supprimera le dossier locataire et libérera automatiquement le ou les lots / logements qu&apos;il occupait.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setLocataireToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resiliation Modal */}
      {resiliationModalBail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Résiliation du contrat de bail</h3>
              <button onClick={() => setResiliationModalBail(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmResiliation} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date effective de sortie</label>
                <input 
                  type="date" 
                  value={resilDate} 
                  onChange={(e) => setResilDate(e.target.value)} 
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs" 
                  required 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif de résiliation</label>
                <input 
                  type="text" 
                  value={resilMotif} 
                  onChange={(e) => setResilMotif(e.target.value)} 
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">État des lieux de sortie</label>
                <textarea 
                  value={resilEtatLieux} 
                  onChange={(e) => setResilEtatLieux(e.target.value)} 
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs" 
                  rows={2} 
                />
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Caution restituée (FCFA)</label>
                  <input 
                    type="number" 
                    value={cautionRestituee} 
                    onChange={(e) => setCautionRestituee(Number(e.target.value))} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Retenues éventuelles (FCFA)</label>
                  <input 
                    type="number" 
                    value={retenueCaution} 
                    onChange={(e) => setRetenueCaution(Number(e.target.value))} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setResiliationModalBail(null)} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Confirmer la résiliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Detail Modal */}
      {selectedLocataireDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedLocataireDetail.photo_url} 
                  alt="" 
                  className="w-12 h-12 rounded-full object-cover border border-slate-200" 
                />
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedLocataireDetail.nom_complet}</h3>
                  <p className="text-xs text-slate-500">{selectedLocataireDetail.profession_employeur || selectedLocataireDetail.profession}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLocataireDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Téléphone Principal</span>
                  <p className="font-bold text-slate-800">{selectedLocataireDetail.telephone_principal}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Email</span>
                  <p className="font-bold text-slate-800">{selectedLocataireDetail.email}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">CNI / Passeport</span>
                  <p className="font-bold text-slate-800">{selectedLocataireDetail.cni_passeport || 'CM-100928'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Situation Familiale</span>
                  <p className="font-bold text-slate-800 capitalize">{selectedLocataireDetail.situation_familiale} ({selectedLocataireDetail.nombre_enfants} enfants)</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button 
                  onClick={() => handleDirectWhatsApp(selectedLocataireDetail)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>Contacter sur WhatsApp</span>
                </button>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const loc = selectedLocataireDetail;
                      setSelectedLocataireDetail(null);
                      handleOpenEditModal(loc);
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>

                  {selectedLocataireDetail.statut === 'actif' && (
                    <button 
                      onClick={() => {
                        const b = baux.find(item => item.locataire_id === selectedLocataireDetail.id && item.statut === 'actif');
                        if (b) handleOpenResiliation(b);
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-semibold cursor-pointer"
                    >
                      Résilier le bail & Sortie
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lease & Housing Assignment Modal (Triggered by clicking any tenant row) */}
      {selectedLocataireForLease && (
        <LocataireLeaseModal
          locataire={selectedLocataireForLease}
          onClose={() => setSelectedLocataireForLease(null)}
        />
      )}
    </div>
  );
};

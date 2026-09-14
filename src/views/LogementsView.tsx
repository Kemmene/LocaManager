import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logement, HousingType, HousingStatus } from '../types';
import { 
  Building2, 
  MapPin, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Edit, 
  Archive, 
  DoorOpen, 
  TrendingUp, 
  Users, 
  ChevronRight,
  X,
  Check,
  Building,
  Plus,
  Layers,
  Crown,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { formatFCFA } from '../utils/formatters';

interface LogementsViewProps {
  onOpenNewHousing?: (mode?: 'single' | 'batch') => void;
  onOpenNewPiece?: (logementId?: string) => void;
}

export const LogementsView: React.FC<LogementsViewProps> = ({
  onOpenNewHousing,
  onOpenNewPiece
}) => {
  const { 
    logements, 
    pieces, 
    locataires, 
    updateLogement, 
    archiveLogement, 
    setActiveTab,
    currentUser,
    currentUserSubscription,
    isCurrentUserSubscriptionExpired,
    currentUserPlan,
    setIsPlanModalOpen
  } = useApp();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLogementForDetail, setSelectedLogementForDetail] = useState<Logement | null>(null);
  const [editingLogement, setEditingLogement] = useState<Logement | null>(null);

  // Active non-archived properties
  const activeLogements = logements.filter(l => !l.is_archived);

  // Calculate days remaining on subscription
  let daysRemaining = 0;
  if (currentUserSubscription?.date_expiration) {
    const expDate = new Date(currentUserSubscription.date_expiration);
    const today = new Date();
    daysRemaining = Math.max(0, Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // Filtered
  const filteredLogements = activeLogements.filter(l => {
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    if (statusFilter !== 'all' && l.statut !== statusFilter) return false;
    if (cityFilter && !l.ville.toLowerCase().includes(cityFilter.toLowerCase()) && !l.nom.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    return true;
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLogement) return;
    updateLogement(editingLogement.id, editingLogement);
    setEditingLogement(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Creation Buttons and View Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Gestion des Biens & Patrimoine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision de vos immeubles, résidences, villas et studios au Cameroun ({activeLogements.length} biens actifs)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Quick toggle list / grid */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-100 p-0.5">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Vue Liste"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action: Add Single Bien */}
          {onOpenNewHousing && (
            <button
              onClick={() => onOpenNewHousing('single')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nouveau Bien</span>
            </button>
          )}
        </div>
      </div>

      {/* Subscription Validity Bar for Landlord */}
      {currentUser.role === 'bailleur' && (
        isCurrentUserSubscriptionExpired ? (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Forfait DISCOM Expiré</span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span>Votre forfait s'est achevé le {currentUserSubscription?.date_expiration || 'récemment'}. Renouvelez pour continuer à enregistrer vos propriétés.</span>
              </div>
            </div>
            <button
              onClick={() => setIsPlanModalOpen(true)}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Renouveler mon Forfait</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50/40 border border-emerald-200/80 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-900">
                    Forfait {currentUserPlan?.nom || 'Propriétaire'}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full">
                    Actif
                  </span>
                  <span className="text-slate-500 hidden md:inline">·</span>
                  <span className="text-slate-600 hidden md:inline font-medium">
                    Création de biens autorisée jusqu'au {currentUserSubscription?.date_expiration || '31/12/2026'} ({daysRemaining} jours restants)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Capacité : {activeLogements.length} biens actifs sur {currentUserPlan?.max_logements >= 999 ? 'illimité' : `${currentUserPlan?.max_logements || 25} inclus`} dans votre forfait DISCOM.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Prolonger / Forfaits</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2.5 items-center flex-1 min-w-[280px]">
          {/* Type Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Tous les types de biens</option>
              <option value="immeuble">Immeuble</option>
              <option value="villa">Villa</option>
              <option value="maison">Maison</option>
              <option value="studio_residence">Résidence / Studios</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          {/* City / Location Input */}
          <div className="relative flex-1 min-w-[180px]">
            <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filtrer par ville ou quartier (Douala, Yaoundé...)"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'plein', label: 'Plein' },
              { id: 'partiel', label: 'Partiel' },
              { id: 'vide', label: 'Vide' },
              { id: 'travaux', label: 'Travaux' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
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
      </div>

      {/* Grid or List of Properties */}
      {filteredLogements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 sm:p-14 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-800 mb-1">Aucun bien trouvé</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Vous n'avez pas encore de propriété enregistrée ou correspondant à vos filtres. Enregistrez un nouveau bien (immeuble, villa, maison...) dès maintenant.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onOpenNewHousing && (
              <button
                type="button"
                onClick={() => onOpenNewHousing('single')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nouveau Bien</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLogements.map((logement) => {
            const logPieces = pieces.filter(p => p.logement_id === logement.id);
            const occPieces = logPieces.filter(p => p.statut === 'occupee').length;
            const caTotal = logPieces.reduce((sum, p) => sum + (p.loyer_reference + (p.charges_incluses || 0)), 0);
            const totalSuperficie = logPieces.reduce((sum, p) => sum + (p.superficie || 0), 0);

            let statusBadge = { label: 'Libre', bg: 'bg-yellow-100 text-yellow-800' };
            if (logement.statut === 'plein' || (logPieces.length > 0 && occPieces === logPieces.length)) {
              statusBadge = { label: 'Occupé 100%', bg: 'bg-emerald-100 text-emerald-800' };
            } else if (logement.statut === 'partiel' || occPieces > 0) {
              statusBadge = { label: `Occupé (${occPieces}/${logPieces.length})`, bg: 'bg-blue-100 text-blue-800' };
            } else if (logement.statut === 'travaux') {
              statusBadge = { label: 'En travaux', bg: 'bg-red-100 text-red-800' };
            }

            return (
              <article 
                key={logement.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Photo banner */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img 
                    src={logement.photo} 
                    alt={logement.nom}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-xs shadow-xs ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-white/95 text-slate-800 text-[10px] font-bold rounded shadow-xs uppercase tracking-wider">
                      {logement.type}
                    </span>
                    {logement.type === 'immeuble' && (
                      <span className="px-2 py-0.5 bg-indigo-900/90 text-white text-[10px] font-bold rounded shadow-xs">
                        R+{logement.nombre_etages || 1}
                        {logement.a_logements_rdc !== false ? ' • RDC avec logements' : ' • RDC sans logements'}
                        {logement.a_sous_sol ? ` • ${logement.nombre_sous_sols || 1} Sous-sol` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm text-slate-800 line-clamp-1">
                        {logement.nom}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setEditingLogement(logement)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => archiveLogement(logement.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          title="Archiver"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{logement.adresse}, {logement.ville}{logement.pays ? ` (${logement.pays})` : ''}</span>
                    </p>

                    {/* Metrics 3 columns */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-slate-100 mb-3 bg-slate-50/70 rounded-lg px-2">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Logements</span>
                        <span className="font-bold text-xs text-slate-800">
                          {logPieces.length} unités
                        </span>
                      </div>
                      <div className="text-center border-l border-r border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Superficie</span>
                        <span className="font-bold text-xs text-slate-800">
                          {totalSuperficie > 0 ? `${totalSuperficie} m²` : '—'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">CA Mensuel</span>
                        <span className="font-bold text-xs text-emerald-700">
                          {formatFCFA(caTotal)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {logement.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setActiveTab('pieces');
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group/btn cursor-pointer"
                    >
                      <DoorOpen className="w-3.5 h-3.5" />
                      <span>Voir les {logPieces.length} logements</span>
                      <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>

                    <button 
                      onClick={() => setSelectedLogementForDetail(logement)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                      Fiche
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Bien & Emplacement</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-center">Logements / Unités</th>
                <th className="py-2.5 px-3 text-right">CA Potentiel</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogements.map((logement) => {
                const logPieces = pieces.filter(p => p.logement_id === logement.id);
                const occPieces = logPieces.filter(p => p.statut === 'occupee').length;
                const caTotal = logPieces.reduce((sum, p) => sum + (p.loyer_reference + (p.charges_incluses || 0)), 0);

                return (
                  <tr key={logement.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={logement.photo} 
                          alt="" 
                          className="w-10 h-10 rounded-md object-cover border border-slate-200" 
                        />
                        <div>
                          <p className="font-bold text-slate-800">{logement.nom}</p>
                          <p className="text-[11px] text-slate-500">{logement.adresse}, {logement.ville}{logement.pays ? ` (${logement.pays})` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 uppercase text-[11px] font-semibold text-slate-600">
                      {logement.type}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {occPieces} / {logPieces.length} occupées
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {formatFCFA(caTotal)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        logement.statut === 'plein' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {logement.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setSelectedLogementForDetail(logement)}
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                          title="Fiche"
                        >
                          <Building className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setEditingLogement(logement)}
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingLogement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-800">
                Modifier le Logement
              </h3>
              <button 
                onClick={() => setEditingLogement(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nom de la propriété :
                </label>
                <input 
                  type="text"
                  value={editingLogement.nom}
                  onChange={(e) => setEditingLogement({ ...editingLogement, nom: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Adresse :
                  </label>
                  <input 
                    type="text"
                    value={editingLogement.adresse}
                    onChange={(e) => setEditingLogement({ ...editingLogement, adresse: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Ville :
                  </label>
                  <input 
                    type="text"
                    value={editingLogement.ville}
                    onChange={(e) => setEditingLogement({ ...editingLogement, ville: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Pays :
                  </label>
                  <input 
                    type="text"
                    value={editingLogement.pays || 'Cameroun'}
                    onChange={(e) => setEditingLogement({ ...editingLogement, pays: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Si Immeuble : Configuration étages & Rez-de-chaussée */}
              {editingLogement.type === 'immeuble' && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950">
                      Configuration Immeuble (Étages & RDC)
                    </label>
                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800">
                      R+{editingLogement.nombre_etages || 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Nombre d'étages :
                      </label>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={editingLogement.nombre_etages || 1}
                        onChange={(e) => setEditingLogement({ ...editingLogement, nombre_etages: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input 
                        type="checkbox"
                        id="edit-a-logements-rdc"
                        checked={editingLogement.a_logements_rdc !== false}
                        onChange={(e) => setEditingLogement({ ...editingLogement, a_logements_rdc: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="edit-a-logements-rdc" className="text-xs font-medium text-slate-800 cursor-pointer select-none">
                        Le rez-de-chaussée contient des logements
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Description :
                </label>
                <textarea 
                  rows={3}
                  value={editingLogement.description}
                  onChange={(e) => setEditingLogement({ ...editingLogement, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setEditingLogement(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {selectedLogementForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{selectedLogementForDetail.nom}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedLogementForDetail.adresse}, {selectedLogementForDetail.ville}{selectedLogementForDetail.pays ? ` (${selectedLogementForDetail.pays})` : ''}
                </p>
              </div>
              <button 
                onClick={() => setSelectedLogementForDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <img 
                src={selectedLogementForDetail.photo} 
                alt="" 
                className="w-full h-56 object-cover rounded-lg border border-slate-200" 
              />
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedLogementForDetail.description}
              </p>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                  Unités & Logements Composants
                </h4>
                <div className="space-y-2">
                  {pieces.filter(p => p.logement_id === selectedLogementForDetail.id).map(p => (
                    <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{p.nom} ({p.type})</span>
                        <span className="text-[11px] text-slate-500 block">
                          {p.etage === 0 ? 'Rez-de-chaussée (RDC)' : p.etage < 0 ? `Sous-sol ${p.etage}` : `Étage ${p.etage}`} • {p.superficie} m²
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700">{formatFCFA(p.loyer_reference)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

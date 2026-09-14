import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Piece, PieceStatus, PieceType } from '../types';
import { 
  DoorOpen, 
  Plus, 
  Search, 
  Filter, 
  Columns, 
  List, 
  Building, 
  History, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Calendar, 
  Edit, 
  Trash2, 
  X,
  Clock,
  Home
} from 'lucide-react';
import { formatFCFA, formatDateFR } from '../utils/formatters';

interface PiecesViewProps {
  onOpenNewPiece: (logementId?: string) => void;
  onOpenNewLeaseForPiece: (pieceId: string) => void;
}

export const PiecesView: React.FC<PiecesViewProps> = ({
  onOpenNewPiece,
  onOpenNewLeaseForPiece
}) => {
  const { 
    pieces, 
    logements, 
    locataires, 
    occupationHistory, 
    updatePiece, 
    deletePiece, 
    setActiveTab 
  } = useApp();

  const [selectedLogementFilter, setSelectedLogementFilter] = useState<string>('all');
  const [viewType, setViewType] = useState<'kanban' | 'list'>('kanban');
  const [selectedPieceHistory, setSelectedPieceHistory] = useState<Piece | null>(null);
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null);

  // Filtered pieces
  const filteredPieces = pieces.filter(p => {
    if (selectedLogementFilter !== 'all' && p.logement_id !== selectedLogementFilter) return false;
    return true;
  });

  const kanbanColumns: { id: PieceStatus; label: string; bg: string; border: string; text: string; icon: any }[] = [
    { id: 'libre', label: 'Libre / Disponible', bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-800', icon: CheckCircle2 },
    { id: 'occupee', label: 'Occupée (Louée)', bg: 'bg-blue-50/70', border: 'border-blue-200', text: 'text-blue-800', icon: User },
    { id: 'reservee', label: 'Réservée (Acompte)', bg: 'bg-amber-50/70', border: 'border-amber-200', text: 'text-amber-800', icon: Clock },
    { id: 'en_travaux', label: 'En Travaux / Rénovation', bg: 'bg-red-50/70', border: 'border-red-200', text: 'text-red-800', icon: Wrench },
  ];

  const handleStatusChange = (pieceId: string, newStatus: PieceStatus) => {
    updatePiece(pieceId, { statut: newStatus });
  };

  const handleSavePieceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPiece) return;
    updatePiece(editingPiece.id, editingPiece);
    setEditingPiece(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Logements & Lots Locatifs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez chaque logement de vos biens (villas, studios, immeubles), son statut en temps réel et son historique d'occupation
          </p>
        </div>

        <button 
          onClick={() => onOpenNewPiece()}
          className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Nouveau Logement</span>
        </button>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 whitespace-nowrap uppercase tracking-wider">
            <Building className="w-3.5 h-3.5 text-slate-400" /> Bien parent :
          </span>
          <select
            value={selectedLogementFilter}
            onChange={(e) => setSelectedLogementFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-indigo-500 flex-1 max-w-xs cursor-pointer"
          >
            <option value="all">Tous les biens ({pieces.length} logements)</option>
            {logements.map(l => (
              <option key={l.id} value={l.id}>{l.nom} ({l.ville})</option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-100 p-0.5">
          <button 
            onClick={() => setViewType('kanban')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${viewType === 'kanban' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Tableau Kanban</span>
          </button>
          <button 
            onClick={() => setViewType('list')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${viewType === 'list' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Vue Liste</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View (F3.3) */}
      {viewType === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {kanbanColumns.map((col) => {
            const colPieces = filteredPieces.filter(p => p.statut === col.id);
            const Icon = col.icon;

            return (
              <div 
                key={col.id}
                className="bg-[#f8f9ff] rounded-2xl border border-[#c6c6cd]/40 p-4 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#c6c6cd]/30">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${col.bg} ${col.text}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-[14px] text-[#0b1c30]">{col.label}</h3>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-white border border-[#c6c6cd]/40 text-[#0b1c30] text-[11px] font-bold flex items-center justify-center shadow-xs">
                    {colPieces.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {colPieces.length === 0 ? (
                    <div className="h-32 rounded-xl border border-dashed border-[#c6c6cd]/50 flex items-center justify-center text-[12px] text-[#76777d]">
                      Aucun logement dans ce statut
                    </div>
                  ) : (
                    colPieces.map((piece) => {
                      const parentLog = logements.find(l => l.id === piece.logement_id);
                      const currentTenant = locataires.find(l => l.id === piece.current_locataire_id);

                      return (
                        <div 
                          key={piece.id}
                          className="bg-white rounded-xl p-4 border border-[#c6c6cd]/50 shadow-xs hover:shadow-md transition-all space-y-3"
                        >
                          {/* Unit Photo if available */}
                          {piece.photo && (
                            <div className="h-28 w-full rounded-lg overflow-hidden bg-slate-100 mb-2">
                              <img src={piece.photo} alt={piece.numero} className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Unit Title & Parent */}
                          <div>
                            <div className="flex items-start justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#76777d]">
                                {parentLog?.nom || 'Bien'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => setSelectedPieceHistory(piece)}
                                  className="p-1 text-[#76777d] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded"
                                  title="Historique d'occupation"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => setEditingPiece(piece)}
                                  className="p-1 text-[#76777d] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded"
                                  title="Modifier"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-bold text-[15px] text-[#0b1c30]">
                              {piece.numero} - {piece.nom}
                            </h4>
                            <p className="text-[11px] text-[#45464d] mt-0.5">
                              {piece.type} • {piece.superficie} m² • {piece.etage === 0 ? 'Rez-de-chaussée (RDC)' : piece.etage < 0 ? `Sous-sol ${piece.etage}` : `Étage ${piece.etage}`}
                            </p>
                          </div>

                          {/* Rent Info */}
                          <div className="p-2 rounded-lg bg-[#f8f9ff] border border-[#c6c6cd]/30 flex items-center justify-between">
                            <span className="text-[11px] text-[#76777d]">Loyer mensuel :</span>
                            <span className="font-bold text-[13px] text-[#006c49]">
                              {formatFCFA(piece.loyer_reference)}
                            </span>
                          </div>

                          {/* Tenant Info if occupied */}
                          {currentTenant && (
                            <div className="pt-2 border-t border-[#c6c6cd]/30 flex items-center gap-2">
                              <img 
                                src={currentTenant.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                                alt={currentTenant.nom_complet}
                                className="w-6 h-6 rounded-full object-cover" 
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-[#0b1c30] truncate">{currentTenant.nom_complet}</p>
                                <p className="text-[10px] text-[#76777d] truncate">{currentTenant.telephone_principal}</p>
                              </div>
                            </div>
                          )}

                          {/* Status transition dropdown / actions */}
                          <div className="pt-2 border-t border-[#c6c6cd]/30 flex items-center justify-between gap-1">
                            {piece.statut === 'libre' ? (
                              <button 
                                onClick={() => onOpenNewLeaseForPiece(piece.id)}
                                className="w-full py-1.5 px-2 bg-[#0b1c30] text-white text-[11px] font-bold rounded-lg hover:bg-[#1f2d40] transition-colors text-center"
                              >
                                + Nouveau Bailleur/Locataire
                              </button>
                            ) : (
                              <div className="w-full flex items-center justify-between">
                                <span className="text-[10px] text-[#76777d]">Changer statut :</span>
                                <select 
                                  value={piece.statut}
                                  onChange={(e) => handleStatusChange(piece.id, e.target.value as PieceStatus)}
                                  className="text-[11px] font-semibold bg-[#f8f9ff] border border-[#c6c6cd]/40 rounded px-1.5 py-0.5 text-[#0b1c30]"
                                >
                                  <option value="libre">Libre</option>
                                  <option value="occupee">Occupée</option>
                                  <option value="reservee">Réservée</option>
                                  <option value="en_travaux">En travaux</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="bg-white rounded-2xl border border-[#c6c6cd]/50 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8f9ff] text-[#76777d] font-bold uppercase tracking-wider text-[11px] border-b border-[#c6c6cd]/40">
                <tr>
                  <th className="py-3 px-4">Numéro & Nom</th>
                  <th className="py-3 px-4">Bien Parent</th>
                  <th className="py-3 px-4">Type & Surface</th>
                  <th className="py-3 px-4">Locataire Actuel</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Loyer Mensuel</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6cd]/30">
                {filteredPieces.map((piece) => {
                  const parentLog = logements.find(l => l.id === piece.logement_id);
                  const currentTenant = locataires.find(l => l.id === piece.current_locataire_id);

                  return (
                    <tr key={piece.id} className="hover:bg-[#eff4ff]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0b1c30]">
                        <div className="flex items-center gap-2.5">
                          {piece.photo ? (
                            <img src={piece.photo} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">
                              <DoorOpen className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <span className="block">{piece.numero}</span>
                            <span className="block text-[11px] text-[#76777d] font-normal">{piece.nom}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#45464d]">{parentLog?.nom}</td>
                      <td className="py-3 px-4 text-[#45464d]">
                        {piece.type} ({piece.superficie} m²)
                      </td>
                      <td className="py-3 px-4">
                        {currentTenant ? (
                          <span className="font-semibold text-[#0b1c30]">{currentTenant.nom_complet}</span>
                        ) : (
                          <span className="text-[#76777d] italic">Aucun</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                          piece.statut === 'occupee' ? 'bg-blue-100 text-blue-800' :
                          piece.statut === 'libre' ? 'bg-emerald-100 text-emerald-800' :
                          piece.statut === 'reservee' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {piece.statut}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#006c49]">
                        {formatFCFA(piece.loyer_reference)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedPieceHistory(piece)}
                            className="p-1.5 text-[#0b1c30] hover:bg-[#eff4ff] rounded-lg"
                            title="Historique"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingPiece(piece)}
                            className="p-1.5 text-[#76777d] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-lg"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Piece Occupation History Modal (F3.4) */}
      {selectedPieceHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 bg-[#0b1c30] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6cf8bb]">
                  Historique d'occupation du lot
                </span>
                <h3 className="text-[20px] font-bold">{selectedPieceHistory.numero} - {selectedPieceHistory.nom}</h3>
              </div>
              <button 
                onClick={() => setSelectedPieceHistory(null)}
                className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-[13px] text-[#45464d]">
                Consultez tous les locataires ayant précédemment occupé cette unité ainsi que les motifs de sortie.
              </p>

              {(() => {
                const historyList = occupationHistory.filter(h => h.piece_id === selectedPieceHistory.id);

                if (historyList.length === 0) {
                  return (
                    <div className="p-8 text-center bg-[#f8f9ff] rounded-xl border border-dashed border-[#c6c6cd]">
                      <p className="text-[13px] text-[#76777d]">Aucun historique d'ancien locataire pour ce logement.</p>
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-[#c6c6cd]/40 border border-[#c6c6cd]/50 rounded-xl overflow-hidden">
                    {historyList.map(h => (
                      <div key={h.id} className="p-4 bg-white hover:bg-[#f8f9ff] transition-colors flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-[14px] text-[#0b1c30]">{h.locataire_nom}</h4>
                          <p className="text-[12px] text-[#76777d] mt-0.5">CNI/Passeport : {h.locataire_cni}</p>
                          <p className="text-[12px] text-[#45464d] mt-1">
                            Motif de départ : <strong>{h.motif_sortie}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2.5 py-1 rounded bg-[#eff4ff] text-[#0b1c30] text-[11px] font-semibold">
                            Du {formatDateFR(h.date_debut)} au {formatDateFR(h.date_fin)}
                          </span>
                          <p className="text-[13px] font-bold text-[#006c49] mt-1.5">{formatFCFA(h.loyer_mensuel)}/mois</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 bg-[#f8f9ff] border-t border-[#c6c6cd]/40 flex justify-end">
              <button 
                onClick={() => setSelectedPieceHistory(null)}
                className="px-5 py-2 bg-[#0b1c30] text-white rounded-xl text-[13px] font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Piece Modal */}
      {editingPiece && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-[#0b1c30] text-white flex items-center justify-between">
              <h3 className="font-bold text-[16px]">Modifier le logement</h3>
              <button onClick={() => setEditingPiece(null)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePieceEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#45464d] mb-1">Numéro / Code</label>
                  <input 
                    type="text"
                    value={editingPiece.numero}
                    onChange={(e) => setEditingPiece({ ...editingPiece, numero: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#45464d] mb-1">Nom / Libellé</label>
                  <input 
                    type="text"
                    value={editingPiece.nom}
                    onChange={(e) => setEditingPiece({ ...editingPiece, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#45464d] mb-1">Loyer Référence (FCFA)</label>
                  <input 
                    type="number"
                    value={editingPiece.loyer_reference}
                    onChange={(e) => setEditingPiece({ ...editingPiece, loyer_reference: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#45464d] mb-1">Charges Incluses (FCFA)</label>
                  <input 
                    type="number"
                    value={editingPiece.charges_incluses}
                    onChange={(e) => setEditingPiece({ ...editingPiece, charges_incluses: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#45464d] mb-1">Superficie (m²)</label>
                  <input 
                    type="number"
                    value={editingPiece.superficie}
                    onChange={(e) => setEditingPiece({ ...editingPiece, superficie: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#45464d] mb-1">Étage</label>
                  <input 
                    type="number"
                    value={editingPiece.etage}
                    onChange={(e) => setEditingPiece({ ...editingPiece, etage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#c6c6cd]/40">
                <button 
                  type="button"
                  onClick={() => setEditingPiece(null)}
                  className="px-4 py-2 text-[13px] font-semibold text-[#76777d] hover:text-[#0b1c30]"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#0b1c30] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1f2d40]"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

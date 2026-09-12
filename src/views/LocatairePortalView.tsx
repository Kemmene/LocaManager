import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  UserCheck, 
  Home, 
  Calendar, 
  CreditCard, 
  FileText, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Send, 
  Download, 
  ShieldCheck,
  Clock,
  Plus
} from 'lucide-react';
import { formatFCFA, formatDateFR, formatMonthYear } from '../utils/formatters';

export const LocatairePortalView: React.FC = () => {
  const { 
    currentUser, 
    locataires, 
    baux, 
    pieces, 
    logements, 
    paiements, 
    maintenanceTickets, 
    addMaintenanceTicket, 
    setSelectedQuittancePaiement,
    allUsers 
  } = useApp();

  // Find tenant identity
  const currentLocataire = locataires.find(l => l.email === currentUser.email) || locataires[0];
  const bail = baux.find(b => b.locataire_id === currentLocataire?.id && b.statut === 'actif');
  const logement = logements.find(l => l.id === currentLocataire?.logement_id);
  const piece = pieces.find(p => p.id === currentLocataire?.piece_id);
  const landlord = allUsers.find(u => u.id === logement?.user_id) || allUsers[0];

  const tenantPayments = paiements.filter(p => p.locataire_id === currentLocataire?.id);
  const tenantTickets = maintenanceTickets.filter(t => t.locataire_id === currentLocataire?.id);

  // New ticket state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketTitre, setTicketTitre] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketPriorite, setTicketPriorite] = useState<'basse' | 'normale' | 'urgente'>('normale');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocataire || !logement || !piece) return;

    addMaintenanceTicket({
      logement_id: logement.id,
      piece_id: piece.id,
      locataire_id: currentLocataire.id,
      titre: ticketTitre,
      description: ticketDesc,
      priorite: ticketPriorite,
      statut: 'ouvert'
    });

    setTicketTitre('');
    setTicketDesc('');
    setTicketSuccess(true);
    setTimeout(() => {
      setTicketSuccess(false);
      setIsTicketModalOpen(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-[#0b1c30] to-[#1a2d47] text-white rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src={currentLocataire?.photo_url || currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
            alt={currentLocataire?.nom_complet || currentUser.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-[#6cf8bb]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6cf8bb]">Espace Résident Locataire</span>
              <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white">Bail en règle</span>
            </div>
            <h2 className="font-extrabold text-[22px] tracking-tight">{currentLocataire?.nom_complet || currentUser.name}</h2>
            <p className="text-[12px] text-white/80">
              Résident au : <strong>{logement?.nom}</strong> ({piece?.nom} • {piece?.numero})
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsTicketModalOpen(true)}
          className="px-4 py-2 bg-[#6cf8bb] text-[#0b1c30] font-bold text-[13px] rounded-xl hover:bg-[#58e2a6] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Wrench className="w-4 h-4" />
          <span>Signaler un Problème / Travaux</span>
        </button>
      </div>

      {/* Bento Grid: Lease Overview, Rent Due, Landlord Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Rent status */}
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cd]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#76777d] uppercase tracking-wider">Loyer Mensuel</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Charges incluses
            </span>
          </div>
          <div className="my-3">
            <span className="text-[28px] font-extrabold text-[#006c49]">
              {bail ? formatFCFA(bail.montant_loyer_fcfa + (bail.montant_charges_fcfa || 0)) : '—'}
            </span>
            <span className="text-[12px] text-[#76777d] block mt-0.5">Payable avant le 5 du mois</span>
          </div>
          <div className="pt-3 border-t border-[#c6c6cd]/30 text-[12px] text-[#45464d] flex items-center justify-between">
            <span>Caution versée :</span>
            <strong className="text-[#0b1c30]">{bail ? formatFCFA(bail.montant_caution_fcfa) : '0 FCFA'}</strong>
          </div>
        </div>

        {/* Card 2: Lease Expiry & Advance */}
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cd]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#76777d] uppercase tracking-wider">Échéance de Fin de Bail</span>
            <Clock className="w-4 h-4 text-[#006c49]" />
          </div>
          <div className="my-3">
            <span className="text-[20px] font-extrabold text-[#0b1c30] block">
              {bail ? formatDateFR(bail.date_echeance_reelle) : 'Non défini'}
            </span>
            <span className="text-[11px] text-[#76777d] block mt-0.5">
              Inclus {bail?.mois_avance || 0} mois d'avance consommés
            </span>
          </div>
          <div className="pt-3 border-t border-[#c6c6cd]/30 text-[12px] text-[#45464d]">
            <span>Durée du contrat : <strong>{bail?.duree_mois || 12} mois</strong></span>
          </div>
        </div>

        {/* Card 3: Landlord Info */}
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cd]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#76777d] uppercase tracking-wider">Votre Propriétaire / Bailleur</span>
            <Home className="w-4 h-4 text-[#0b1c30]" />
          </div>
          <div className="my-3">
            <p className="font-bold text-[15px] text-[#0b1c30]">{landlord.name}</p>
            {landlord.entreprise && <p className="text-[11px] text-[#76777d]">{landlord.entreprise}</p>}
            <p className="text-[12px] text-[#45464d] mt-1">{landlord.phonenumber} • {landlord.email}</p>
          </div>
          <div className="pt-3 border-t border-[#c6c6cd]/30 flex items-center justify-between text-[11px] text-[#006c49] font-semibold">
            <span>Paiements acceptés : Wave, Orange Money</span>
          </div>
        </div>
      </div>

      {/* Main Split: Quittances List & Maintenance Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Official Quittances */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#c6c6cd]/50 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[18px] text-[#0b1c30]">
                Mes Quittances de Loyer Téléchargeables ({tenantPayments.filter(p => p.statut === 'paye' || p.statut === 'partiel').length})
              </h3>
              <p className="text-[13px] text-[#76777d]">
                Reçus officiels certifiés conformes avec QR Code et signature numérique
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#c6c6cd]/30 border border-[#c6c6cd]/40 rounded-xl overflow-hidden">
            {tenantPayments.length === 0 ? (
              <div className="p-6 text-center text-[#76777d] text-[13px]">
                Aucun historique de paiement disponible.
              </div>
            ) : (
              tenantPayments.map((p) => {
                const isPaid = p.statut === 'paye' || p.statut === 'partiel';

                return (
                  <div key={p.id} className="p-4 bg-white hover:bg-[#f8f9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#006c49]" />
                        <h4 className="font-bold text-[14px] text-[#0b1c30]">
                          Quittance {formatMonthYear(p.mois_concerne)}
                        </h4>
                        <span className="text-[10px] font-mono bg-[#eff4ff] text-[#0b1c30] px-2 py-0.5 rounded">
                          {p.quittance_numero || 'QUIT-OFFICIEL'}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#76777d] mt-1">
                        Montant réglé : <strong>{formatFCFA(p.montant_recu)}</strong> via <span className="capitalize">{p.mode_paiement} {p.operateur_mobile ? `(${p.operateur_mobile})` : ''}</span> le {formatDateFR(p.date_paiement || p.date_creation)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPaid ? (
                        <button 
                          onClick={() => setSelectedQuittancePaiement(p)}
                          className="px-3.5 py-1.5 bg-[#0b1c30] text-white text-[12px] font-bold rounded-lg hover:bg-[#1f2d40] transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Voir & Télécharger A4</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-[#ba1a1a] bg-red-100 px-2.5 py-1 rounded-full">
                          En attente de règlement
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Maintenance Tickets */}
        <div className="bg-white rounded-2xl p-6 border border-[#c6c6cd]/50 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[18px] text-[#0b1c30]">
                Signalements & Travaux
              </h3>
              <p className="text-[12px] text-[#76777d]">
                Suivi des demandes d'intervention
              </p>
            </div>
            <button 
              onClick={() => setIsTicketModalOpen(true)}
              className="p-1.5 bg-[#eff4ff] text-[#0b1c30] rounded-lg hover:bg-[#dce9ff]"
              title="Nouveau signalement"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {tenantTickets.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-[#76777d] bg-[#f8f9ff] rounded-xl border border-dashed border-[#c6c6cd]">
                Aucun incident en cours. Votre logement est en parfait état.
              </div>
            ) : (
              tenantTickets.map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl border border-[#c6c6cd]/40 bg-[#f8f9ff] space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-[13px] text-[#0b1c30]">{t.titre}</h5>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.statut === 'resolu' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {t.statut}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#45464d]">{t.description}</p>
                  <p className="text-[10px] text-[#76777d] pt-1">Déclaré le {formatDateFR(t.date_creation)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-[#0b1c30] text-white flex items-center justify-between">
              <h3 className="font-bold text-[16px]">Signaler une Panne / Demande d'Intervention</h3>
              <button onClick={() => setIsTicketModalOpen(false)} className="text-white/70 hover:text-white">
                ✕
              </button>
            </div>

            {ticketSuccess ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#006c49] mx-auto" />
                <h4 className="font-bold text-[16px] text-[#0b1c30]">Signalement transmis au propriétaire</h4>
                <p className="text-[13px] text-[#76777d]">Le bailleur a été notifié par SMS et email.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#45464d] mb-1">Objet / Titre du problème</label>
                  <input 
                    type="text"
                    value={ticketTitre}
                    onChange={(e) => setTicketTitre(e.target.value)}
                    placeholder="Ex: Fuite d'eau sous l'évier de la cuisine"
                    className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#45464d] mb-1">Description détaillée</label>
                  <textarea 
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    placeholder="Précisez la nature de la panne, la pièce concernée..."
                    className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px] h-24"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#45464d] mb-1">Niveau d'urgence</label>
                  <select 
                    value={ticketPriorite}
                    onChange={(e) => setTicketPriorite(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                  >
                    <option value="normale">Normale (quelques jours)</option>
                    <option value="urgente">Urgente (eau, électricité, serrure)</option>
                    <option value="basse">Basse (amélioration)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#c6c6cd]/40">
                  <button 
                    type="button"
                    onClick={() => setIsTicketModalOpen(false)}
                    className="px-4 py-2 text-[13px] font-semibold text-[#76777d]"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#0b1c30] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1f2d40]"
                  >
                    Envoyer le signalement
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

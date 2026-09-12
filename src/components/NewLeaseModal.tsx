import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TenantPersonType } from '../types';
import { X, UserPlus, FileText, Calendar, Clock, DollarSign, ShieldCheck, Building, User, AlertCircle } from 'lucide-react';
import { computeLeaseExpiry, formatFCFA } from '../utils/formatters';

interface NewLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPieceId?: string;
}

export const NewLeaseModal: React.FC<NewLeaseModalProps> = ({
  isOpen,
  onClose,
  preselectedPieceId
}) => {
  const { logements, pieces, createLocataireAndBail } = useApp();

  // Tenant Type: Personne physique (default) or Personne morale
  const [typePersonne, setTypePersonne] = useState<TenantPersonType>('personne_physique');

  // Situation d'ancienneté : Nouveau locataire vs Ancien locataire (existant)
  const [isAncien, setIsAncien] = useState<boolean>(false);
  const [arrieresMontant, setArrieresMontant] = useState<number>(0);
  const [arrieresDetails, setArrieresDetails] = useState<string>('');
  const [dateEntreeInitiale, setDateEntreeInitiale] = useState<string>('');

  // Fields for Personne Morale
  const [raisonSociale, setRaisonSociale] = useState('');
  const [niu, setNiu] = useState('');
  const [nomGerant, setNomGerant] = useState('');
  const [telephoneGerant, setTelephoneGerant] = useState('');

  // Common and Personne Physique fields
  const [nomComplet, setNomComplet] = useState('');
  const [nationalite, setNationalite] = useState('Camerounaise');
  const [cniPasseport, setCniPasseport] = useState('');
  const [telephonePrincipal, setTelephonePrincipal] = useState('');
  const [telephoneSecondaire, setTelephoneSecondaire] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [employeur, setEmployeur] = useState('');
  const [contactUrgenceNom, setContactUrgenceNom] = useState('');
  const [contactUrgenceTelephone, setContactUrgenceTelephone] = useState('');

  // Piece & Housing selection
  const initialPiece = preselectedPieceId 
    ? pieces.find(p => p.id === preselectedPieceId) 
    : pieces.find(p => p.statut === 'libre') || pieces[0];
  
  const [selectedLogementFilter, setSelectedLogementFilter] = useState<string>(initialPiece?.logement_id || 'all');
  const [selectedPieceIds, setSelectedPieceIds] = useState<string[]>(initialPiece ? [initialPiece.id] : []);

  // Filter available pieces based on selected property
  const availablePieces = pieces.filter(p => {
    const matchesLogement = selectedLogementFilter === 'all' || p.logement_id === selectedLogementFilter;
    return matchesLogement;
  });

  const selectedPiecesList = pieces.filter(p => selectedPieceIds.includes(p.id));
  const primaryPiece = selectedPiecesList[0] || initialPiece;
  const selectedLogementId = primaryPiece?.logement_id || logements[0]?.id || '';

  // Lease state
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [dureeMois, setDureeMois] = useState(12);
  const [moisAvance, setMoisAvance] = useState(2);

  // Auto calculate sum of rent and charges
  const totalAutoRent = selectedPiecesList.reduce((sum, p) => sum + p.loyer_reference, 0);
  const totalAutoCharges = selectedPiecesList.reduce((sum, p) => sum + (p.charges_incluses || 0), 0);

  const [montantLoyer, setMontantLoyer] = useState(totalAutoRent || 300000);
  const [montantCharges, setMontantCharges] = useState(totalAutoCharges || 25000);
  const [montantCaution, setMontantCaution] = useState((totalAutoRent || 300000) * 2);
  const [clauseRenouvellement, setClauseRenouvellement] = useState<'tacite_reconduction' | 'expres'>('tacite_reconduction');

  useEffect(() => {
    if (selectedPiecesList.length > 0) {
      const sumRent = selectedPiecesList.reduce((sum, p) => sum + p.loyer_reference, 0);
      const sumCharges = selectedPiecesList.reduce((sum, p) => sum + (p.charges_incluses || 0), 0);
      setMontantLoyer(sumRent);
      setMontantCharges(sumCharges);
      setMontantCaution(sumRent * 2);
    }
  }, [selectedPieceIds.join(',')]);

  const togglePieceSelection = (pieceId: string) => {
    setSelectedPieceIds(prev => {
      if (prev.includes(pieceId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(id => id !== pieceId);
      } else {
        return [...prev, pieceId];
      }
    });
  };

  if (!isOpen) return null;

  // Real-time calculation of dates
  const { theoriqueDate, reelleDate } = computeLeaseExpiry(dateDebut, dureeMois, moisAvance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPieceIds.length === 0) return;

    if (typePersonne === 'personne_morale') {
      if (!raisonSociale || !niu || !telephonePrincipal || !nomGerant || !telephoneGerant || !email) {
        alert('Veuillez remplir tous les champs obligatoires pour la personne morale (Raison sociale, NIU, Téléphone, Nom du gérant, Numéro du gérant, Email).');
        return;
      }

      createLocataireAndBail(
        {
          logement_id: selectedLogementId,
          piece_id: selectedPieceIds[0],
          piece_ids: selectedPieceIds,
          type_personne: 'personne_morale',
          nom_complet: raisonSociale,
          raison_sociale: raisonSociale,
          niu: niu,
          nom_gerant: nomGerant,
          telephone_gerant: telephoneGerant,
          cni_passeport: niu,
          nationalite: nationalite || 'Camerounaise',
          telephone_principal: telephonePrincipal,
          telephone_secondaire: telephoneGerant,
          email: email,
          contact_urgence_nom: `${nomGerant} (Gérant)`,
          contact_urgence_telephone: telephoneGerant,
          profession: 'Entreprise / Société',
          employeur: raisonSociale,
          statut: 'actif',
          is_ancien: isAncien,
          arrieres_montant: isAncien ? (Number(arrieresMontant) || 0) : 0,
          arrieres_details: isAncien ? arrieresDetails : '',
          date_entree_initiale: isAncien ? (dateEntreeInitiale || dateDebut) : dateDebut
        },
        {
          logement_id: selectedLogementId,
          piece_id: selectedPieceIds[0],
          piece_ids: selectedPieceIds,
          date_debut: dateDebut,
          duree_mois: dureeMois,
          mois_avance: moisAvance,
          montant_loyer_fcfa: montantLoyer,
          montant_charges_fcfa: montantCharges,
          montant_caution_fcfa: montantCaution,
          caution_versee_fcfa: montantCaution,
          clause_renouvellement: clauseRenouvellement
        }
      );
    } else {
      // Personne physique
      if (!nomComplet || !telephonePrincipal || !cniPasseport) {
        alert('Veuillez remplir les informations obligatoires (Nom complet, CNI/Passeport, Téléphone).');
        return;
      }

      createLocataireAndBail(
        {
          logement_id: selectedLogementId,
          piece_id: selectedPieceIds[0],
          piece_ids: selectedPieceIds,
          type_personne: 'personne_physique',
          nom_complet: nomComplet,
          nationalite: nationalite || 'Camerounaise',
          cni_passeport: cniPasseport,
          telephone_principal: telephonePrincipal,
          telephone_secondaire: telephoneSecondaire,
          email: email,
          contact_urgence_nom: contactUrgenceNom,
          contact_urgence_telephone: contactUrgenceTelephone,
          profession: profession,
          employeur: employeur,
          statut: 'actif',
          is_ancien: isAncien,
          arrieres_montant: isAncien ? (Number(arrieresMontant) || 0) : 0,
          arrieres_details: isAncien ? arrieresDetails : '',
          date_entree_initiale: isAncien ? (dateEntreeInitiale || dateDebut) : dateDebut
        },
        {
          logement_id: selectedLogementId,
          piece_id: selectedPieceIds[0],
          piece_ids: selectedPieceIds,
          date_debut: dateDebut,
          duree_mois: dureeMois,
          mois_avance: moisAvance,
          montant_loyer_fcfa: montantLoyer,
          montant_charges_fcfa: montantCharges,
          montant_caution_fcfa: montantCaution,
          caution_versee_fcfa: montantCaution,
          clause_renouvellement: clauseRenouvellement
        }
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-5 bg-[#0b1c30] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#6cf8bb]" />
            <h3 className="font-bold text-[17px]">Nouveau Locataire & Contrat de Bail</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Section 0: Ancienneté du Locataire (Nouveau vs Ancien) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-[12px] font-bold text-slate-800 mb-2">
              Situation d&apos;enregistrement du locataire :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsAncien(false);
                  setArrieresMontant(0);
                  setArrieresDetails('');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  !isAncien
                    ? 'bg-white border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Nouveau locataire
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Standard
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nouvelle entrée normale avec formulaire classique, avance et caution.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsAncien(true)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isAncien
                    ? 'bg-amber-50/70 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Ancien locataire (Déjà dans les lieux)
                  </div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Historique / Arriérés
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 mt-1">
                  Locataire déjà en place. Permet de déclarer ses arriérés éventuels et sa date d&apos;entrée.
                </p>
              </button>
            </div>

            {/* Champs conditionnels si Ancien Locataire */}
            {isAncien && (
              <div className="mt-3.5 p-3.5 bg-white border border-amber-300 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Régularisation des arriérés & informations d&apos;ancienneté</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Arriérés de loyers antérieurs (FCFA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={arrieresMontant || ''}
                      onChange={(e) => setArrieresMontant(Math.max(0, Number(e.target.value)))}
                      placeholder="0 si à jour"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 focus:outline-none focus:border-amber-600 bg-amber-50/30"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">0 si aucun arriéré</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Date d&apos;entrée initiale dans les lieux
                    </label>
                    <input
                      type="date"
                      value={dateEntreeInitiale}
                      onChange={(e) => setDateEntreeInitiale(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Détails / Mois des arriérés
                    </label>
                    <input
                      type="text"
                      value={arrieresDetails}
                      onChange={(e) => setArrieresDetails(e.target.value)}
                      placeholder="Ex: 2 mois d&apos;arriérés à régulariser"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Type de Personne & Identité */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#c6c6cd]/40 pb-2">
              <h4 className="font-bold text-[14px] text-[#0b1c30] flex items-center gap-1.5">
                <span>1. Type de Locataire & Identité</span>
              </h4>

              {/* Toggle Personne physique vs Personne morale */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTypePersonne('personne_physique')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    typePersonne === 'personne_physique'
                      ? 'bg-white text-[#0b1c30] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Personne physique (Par défaut)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTypePersonne('personne_morale')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    typePersonne === 'personne_morale'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Personne morale (Entreprise)</span>
                </button>
              </div>
            </div>

            {/* If Personne Morale */}
            {typePersonne === 'personne_morale' ? (
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-bold text-[#0b1c30] mb-1">
                      Nom entreprise / Raison sociale <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={raisonSociale}
                      onChange={(e) => setRaisonSociale(e.target.value)}
                      placeholder="Ex: AFRICOM LOGISTICS SARL"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#c6c6cd] rounded-xl text-[13px] text-[#0b1c30] font-semibold focus:outline-none focus:border-indigo-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#0b1c30] mb-1">
                      NIU (Numéro d'Identification Unique) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={niu}
                      onChange={(e) => setNiu(e.target.value)}
                      placeholder="Ex: M052112345678B"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#c6c6cd] rounded-xl text-[13px] font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-bold text-[#0b1c30] mb-1">
                      Téléphone de l'entreprise <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel"
                      value={telephonePrincipal}
                      onChange={(e) => setTelephonePrincipal(e.target.value)}
                      placeholder="Ex: +237 233 42 00 00 / 699 00 00 00"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#c6c6cd] rounded-xl text-[13px] focus:outline-none focus:border-indigo-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#0b1c30] mb-1">
                      Email de l'entreprise <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: contact@africom-logistics.cm"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#c6c6cd] rounded-xl text-[13px] focus:outline-none focus:border-indigo-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-indigo-100">
                  <div>
                    <label className="block text-[12px] font-bold text-[#0b1c30] mb-1">
                      Nom du gérant / Représentant légal <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={nomGerant}
                      onChange={(e) => setNomGerant(e.target.value)}
                      placeholder="Ex: M. Jean-Marc TCHOUA"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#c6c6cd] rounded-xl text-[13px] font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#0b1c30] mb-1">
                      Numéro du gérant <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel"
                      value={telephoneGerant}
                      onChange={(e) => setTelephoneGerant(e.target.value)}
                      placeholder="Ex: +237 677 88 99 00"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#c6c6cd] rounded-xl text-[13px] focus:outline-none focus:border-indigo-600"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* If Personne Physique */
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#45464d] mb-1">
                      Nom et prénoms complets <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={nomComplet}
                      onChange={(e) => setNomComplet(e.target.value)}
                      placeholder="Ex: Koffi Emmanuel Kouamé"
                      className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px] text-[#0b1c30]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#45464d] mb-1">
                      Numéro CNI / Passeport <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={cniPasseport}
                      onChange={(e) => setCniPasseport(e.target.value)}
                      placeholder="Ex: CE-0029482910"
                      className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#45464d] mb-1">
                      Téléphone direct (SMS/WhatsApp) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel"
                      value={telephonePrincipal}
                      onChange={(e) => setTelephonePrincipal(e.target.value)}
                      placeholder="+237 699 88 99 00"
                      className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#45464d] mb-1">Email</label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="locataire@email.com"
                      className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#45464d] mb-1">Nationalité</label>
                    <input 
                      type="text"
                      value={nationalite}
                      onChange={(e) => setNationalite(e.target.value)}
                      className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#45464d] mb-1">Profession / Employeur</label>
                    <input 
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="Ex: Cadre Bancaire - Afriland First Bank"
                      className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#45464d] mb-1">Personne d'urgence (Nom & Tél)</label>
                    <input 
                      type="text"
                      value={contactUrgenceNom}
                      onChange={(e) => setContactUrgenceNom(e.target.value)}
                      placeholder="Ex: Mariama Kouamé (+237 677 44 33 22)"
                      className="w-full px-3 py-2 border border-[#c6c6cd] rounded-xl text-[13px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Lot & Housing */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c6c6cd]/40 pb-1">
              <h4 className="font-bold text-[14px] text-[#0b1c30] flex items-center gap-1.5">
                <span>2. Désignation du Bien & Logement(s) Loué(s)</span>
              </h4>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {selectedPieceIds.length} logement(s) sélectionné(s) {selectedPieceIds.length > 1 ? '(Multi-logements)' : ''}
              </span>
            </div>

            {/* Filter by property */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="sm:col-span-1">
                <label className="block text-[12px] font-bold text-[#45464d] mb-1">Filtrer par Bien :</label>
                <select 
                  value={selectedLogementFilter}
                  onChange={(e) => setSelectedLogementFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f9ff] border border-[#c6c6cd] rounded-xl text-[12px] text-[#0b1c30] font-medium"
                >
                  <option value="all">Tous les Biens</option>
                  {logements.map(l => (
                    <option key={l.id} value={l.id}>{l.nom} ({l.ville})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                Vous pouvez cocher <strong>un ou plusieurs logements</strong> (ex: appartement + parking, ou plusieurs pièces) occupés par ce locataire sous un contrat unique.
              </div>
            </div>

            {/* List of units available for selection */}
            <div className="border border-[#c6c6cd] rounded-xl p-3 bg-white max-h-48 overflow-y-auto space-y-2">
              {availablePieces.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center italic">Aucun logement trouvé pour ce bien.</p>
              ) : (
                availablePieces.map(p => {
                  const log = logements.find(l => l.id === p.logement_id);
                  const isChecked = selectedPieceIds.includes(p.id);
                  const isOccupied = p.statut === 'occupee';

                  return (
                    <label 
                      key={p.id} 
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isChecked 
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePieceSelection(p.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[13px] text-slate-900">
                              N° {p.numero} - {p.nom}
                            </span>
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {p.type}
                            </span>
                            {isOccupied && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                Déjà occupé
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Bien : {log?.nom} • Étage {p.etage}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-[12px] text-slate-900 block">
                          {formatFCFA(p.loyer_reference)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          + {formatFCFA(p.charges_incluses || 0)} charges
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: Contrat de Bail & Calcul des Dates Réelles */}
          <div className="space-y-4 p-4 bg-[#eff4ff] border border-[#d3e4fe] rounded-2xl">
            <h4 className="font-bold text-[14px] text-[#0b1c30] flex items-center justify-between">
              <span>3. Conditions Financières & Moteur d'Échéances</span>
              <span className="text-[11px] font-semibold bg-white text-[#006c49] px-2 py-0.5 rounded border border-[#c6c6cd]/40">
                Calcul automatique
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-[#45464d] mb-1">Date d'entrée effective</label>
                <input 
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#c6c6cd] rounded-xl text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#45464d] mb-1">Durée du bail (mois)</label>
                <input 
                  type="number"
                  value={dureeMois}
                  min={1}
                  max={60}
                  onChange={(e) => setDureeMois(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#c6c6cd] rounded-xl text-[13px] font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#45464d] mb-1">Mois d'avance versés</label>
                <input 
                  type="number"
                  value={moisAvance}
                  min={0}
                  max={24}
                  onChange={(e) => setMoisAvance(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#c6c6cd] rounded-xl text-[13px] font-bold text-[#006c49]"
                  required
                />
              </div>
            </div>

            {/* Calculated Dates Pill */}
            <div className="p-3 bg-white rounded-xl border border-[#c6c6cd]/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
              <div>
                <span className="text-[#76777d]">Échéance théorique :</span>
                <p className="font-bold text-[#0b1c30]">{theoriqueDate}</p>
              </div>
              <div>
                <span className="text-[#76777d]">Échéance réelle avec {moisAvance} mois d'avance :</span>
                <p className="font-bold text-[#006c49] text-[13px]">{reelleDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-[#45464d] mb-1">Loyer Mensuel Nu (FCFA)</label>
                <input 
                  type="number"
                  value={montantLoyer}
                  onChange={(e) => setMontantLoyer(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#c6c6cd] rounded-xl text-[13px] font-bold text-[#006c49]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#45464d] mb-1">Charges Incluses (FCFA)</label>
                <input 
                  type="number"
                  value={montantCharges}
                  onChange={(e) => setMontantCharges(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#c6c6cd] rounded-xl text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#45464d] mb-1">Caution / Dépôt Garantie (FCFA)</label>
                <input 
                  type="number"
                  value={montantCaution}
                  onChange={(e) => setMontantCaution(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#c6c6cd] rounded-xl text-[13px]"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#c6c6cd]/40">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-[#76777d] hover:text-[#0b1c30]"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-[#0b1c30] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1f2d40] shadow-sm"
            >
              Enregistrer le Bail & Générer Quittance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

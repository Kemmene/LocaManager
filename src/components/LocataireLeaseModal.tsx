import React, { useState, useId } from 'react';
import { useApp } from '../context/AppContext';
import { Locataire, Bail, Logement, Piece } from '../types';
import { 
  X, 
  Download, 
  Printer, 
  Building, 
  Home, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Briefcase, 
  AlertCircle,
  Loader2,
  Share2,
  ExternalLink
} from 'lucide-react';
import { formatFCFA, formatDateFR, formatMonthYear } from '../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LocataireLeaseModalProps {
  locataire: Locataire;
  onClose: () => void;
  initialTab?: 'contrat' | 'ajouter_logement' | 'dossier';
}

export const LocataireLeaseModal: React.FC<LocataireLeaseModalProps> = ({
  locataire,
  onClose,
  initialTab = 'contrat'
}) => {
  const { 
    logements, 
    pieces, 
    baux, 
    paiements, 
    currentUser, 
    addHousingToLocataire,
    setSelectedQuittancePaiement 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'contrat' | 'ajouter_logement' | 'dossier'>(initialTab);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Active or most recent lease for this tenant
  const tenantBaux = baux.filter(b => b.locataire_id === locataire.id);
  const activeBail = tenantBaux.find(b => b.statut === 'actif') || tenantBaux[0];

  // Pieces / units currently occupied by this tenant
  const occupiedPieces = pieces.filter(p => 
    p.current_locataire_id === locataire.id ||
    locataire.piece_id === p.id ||
    (locataire.piece_ids && locataire.piece_ids.includes(p.id)) ||
    (activeBail?.piece_ids && activeBail.piece_ids.includes(p.id)) ||
    activeBail?.piece_id === p.id
  );

  const activeLogement = logements.find(l => 
    l.id === activeBail?.logement_id || 
    l.id === locataire.logement_id ||
    occupiedPieces[0]?.logement_id
  );

  // Form state for adding a housing unit and creating a lease
  const availableLogements = logements;
  const [selectedBienId, setSelectedBienId] = useState<string>(availableLogements[0]?.id || '');
  
  const bienPieces = pieces.filter(p => p.logement_id === selectedBienId);
  const [selectedPieceId, setSelectedPieceId] = useState<string>(() => {
    const firstFree = bienPieces.find(p => p.statut === 'libre') || bienPieces[0];
    return firstFree?.id || '';
  });

  const [selectedPieceIds, setSelectedPieceIds] = useState<string[]>([]);
  const [leaseStartDate, setLeaseStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [leaseDurationMonths, setLeaseDurationMonths] = useState<number>(12);
  const [leaseAdvanceMonths, setLeaseAdvanceMonths] = useState<number>(2);
  const [leaseRent, setLeaseRent] = useState<number>(() => {
    const p = pieces.find(item => item.id === selectedPieceId);
    return p ? p.loyer_reference : 250000;
  });
  const [leaseCharges, setLeaseCharges] = useState<number>(() => {
    const p = pieces.find(item => item.id === selectedPieceId);
    return p ? (p.charges_incluses || 25000) : 25000;
  });
  const [leaseCaution, setLeaseCaution] = useState<number>(() => {
    const p = pieces.find(item => item.id === selectedPieceId);
    const rent = p ? p.loyer_reference : 250000;
    return rent * 2;
  });
  const [renewalClause, setRenewalClause] = useState<'tacite_reconduction' | 'expres'>('tacite_reconduction');
  const [leaseUsage, setLeaseUsage] = useState<string>(
    locataire.type_personne === 'personne_morale' ? 'Usage Professionnel et Commercial (Bureaux & Activité)' : 'Usage d\'Habitation Bourgeoise Exclusive'
  );

  // Unique contract reference
  const contractRef = activeBail 
    ? `BAIL-DLA-${activeBail.id.replace('bail_', '').toUpperCase()}`
    : `BAIL-DLA-${Date.now().toString().slice(-6)}`;

  // Handler when selecting another building
  const handleBienChange = (bienId: string) => {
    setSelectedBienId(bienId);
    const pList = pieces.filter(p => p.logement_id === bienId);
    const firstP = pList.find(p => p.statut === 'libre') || pList[0];
    if (firstP) {
      setSelectedPieceId(firstP.id);
      setSelectedPieceIds([firstP.id]);
      setLeaseRent(firstP.loyer_reference);
      setLeaseCharges(firstP.charges_incluses || 20000);
      setLeaseCaution(firstP.loyer_reference * 2);
    }
  };

  const handlePieceChange = (pieceId: string) => {
    setSelectedPieceId(pieceId);
    setSelectedPieceIds([pieceId]);
    const p = pieces.find(item => item.id === pieceId);
    if (p) {
      setLeaseRent(p.loyer_reference);
      setLeaseCharges(p.charges_incluses || 20000);
      setLeaseCaution(p.loyer_reference * 2);
    }
  };

  // Submit new housing assignment & lease generation
  const handleSaveHousingAndLease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBienId || !selectedPieceId) {
      setFeedbackError('Veuillez sélectionner un bien immobilier et au moins un logement/lot.');
      return;
    }

    const allUnits = selectedPieceIds.length > 0 ? selectedPieceIds : [selectedPieceId];

    const result = addHousingToLocataire(
      locataire.id,
      selectedBienId,
      selectedPieceId,
      {
        date_debut: leaseStartDate,
        duree_mois: leaseDurationMonths,
        mois_avance: leaseAdvanceMonths,
        montant_loyer_fcfa: leaseRent,
        montant_charges_fcfa: leaseCharges,
        montant_caution_fcfa: leaseCaution,
        clause_renouvellement: renewalClause,
        piece_ids: allUnits,
        usage: leaseUsage
      }
    );

    if (result.success) {
      setFeedbackSuccess('Le logement a été attribué avec succès et le nouveau contrat de bail a été généré !');
      setActiveTab('contrat');
      setTimeout(() => setFeedbackSuccess(null), 6000);
    } else {
      setFeedbackError(result.error || 'Erreur lors de l\'enregistrement.');
    }
  };

  // Download Lease PDF
  const handleDownloadLeasePDF = async () => {
    const element = document.getElementById('printable-lease-contract');
    if (!element) return;

    setIsGeneratingPdf(true);
    setFeedbackSuccess('Génération du fichier PDF du contrat de bail en cours...');

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (locataire.nom_complet || 'Locataire').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Contrat_de_Bail_${contractRef}_${safeName}.pdf`;
      pdf.save(fileName);

      setFeedbackSuccess(`Contrat de bail téléchargé avec succès au format PDF (${fileName}) !`);
    } catch (error) {
      console.error('Erreur génération PDF contrat de bail:', error);
      setFeedbackError('Erreur lors de la génération du PDF. Vous pouvez imprimer le contrat directement.');
    } finally {
      setIsGeneratingPdf(false);
      setTimeout(() => setFeedbackSuccess(null), 5000);
    }
  };

  // Print Lease
  const handlePrintLease = () => {
    const element = document.getElementById('printable-lease-contract');
    if (!element) {
      window.print();
      return;
    }

    try {
      const printWindow = window.open('', '_blank', 'width=950,height=1000');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Contrat de Bail - ${locataire.nom_complet}</title>
              <meta charset="utf-8">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page { size: A4; margin: 12mm 15mm; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  background: #ffffff;
                  color: #0f172a;
                  margin: 0;
                  padding: 15px;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                @media print {
                  body { padding: 0; margin: 0; }
                }
              </style>
            </head>
            <body>
              ${element.outerHTML}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                    window.close();
                  }, 400);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    } catch (e) {
      console.warn('Fallback print:', e);
    }

    window.print();
  };

  // Payments for this tenant
  const tenantPayments = paiements.filter(p => p.locataire_id === locataire.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 my-4 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Header with Tenant Identity */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-xl font-bold">
              {locataire.type_personne === 'personne_morale' ? '🏢' : '👤'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {locataire.nom_complet}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                  locataire.type_personne === 'personne_morale' 
                    ? 'bg-amber-400 text-slate-950' 
                    : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
                }`}>
                  {locataire.type_personne === 'personne_morale' ? 'Personne Morale (Entreprise)' : 'Personne Physique'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  locataire.statut === 'actif' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-slate-500/20 text-slate-300'
                }`}>
                  {locataire.statut === 'actif' ? 'Bail Actif' : 'Résilié'}
                </span>
              </div>

              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                {locataire.type_personne === 'personne_morale' && locataire.niu && (
                  <span className="font-mono text-amber-300 font-bold">
                    NIU : {locataire.niu}
                  </span>
                )}
                <span>📞 {locataire.telephone_principal}</span>
                <span>✉️ {locataire.email}</span>
                {locataire.type_personne === 'personne_morale' && locataire.nom_gerant && (
                  <span className="text-indigo-200 font-semibold">
                    Gérant : {locataire.nom_gerant} {locataire.telephone_gerant ? `(${locataire.telephone_gerant})` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-5 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('contrat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'contrat' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Contrat de Bail & Téléchargement PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ajouter_logement')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ajouter_logement' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un Logement</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dossier')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dossier' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Fiche & Coordonnées</span>
            </button>
          </div>

          {/* Direct Actions when in Contrat Tab */}
          {activeTab === 'contrat' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintLease}
                className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadLeasePDF}
                disabled={isGeneratingPdf}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Télécharger le Fichier PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Feedback alerts */}
        {feedbackSuccess && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium shrink-0 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
        )}
        {feedbackError && (
          <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2 font-medium shrink-0 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{feedbackError}</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50">
          
          {/* TAB 1: CONTRAT DE BAIL OFFICIEL & TÉLÉCHARGEMENT PDF */}
          {activeTab === 'contrat' && (
            <div className="space-y-4">
              {/* Quick Info Banner */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs text-indigo-950 font-medium">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Contrat conforme à la législation camerounaise sur les baux d'habitation et professionnels (Loi n° 2001/015 & Acte Uniforme OHADA).
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-900 bg-white px-2.5 py-1 rounded border border-indigo-200">
                    Réf : {contractRef}
                  </span>
                </div>
              </div>

              {/* Printable / Downloadable Contract Sheet */}
              <div 
                id="printable-lease-contract" 
                className="bg-white p-6 sm:p-10 rounded-xl border border-slate-300 shadow-md text-slate-800 text-xs leading-relaxed space-y-6 max-w-3xl mx-auto"
              >
                {/* Legal Header */}
                <div className="border-b-2 border-slate-900 pb-4 text-center">
                  <div className="flex justify-between items-start text-[10px] text-slate-600 font-semibold mb-2">
                    <div className="text-left">
                      <p className="font-bold text-slate-900">RÉPUBLIQUE DU CAMEROUN</p>
                      <p>Paix - Travail - Patrie</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">REPUBLIC OF CAMEROON</p>
                      <p>Peace - Work - Fatherland</p>
                    </div>
                  </div>

                  <h1 className="text-base sm:text-lg font-extrabold uppercase text-slate-950 tracking-wider mt-2">
                    CONTRAT DE BAIL À USAGE D'HABITATION ET PROFESSIONNEL
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Réf. d'Enregistrement : <strong className="text-slate-900 font-mono">{contractRef}</strong> • Soumis au Droit Commun Camerounais
                  </p>
                </div>

                {/* Section: Les Parties */}
                <div className="space-y-2">
                  <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide bg-slate-100 p-1.5 rounded">
                    ENTRE LES SOUSSIGNÉS :
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Bailleur */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <h3 className="font-bold text-[11px] text-indigo-950 uppercase mb-1">
                        1. LE BAILLEUR (Propriétaire / Bailleur) :
                      </h3>
                      <p className="font-bold text-slate-900">{currentUser.entreprise || currentUser.name}</p>
                      <p className="text-[11px] text-slate-600">Représenté légalement par : {currentUser.name}</p>
                      <p className="text-[11px] text-slate-600">Adresse : {currentUser.ville || 'Douala'}, Cameroun</p>
                      <p className="text-[11px] text-slate-600">Téléphone : {currentUser.phonenumber || '+237 699 00 00 00'}</p>
                      <p className="text-[11px] text-slate-600">Email : {currentUser.email}</p>
                      <p className="text-[10px] text-slate-500 mt-1 italic">
                        Ci-après dénommé collectivement <strong>« LE BAILLEUR »</strong> d'une part,
                      </p>
                    </div>

                    {/* Preneur */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <h3 className="font-bold text-[11px] text-indigo-950 uppercase mb-1">
                        2. LE PRENEUR (Locataire) :
                      </h3>
                      <p className="font-bold text-slate-900">{locataire.nom_complet}</p>
                      <p className="text-[11px] text-slate-600">
                        Type : <strong>{locataire.type_personne === 'personne_morale' ? 'Personne Morale (Entreprise)' : 'Personne Physique'}</strong>
                      </p>
                      {locataire.type_personne === 'personne_morale' && locataire.niu && (
                        <p className="text-[11px] font-mono text-indigo-900 font-bold">
                          NIU (Numéro d'Identifiant Unique) : {locataire.niu}
                        </p>
                      )}
                      {locataire.type_personne === 'personne_morale' && locataire.nom_gerant && (
                        <p className="text-[11px] text-slate-600">
                          Représentée par son Gérant : <strong>{locataire.nom_gerant}</strong> ({locataire.telephone_gerant || locataire.telephone_secondaire})
                        </p>
                      )}
                      {locataire.cni_passeport && (
                        <p className="text-[11px] text-slate-600">CNI / Passeport : {locataire.cni_passeport}</p>
                      )}
                      <p className="text-[11px] text-slate-600">Téléphone : {locataire.telephone_principal}</p>
                      <p className="text-[11px] text-slate-600">Email : {locataire.email}</p>
                      <p className="text-[10px] text-slate-500 mt-1 italic">
                        Ci-après dénommé collectivement <strong>« LE PRENEUR »</strong> d'autre part.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Article 1: Désignation des Lieux */}
                <div className="space-y-1.5">
                  <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide bg-slate-100 p-1.5 rounded">
                    ARTICLE 1 : DÉSIGNATION DES LIEUX LOUÉS ET CONSISTANCE
                  </h2>
                  <p>
                    Le BAILLEUR donne à bail à loyer au PRENEUR qui accepte les locaux ci-après désignés, dépendant du bien immobilier dénommé <strong>« {activeLogement?.nom || 'Immeuble Locatif'} »</strong>, situé à l'adresse suivante : <strong>{activeLogement?.adresse || 'Douala'}, {activeLogement?.ville || 'Cameroun'}</strong>.
                  </p>
                  
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg mt-1 space-y-1">
                    <p>
                      <strong>Lot(s) / Unité(s) louée(s) :</strong>{' '}
                      <span className="font-semibold text-indigo-950">
                        {occupiedPieces.length > 0 
                          ? occupiedPieces.map(p => `${p.numero} - ${p.nom} (${p.type.toUpperCase()})`).join(' ; ')
                          : 'Unité locative résidentielle'}
                      </span>
                    </p>
                    <p>
                      <strong>Superficie estimée :</strong> {occupiedPieces.reduce((acc, p) => acc + (p.superficie || 0), 0) || 75} m² • 
                      <strong> Étage :</strong> {occupiedPieces[0]?.etage ?? 1}
                    </p>
                    <p>
                      <strong>Équipements et installations :</strong> Compteur d'eau individuel/forage, compteur électrique prépayé (ENEO), sanitaires complets, placards intégrés, accès sécurisé.
                    </p>
                  </div>
                </div>

                {/* Article 2: Destination des lieux */}
                <div className="space-y-1.5">
                  <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide bg-slate-100 p-1.5 rounded">
                    ARTICLE 2 : DESTINATION DES LIEUX
                  </h2>
                  <p>
                    Les lieux loués sont exclusivement destinés à : <strong>{leaseUsage}</strong>.
                    Toute sous-location ou cession de bail, même partielle, est formellement interdite sans l'accord exprès et écrit préalable du BAILLEUR.
                  </p>
                </div>

                {/* Article 3: Durée du bail */}
                <div className="space-y-1.5">
                  <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide bg-slate-100 p-1.5 rounded">
                    ARTICLE 3 : DURÉE DU CONTRAT ET PRISE D'EFFET
                  </h2>
                  <p>
                    Le présent bail est consenti et accepté pour une durée ferme de <strong>{activeBail?.duree_mois || 12} mois</strong> consécutifs, prenant effet à compter du <strong>{formatDateFR(activeBail?.date_debut || leaseStartDate)}</strong> pour se terminer le <strong>{formatDateFR(activeBail?.date_echeance_theorique || activeBail?.date_echeance_reelle || '2027-03-31')}</strong>.
                  </p>
                  <p>
                    <strong>Clause de renouvellement :</strong> {activeBail?.clause_renouvellement === 'tacite_reconduction' ? 'Tacite reconduction d\'année en année, sous réserve d\'un préavis écrit de trois (3) mois notifié par l\'une ou l\'autre des parties.' : 'Renouvellement par accord exprès et écrit uniquement.'}
                  </p>
                </div>

                {/* Article 4: Conditions Financières */}
                <div className="space-y-1.5">
                  <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide bg-slate-100 p-1.5 rounded">
                    ARTICLE 4 : CONDITIONS FINANCIÈRES (LOYER, CHARGES & CAUTION)
                  </h2>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 text-xs mt-1">
                      <thead className="bg-slate-100 text-slate-700 font-bold">
                        <tr>
                          <th className="border border-slate-300 py-1.5 px-3 text-left">Rubrique Financière</th>
                          <th className="border border-slate-300 py-1.5 px-3 text-center">Modalité d'Exigibilité</th>
                          <th className="border border-slate-300 py-1.5 px-3 text-right">Montant (FCFA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 py-1.5 px-3 font-medium">Loyer Mensuel Principal</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-center text-slate-600">D'avance le 5 de chaque mois</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-right font-bold text-slate-900">
                            {formatFCFA(activeBail?.montant_loyer_fcfa || leaseRent)}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 py-1.5 px-3 font-medium">Provision Mensuelle pour Charges (Eau, Gardiennage, Parties communes)</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-center text-slate-600">Payable en même temps que le loyer</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-right font-bold text-slate-900">
                            {formatFCFA(activeBail?.montant_charges_fcfa || leaseCharges)}
                          </td>
                        </tr>
                        <tr className="bg-indigo-50/50 font-bold text-indigo-950">
                          <td className="border border-slate-300 py-1.5 px-3">TOTAL MENSUEL EXIGIBLE</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-center">Loyer Net + Charges</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-right text-indigo-900">
                            {formatFCFA((activeBail?.montant_loyer_fcfa || leaseRent) + (activeBail?.montant_charges_fcfa || leaseCharges))}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 py-1.5 px-3 font-medium">Dépôt de Garantie (Caution Remboursable)</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-center text-slate-600">Versé à la signature du présent contrat</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-right font-bold text-slate-900">
                            {formatFCFA(activeBail?.montant_caution_fcfa || leaseCaution)}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 py-1.5 px-3 font-medium">Avance sur Loyers Réglée</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-center text-slate-600">{activeBail?.mois_avance || leaseAdvanceMonths} mois d'avance</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-right font-bold text-slate-900">
                            {formatFCFA(((activeBail?.montant_loyer_fcfa || leaseRent) + (activeBail?.montant_charges_fcfa || leaseCharges)) * (activeBail?.mois_avance || leaseAdvanceMonths))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2">
                    Le dépôt de garantie n'est pas productif d'intérêts et ne peut en aucun cas s'imputer sur le paiement des derniers mois de loyer. Il sera restitué au PRENEUR en fin de bail, sous déduction des éventuelles réparations locatives et arriérés.
                  </p>
                </div>

                {/* Article 5: Obligations du Preneur */}
                <div className="space-y-1">
                  <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide bg-slate-100 p-1.5 rounded">
                    ARTICLE 5 : OBLIGATIONS PRINCIPALES DU PRENEUR
                  </h2>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 pl-1">
                    <li>Payer ponctuellement le loyer et les charges convenus aux termes fixés au présent bail.</li>
                    <li>Jouir des lieux en « bon père de famille » sans causer de troubles de jouissance ou de nuisances au voisinage.</li>
                    <li>Assurer les réparations locatives d'entretien courant prévues par les lois et règlements camerounais.</li>
                    <li>Ne faire aucune modification, percement de mur ou transformation de structure sans autorisation écrite du BAILLEUR.</li>
                    <li>Laisser visiter les locaux au BAILLEUR ou à ses délégués pour les contrôles techniques ou en cas de préavis de départ.</li>
                  </ul>
                </div>

                {/* Article 6: Clause Résolutoire */}
                <div className="space-y-1">
                  <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide bg-slate-100 p-1.5 rounded">
                    ARTICLE 6 : CLAUSE RÉSOLUTOIRE DE PLEIN DROIT
                  </h2>
                  <p className="text-[11px] text-slate-700">
                    Il est expressément stipulé qu'à défaut de paiement d'un seul terme de loyer à son échéance ou en cas d'inexécution de l'une quelconque des clauses du présent bail, celui-ci sera résilié de plein droit quinze (15) jours après une simple mise en demeure ou sommation de payer restée infructueuse. L'expulsion pourra avoir lieu en vertu d'une ordonnance de référé rendue par la juridiction compétente.
                  </p>
                </div>

                {/* Article 7: Élection de domicile et litiges */}
                <div className="space-y-1">
                  <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide bg-slate-100 p-1.5 rounded">
                    ARTICLE 7 : ÉLECTION DE DOMICILE ET TRIBUNAUX COMPÉTENTS
                  </h2>
                  <p className="text-[11px] text-slate-700">
                    Pour l'exécution des présentes, les parties font élection de domicile : le BAILLEUR en son siège ou domicile et le PRENEUR dans les lieux loués. En cas de contestation relative à l'interprétation ou à l'exécution du présent contrat, compétence exclusive est attribuée aux Tribunaux de <strong>{activeLogement?.ville || 'Douala'} (Cameroun)</strong>.
                  </p>
                </div>

                {/* Signatures and Seals Block */}
                <div className="pt-4 border-t-2 border-slate-900">
                  <div className="flex justify-between items-center text-xs text-slate-600 mb-6">
                    <span>Fait à <strong>{activeLogement?.ville || 'Douala'}</strong>, le {formatDateFR(new Date().toISOString().split('T')[0])}</span>
                    <span>En deux (2) exemplaires originaux de bonne foi</span>
                  </div>

                  <div className="grid grid-cols-2 gap-8 text-center pt-2">
                    {/* Preneur Signature */}
                    <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 min-h-[140px] flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-900 uppercase">LE PRENEUR</p>
                        <p className="text-[10px] text-slate-500 italic">(Mention manuscrite « Lu et approuvé »)</p>
                      </div>
                      <div className="py-2 text-[10px] text-indigo-900 font-semibold">
                        {locataire.nom_complet}
                      </div>
                      <div className="border-t border-dashed border-slate-400 pt-1 text-[9px] text-slate-400">
                        Signature & Cachet
                      </div>
                    </div>

                    {/* Bailleur Signature */}
                    <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 min-h-[140px] flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-900 uppercase">LE BAILLEUR</p>
                        <p className="text-[10px] text-slate-500 italic">(Mention manuscrite « Lu et approuvé »)</p>
                      </div>
                      <div className="py-2 text-[10px] text-emerald-900 font-semibold">
                        {currentUser.entreprise || currentUser.name}
                      </div>
                      <div className="border-t border-dashed border-slate-400 pt-1 text-[9px] text-slate-400">
                        Signature & Cachet Officiel
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: AJOUTER UN LOGEMENT & NOUVEAU CONTRAT DE BAIL */}
          {activeTab === 'ajouter_logement' && (
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Home className="w-5 h-5 text-indigo-600" />
                  Attribuer un Logement & Générer un Nouveau Contrat de Bail
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sélectionnez le bien et la pièce/lot à assigner à <strong>{locataire.nom_complet}</strong>, configurez les conditions financières du bail, puis validez.
                </p>
              </div>

              <form onSubmit={handleSaveHousingAndLease} className="space-y-4">
                {/* 1 - Selection du Bien Immobilier */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      1. Bien Immobilier (Immeuble / Villa / Résidence) :
                    </label>
                    <select
                      value={selectedBienId}
                      onChange={(e) => handleBienChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                      required
                    >
                      {availableLogements.map(b => (
                        <option key={b.id} value={b.id}>
                          🏢 {b.nom} ({b.ville}{b.pays ? `, ${b.pays}` : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2 - Selection de la Pièce / Lot */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      2. Logement / Lot / Appartement :
                    </label>
                    <select
                      value={selectedPieceId}
                      onChange={(e) => handlePieceChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-indigo-900 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                      required
                    >
                      {bienPieces.map(p => (
                        <option key={p.id} value={p.id}>
                          🚪 {p.numero} - {p.nom} ({p.type.toUpperCase()}) • {p.statut === 'libre' ? '✅ Disponible' : '⚠️ Déjà loué'} • Réf: {formatFCFA(p.loyer_reference)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Multi-Units Selection */}
                {bienPieces.length > 1 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Lots additionnels loués ensemble par ce locataire (ex: Appartement + Place de Parking + Magasin) :
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {bienPieces.map(p => {
                        const isSelected = selectedPieceIds.includes(p.id) || selectedPieceId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              if (selectedPieceIds.includes(p.id)) {
                                if (selectedPieceIds.length > 1) {
                                  setSelectedPieceIds(prev => prev.filter(id => id !== p.id));
                                }
                              } else {
                                setSelectedPieceIds(prev => [...prev, p.id]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {p.numero} ({p.nom})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Usage / Destination */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Destination & Usage des lieux :
                  </label>
                  <select
                    value={leaseUsage}
                    onChange={(e) => setLeaseUsage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Usage d'Habitation Bourgeoise Exclusive">
                      Usage d'Habitation Bourgeoise Exclusive (Logement résidentiel)
                    </option>
                    <option value="Usage Professionnel et Commercial (Bureaux & Activité)">
                      Usage Professionnel et Commercial (Bureaux d'entreprise, agence, cabinet)
                    </option>
                    <option value="Usage Mixte (Habitation & Télétravail / Profession Libérale)">
                      Usage Mixte (Habitation & Activité libérale)
                    </option>
                    <option value="Usage Commercial (Boutique, Commerce, Showroom)">
                      Usage Commercial (Boutique ou Local de vente)
                    </option>
                  </select>
                </div>

                {/* Dates & Durations */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Date de prise d'effet :
                    </label>
                    <input
                      type="date"
                      value={leaseStartDate}
                      onChange={(e) => setLeaseStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Durée du bail (Mois) :
                    </label>
                    <select
                      value={leaseDurationMonths}
                      onChange={(e) => setLeaseDurationMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 cursor-pointer"
                    >
                      <option value={6}>6 mois</option>
                      <option value={12}>12 mois (1 an - Standard)</option>
                      <option value={24}>24 mois (2 ans)</option>
                      <option value={36}>36 mois (3 ans)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Mois d'avance exigés :
                    </label>
                    <select
                      value={leaseAdvanceMonths}
                      onChange={(e) => setLeaseAdvanceMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 cursor-pointer"
                    >
                      <option value={1}>1 mois</option>
                      <option value={2}>2 mois (Standard)</option>
                      <option value={3}>3 mois (Trimestre)</option>
                      <option value={6}>6 mois (Semestre)</option>
                      <option value={12}>12 mois (Annuel)</option>
                    </select>
                  </div>
                </div>

                {/* Financial Conditions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-indigo-950 mb-1">
                      Loyer mensuel nu (FCFA) :
                    </label>
                    <input
                      type="number"
                      value={leaseRent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLeaseRent(val);
                        setLeaseCaution(val * 2);
                      }}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-extrabold text-indigo-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-950 mb-1">
                      Charges mensuelles (FCFA) :
                    </label>
                    <input
                      type="number"
                      value={leaseCharges}
                      onChange={(e) => setLeaseCharges(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-extrabold text-indigo-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-950 mb-1">
                      Dépôt de Garantie / Caution (FCFA) :
                    </label>
                    <input
                      type="number"
                      value={leaseCaution}
                      onChange={(e) => setLeaseCaution(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-extrabold text-indigo-900"
                      required
                    />
                  </div>
                </div>

                {/* Total Preview */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-900 flex-wrap gap-2">
                  <span>
                    Montant total exigible à la signature (Avance {leaseAdvanceMonths} mois + Caution) :
                  </span>
                  <span className="text-sm font-extrabold text-emerald-800">
                    {formatFCFA(((leaseRent + leaseCharges) * leaseAdvanceMonths) + leaseCaution)}
                  </span>
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('contrat')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Enregistrer le Logement & Générer le Contrat de Bail</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: FICHE DU LOCATAIRE & COORDONNÉES */}
          {activeTab === 'dossier' && (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Informations d'Identification & Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Nom complet / Raison Sociale :</span>
                    <span className="font-bold text-slate-900 text-sm">{locataire.nom_complet}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Statut juridique :</span>
                    <span className="font-bold text-indigo-700">
                      {locataire.type_personne === 'personne_morale' ? 'Entreprise / Personne Morale' : 'Personne Physique'}
                    </span>
                  </div>

                  {locataire.type_personne === 'personne_morale' && locataire.niu && (
                    <div>
                      <span className="text-slate-500 font-medium block">Numéro d'Identifiant Unique (NIU) :</span>
                      <span className="font-mono font-bold text-indigo-900">{locataire.niu}</span>
                    </div>
                  )}

                  {locataire.type_personne === 'personne_morale' && locataire.nom_gerant && (
                    <div>
                      <span className="text-slate-500 font-medium block">Gérant Statutaire :</span>
                      <span className="font-bold text-slate-800">
                        {locataire.nom_gerant} {locataire.telephone_gerant ? `(${locataire.telephone_gerant})` : ''}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 font-medium block">Téléphone Principal :</span>
                    <span className="font-bold text-slate-800">{locataire.telephone_principal}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Adresse Email :</span>
                    <span className="font-bold text-slate-800">{locataire.email}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Profession ou Employeur :</span>
                    <span className="font-semibold text-slate-800">{locataire.profession_employeur || 'Cadre d\'entreprise'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Personne / Contact d'Urgence :</span>
                    <span className="font-semibold text-slate-800">
                      {locataire.contact_urgence_nom || 'Famille'} ({locataire.contact_urgence_telephone || '+237 690 00 00 00'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Housing Units Currently Occupied */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-600" />
                    Logements & Lots Assignés ({occupiedPieces.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ajouter_logement')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un autre lot</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {occupiedPieces.map(piece => (
                    <div key={piece.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          🚪 {piece.numero} - {piece.nom} ({piece.type.toUpperCase()})
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {activeLogement?.nom} • Étage {piece.etage ?? 0} • {piece.superficie || 50} m²
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {formatFCFA(piece.loyer_reference + (piece.charges_incluses || 0))} / mois
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase">
                          Occupé
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment History & Quittances */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Historique des Règlements & Quittances ({tenantPayments.length})
                </h3>

                {tenantPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Aucun règlement enregistré pour le moment.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {tenantPayments.map(p => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-800 block">
                            Période : {formatMonthYear(p.mois_concerne)}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {p.mode_paiement.toUpperCase()} • Réf : {p.reference_recu || p.quittance_numero}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-700">
                            {formatFCFA(p.montant_recu)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedQuittancePaiement(p)}
                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Quittance
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

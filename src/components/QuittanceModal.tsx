import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Building, 
  FileText,
  Send,
  MessageCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { formatFCFA, formatDateFR, formatMonthYear } from '../utils/formatters';
import { downloadQuittancePDF } from '../utils/pdfGenerator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const QuittanceModal: React.FC = () => {
  const { selectedQuittancePaiement, setSelectedQuittancePaiement, locataires, logements, pieces, currentUser } = useApp();
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!selectedQuittancePaiement) return null;

  const locataire = locataires.find(l => l.id === selectedQuittancePaiement.locataire_id);
  const logement = logements.find(l => l.id === selectedQuittancePaiement.logement_id);
  
  // Multiple housing units support: tenant might occupy 1 or more units
  const occupiedPieces = pieces.filter(p => 
    (selectedQuittancePaiement.piece_ids && selectedQuittancePaiement.piece_ids.includes(p.id)) ||
    p.id === selectedQuittancePaiement.piece_id ||
    (locataire?.piece_ids && locataire.piece_ids.includes(p.id)) ||
    p.current_locataire_id === locataire?.id
  );
  // Fallback to single piece
  const mainPiece = pieces.find(p => p.id === selectedQuittancePaiement.piece_id) || occupiedPieces[0];

  // Payment type detection: Installment (tranche) or Multiple-month (multi_mois)
  const isTranche = selectedQuittancePaiement.type_paiement === 'tranche' || 
    selectedQuittancePaiement.statut === 'partiel' || 
    (selectedQuittancePaiement.tranche_solde_restant !== undefined && selectedQuittancePaiement.tranche_solde_restant > 0);

  const isMultiMois = selectedQuittancePaiement.type_paiement === 'multi_mois' || 
    (selectedQuittancePaiement.mois_soldes && selectedQuittancePaiement.mois_soldes.length > 1);

  const moisSoldesList = selectedQuittancePaiement.mois_soldes && selectedQuittancePaiement.mois_soldes.length > 0 
    ? selectedQuittancePaiement.mois_soldes 
    : [selectedQuittancePaiement.mois_concerne];

  const nbMoisRegles = selectedQuittancePaiement.nb_mois_regles || (isMultiMois ? moisSoldesList.length : 1);
  const formattedPeriodeCouverte = (selectedQuittancePaiement.periode_debut && selectedQuittancePaiement.periode_fin)
    ? `Du ${formatDateFR(selectedQuittancePaiement.periode_debut)} au ${formatDateFR(selectedQuittancePaiement.periode_fin)}`
    : selectedQuittancePaiement.mois_soldes_labels || formatMonthYear(selectedQuittancePaiement.mois_concerne);

  const montantTotalRecu = selectedQuittancePaiement.montant_recu;
  const montantAttendu = selectedQuittancePaiement.montant_attendu || montantTotalRecu;
  const soldeRestant = selectedQuittancePaiement.tranche_solde_restant ?? Math.max(0, montantAttendu - montantTotalRecu);

  // Approximate rent / charges split across occupied pieces
  const totalCharges = occupiedPieces.reduce((sum, p) => sum + (p.charges_incluses || 0), 0) * (isMultiMois ? nbMoisRegles : 1);
  const montantCharges = Math.min(montantTotalRecu, totalCharges);
  const montantLoyerNu = Math.max(0, montantTotalRecu - montantCharges);
  
  const quittanceNum = selectedQuittancePaiement.quittance_numero || 
    `QUIT-CM-${selectedQuittancePaiement.annee}-${Math.floor(1000 + Math.random() * 9000)}`;

  const modePaiementLabel = selectedQuittancePaiement.mode_paiement.toUpperCase().replace(/\s+/g, '_');
  const transactionRef = selectedQuittancePaiement.reference_recu || `${modePaiementLabel}-${quittanceNum}`;

  // Format phone number for WhatsApp URL
  const getCleanPhoneForWhatsApp = (rawPhone?: string) => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('00237')) digits = digits.substring(2);
    else if (!digits.startsWith('237') && digits.length === 9) digits = '237' + digits;
    return digits;
  };

  // Generate WhatsApp Message with multi-month / installment precision
  const generateWhatsAppMessage = () => {
    const periodLabel = isMultiMois 
      ? `Période couverte : ${formattedPeriodeCouverte} (${nbMoisRegles} mois réglés)`
      : formatMonthYear(selectedQuittancePaiement.mois_concerne).toUpperCase();

    const trancheDetails = isTranche 
      ? `\n🔖 *Type :* Paiement en Tranche (Acompte Tranche ${selectedQuittancePaiement.tranche_numero || 1})\n` +
        `💰 *Total Attendu :* ${formatFCFA(montantAttendu)}\n` +
        `💵 *Acompte Versé :* ${formatFCFA(montantTotalRecu)}\n` +
        `⏳ *Solde Restant Dû :* ${formatFCFA(soldeRestant)}\n` +
        (selectedQuittancePaiement.tranche_date_limite ? `📅 *Échéance solde :* ${formatDateFR(selectedQuittancePaiement.tranche_date_limite)}\n` : '')
      : `💰 *Montant Réglé :* ${formatFCFA(montantTotalRecu)}\n`;

    const unitsList = occupiedPieces.map(p => `${p.nom} (${p.type.toUpperCase()})`).join(' + ');

    return `*REÇU & QUITTANCE DE LOYER OFFICIELLE*\n` +
      `---------------------------------------\n` +
      `🏢 *Bailleur :* ${currentUser.entreprise || currentUser.name}\n` +
      `👤 *Locataire :* ${locataire?.nom_complet || 'Cher locataire'}\n` +
      `🏠 *Bien Loué :* ${logement?.nom || 'Bien'}\n` +
      `🚪 *Logement(s) / Unités :* ${unitsList || mainPiece?.nom || 'Lot locatif'}\n` +
      `📍 *Adresse :* ${logement?.adresse || ''}, ${logement?.ville || 'Cameroun'}\n` +
      `📅 *Période couverte :* ${periodLabel}\n` +
      trancheDetails +
      `💳 *Mode de paiement :* ${selectedQuittancePaiement.mode_paiement.toUpperCase()}\n` +
      `🔢 *Réf. Transaction :* ${transactionRef}\n` +
      `📄 *N° Quittance :* ${quittanceNum}\n` +
      `✅ *Statut :* ${isTranche ? 'Acompte enregistré & certifié' : 'Solde entièrement acquitté'}\n` +
      `---------------------------------------\n` +
      `_Document officiel certifié généré via LocaManager DISCOM Cameroun._\n` +
      `Merci pour votre confiance et ponctualité !`;
  };

  const handlePrint = () => {
    const element = document.getElementById('printable-quittance');
    if (!element) {
      window.print();
      return;
    }

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=1000');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Quittance de Loyer - ${quittanceNum}</title>
              <meta charset="utf-8">
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page { size: A4; margin: 10mm 15mm; }
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
      console.warn('Popup print fallback:', e);
    }

    window.print();
  };

  const handleSendWhatsApp = () => {
    const rawPhone = locataire?.telephone_principal || '';
    const cleanPhone = getCleanPhoneForWhatsApp(rawPhone);
    const message = generateWhatsAppMessage();
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
    }

    const whatsappUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
    setFeedbackSuccess(`Reçu envoyé via WhatsApp à ${locataire?.nom_complet} (${rawPhone}) ! Texte également copié.`);
    setTimeout(() => setFeedbackSuccess(null), 5000);
  };

  const handleDownloadReceipt = async () => {
    setIsGeneratingPdf(true);
    setFeedbackSuccess('Génération du fichier PDF du ticket en cours...');

    try {
      // 1. Try vector PDF generator (instant, pixel-perfect, and works in all browsers/iframes)
      const success = downloadQuittancePDF({
        paiement: selectedQuittancePaiement,
        bailleur: currentUser,
        locataire: locataire,
        logement: logement,
        pieces: occupiedPieces
      });

      if (success) {
        setFeedbackSuccess(`Ticket de quittance N° ${quittanceNum} téléchargé avec succès au format .PDF !`);
        setIsGeneratingPdf(false);
        setTimeout(() => setFeedbackSuccess(null), 5000);
        return;
      }
    } catch (err) {
      console.warn('Erreur générateur vectoriel, tentative de secours:', err);
    }

    // 2. Fallback to html2canvas if needed
    try {
      const element = document.getElementById('printable-quittance');
      if (element) {
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

        const fileName = `Ticket_Quittance_${quittanceNum}_${(locataire?.nom_complet || 'Locataire').replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);

        setFeedbackSuccess(`Ticket de quittance téléchargé avec succès au format .PDF (${fileName}) !`);
      }
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      setFeedbackSuccess('Erreur lors de la génération du PDF. Vous pouvez imprimer directement via le bouton Imprimer.');
    } finally {
      setIsGeneratingPdf(false);
      setTimeout(() => setFeedbackSuccess(null), 5000);
    }
  };

  const handleCopyMessage = () => {
    const message = generateWhatsAppMessage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
      setFeedbackSuccess('Texte complet du reçu copié dans le presse-papier !');
      setTimeout(() => setFeedbackSuccess(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[94vh] border border-slate-200">
        
        {/* Modal Action Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold text-sm tracking-tight">Reçu & Quittance de Loyer Certifiée</span>
              <span className="text-[10px] text-slate-400 block">Norme OHADA Cameroun • Impression A4 Conforme</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp CTA */}
            <button 
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Envoyer directement sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>Envoyer WhatsApp</span>
            </button>

            {/* Download PDF */}
            <button 
              type="button"
              onClick={handleDownloadReceipt}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
              title="Télécharger le ticket de quittance au format .PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? 'Export PDF...' : 'Télécharger (.PDF)'}</span>
            </button>

            {/* Print */}
            <button 
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Imprimer le ticket de quittance"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            <button 
              type="button"
              onClick={() => setSelectedQuittancePaiement(null)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-emerald-800 text-xs font-semibold flex items-center gap-2 no-print shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {/* Printable Quittance Document (Clean, compliant, full visibility) */}
        <div id="printable-quittance" className="p-6 sm:p-7 overflow-y-auto bg-white text-slate-800 flex-1 print:p-0 print:overflow-visible">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-700 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  DIS
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-slate-900 uppercase tracking-tight">
                    {currentUser.entreprise || currentUser.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Gestion Immobilière & Patrimoine Locatif Cameroun
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5 mt-1">
                <p><strong>Bailleur :</strong> {currentUser.name}</p>
                <p><strong>Contact :</strong> {currentUser.phonenumber} • {currentUser.email}</p>
                <p><strong>Localisation :</strong> {currentUser.ville || 'Douala'}, Cameroun</p>
              </div>
            </div>

            <div className="text-left sm:text-right flex flex-col sm:items-end">
              <span className="inline-block bg-slate-900 text-white font-bold text-xs px-3 py-1 rounded-md uppercase tracking-wider mb-2">
                Quittance N° {quittanceNum}
              </span>
              <p className="text-xs text-slate-600 space-y-0.5">
                <span><strong>Date d'émission :</strong> {formatDateFR(selectedQuittancePaiement.date_paiement || selectedQuittancePaiement.date_creation)}</span><br />
                <span><strong>Période :</strong> <span className="font-bold uppercase text-emerald-700">{formatMonthYear(selectedQuittancePaiement.mois_concerne)}</span></span>
              </p>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="my-4 text-center py-2.5 px-4 bg-slate-100 border border-slate-300 rounded-lg">
            <h1 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
              {isTranche 
                ? "REÇU D'ACOMPTE & PAIEMENT DE LOYER EN TRANCHE" 
                : isMultiMois 
                ? "QUITTANCE DE LOYER MULTIPLE-MOIS (PAIEMENT GROUPÉ)" 
                : "QUITTANCE DE LOYER & REÇU D'ACQUITTEMENT DÉFINITIF"}
            </h1>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Délivrée en conformité avec les règles du droit foncier et locatif OHADA au Cameroun
            </p>
          </div>

          {/* Badges for Special Payment Types (Tranche or Multi-mois) */}
          {(isTranche || isMultiMois) && (
            <div className="mb-4 p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-indigo-50/60 border-indigo-200">
              {isTranche && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500 text-white rounded font-bold text-[10px] uppercase">
                    Paiement en Tranche {selectedQuittancePaiement.tranche_numero ? `(Tranche ${selectedQuittancePaiement.tranche_numero})` : ''}
                  </span>
                  <span className="text-slate-700 font-medium">
                    Acompte de {formatFCFA(montantTotalRecu)} versé sur un total de {formatFCFA(montantAttendu)}. Reste dû : <strong>{formatFCFA(soldeRestant)}</strong>
                  </span>
                </div>
              )}

              {isMultiMois && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-indigo-600 text-white rounded font-bold text-[10px] uppercase">
                    Paiement groupé ({nbMoisRegles} mois)
                  </span>
                  <span className="text-slate-800 font-bold">
                    Période couverte : {formattedPeriodeCouverte} ({nbMoisRegles} Mois réglés)
                  </span>
                </div>
              )}

              {isTranche && selectedQuittancePaiement.tranche_date_limite && (
                <span className="text-amber-800 text-[11px] font-bold">
                  Date limite du solde : {formatDateFR(selectedQuittancePaiement.tranche_date_limite)}
                </span>
              )}
            </div>
          )}

          {/* Parties Involved Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-3.5">
            {/* Left: Property & Units Occupied */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-600" /> Bien & Logement(s) Loué(s)
              </h3>
              <p className="font-bold text-xs text-slate-900">{logement?.nom || 'Bien immobilier'}</p>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                <p>
                  <strong>Unité(s) occupée(s) :</strong>{' '}
                  <span className="text-indigo-900 font-semibold">
                    {occupiedPieces.length > 0 
                      ? occupiedPieces.map(p => `${p.nom} (${p.type.toUpperCase()})`).join(' + ')
                      : `${mainPiece?.nom || 'Logement'} (${mainPiece?.type || 'Appartement'})`}
                  </span>
                </p>
                <p>Adresse : {logement?.adresse}, {logement?.ville}</p>
                <p>Étage : {mainPiece?.etage ?? 0} • Superficie : {occupiedPieces.reduce((sum, p) => sum + (p.superficie || 0), 0) || 50} m²</p>
              </div>
            </div>

            {/* Right: Tenant details */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Locataire Débiteur
              </h3>
              <p className="font-bold text-xs text-slate-900">{locataire?.nom_complet || 'Nom du locataire'}</p>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                <p>CNI / Passeport : <strong>{locataire?.cni_passeport || 'N/A'}</strong></p>
                <p>Téléphone WhatsApp : <strong>{locataire?.telephone_principal || 'N/A'}</strong></p>
                <p>Profession : {locataire?.profession || 'Cadre'}</p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <div className="my-3.5 border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3">Désignation</th>
                  <th className="py-2 px-3 text-center">Période Couverte</th>
                  <th className="py-2 px-3 text-center">Nombre de mois réglés</th>
                  <th className="py-2 px-3 text-right">Montant Attendu</th>
                  <th className="py-2 px-3 text-right">Montant Encaissé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Single consolidated row for multi-month payment */}
                {isMultiMois ? (
                  <tr className="bg-white">
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      Loyer & Charges ({occupiedPieces.map(p => p.nom).join(', ')})
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700 font-medium text-xs">
                      {formattedPeriodeCouverte}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-xs">
                        {nbMoisRegles} {nbMoisRegles > 1 ? 'Mois' : 'Mois'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                      {formatFCFA(montantAttendu)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatFCFA(montantTotalRecu)}
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        Loyer principal nu ({occupiedPieces.map(p => p.nom).join(', ')})
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {formatMonthYear(selectedQuittancePaiement.mois_concerne)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-xs">
                          {isTranche ? `Tranche ${selectedQuittancePaiement.tranche_numero || 1}` : '1 Mois'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                        {formatFCFA(Math.max(0, montantAttendu - montantCharges))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatFCFA(montantLoyerNu)}
                      </td>
                    </tr>
                    {montantCharges > 0 && (
                      <tr>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          Provisions pour charges locatives (gardiennage, forage, communs)
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600">
                          {formatMonthYear(selectedQuittancePaiement.mois_concerne)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-xs">
                            1 Mois
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-600">
                          {formatFCFA(montantCharges)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatFCFA(montantCharges)}
                        </td>
                      </tr>
                    )}
                  </>
                )}

                {/* Total Received row */}
                <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-300">
                  <td className="py-2.5 px-3 text-emerald-950 text-xs">
                    TOTAL EFFECTIVEMENT REÇU & ENCAISSÉ
                  </td>
                  <td className="py-2.5 px-3 text-center text-[10px] text-emerald-800 uppercase font-bold">
                    {isTranche ? 'Acompte partiel' : 'Acquitté intégralement'}
                  </td>
                  <td className="py-2.5 px-3 text-center text-xs font-bold text-emerald-900">
                    {nbMoisRegles} {nbMoisRegles > 1 ? 'Mois' : 'Mois'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    {formatFCFA(montantAttendu)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-sm text-emerald-800">
                    {formatFCFA(montantTotalRecu)}
                  </td>
                </tr>

                {/* Tranche restant row if applicable */}
                {isTranche && soldeRestant > 0 && (
                  <tr className="bg-amber-50 font-bold text-amber-900">
                    <td className="py-2 px-3 text-xs">
                      SOLDE RESTANT DÛ (TRANCHE SUIVANTE)
                    </td>
                    <td className="py-2 px-3 text-center text-[10px] uppercase">
                      {selectedQuittancePaiement.tranche_date_limite ? `À régler avant le ${formatDateFR(selectedQuittancePaiement.tranche_date_limite)}` : 'À régler sous huitaine'}
                    </td>
                    <td className="py-2 px-3 text-center text-xs">
                      -
                    </td>
                    <td className="py-2 px-3 text-right text-xs">
                      -
                    </td>
                    <td className="py-2 px-3 text-right text-sm text-amber-800 font-extrabold">
                      {formatFCFA(soldeRestant)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Method Details */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p>
                <strong>Mode de paiement :</strong>{' '}
                <span className="uppercase font-bold text-slate-900">
                  {selectedQuittancePaiement.mode_paiement}
                </span>
              </p>
              <p className="mt-0.5">
                <strong>Référence transaction :</strong>{' '}
                <span className="font-mono font-bold text-slate-800">
                  {transactionRef}
                </span>
                <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                  (Mode de paiement + N° Ticket)
                </span>
              </p>
              <p className="mt-0.5">
                <strong>Date de valeur :</strong> {formatDateFR(selectedQuittancePaiement.date_paiement || selectedQuittancePaiement.date_creation)}
              </p>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center gap-1 px-3 py-1 font-bold rounded-md text-[11px] ${
                isTranche 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> 
                {isTranche ? "ACOMPTE ENREGISTRÉ & VALIDE" : "PAIEMENT VALIDÉ & CONFORME OHADA"}
              </span>
            </div>
          </div>

          {/* Legal Certification & Signatures */}
          <div className="mt-5 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="text-[10px] text-slate-500 leading-relaxed">
              <p>
                Je soussigné <strong>{currentUser.name}</strong>, bailleur du bien immobilier susvisé, 
                reconnais avoir reçu de <strong>{locataire?.nom_complet}</strong> la somme de <strong>{formatFCFA(montantTotalRecu)}</strong>{' '}
                {isMultiMois 
                  ? `pour règlement des loyers des mois de : ${moisSoldesList.map(m => formatMonthYear(m)).join(', ')}.` 
                  : isTranche
                  ? `à titre d'acompte partiel sur le loyer du mois de ${formatMonthYear(selectedQuittancePaiement.mois_concerne)}.`
                  : `pour solde intégral du loyer du mois de ${formatMonthYear(selectedQuittancePaiement.mois_concerne)}.`}
              </p>
              <p className="mt-1 text-[9px] text-slate-400">
                Document électronique certifié conforme, conservé sur le registre numérique <strong>LocaManager DISCOM SARL Cameroun</strong>.
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end">
              <div className="border border-dashed border-slate-400 rounded-lg p-2.5 w-48 text-center bg-slate-50">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cachet & Signature</p>
                <div className="h-11 flex items-center justify-center">
                  <div className="border border-emerald-700 text-emerald-800 rounded px-2.5 py-0.5 font-bold text-[10px] rotate-[-2deg] uppercase tracking-tight bg-white shadow-xs">
                    {isTranche ? 'ACOMPTE ENCAISSÉ' : 'PAYÉ & CERTIFIÉ'}<br />
                    <span className="text-[8px] font-normal text-slate-600">{currentUser.name}</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Fait à {currentUser.ville || 'Douala'}, le {formatDateFR(new Date().toISOString())}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions (Hidden on print) */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>Transmettre WhatsApp</span>
            </button>

            <button 
              type="button"
              onClick={handleCopyMessage}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copier le texte</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setSelectedQuittancePaiement(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Fermer
            </button>

            <button 
              type="button"
              onClick={handleDownloadReceipt}
              className="px-3 py-1.5 bg-slate-800 text-white rounded-md text-xs font-medium hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger Reçu</span>
            </button>

            <button 
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer Quittance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

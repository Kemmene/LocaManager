import { jsPDF } from 'jspdf';
import { Paiement, UserAccount, Logement, Piece, Locataire } from '../types';
import { formatFCFA, formatDateFR, formatMonthYear } from './formatters';

interface QuittancePDFOptions {
  paiement: Paiement;
  bailleur: UserAccount;
  locataire?: Locataire;
  logement?: Logement;
  pieces?: Piece[];
}

export const downloadQuittancePDF = ({
  paiement,
  bailleur,
  locataire,
  logement,
  pieces = []
}: QuittancePDFOptions): boolean => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 16;

    // Header Background Accent Bar
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, pageWidth - (margin * 2), 22, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text((bailleur.entreprise || bailleur.name || 'DISCOM CAMEROUN').toUpperCase(), margin + 6, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Gestion Immobilière & Patrimoine Locatif Conforme OHADA', margin + 6, y + 14);
    doc.text(`Contact : ${bailleur.phonenumber || ''} | ${bailleur.email || ''}`, margin + 6, y + 18);

    // Header Right: Ticket / Quittance Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const quittanceNumStr = `TICKET N° ${paiement.quittance_numero || paiement.id}`;
    doc.text(quittanceNumStr, pageWidth - margin - 6, y + 10, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const dateStr = `Émis le : ${formatDateFR(paiement.date_paiement || paiement.date_creation)}`;
    doc.text(dateStr, pageWidth - margin - 6, y + 16, { align: 'right' });

    y += 28;

    // Document Title Banner
    const isMultiMois = paiement.type_paiement === 'multi_mois' || (paiement.nb_mois_regles && paiement.nb_mois_regles > 1);
    const isTranche = paiement.type_paiement === 'tranche';
    
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 14, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const titleText = isTranche 
      ? "REÇU D'ACOMPTE & PAIEMENT DE LOYER EN TRANCHE" 
      : isMultiMois 
      ? `QUITTANCE DE LOYER MULTIPLE-MOIS (${paiement.nb_mois_regles || 1} MOIS RÉGLÉS)` 
      : "QUITTANCE DE LOYER & REÇU D'ACQUITTEMENT DÉFINITIF";
    doc.text(titleText, pageWidth / 2, y + 6.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Délivrée en application du droit foncier et des dispositions du droit locatif OHADA au Cameroun', pageWidth / 2, y + 11, { align: 'center' });

    y += 18;

    // Parties Grid (Left: Bien / Right: Locataire)
    const boxWidth = (pageWidth - (margin * 2) - 6) / 2;
    const boxHeight = 36;

    // Left Box - Bien & Logement
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('BIEN & LOGEMENT LOUÉ', margin + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(logement?.nom || 'Bien immobilier', margin + 4, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const pieceNames = pieces.length > 0 ? pieces.map(p => p.nom).join(', ') : 'Logement principal';
    doc.text(`Unité(s) : ${pieceNames}`, margin + 4, y + 18);
    doc.text(`Adresse : ${logement?.adresse || 'N/A'}, ${logement?.ville || 'Cameroun'}`, margin + 4, y + 24);
    doc.text(`Propriétaire : ${bailleur.name} (${bailleur.phonenumber || ''})`, margin + 4, y + 30);

    // Right Box - Locataire
    const rightBoxX = margin + boxWidth + 6;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightBoxX, y, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(79, 70, 229);
    doc.text('LOCATAIRE DÉBITEUR', rightBoxX + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(locataire?.nom_complet || 'Locataire', rightBoxX + 4, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Téléphone : ${locataire?.telephone_principal || 'N/A'}`, rightBoxX + 4, y + 18);
    doc.text(`CNI / RCCM : ${locataire?.cni_passeport || 'N/A'}`, rightBoxX + 4, y + 24);
    doc.text(`Type : ${locataire?.type_personne === 'personne_morale' ? 'Personne Morale / Entreprise' : 'Personne Physique'}`, rightBoxX + 4, y + 30);

    y += boxHeight + 6;

    // Period formatting
    let periodText = '';
    if (paiement.periode_debut && paiement.periode_fin) {
      periodText = `Du ${formatDateFR(paiement.periode_debut)} au ${formatDateFR(paiement.periode_fin)}`;
    } else if (paiement.mois_soldes_labels) {
      periodText = paiement.mois_soldes_labels;
    } else {
      periodText = formatMonthYear(paiement.mois_concerne);
    }

    const nbMoisRegles = paiement.nb_mois_regles || (isMultiMois && paiement.mois_soldes ? paiement.mois_soldes.length : 1);

    // Table Header
    const tableX = margin;
    const tableWidth = pageWidth - (margin * 2);
    const colWidths = {
      desig: tableWidth * 0.36,
      periode: tableWidth * 0.28,
      nbMois: tableWidth * 0.14,
      recu: tableWidth * 0.22
    };

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(tableX, y, tableWidth, 8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('DÉSIGNATION DU LOGEMENT', tableX + 3, y + 5.5);
    doc.text('PÉRIODE COUVERTE', tableX + colWidths.desig + 3, y + 5.5);
    doc.text('NB MOIS RÉGLÉS', tableX + colWidths.desig + colWidths.periode + 2, y + 5.5);
    doc.text('MONTANT ENCAISSÉ', tableX + tableWidth - 3, y + 5.5, { align: 'right' });

    y += 8;

    // Table Row (Consolidated single row as requested by user - NO listing of all individual months!)
    const rowHeight = 12;
    doc.setFillColor(255, 255, 255);
    doc.rect(tableX, y, tableWidth, rowHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const desigLabel = isTranche
      ? `Acompte loyer - ${pieceNames} (Tranche ${paiement.tranche_numero || 1})`
      : `Loyer & charges - ${pieceNames}`;
    doc.text(desigLabel, tableX + 3, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(periodText, tableX + colWidths.desig + 3, y + 5.5);

    // Case "Nombre de mois réglés pour ce logement" (Requirement 2)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(79, 70, 229);
    const nbMoisStr = isTranche ? 'Acompte' : `${nbMoisRegles} ${nbMoisRegles > 1 ? 'Mois' : 'Mois'}`;
    doc.text(nbMoisStr, tableX + colWidths.desig + colWidths.periode + 4, y + 5.5);

    // Montant
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(formatFCFA(paiement.montant_recu), tableX + tableWidth - 3, y + 5.5, { align: 'right' });

    y += rowHeight;

    // Total Row
    doc.setFillColor(248, 250, 252);
    doc.rect(tableX, y, tableWidth, 9, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL ENCAISSÉ (FCFA) :', tableX + colWidths.desig + 3, y + 6);

    doc.setFontSize(10.5);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(formatFCFA(paiement.montant_recu), tableX + tableWidth - 3, y + 6.5, { align: 'right' });

    y += 14;

    // Payment method & transaction metadata
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, tableWidth, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('DÉTAILS DU RÈGLEMENT & TRAÇABILITÉ NUMÉRIQUE :', margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(71, 85, 105);
    const modeLabel = paiement.mode_paiement === 'mtn_money' 
      ? 'MTN Mobile Money Cameroun (*126#)'
      : paiement.mode_paiement === 'orange_money'
      ? 'Orange Money Cameroun (#150#)'
      : paiement.mode_paiement === 'virement'
      ? 'Virement Bancaire'
      : paiement.mode_paiement === 'cheque'
      ? 'Chèque Bancaire'
      : 'Espèces contre reçu';
    doc.text(`• Mode de versement : ${modeLabel}`, margin + 4, y + 11);
    doc.text(`• Réf. Transaction : ${paiement.reference_recu || 'N/A'}`, margin + 4, y + 16.5);
    doc.text(`• N° Quittance : ${paiement.quittance_numero || paiement.id}`, margin + 4, y + 22);

    const midCol = margin + (tableWidth / 2);
    doc.text(`• Date de paiement : ${formatDateFR(paiement.date_paiement || paiement.date_creation)}`, midCol, y + 11);
    doc.text(`• Statut : Règlement validé avec acquittement`, midCol, y + 16.5);
    if (paiement.commentaire) {
      doc.text(`• Note : ${paiement.commentaire.substring(0, 45)}`, midCol, y + 22);
    }

    y += 29;

    // Legal acknowledgment block & Stamp
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const legalText = "Le bailleur soussigné reconnaît avoir reçu du locataire susnommé la somme indiquée au titre du paiement des loyers pour la période susmentionnée. Cette quittance annule tout reçu provisoire antérieur et fait foi de paiement conformément aux dispositions légales en vigueur.";
    const splitLegal = doc.splitTextToSize(legalText, tableWidth - 55);
    doc.text(splitLegal, margin, y);

    // Official Stamp / Signature Box on the Right
    const stampX = pageWidth - margin - 50;
    const stampY = y - 2;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(79, 70, 229);
    doc.roundedRect(stampX, stampY, 50, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(79, 70, 229);
    doc.text('POUR ACQUIT & VALIDATION', stampX + 25, stampY + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Signature / Cachet Bailleur', stampX + 25, stampY + 9, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(16, 185, 129);
    doc.text('CERTIFIÉ DISCOM', stampX + 25, stampY + 16, { align: 'center' });

    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(new Date().toISOString().split('T')[0], stampX + 25, stampY + 20, { align: 'center' });

    // Footer
    y = 282;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Document officiel généré par LocaManager DISCOM • Sécurisé & Inaltérable • www.discom-cameroun.cm', pageWidth / 2, y + 4, { align: 'center' });

    // Filename & trigger download
    const safeLocataire = (locataire?.nom_complet || 'Locataire').replace(/[^a-zA-Z0-9]/g, '_');
    const safeTicket = (paiement.quittance_numero || paiement.id).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Ticket_Quittance_${safeTicket}_${safeLocataire}.pdf`;

    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return false;
  }
};

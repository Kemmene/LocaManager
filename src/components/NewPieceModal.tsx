import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PieceType, PieceStatus } from '../types';
import { 
  X, 
  DoorOpen, 
  Building, 
  Plus, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Upload,
  Trash2,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  Home
} from 'lucide-react';
import { formatFCFA } from '../utils/formatters';
import confetti from 'canvas-confetti';

interface NewPieceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLogementId?: string;
}

const LOGEMENT_PHOTO_PRESETS = [
  {
    label: 'Appartement Salon & Séjour',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
    type: 'appartement'
  },
  {
    label: 'Studio Moderne',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
    type: 'studio'
  },
  {
    label: 'Chambre confortable',
    url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80',
    type: 'chambre'
  },
  {
    label: 'Bureau professionnel',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    type: 'bureau'
  },
  {
    label: 'Magasin / Espace commercial',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    type: 'magasin'
  }
];

export const NewPieceModal: React.FC<NewPieceModalProps> = ({
  isOpen,
  onClose,
  defaultLogementId
}) => {
  const { logements, addPiece, addMultiplePieces } = useApp();

  // Étape 1 : Sélection du Bien parent
  const [selectedBienId, setSelectedBienId] = useState<string>(
    defaultLogementId || logements[0]?.id || ''
  );

  const selectedBien = useMemo(() => {
    return logements.find(l => l.id === selectedBienId) || logements[0];
  }, [logements, selectedBienId]);

  const isImmeuble = selectedBien?.type === 'immeuble';

  // Étages disponibles pour cet immeuble
  const availableFloors = useMemo(() => {
    if (!selectedBien || !isImmeuble) {
      return [{ id: 1, label: 'Étage 1', baseNumber: 100 }];
    }

    const floors: Array<{ id: number; label: string; baseNumber: number }> = [];

    // Étage 1 par défaut en premier
    floors.push({ id: 1, label: 'Étage 1', baseNumber: 100 });

    // Étages supérieurs
    const maxFloors = selectedBien.nombre_etages || 3;
    for (let f = 2; f <= maxFloors; f++) {
      floors.push({ id: f, label: `Étage ${f}`, baseNumber: f * 100 });
    }

    // Rez-de-chaussée (Niveau 0)
    floors.push({ id: 0, label: 'Rez-de-chaussée (RDC - Niveau 0)', baseNumber: 0 });

    // Sous-sol si défini
    if (selectedBien.a_sous_sol) {
      const nbSousSols = selectedBien.nombre_sous_sols || 1;
      for (let s = 1; s <= nbSousSols; s++) {
        floors.push({
          id: -s,
          label: `Sous-sol -${s}`,
          baseNumber: s * 100
        });
      }
    }

    return floors;
  }, [selectedBien, isImmeuble]);

  // ==========================================
  // CHAMPS SPÉCIFIQUES IMMEUBLE
  // ==========================================
  // 1. Étage (Mentionner Étage 1 par défaut)
  const [selectedFloorId, setSelectedFloorId] = useState<number>(1);

  // 2. Type de logement: appartement, chambre, studio, magasin, bureau
  const [logementType, setLogementType] = useState<PieceType>('appartement');

  // 3. Nombre de pièces dans le logement
  const [nombrePieces, setNombrePieces] = useState<number>(3);

  // 4. Préfixe du logement (Input text, ex: "A")
  const [prefixe, setPrefixe] = useState<string>('A');

  // 5. Nombre de logements dans l'étage (ex: 10 pour A100 à A109)
  const [nombreLogementsEtage, setNombreLogementsEtage] = useState<number>(10);

  // Caractéristiques financières & surface
  const [loyerReference, setLoyerReference] = useState<number>(180000);
  const [chargesIncluses, setChargesIncluses] = useState<number>(15000);
  const [superficie, setSuperficie] = useState<number>(55);
  const [statut, setStatut] = useState<PieceStatus>('libre');
  const [description, setDescription] = useState<string>('Logement avec compteur individuel et finitions soignées.');

  // ==========================================
  // CHAMPS POUR BIEN NON-IMMEUBLE (VILLA, etc.)
  // ==========================================
  const [customNumero, setCustomNumero] = useState<string>('Villa 01');
  const [customNom, setCustomNom] = useState<string>('Logement Principal');

  // ==========================================
  // IMAGE DU LOGEMENT (PAS OBLIGATOIRE)
  // ==========================================
  const [photo, setPhoto] = useState<string>('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ==========================================
  // GÉNÉRATION DES APPELLATIONS (A100 à A109, etc.)
  // ==========================================
  const generatedUnits = useMemo(() => {
    if (!isImmeuble) return [];

    const currentFloorConfig = availableFloors.find(f => f.id === selectedFloorId) || availableFloors[0];
    const base = currentFloorConfig ? currentFloorConfig.baseNumber : 100;
    const isSousSol = selectedFloorId < 0;
    const isRDC = selectedFloorId === 0;

    const count = Math.min(Math.max(nombreLogementsEtage, 1), 50);
    const units = [];

    const effectivePrefix = prefixe.trim() || 'A';

    for (let i = 0; i < count; i++) {
      let code = '';
      if (isSousSol) {
        // Ex: SS100, SS101... ou A-SS100
        code = `${effectivePrefix}SS${base + i}`;
      } else if (isRDC) {
        // Ex: A000, A001... A009
        code = `${effectivePrefix}00${i}`;
      } else {
        // Ex: Étage 1 -> A100, A101, ... A109
        // Étage 2 -> A200, A201, ... A209
        // Étage 3 -> A300, A301, ... A309
        code = `${effectivePrefix}${base + i}`;
      }

      const typeLabel = 
        logementType === 'appartement' ? 'Appartement' :
        logementType === 'studio' ? 'Studio' :
        logementType === 'chambre' ? 'Chambre' :
        logementType === 'magasin' ? 'Magasin' :
        logementType === 'bureau' ? 'Bureau' : 'Logement';

      const unitNom = `${code} (${nombrePieces} pièce${nombrePieces > 1 ? 's' : ''})`;

      units.push({
        numero: code,
        nom: unitNom,
        type: logementType,
        nombre_pieces: nombrePieces,
        prefixe: effectivePrefix,
        etage: selectedFloorId,
        superficie,
        loyer_reference: loyerReference,
        charges_incluses: chargesIncluses,
        statut,
        description: description.trim(),
        photo: photo.trim() || undefined
      });
    }

    return units;
  }, [
    isImmeuble,
    availableFloors,
    selectedFloorId,
    nombreLogementsEtage,
    prefixe,
    logementType,
    nombrePieces,
    superficie,
    loyerReference,
    chargesIncluses,
    statut,
    description,
    photo
  ]);

  if (!isOpen) return null;

  // File upload handler for housing image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("L'image est trop volumineuse (maximum 5 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhoto(reader.result);
        setCustomPhotoUrl('');
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedBien) {
      setErrorMessage("Veuillez d'abord sélectionner ou créer un Bien parent.");
      return;
    }

    if (isImmeuble) {
      if (generatedUnits.length === 0) {
        setErrorMessage("Aucun logement n'a pu être généré. Vérifiez le nombre de logements.");
        return;
      }

      if (generatedUnits.length === 1) {
        const u = generatedUnits[0];
        addPiece({
          logement_id: selectedBien.id,
          numero: u.numero,
          nom: u.nom,
          type: u.type,
          nombre_pieces: u.nombre_pieces,
          prefixe: u.prefixe,
          superficie: u.superficie,
          etage: u.etage,
          loyer_reference: u.loyer_reference,
          charges_incluses: u.charges_incluses,
          statut: u.statut,
          description: u.description,
          photo: u.photo,
          current_locataire_id: null
        });
      } else {
        addMultiplePieces(
          generatedUnits.map(u => ({
            logement_id: selectedBien.id,
            numero: u.numero,
            nom: u.nom,
            type: u.type,
            nombre_pieces: u.nombre_pieces,
            prefixe: u.prefixe,
            superficie: u.superficie,
            etage: u.etage,
            loyer_reference: u.loyer_reference,
            charges_incluses: u.charges_incluses,
            statut: u.statut,
            description: u.description,
            photo: u.photo,
            current_locataire_id: null
          }))
        );
      }
    } else {
      // Non-immeuble (villa, duplex, etc.)
      if (!customNumero.trim() || !customNom.trim()) {
        setErrorMessage("Veuillez renseigner le numéro et le nom du logement.");
        return;
      }

      addPiece({
        logement_id: selectedBien.id,
        numero: customNumero.trim(),
        nom: customNom.trim(),
        type: logementType,
        nombre_pieces: nombrePieces,
        superficie,
        etage: 0,
        loyer_reference: loyerReference,
        charges_incluses: chargesIncluses,
        statut,
        description: description.trim(),
        photo: photo.trim() || undefined,
        current_locataire_id: null
      });
    }

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      // silent
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Création de Logement</h3>
              <p className="text-[11px] text-slate-400">
                Générez des logements par étage avec appellations automatiques
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10 cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <form id="new-piece-form" onSubmit={handleSubmit} className="space-y-4">

            {/* ========================================================= */}
            {/* 1- SÉLECTION DU BIEN PARENT                                */}
            {/* ========================================================= */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1 · Sélection du Bien Immobilier <span className="text-red-500">*</span>
              </label>
              
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={selectedBienId}
                  onChange={(e) => {
                    setSelectedBienId(e.target.value);
                    setSelectedFloorId(1); // Réinitialiser sur Étage 1
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
                  required
                >
                  {logements.map((bien) => (
                    <option key={bien.id} value={bien.id}>
                      {bien.nom} — ({bien.type.toUpperCase()}) à {bien.ville}
                    </option>
                  ))}
                </select>
              </div>

              {/* État du Bien sélectionné */}
              {selectedBien && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                      {selectedBien.type}
                    </span>
                    <span className="text-slate-600 truncate max-w-xs">
                      {selectedBien.adresse}, {selectedBien.ville}
                    </span>
                  </div>

                  {isImmeuble ? (
                    <span className="text-[11px] font-bold text-indigo-900 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                      🏢 R+{selectedBien.nombre_etages || 1}
                      {selectedBien.a_sous_sol ? ` • ${selectedBien.nombre_sous_sols || 1} sous-sol(s)` : ' • Sans sous-sol'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      Bien individuel / Concession
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* SI IMMEUBLE : FLUX SPÉCIFIQUE AUTOMATISÉ                  */}
            {/* ========================================================= */}
            {isImmeuble ? (
              <div className="space-y-4">
                
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">
                      Bien sélectionné : Immeuble avec étages configurés
                    </span>
                    <span className="text-[11px] text-indigo-700">
                      Remplissez l'étage pour générer les appellations en série (A100 à A109...)
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-white text-indigo-800 rounded font-bold text-[11px] border border-indigo-200 shrink-0">
                    Série Automatique ✨
                  </span>
                </div>

                {/* Champ 1 : Étage (Prioritaire, mention Étage 1 par défaut) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Étage du bien <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedFloorId}
                    onChange={(e) => setSelectedFloorId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs sm:text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
                  >
                    {availableFloors.map((floor) => (
                      <option key={floor.id} value={floor.id}>
                        {floor.label} (Base {floor.baseNumber})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Étage 1 sélectionné par défaut. Les appellations démarreront à {availableFloors.find(f => f.id === selectedFloorId)?.baseNumber || 100}.
                  </p>
                </div>

                {/* Ligne 2 : Type de logement & Nombre de pièces */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Type de logement <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={logementType}
                      onChange={(e) => setLogementType(e.target.value as PieceType)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="appartement">Appartement</option>
                      <option value="chambre">Chambre</option>
                      <option value="studio">Studio</option>
                      <option value="magasin">Magasin</option>
                      <option value="bureau">Bureau</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nombre de pièces dans le logement <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={nombrePieces}
                      onChange={(e) => setNombrePieces(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="1">1 pièce (Studio / Pièce unique)</option>
                      <option value="2">2 pièces (1 Chambre + Salon)</option>
                      <option value="3">3 pièces (2 Chambres + Salon)</option>
                      <option value="4">4 pièces (3 Chambres + Salon)</option>
                      <option value="5">5 pièces et +</option>
                    </select>
                  </div>
                </div>

                {/* Ligne 3 : Préfixe & Nombre de logements dans l'étage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Préfixe du logement <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={prefixe}
                      onChange={(e) => setPrefixe(e.target.value.toUpperCase())}
                      placeholder="Ex: A, B, LOG, APT"
                      maxLength={6}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 uppercase focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Lettre ou code servant de base au numéro (ex: "A")
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nombre de logements dans l'étage <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max="50"
                      value={nombreLogementsEtage}
                      onChange={(e) => setNombreLogementsEtage(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Ex: 10 (générera de {prefixe.trim() || 'A'}100 à {prefixe.trim() || 'A'}109)
                    </p>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* APERÇU EN DIRECT DE LA GÉNÉRATION DES APPELLATIONS        */}
                {/* Format exact demandé : A100 à A109 selon le nombre       */}
                {/* ========================================================= */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Génération des appellations :</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                      {generatedUnits.length} logement{generatedUnits.length > 1 ? 's' : ''} calculé{generatedUnits.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Résumé de plage */}
                  {generatedUnits.length > 0 && (
                    <p className="text-xs font-semibold text-emerald-900">
                      Série générée : <span className="font-extrabold text-emerald-950 bg-emerald-100/80 px-2 py-0.5 rounded">{generatedUnits[0]?.numero} à {generatedUnits[generatedUnits.length - 1]?.numero}</span> ({selectedFloorId === 0 ? 'Rez-de-chaussée' : selectedFloorId < 0 ? `Sous-sol ${selectedFloorId}` : `Niveau Étage ${selectedFloorId}`})
                    </p>
                  )}

                  {/* Badges horizontaux avec défilement fluide */}
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white/70 rounded-lg border border-emerald-200/60">
                    {generatedUnits.map((u, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-white text-emerald-900 border border-emerald-300 rounded text-xs font-bold shadow-2xs"
                      >
                        {u.numero}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              /* ========================================================= */
              /* BIEN NON-IMMEUBLE (VILLA, DUPLEX, BOUTIQUE...)            */
              /* ========================================================= */
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-800 block">
                  Configuration du Logement (Bien individuel)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Type de logement :
                    </label>
                    <select
                      value={logementType}
                      onChange={(e) => setLogementType(e.target.value as PieceType)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="appartement">Appartement</option>
                      <option value="chambre">Chambre</option>
                      <option value="studio">Studio</option>
                      <option value="magasin">Magasin</option>
                      <option value="bureau">Bureau</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre de pièces :
                    </label>
                    <select
                      value={nombrePieces}
                      onChange={(e) => setNombrePieces(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="1">1 pièce</option>
                      <option value="2">2 pièces</option>
                      <option value="3">3 pièces</option>
                      <option value="4">4 pièces</option>
                      <option value="5">5 pièces et +</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Numéro / Code de porte <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={customNumero}
                      onChange={(e) => setCustomNumero(e.target.value)}
                      placeholder="Ex: Villa 01, Porte Principale"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Désignation / Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={customNom}
                      onChange={(e) => setCustomNom(e.target.value)}
                      placeholder="Ex: Villa Familiale 4 Pièces"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* CARACTÉRISTIQUES COMMUNES : LOYER, CHARGES, SURFACE       */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Loyer mensuel (FCFA) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number"
                  step="5000"
                  min="5000"
                  value={loyerReference}
                  onChange={(e) => setLoyerReference(parseInt(e.target.value) || 50000)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Charges incluses (FCFA)
                </label>
                <input 
                  type="number"
                  step="1000"
                  min="0"
                  value={chargesIncluses}
                  onChange={(e) => setChargesIncluses(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Superficie par lot (m²)
                </label>
                <input 
                  type="number"
                  min="5"
                  value={superficie}
                  onChange={(e) => setSuperficie(parseInt(e.target.value) || 20)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Statut initial */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Statut initial de disponibilité :
              </label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as PieceStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="libre">Libre / Disponible à la location</option>
                <option value="reservee">Réservée (Acompte versé)</option>
                <option value="en_travaux">En travaux / Rénovation</option>
              </select>
            </div>

            {/* ========================================================= */}
            {/* IMAGE DU LOGEMENT (PAS OBLIGATOIRE)                       */}
            {/* ========================================================= */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <label className="text-xs font-bold text-slate-800">
                      Photo ou Illustration du Logement
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Optionnelle — Vous pouvez associer une photo du logement ou laisser vide
                  </span>
                </div>

                {photo && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto('');
                      setCustomPhotoUrl('');
                    }}
                    className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer px-2 py-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Retirer</span>
                  </button>
                )}
              </div>

              {/* Aperçu si image sélectionnée */}
              {photo ? (
                <div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-300 bg-slate-200 group">
                  <img 
                    src={photo} 
                    alt="Aperçu du logement" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Changer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 border border-dashed border-slate-300 rounded-xl text-center bg-white">
                  <p className="text-xs text-slate-500">
                    Aucune photo associée <span className="text-slate-400 font-normal">(pas obligatoire)</span>
                  </p>
                </div>
              )}

              {/* Boutons d'action pour téléverser ou saisir URL */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Téléverser depuis l'appareil</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <span>Lien URL d'image</span>
                </button>
              </div>

              {/* Saisie URL directe */}
              {showUrlInput && (
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="url"
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customPhotoUrl.trim()) {
                        setPhoto(customPhotoUrl.trim());
                        setShowUrlInput(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                  >
                    Valider
                  </button>
                </div>
              )}

              {/* Suggestions rapides */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Ou choisir une photo type suggérée :
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {LOGEMENT_PHOTO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhoto(preset.url)}
                      className={`relative h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        photo === preset.url ? 'border-indigo-600 ring-2 ring-indigo-600/30' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt="" className="w-full h-full object-cover" />
                      {photo === preset.url && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description / Remarques */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Remarques particulières :
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Finitions modernes, placard intégré, prise climatiseur..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {isImmeuble ? (
              <span>
                Total à créer : <strong className="text-slate-800">{generatedUnits.length} logement{generatedUnits.length > 1 ? 's' : ''}</strong>
              </span>
            ) : (
              <span>1 logement individuel</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button 
              type="submit"
              form="new-piece-form"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isImmeuble 
                  ? (generatedUnits.length > 1 
                      ? `Générer les ${generatedUnits.length} Logements` 
                      : 'Créer le Logement')
                  : 'Créer le Logement'
                }
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

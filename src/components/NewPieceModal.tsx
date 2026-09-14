import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  Home,
  Hash
} from 'lucide-react';
import { formatFCFA } from '../utils/formatters';
import confetti from 'canvas-confetti';

interface NewPieceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLogementId?: string;
}

interface ConfiguredLevel {
  id: string;
  etage: number;
  logementType: PieceType;
  nombrePieces: number;
  prefixe: string;
  premierNumero: number;
  nombreLogements: number;
  loyerReference: number;
  chargesIncluses: number;
  superficie: number;
  statut: PieceStatus;
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

    // Rez-de-chaussée (RDC) : pris en compte si le bien contient des logements au RDC
    if (selectedBien.a_logements_rdc !== false) {
      floors.push({ id: 0, label: 'Rez-de-chaussée (RDC)', baseNumber: 1 });
    }

    // Étages supérieurs (Étage 1, 2, 3...)
    const maxFloors = selectedBien.nombre_etages || 3;
    for (let f = 1; f <= maxFloors; f++) {
      floors.push({ id: f, label: `Étage ${f}`, baseNumber: f * 100 });
    }

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
  // CONFIGURATION DES NIVEAUX (POUR IMMEUBLE)
  // ==========================================
  const [levels, setLevels] = useState<ConfiguredLevel[]>([
    {
      id: '1',
      etage: 1,
      logementType: 'appartement',
      nombrePieces: 3,
      prefixe: 'A',
      premierNumero: 100,
      nombreLogements: 10,
      loyerReference: 180000,
      chargesIncluses: 15000,
      superficie: 55,
      statut: 'libre'
    }
  ]);

  // Réinitialiser les niveaux lorsque le bien sélectionné change
  useEffect(() => {
    if (isImmeuble && availableFloors.length > 0) {
      // Priorité au RDC si présent, sinon Étage 1
      const initialFloor = availableFloors.find(f => f.id === 0) || availableFloors.find(f => f.id === 1) || availableFloors[0];
      setLevels([
        {
          id: Math.random().toString(36).substring(2, 9),
          etage: initialFloor.id,
          logementType: 'appartement',
          nombrePieces: 3,
          prefixe: initialFloor.id === 0 ? 'RDC' : 'A',
          premierNumero: initialFloor.baseNumber || (initialFloor.id === 0 ? 1 : 100),
          nombreLogements: 6,
          loyerReference: 180000,
          chargesIncluses: 15000,
          superficie: 55,
          statut: 'libre'
        }
      ]);
    }
  }, [selectedBienId, isImmeuble, availableFloors]);

  // Niveaux d'étage restants à configurer pour cet immeuble
  const remainingFloors = useMemo(() => {
    const usedFloorIds = levels.map(l => l.etage);
    return availableFloors.filter(f => !usedFloorIds.includes(f.id));
  }, [availableFloors, levels]);

  // Action : Ajouter un nouveau niveau
  const handleAddLevel = () => {
    if (remainingFloors.length === 0) return;

    const nextFloor = remainingFloors[0];
    const previousLevel = levels[levels.length - 1];

    let defaultFirstNum = nextFloor.baseNumber;
    if (nextFloor.id > 0) {
      defaultFirstNum = nextFloor.id * 100;
    } else if (nextFloor.id === 0) {
      defaultFirstNum = 1;
    } else {
      defaultFirstNum = Math.abs(nextFloor.id) * 100;
    }

    const newLevel: ConfiguredLevel = {
      id: Math.random().toString(36).substring(2, 9),
      etage: nextFloor.id,
      logementType: previousLevel ? previousLevel.logementType : 'appartement',
      nombrePieces: previousLevel ? previousLevel.nombrePieces : 3,
      prefixe: previousLevel ? previousLevel.prefixe : 'A',
      premierNumero: defaultFirstNum,
      nombreLogements: previousLevel ? previousLevel.nombreLogements : 10,
      loyerReference: previousLevel ? previousLevel.loyerReference : 180000,
      chargesIncluses: previousLevel ? previousLevel.chargesIncluses : 15000,
      superficie: previousLevel ? previousLevel.superficie : 55,
      statut: previousLevel ? previousLevel.statut : 'libre'
    };

    setLevels(prev => [...prev, newLevel]);
  };

  // Action : Supprimer un niveau configuré
  const handleRemoveLevel = (levelId: string) => {
    if (levels.length <= 1) return;
    setLevels(prev => prev.filter(l => l.id !== levelId));
  };

  // Action : Mettre à jour les propriétés d'un niveau
  const handleUpdateLevel = (levelId: string, updates: Partial<ConfiguredLevel>) => {
    setLevels(prev => prev.map(l => {
      if (l.id !== levelId) return l;
      return { ...l, ...updates };
    }));
  };

  // ==========================================
  // CHAMPS POUR BIEN NON-IMMEUBLE (VILLA, etc.)
  // ==========================================
  const [customNumero, setCustomNumero] = useState<string>('Villa 01');
  const [customNom, setCustomNom] = useState<string>('Logement Principal');
  const [villaType, setVillaType] = useState<PieceType>('appartement');
  const [villaPieces, setVillaPieces] = useState<number>(4);
  const [villaLoyer, setVillaLoyer] = useState<number>(350000);
  const [villaCharges, setVillaCharges] = useState<number>(20000);
  const [villaSuperficie, setVillaSuperficie] = useState<number>(120);
  const [villaStatut, setVillaStatut] = useState<PieceStatus>('libre');

  // ==========================================
  // IMAGE & DESCRIPTION DU LOGEMENT
  // ==========================================
  const [photo, setPhoto] = useState<string>('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState<string>('Logement avec compteur individuel et finitions soignées.');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ==========================================
  // CALCUL DES LOGEMENTS GÉNÉRÉS
  // ==========================================
  const generatedUnits = useMemo(() => {
    if (!isImmeuble) return [];

    const units: Array<{
      numero: string;
      nom: string;
      type: PieceType;
      nombre_pieces: number;
      prefixe: string;
      etage: number;
      superficie: number;
      loyer_reference: number;
      charges_incluses: number;
      statut: PieceStatus;
      description: string;
      photo?: string;
    }> = [];

    levels.forEach((level) => {
      const floorConfig = availableFloors.find(f => f.id === level.etage) || { label: `Étage ${level.etage}` };
      const prefix = level.prefixe.trim() || 'A';
      const count = Math.max(1, Math.min(level.nombreLogements || 1, 100));
      const startNum = level.premierNumero ?? 100;

      for (let i = 0; i < count; i++) {
        const currentNum = startNum + i;
        const code = `${prefix}${currentNum}`;
        const unitNom = `${code} (${level.nombrePieces} pièce${level.nombrePieces > 1 ? 's' : ''})`;

        units.push({
          numero: code,
          nom: unitNom,
          type: level.logementType,
          nombre_pieces: level.nombrePieces,
          prefixe: prefix,
          etage: level.etage,
          superficie: level.superficie,
          loyer_reference: level.loyerReference,
          charges_incluses: level.chargesIncluses,
          statut: level.statut,
          description: description.trim() || (level.etage === 0 ? 'Logement situé au Rez-de-chaussée (RDC).' : level.etage < 0 ? `Logement situé au niveau Sous-sol ${level.etage}.` : `Logement situé à l'Étage ${level.etage}.`),
          photo: photo.trim() || undefined
        });
      }
    });

    return units;
  }, [isImmeuble, levels, availableFloors, description, photo]);

  // Détection des doublons d'appellation entre niveaux
  const duplicateNumbers = useMemo(() => {
    if (!isImmeuble) return [];
    const counts: Record<string, number> = {};
    generatedUnits.forEach(u => {
      counts[u.numero] = (counts[u.numero] || 0) + 1;
    });
    return Object.keys(counts).filter(k => counts[k] > 1);
  }, [isImmeuble, generatedUnits]);

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
        setErrorMessage("Aucun logement n'a pu être généré. Vérifiez la configuration des niveaux.");
        return;
      }

      if (duplicateNumbers.length > 0) {
        setErrorMessage(
          `Certains numéros de logement sont en doublon (${duplicateNumbers.slice(0, 3).join(', ')}...). Veuillez ajuster la lettre d'appellation ou le premier numéro d'un des niveaux.`
        );
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
        type: villaType,
        nombre_pieces: villaPieces,
        superficie: villaSuperficie,
        etage: 0,
        loyer_reference: villaLoyer,
        charges_incluses: villaCharges,
        statut: villaStatut,
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
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Création de Logements</h3>
              <p className="text-[11px] text-slate-400">
                Configurez les niveaux d'étage et générez les numérotations d'appellation
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
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
                  onChange={(e) => setSelectedBienId(e.target.value)}
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
                      {selectedBien.a_logements_rdc !== false ? ' • RDC avec logements' : ' • RDC sans logements'}
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
            {/* SI IMMEUBLE : GESTION DES NIVEAUX ET NUMÉROTATION         */}
            {/* ========================================================= */}
            {isImmeuble ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      2 · Niveaux d'étage et Appellations ({levels.length} niveau{levels.length > 1 ? 'x' : ''} configuré{levels.length > 1 ? 's' : ''})
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {availableFloors.length} niveau{availableFloors.length > 1 ? 'x' : ''} au total dans l'immeuble
                  </span>
                </div>

                {/* Avertissement si doublons de numéros */}
                {duplicateNumbers.length > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Attention : Le(s) numéro(s) <strong>{duplicateNumbers.join(', ')}</strong> apparaisse(nt) sur plusieurs niveaux. Modifiez la lettre de préfixe ou le premier numéro pour les différencier.
                    </span>
                  </div>
                )}

                {/* LISTE DES NIVEAUX CONFIGURÉS */}
                <div className="space-y-3">
                  {levels.map((lvl, index) => {
                    const floorObj = availableFloors.find(f => f.id === lvl.etage);
                    const premierNum = lvl.premierNumero ?? 100;
                    const nbLots = lvl.nombreLogements || 1;
                    const dernierNum = premierNum + nbLots - 1;
                    const prefixeAffiche = lvl.prefixe.trim() || 'A';
                    const appellationDebut = `${prefixeAffiche}${premierNum}`;
                    const appellationFin = `${prefixeAffiche}${dernierNum}`;

                    return (
                      <div 
                        key={lvl.id}
                        className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3 relative hover:border-indigo-300 transition-colors"
                      >
                        {/* En-tête du niveau */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[11px] font-bold">
                              Niveau {index + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {floorObj ? floorObj.label : `Étage ${lvl.etage}`}
                            </span>
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md text-[11px] font-extrabold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              Appellations : {appellationDebut} à {appellationFin} ({nbLots} {lvl.logementType}{nbLots > 1 ? 's' : ''})
                            </span>
                          </div>

                          {/* Bouton supprimer ce niveau si plus d'un niveau */}
                          {levels.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLevel(lvl.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Supprimer ce niveau"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Ligne 1 : Choix de l'Étage, Type de logement et Nombre de pièces */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Étage de l'immeuble <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={lvl.etage}
                              onChange={(e) => {
                                const newEtageId = parseInt(e.target.value);
                                const selectedFl = availableFloors.find(f => f.id === newEtageId);
                                const newBase = selectedFl 
                                  ? (selectedFl.id > 0 ? selectedFl.id * 100 : selectedFl.id === 0 ? 1 : Math.abs(selectedFl.id) * 100)
                                  : 100;
                                handleUpdateLevel(lvl.id, { 
                                  etage: newEtageId,
                                  premierNumero: newBase
                                });
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                            >
                              {availableFloors.map((fl) => {
                                const isAlreadyAssigned = levels.some(other => other.id !== lvl.id && other.etage === fl.id);
                                return (
                                  <option key={fl.id} value={fl.id}>
                                    {fl.label} {isAlreadyAssigned ? '(déjà ajouté)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Type de logement <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={lvl.logementType}
                              onChange={(e) => handleUpdateLevel(lvl.id, { logementType: e.target.value as PieceType })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                            >
                              <option value="appartement">Appartement</option>
                              <option value="studio">Studio</option>
                              <option value="chambre">Chambre</option>
                              <option value="magasin">Magasin</option>
                              <option value="bureau">Bureau</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Nombre de pièces <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={lvl.nombrePieces}
                              onChange={(e) => handleUpdateLevel(lvl.id, { nombrePieces: parseInt(e.target.value) || 1 })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                            >
                              <option value="1">1 pièce (Studio / Pièce unique)</option>
                              <option value="2">2 pièces (1 Chambre + Salon)</option>
                              <option value="3">3 pièces (2 Chambres + Salon)</option>
                              <option value="4">4 pièces (3 Chambres + Salon)</option>
                              <option value="5">5 pièces et +</option>
                            </select>
                          </div>
                        </div>

                        {/* Ligne 2 : Numérotation & Appellation (Lettre, Premier numéro, Nombre de logements, Dernier numéro calculé) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Lettre d'appellation <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="text"
                              value={lvl.prefixe}
                              onChange={(e) => handleUpdateLevel(lvl.id, { prefixe: e.target.value.toUpperCase() })}
                              placeholder="Ex: A"
                              maxLength={6}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 uppercase focus:outline-none focus:border-indigo-600"
                              required
                            />
                            <span className="text-[9px] text-slate-400 block mt-0.5">Ex: A, B, APT</span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Premier chiffre d'appellation <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="number"
                              min="0"
                              value={lvl.premierNumero}
                              onChange={(e) => handleUpdateLevel(lvl.id, { premierNumero: Math.max(0, parseInt(e.target.value) || 0) })}
                              placeholder="Ex: 100"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-indigo-900 focus:outline-none focus:border-indigo-600"
                              required
                            />
                            <span className="text-[9px] text-slate-400 block mt-0.5">Numéro de départ (ex: 100)</span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Nombre de logements <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="number"
                              min="1"
                              max="100"
                              value={lvl.nombreLogements}
                              onChange={(e) => handleUpdateLevel(lvl.id, { nombreLogements: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                              required
                            />
                            <span className="text-[9px] text-slate-400 block mt-0.5">Total de ce type</span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-emerald-800 mb-0.5 flex items-center justify-between">
                              <span>Dernier numéro</span>
                              <span className="text-[9px] font-normal text-emerald-600">Auto ✨</span>
                            </label>
                            <input 
                              type="text"
                              value={dernierNum}
                              readOnly
                              disabled
                              className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-extrabold text-emerald-900 cursor-not-allowed"
                            />
                            <span className="text-[9px] text-emerald-700 font-medium block mt-0.5">
                              Fin : {appellationFin}
                            </span>
                          </div>
                        </div>

                        {/* Ligne 3 : Loyer, charges et superficie de ce niveau */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Loyer mensuel (FCFA) <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="number"
                              step="5000"
                              min="5000"
                              value={lvl.loyerReference}
                              onChange={(e) => handleUpdateLevel(lvl.id, { loyerReference: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800 focus:outline-none focus:border-indigo-600"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Charges incluses (FCFA)
                            </label>
                            <input 
                              type="number"
                              step="1000"
                              min="0"
                              value={lvl.chargesIncluses}
                              onChange={(e) => handleUpdateLevel(lvl.id, { chargesIncluses: Math.max(0, parseInt(e.target.value) || 0) })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Superficie par logement (m²)
                            </label>
                            <input 
                              type="number"
                              min="5"
                              value={lvl.superficie}
                              onChange={(e) => handleUpdateLevel(lvl.id, { superficie: Math.max(5, parseInt(e.target.value) || 20) })}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* BOUTON "+ AJOUTER UN NIVEAU" */}
                <div className="pt-1">
                  {remainingFloors.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleAddLevel}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-dashed border-indigo-300 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <span>+ Ajouter un niveau ({remainingFloors.length} niveau{remainingFloors.length > 1 ? 'x' : ''} restant{remainingFloors.length > 1 ? 's' : ''})</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tous les niveaux d'étage de cet immeuble ({availableFloors.length} niveaux) ont été configurés.</span>
                    </div>
                  )}
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
                      value={villaType}
                      onChange={(e) => setVillaType(e.target.value as PieceType)}
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
                      value={villaPieces}
                      onChange={(e) => setVillaPieces(parseInt(e.target.value) || 1)}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Loyer mensuel (FCFA) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number"
                      step="5000"
                      min="5000"
                      value={villaLoyer}
                      onChange={(e) => setVillaLoyer(parseInt(e.target.value) || 50000)}
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
                      value={villaCharges}
                      onChange={(e) => setVillaCharges(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Superficie (m²)
                    </label>
                    <input 
                      type="number"
                      min="5"
                      value={villaSuperficie}
                      onChange={(e) => setVillaSuperficie(parseInt(e.target.value) || 20)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* IMAGE DU LOGEMENT (OPTIONNELLE)                           */}
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
                Total à créer : <strong className="text-indigo-900 font-bold">{generatedUnits.length} logement{generatedUnits.length > 1 ? 's' : ''}</strong> sur <strong className="text-slate-800">{levels.length} niveau{levels.length > 1 ? 'x' : ''}</strong>
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
              disabled={isImmeuble && duplicateNumbers.length > 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                isImmeuble && duplicateNumbers.length > 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {isImmeuble 
                  ? (generatedUnits.length > 1 
                      ? `Créer les ${generatedUnits.length} Logements` 
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

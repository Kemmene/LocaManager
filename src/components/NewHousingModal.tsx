import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { HousingType, HousingStatus } from '../types';
import { 
  X, 
  Building2, 
  MapPin, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Crown, 
  Plus, 
  Upload,
  Trash2,
  Sparkles, 
  Layers,
  CreditCard, 
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewHousingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'single' | 'batch';
}

const REAL_ESTATE_PRESETS = [
  {
    label: 'Immeuble Moderne R+3',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
    type: 'immeuble' as HousingType
  },
  {
    label: 'Villa avec Jardin',
    url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
    type: 'villa' as HousingType
  },
  {
    label: 'Résidence Appartements',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
    type: 'studio_residence' as HousingType
  },
  {
    label: 'Duplex Haut Standing',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    type: 'maison' as HousingType
  },
  {
    label: 'Centre Commercial / Bureaux',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    type: 'commercial' as HousingType
  }
];

const CAMEROON_CITIES = [
  'Douala',
  'Yaoundé',
  'Bafoussam',
  'Kribi',
  'Garoua',
  'Limbe',
  'Bamenda',
  'Buea',
  'Bertoua',
  'Ngaoundéré',
  'Ebolowa',
  'Maroua'
];

const COUNTRIES_LIST = [
  'Cameroun',
  'Côte d\'Ivoire',
  'Sénégal',
  'Gabon',
  'Congo',
  'RDC',
  'Togo',
  'Bénin',
  'Guinée',
  'Mali',
  'Burkina Faso',
  'Niger',
  'Tchad',
  'Centrafrique',
  'Guinée Équatoriale',
  'France'
];

export const NewHousingModal: React.FC<NewHousingModalProps> = ({ 
  isOpen, 
  onClose,
  initialMode = 'single'
}) => {
  const { 
    addLogement, 
    currentUser, 
    currentUserSubscription, 
    isCurrentUserSubscriptionExpired, 
    currentUserPlan,
    setIsPlanModalOpen,
    logements
  } = useApp();

  // Basic Property Fields
  const [nom, setNom] = useState('');
  const [type, setType] = useState<HousingType>('immeuble');
  const [pays, setPays] = useState('Cameroun');
  const [ville, setVille] = useState(currentUser.ville || 'Douala');
  const [adresse, setAdresse] = useState('');
  const [description, setDescription] = useState('');

  // Immeuble specific fields: Floors, Ground floor with housing, and Basements
  const [nombreEtages, setNombreEtages] = useState<number>(3);
  const [aLogementsRdc, setALogementsRdc] = useState<boolean>(true);
  const [hasSousSol, setHasSousSol] = useState<boolean>(false);
  const [nombreSousSols, setNombreSousSols] = useState<number>(1);

  // Image Upload / Selection (Optional)
  const [photo, setPhoto] = useState<string>(REAL_ESTATE_PRESETS[0].url);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate pieces/apartments
  const [generateInitialPieces, setGenerateInitialPieces] = useState(false);
  const [initialPiecesCount, setInitialPiecesCount] = useState(4);
  const [initialBaseRent, setInitialBaseRent] = useState(120000);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate days remaining on subscription
  let daysRemaining = 0;
  if (currentUserSubscription?.date_expiration) {
    const expDate = new Date(currentUserSubscription.date_expiration);
    const today = new Date();
    daysRemaining = Math.max(0, Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // File upload handler
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

  // Submit Bien
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isCurrentUserSubscriptionExpired) {
      setErrorMessage("Votre forfait DISCOM a expiré. Veuillez renouveler votre abonnement pour pouvoir créer des biens.");
      return;
    }

    if (!nom.trim() || !adresse.trim()) {
      setErrorMessage("Veuillez renseigner au moins le nom et l'adresse du bien.");
      return;
    }

    if (type === 'immeuble' && (!nombreEtages || nombreEtages < 1)) {
      setErrorMessage("Veuillez indiquer un nombre d'étages valide pour l'immeuble (minimum 1).");
      return;
    }

    if (type === 'immeuble' && hasSousSol && (!nombreSousSols || nombreSousSols < 1)) {
      setErrorMessage("Veuillez préciser le nombre d'étages en sous-sol (minimum 1).");
      return;
    }

    // Default photo fallback if empty
    const finalPhoto = photo.trim() || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80';

    const res = addLogement(
      {
        nom: nom.trim(),
        type,
        pays: pays.trim(),
        ville: ville.trim(),
        adresse: adresse.trim(),
        description: description.trim() || `Propriété située à ${adresse.trim()}, ${ville.trim()}${pays ? ` (${pays})` : ''}.`,
        photo: finalPhoto,
        statut: 'vide',
        nombre_etages: type === 'immeuble' ? Math.max(1, Number(nombreEtages)) : undefined,
        a_logements_rdc: type === 'immeuble' ? aLogementsRdc : undefined,
        a_sous_sol: type === 'immeuble' ? hasSousSol : undefined,
        nombre_sous_sols: (type === 'immeuble' && hasSousSol) ? Math.max(1, Number(nombreSousSols)) : undefined
      },
      generateInitialPieces ? initialPiecesCount : 0,
      initialBaseRent
    );

    if (res.success) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (err) {
        // silent
      }
      onClose();
    } else {
      setErrorMessage(res.error || "Erreur lors de la création du bien.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Ajouter un Nouveau Bien</h3>
              <p className="text-[11px] text-slate-400">
                Enregistrez votre immeuble, villa, concession ou résidence
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

        {/* Subscription Validity Bar */}
        <div className="px-5 py-2.5 border-b border-slate-200 shrink-0 bg-slate-50/50">
          {isCurrentUserSubscriptionExpired ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Forfait DISCOM Expiré</span>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Votre forfait a expiré le <span className="font-bold">{currentUserSubscription?.date_expiration || 'récemment'}</span>. Le renouvellement est requis pour créer un bien.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsPlanModalOpen(true);
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-xs shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Renouveler</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-900">
                  Forfait {currentUserPlan?.nom || 'Propriétaire'}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-700 text-[11px]">
                  {daysRemaining} jours restants
                </span>
              </div>
              <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-200 text-emerald-800 shadow-2xs shrink-0">
                {logements.filter(l => !l.is_archived).length} / {currentUserPlan?.max_logements >= 999 ? 'Illimité' : `${currentUserPlan?.max_logements || 25} max`}
              </span>
            </div>
          )}
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
          <form id="new-bien-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nom du bien */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom ou Désignation du bien <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Immeuble Le Balcon d'Or, Résidence Bonanjo, Villa Les Hibiscus"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            {/* Type & Localisation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type de bien <span className="text-red-500">*</span>
                </label>
                <select 
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value as HousingType;
                    setType(newType);
                    const matchingPreset = REAL_ESTATE_PRESETS.find(p => p.type === newType);
                    if (matchingPreset && !photo) setPhoto(matchingPreset.url);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="immeuble">🏢 Immeuble (avec étages)</option>
                  <option value="villa">🏡 Villa individuelle</option>
                  <option value="maison">🏠 Maison / Duplex</option>
                  <option value="studio_residence">🏨 Résidence / Studios</option>
                  <option value="commercial">🏬 Local commercial / Bureaux</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pays <span className="text-red-500">*</span>
                </label>
                <select
                  value={pays}
                  onChange={(e) => setPays(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  {COUNTRIES_LIST.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ville <span className="text-red-500">*</span>
                </label>
                {pays === 'Cameroun' ? (
                  <select
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    {CAMEROON_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    placeholder="Ex: Abidjan, Libreville..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                    required
                  />
                )}
              </div>
            </div>

            {/* Adresse exacte */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quartier & Adresse exacte <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Ex: Bonapriso, Rue des Palmiers, Carrefour Armée de l'Air"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
            </div>

            {/* ========================================================= */}
            {/* SPÉCIFICATION IMMEUBLE : NOMBRE D'ÉTAGES & SOUS-SOL      */}
            {/* ========================================================= */}
            {type === 'immeuble' && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3.5 transition-all animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      🏢
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                        Configuration des Étage(s) de l'Immeuble
                      </h4>
                      <p className="text-[11px] text-indigo-700">
                        Ces informations détermineront les étages disponibles lors de la création de logements
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-800 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                    R+{nombreEtages || 1}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Champ 1: Nombre d'étages */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nombre d'étages que comporte l'immeuble <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={nombreEtages}
                        onChange={(e) => setNombreEtages(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        placeholder="Ex: 3 (pour R+3)"
                        required
                      />
                      <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400 pointer-events-none">
                        Étage(s)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Ex: 3 pour un immeuble R+3 (Étages 1, 2 et 3)
                    </p>
                  </div>

                  {/* Champ 2: Sous-sol (Toggle + Nombre si oui) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Étages en sous-sol
                    </label>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-indigo-200">
                      <input 
                        type="checkbox"
                        id="has-sous-sol-check"
                        checked={hasSousSol}
                        onChange={(e) => setHasSousSol(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="has-sous-sol-check" className="text-xs font-medium text-slate-800 cursor-pointer select-none flex-1">
                        L'immeuble contient des étages en sous-sol
                      </label>
                    </div>

                    {/* Si et seulement si sous-sol coché : Préciser le nombre */}
                    {hasSousSol && (
                      <div className="pl-2 pt-1">
                        <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                          Nombre d'étages en sous-sol :
                        </label>
                        <div className="relative">
                          <input 
                            type="number"
                            min="1"
                            max="10"
                            value={nombreSousSols}
                            onChange={(e) => setNombreSousSols(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                            placeholder="Ex: 1 ou 2"
                            required={hasSousSol}
                          />
                          <span className="absolute right-3 top-1.5 text-xs text-slate-400 pointer-events-none">
                            Niveau(x)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Champ Rez-de-chaussée (RDC) : Contient-il des logements ? */}
                <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Le rez-de-chaussée contient-il des logements ? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Précisez si le rez-de-chaussée abrite des logements (appartements, studios, commerces) ou s'il s'agit uniquement de parties communes (hall, parking).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    <label 
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        aLogementsRdc 
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-1 ring-indigo-600/20' 
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="a_logements_rdc"
                        checked={aLogementsRdc}
                        onChange={() => setALogementsRdc(true)}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold block">Oui, le rez-de-chaussée a des logements</span>
                        <span className="text-[10px] text-slate-500 font-normal block mt-0.5">
                          Sera disponible et mentionné comme niveau « Rez-de-chaussée »
                        </span>
                      </div>
                    </label>

                    <label 
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        !aLogementsRdc 
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-1 ring-indigo-600/20' 
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="a_logements_rdc"
                        checked={!aLogementsRdc}
                        onChange={() => setALogementsRdc(false)}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold block">Non, aucun logement au RDC</span>
                        <span className="text-[10px] text-slate-500 font-normal block mt-0.5">
                          Hall d'entrée, parking ou locaux techniques uniquement
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Résumé de configuration en direct */}
                <div className="p-2.5 bg-white rounded-lg border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">Structure enregistrée :</span>
                  <span className="font-bold text-indigo-900">
                    {aLogementsRdc ? 'Rez-de-chaussée (avec logements)' : 'Rez-de-chaussée (sans logements - hall/parking)'} + {nombreEtages} étage{nombreEtages > 1 ? 's' : ''}
                    {hasSousSol ? ` + ${nombreSousSols} sous-sol(s)` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* IMAGE DU BIEN (PAS OBLIGATOIRE)                           */}
            {/* ========================================================= */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <label className="text-xs font-bold text-slate-800">
                      Photo ou Illustration du Bien
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Optionnelle — Vous pouvez associer une photo réelle ou la laisser vide
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
                    <span>Retirer l'image</span>
                  </button>
                )}
              </div>

              {/* Aperçu si image sélectionnée */}
              {photo ? (
                <div className="relative h-32 w-full rounded-xl overflow-hidden border border-slate-300 bg-slate-200 group">
                  <img 
                    src={photo} 
                    alt="Aperçu du bien" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Remplacer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center bg-white">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-700">Aucune photo associée</p>
                  <p className="text-[11px] text-slate-400">Une illustration par défaut sera utilisée si vous ne téléversez rien.</p>
                </div>
              )}

              {/* Boutons d'action pour choisir ou téléverser */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Input fichier caché */}
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

              {/* Champ d'URL manuelle */}
              {showUrlInput && (
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="url"
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    placeholder="Collez ici l'adresse web de l'image (https://...)"
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
                    Appliquer
                  </button>
                </div>
              )}

              {/* Suggestions rapides d'images */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Ou choisir une photo suggérée :
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {REAL_ESTATE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhoto(preset.url)}
                      className={`relative h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
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

            {/* Description & Remarques */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & Équipements généraux du bien
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Forage d'eau potable avec suppresseur, groupe électrogène de secours, gardiennage 24h/24, parking sécurisé..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button 
            type="submit"
            form="new-bien-form"
            disabled={isCurrentUserSubscriptionExpired}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer le Bien</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export type UserRole = 'bailleur' | 'superadmin' | 'locataire' | 'gerant_adjoint';

export type HousingType = 'immeuble' | 'villa' | 'maison' | 'studio_residence' | 'appartement' | 'commercial';
export type HousingStatus = 'plein' | 'partiel' | 'vide' | 'travaux';

export type PieceType = 
  | 'appartement'
  | 'chambre'
  | 'chambre_simple' 
  | 'studio' 
  | '2_pieces' 
  | '3_pieces' 
  | '4_pieces_plus' 
  | 'f2' 
  | 'f3' 
  | 'f4' 
  | 'boutique' 
  | 'bureau' 
  | 'magasin';

export type PieceStatus = 'libre' | 'occupee' | 'reservee' | 'travaux' | 'en_travaux' | 'resiliation_en_cours';

export type LeaseDurationType = 'mensuel' | '6_mois' | '1_an' | '2_ans' | 'indeterminee';
export type LeaseStatus = 'actif' | 'expire' | 'resilie' | 'renouvele';

export type PaymentStatus = 'paye' | 'impaye' | 'partiel';
export type PaymentMethod = 'especes' | 'virement' | 'mobile_money' | 'mtn_money' | 'orange_money' | 'cheque';
export type PaymentMode = PaymentMethod;
export type MobileMoneyProvider = 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | string;

export type NotificationType = 
  | 'echeance_j30' 
  | 'echeance_j7' 
  | 'echeance_j0' 
  | 'impaye_j1' 
  | 'impaye_j7' 
  | 'impaye_j15' 
  | 'paiement_loyer'
  | 'abonnement'
  | 'system' 
  | 'travaux';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phonenumber: string;
  pays: string;
  ville?: string;
  entreprise?: string;
  avatar_url?: string;
  abonnement_id?: string;
  role: UserRole;
  created_at: string;
  password?: string;
  emailVerified?: boolean;
  // Gérant Adjoint relation & permissions
  proprietaire_id?: string; // ID du propriétaire rattaché
  permissions?: {
    gestion_biens: boolean;
    gestion_logements: boolean;
    gestion_locataires: boolean;
    gestion_baux: boolean;
    enregistrement_paiements: boolean;
    generation_quittances: boolean;
    acces_rapports: boolean;
  };
  statut_compte?: 'actif' | 'inactif' | 'suspendu';
}

export interface SubscriptionPlan {
  id: string;
  nom: string;
  prix_fcfa: number;
  ca_min_fcfa: number;
  ca_max_fcfa: number;
  tranche_ca_label: string;
  gratuit_3_premiers_mois: boolean;
  max_logements: number; // max biens
  max_pieces: number; // max logements/unités
  description: string;
  features: string[];
  clauses?: string[]; // Clauses contractuelles et conditions du plan modifiables par SuperAdmin
  is_popular?: boolean;
  criteres_detail?: {
    quittances_illimitees: boolean;
    relances_whatsapp_sms: boolean;
    echeancier_auto: boolean;
    bilans_financiers: boolean;
    multi_gestionnaires: boolean;
    support_niveau: string;
    export_comptable: boolean;
    api_discom?: boolean;
  };
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  statut: 'actif' | 'expire' | 'essai';
  date_debut: string;
  date_expiration: string;
  montant_paye_fcfa: number;
  mode_paiement: string;
  auto_renew: boolean;
  duree_mois?: number;
  facture_numero?: string;
  reference_transaction?: string;
  remise_fcfa?: number;
  telephone_paiement?: string;
  is_trial_applied?: boolean;
}

/**
 * NOMENCLATURE DU SYSTÈME :
 * - Un "Bien" représente la propriété globale (Villa, Studio, Immeuble, Résidence...).
 * - Un "Logement" représente une unité/lot locatif (appartement, studio, pièce, boutique, bureau) contenu dans le Bien.
 */
export type Bien = Logement;
export type HousingUnit = Piece;
export type LotLogement = Piece;

export interface Logement {
  id: string;
  user_id: string;
  nom: string;
  adresse: string;
  ville: string;
  pays?: string;
  type: HousingType;
  photo: string;
  statut: HousingStatus;
  description?: string;
  created_at: string;
  is_archived?: boolean;
  // Propriétés spécifiques Immeuble et configuration des étages
  nombre_etages?: number;
  a_sous_sol?: boolean;
  nombre_sous_sols?: number;
}

export interface Piece {
  id: string;
  logement_id: string;
  numero: string;
  nom: string;
  type: PieceType;
  superficie: number;
  etage: number;
  equipements?: string[];
  loyer_reference: number;
  charges_incluses?: number;
  statut: PieceStatus;
  current_locataire_id?: string | null;
  description?: string;
  created_at: string;
  photo?: string;
  nombre_pieces?: number;
  prefixe?: string;
}

export interface PieceOccupationHistory {
  id: string;
  piece_id: string;
  locataire_nom: string;
  locataire_cni: string;
  date_debut: string;
  date_fin: string;
  motif_sortie: string;
  loyer_mensuel: number;
}

export type TenantPersonType = 'personne_physique' | 'personne_morale';

export interface Locataire {
  id: string;
  user_id: string; // Bailleur id
  piece_id: string;
  piece_ids?: string[]; // Multiple housing units occupied by this tenant
  logement_id: string;
  nom_complet: string;
  type_personne?: TenantPersonType;
  // Champs spécifiques Personne Morale (Entreprise)
  raison_sociale?: string;
  niu?: string; // Numéro d'Identifiant Unique
  nom_gerant?: string;
  telephone_gerant?: string;
  // Champs généraux
  nationalite?: string;
  date_naissance?: string;
  cni_passeport: string;
  profession?: string;
  employeur?: string;
  profession_employeur?: string;
  situation_familiale?: 'celibataire' | 'marie' | 'divorce' | 'veuf';
  nombre_enfants?: number;
  telephone_principal: string;
  telephone_secondaire?: string;
  email: string;
  contact_urgence_nom?: string;
  contact_urgence_telephone?: string;
  photo_url?: string;
  cni_recto_url?: string;
  cni_verso_url?: string;
  statut: 'actif' | 'resilie' | 'archive';
  created_at: string;
  // Dynamic fields
  arrieres_montant?: number;
  mois_impayes?: number;
  is_ancien?: boolean;
  arrieres_details?: string;
  date_entree_initiale?: string;
}

export interface Bail {
  id: string;
  locataire_id: string;
  piece_id: string;
  piece_ids?: string[]; // Multiple housing units covered by this lease
  logement_id: string;
  date_debut: string;
  duree_type?: LeaseDurationType;
  duree_mois: number;
  date_echeance_theorique: string;
  date_echeance_reelle: string; // Adjusted for advance months
  montant_loyer_fcfa: number;
  montant_charges_fcfa?: number;
  mois_avance: number;
  montant_avance_fcfa?: number;
  caution_versee_fcfa: number;
  montant_caution_fcfa?: number;
  clause_renouvellement?: 'tacite_reconduction' | 'expres';
  statut: LeaseStatus;
  date_resiliation?: string;
  motif_resiliation?: string;
  etat_lieux_sortie?: string;
  solde_tout_compte?: {
    caution_initiale: number;
    retenues_reparations: number;
    loyers_impayes_deduits: number;
    montant_restitue: number;
    date_reglement: string;
    remarques: string;
  };
}

export type PaymentTypeCategory = 'standard' | 'tranche' | 'multi_mois';

export interface Paiement {
  id: string;
  bailleur_id: string;
  locataire_id: string;
  piece_id: string;
  piece_ids?: string[];
  logement_id: string;
  mois_concerne: string; // Format 'YYYY-MM'
  annee: number;
  montant_attendu: number;
  montant_recu: number;
  date_paiement: string;
  mode_paiement: PaymentMethod;
  operateur_mobile?: MobileMoneyProvider;
  statut: PaymentStatus;
  reference_recu: string;
  commentaire?: string;
  quittance_numero: string;
  date_creation: string;
  // Tranches & Paiement multiple-mois
  type_paiement?: PaymentTypeCategory;
  tranche_numero?: number;
  tranche_total_prevu?: number;
  tranche_solde_restant?: number;
  tranche_date_limite?: string;
  mois_soldes?: string[]; // e.g. ['2026-03', '2026-04', '2026-05']
  mois_soldes_labels?: string; // e.g. 'Période du 12/09/2026 au 11/12/2026'
  periode_debut?: string; // Date de début exacte comptée à partir du jour de paiement
  periode_fin?: string; // Date de fin calculée
  nb_mois_regles?: number; // Nombre de mois réglés pour ce logement
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  titre: string;
  message: string;
  date: string;
  is_read: boolean;
  canal: 'app' | 'email' | 'sms' | 'push' | 'whatsapp';
  locataire_id?: string;
  logement_id?: string;
  piece_id?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface NotificationSettings {
  echeance_j30: boolean;
  echeance_j7: boolean;
  echeance_j0: boolean;
  impaye_j1: boolean;
  impaye_j7: boolean;
  impaye_j15: boolean;
  canal_whatsapp?: boolean;
  canal_sms?: boolean;
  canal_email?: boolean;
  alerte_email: boolean;
  alerte_sms: boolean;
  alerte_push: boolean;
}

export interface MaintenanceTicket {
  id: string;
  logement_id: string;
  piece_id: string;
  locataire_id: string;
  titre: string;
  description: string;
  priorite: 'basse' | 'normale' | 'haute' | 'urgente';
  statut: 'ouvert' | 'en_cours' | 'resolu';
  date_creation: string;
  cout_estime_fcfa?: number;
}

export type ActiviteGerantType = 
  | 'enregistrement_paiement' 
  | 'generation_quittance' 
  | 'attribution_logement' 
  | 'creation_bail' 
  | 'creation_locataire' 
  | 'resiliation_bail' 
  | 'connexion'
  | 'modification_acces';

export interface ActiviteGerant {
  id: string;
  gerant_id: string;
  gerant_nom: string;
  bailleur_id: string;
  action_type: ActiviteGerantType;
  titre: string;
  description: string;
  montant_fcfa?: number;
  quittance_numero?: string;
  reference?: string;
  locataire_nom?: string;
  logement_nom?: string;
  date: string;
  heure: string;
  statut: 'succes' | 'alerte' | 'info';
}


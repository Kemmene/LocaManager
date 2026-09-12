'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserAccount, 
  UserRole,
  Logement, 
  Piece, 
  PieceOccupationHistory, 
  Locataire, 
  Bail, 
  Paiement, 
  NotificationItem, 
  NotificationSettings, 
  SubscriptionPlan, 
  Subscription,
  MaintenanceTicket,
  ActiviteGerant
} from '../types';
import { 
  initialUsers, 
  initialLogements, 
  initialPieces, 
  initialOccupationHistory, 
  initialLocataires, 
  initialBaux, 
  initialPaiements, 
  initialNotifications, 
  initialNotificationSettings, 
  initialSubscriptionPlans, 
  initialSubscriptions,
  initialMaintenanceTickets,
  initialActivitesGerant
} from '../data/mockData';
import { computeLeaseExpiry, generateQuittanceNumber } from '../utils/formatters';

interface AppContextType {
  // Authentication & Role
  currentUser: UserAccount;
  allUsers: UserAccount[];
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  switchUser: (userId: string) => void;
  setUserRole: (role: UserRole) => void;
  updateUserProfile: (profileData: Partial<UserAccount>) => void;
  loginWithEmail: (email: string, password?: string) => { success: boolean; user?: UserAccount; error?: string };
  loginWithPhone: (phone: string) => { success: boolean; user?: UserAccount; error?: string };
  loginWithGoogle: (email?: string, name?: string) => { success: boolean; user: UserAccount };
  registerOwner: (data: {
    name: string;
    email: string;
    phonenumber: string;
    pays: string;
    password: string;
    entreprise?: string;
    ville?: string;
    planId: string;
    dureeMois: number;
    modePaiement: string;
    montantPaye: number;
    remise?: number;
    telephonePaiement?: string;
  }) => { success: boolean; user?: UserAccount; error?: string; subscription?: Subscription };
  addSubscriberByAdmin: (data: {
    name: string;
    email: string;
    phonenumber: string;
    entreprise?: string;
    ville?: string;
    planId: string;
    dureeMois: number;
    modePaiement?: string;
    password?: string;
  }) => { success: boolean; user?: UserAccount; subscription?: Subscription; error?: string };
  updateSubscriberByAdmin: (
    userId: string, 
    data: { 
      name?: string; 
      email?: string; 
      phonenumber?: string; 
      entreprise?: string; 
      ville?: string; 
      planId?: string; 
      statut?: 'actif' | 'expire' | 'essai'; 
      date_expiration?: string;
    }
  ) => { success: boolean; error?: string };
  deleteUser: (userId: string) => { success: boolean; message?: string; error?: string };
  logout: () => void;
  disconnectUserByAdmin: (userId: string) => { success: boolean; message?: string };
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (val: boolean) => void;
  
  // Gérants Adjoints
  gerantsAdjoints: UserAccount[];
  createGerantAdjoint: (data: {
    name: string;
    email: string;
    phonenumber: string;
    password?: string;
    permissions?: UserAccount['permissions'];
  }) => { success: boolean; user?: UserAccount; error?: string };
  updateGerantAdjoint: (id: string, updates: Partial<UserAccount>) => { success: boolean; error?: string };
  deleteGerantAdjoint: (id: string) => { success: boolean; error?: string };
  effectiveOwnerId: string;
  activitesGerant: ActiviteGerant[];
  addActiviteGerant: (act: Omit<ActiviteGerant, 'id' | 'date' | 'heure'>) => void;
  
  // Logements (Biens)
  logements: Logement[];
  addLogement: (
    logement: Omit<Logement, 'id' | 'user_id' | 'created_at'>,
    initialPiecesCount?: number,
    baseRentFCFA?: number
  ) => { success: boolean; error?: string; logement?: Logement };
  addMultipleLogements: (
    logementsList: Array<Omit<Logement, 'id' | 'user_id' | 'created_at'>>
  ) => { success: boolean; count: number; error?: string };
  updateLogement: (id: string, updates: Partial<Logement>) => void;
  archiveLogement: (id: string) => void;

  // Pieces
  pieces: Piece[];
  addPiece: (piece: Omit<Piece, 'id' | 'created_at'>) => void;
  addMultiplePieces: (pieces: Omit<Piece, 'id' | 'created_at'>[]) => void;
  updatePiece: (id: string, updates: Partial<Piece>) => void;
  deletePiece: (id: string) => void;
  occupationHistory: PieceOccupationHistory[];

  // Locataires & Baux
  locataires: Locataire[];
  baux: Bail[];
  createLocataireAndBail: (
    locataireData: Omit<Locataire, 'id' | 'user_id' | 'created_at'>,
    bailData: Omit<Bail, 'id' | 'locataire_id' | 'date_echeance_theorique' | 'date_echeance_reelle' | 'statut'>
  ) => void;
  addHousingToLocataire: (
    locataireId: string,
    logementId: string,
    pieceId: string,
    bailData: {
      date_debut: string;
      duree_mois: number;
      mois_avance: number;
      montant_loyer_fcfa: number;
      montant_charges_fcfa: number;
      montant_caution_fcfa: number;
      clause_renouvellement?: 'tacite_reconduction' | 'expres';
      piece_ids?: string[];
      usage?: string;
    }
  ) => { success: boolean; newBail?: Bail; error?: string };
  updateLocataire: (id: string, updates: Partial<Locataire>) => void;
  deleteLocataire: (id: string) => { success: boolean; error?: string };
  resilierBail: (
    bailId: string, 
    dateSortie: string, 
    motif: string, 
    etatLieux: string, 
    soldeCompte: Bail['solde_tout_compte']
  ) => void;

  // Paiements & Quittances
  paiements: Paiement[];
  selectedQuittancePaiement: Paiement | null;
  setSelectedQuittancePaiement: (p: Paiement | null) => void;
  quickTogglePayment: (locataireId: string, moisConcerne: string, montant: number) => void;
  recordPayment: (paymentData: Omit<Paiement, 'id' | 'quittance_numero' | 'date_creation'>) => void;

  // Notifications
  notifications: NotificationItem[];
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  triggerManualCronCheck: () => void;

  // SaaS Subscriptions & SuperAdmin
  subscriptionPlans: SubscriptionPlan[];
  subscriptions: Subscription[];
  currentUserSubscription: Subscription | null;
  isCurrentUserSubscriptionExpired: boolean;
  currentUserPlan: SubscriptionPlan | null;
  updateSubscriptionPlan: (planId: string, updates: Partial<SubscriptionPlan>) => void;
  addSubscriptionPlan: (plan: Omit<SubscriptionPlan, 'id'>) => void;
  upgradeSubscription: (userId: string, planId: string) => void;
  isPlanModalOpen: boolean;
  setIsPlanModalOpen: (open: boolean) => void;
  selectedPlanForCheckout: SubscriptionPlan | null;
  setSelectedPlanForCheckout: (plan: SubscriptionPlan | null) => void;
  latestSubReceipt: Subscription | null;
  setLatestSubReceipt: (sub: Subscription | null) => void;
  processSubscriptionPayment: (params: {
    planId: string;
    dureeMois: number;
    modePaiement: string;
    telephoneOuDetails: string;
    montantPaye: number;
    remise: number;
  }) => Subscription;

  // Maintenance Tickets
  maintenanceTickets: MaintenanceTicket[];
  addMaintenanceTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'date_creation'>) => void;

  // Active view navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// SSR safe storage helpers
const getStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial from localStorage or defaults
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => {
    const saved = getStorageItem('locamanager_users');
    let users = saved ? JSON.parse(saved) : initialUsers;
    // Clean up old extra landlords: keep only user_bailleur_1, its gerant adjoint, superadmin, locataires
    users = users.filter((u: UserAccount) => !['user_bailleur_2', 'user_bailleur_3', 'user_bailleur_4'].includes(u.id));
    return users;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return getStorageItem('locamanager_active_user_id') || 'user_bailleur_1';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = getStorageItem('locamanager_is_authenticated');
    return saved !== null ? saved === 'true' : true;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const currentUser = allUsers.find(u => u.id === currentUserId) || allUsers[0];

  const [logements, setLogements] = useState<Logement[]>(() => {
    const saved = getStorageItem('locamanager_logements');
    return saved ? JSON.parse(saved) : initialLogements;
  });

  const [pieces, setPieces] = useState<Piece[]>(() => {
    const saved = getStorageItem('locamanager_pieces');
    return saved ? JSON.parse(saved) : initialPieces;
  });

  const [occupationHistory, setOccupationHistory] = useState<PieceOccupationHistory[]>(() => {
    const saved = getStorageItem('locamanager_history');
    return saved ? JSON.parse(saved) : initialOccupationHistory;
  });

  const [locataires, setLocataires] = useState<Locataire[]>(() => {
    const saved = getStorageItem('locamanager_locataires');
    return saved ? JSON.parse(saved) : initialLocataires;
  });

  const [baux, setBaux] = useState<Bail[]>(() => {
    const saved = getStorageItem('locamanager_baux');
    return saved ? JSON.parse(saved) : initialBaux;
  });

  const [paiements, setPaiements] = useState<Paiement[]>(() => {
    const saved = getStorageItem('locamanager_paiements');
    return saved ? JSON.parse(saved) : initialPaiements;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = getStorageItem('locamanager_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = getStorageItem('locamanager_notif_settings');
    return saved ? JSON.parse(saved) : initialNotificationSettings;
  });

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(() => {
    const saved = getStorageItem('locamanager_plans');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 4 && parsed.some((p: any) => p.ca_min_fcfa !== undefined)) {
          return parsed;
        }
      } catch (e) {}
    }
    return initialSubscriptionPlans;
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = getStorageItem('locamanager_subs');
    let subs = saved ? JSON.parse(saved) : initialSubscriptions;
    subs = subs.filter((s: Subscription) => !['sub_2', 'sub_3', 'sub_4'].includes(s.id));
    return subs;
  });

  const [activitesGerant, setActivitesGerant] = useState<ActiviteGerant[]>(() => {
    const saved = getStorageItem('locamanager_activites_gerant');
    return saved ? JSON.parse(saved) : initialActivitesGerant;
  });

  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>(() => {
    const saved = getStorageItem('locamanager_tickets');
    return saved ? JSON.parse(saved) : initialMaintenanceTickets;
  });

  const [selectedQuittancePaiement, setSelectedQuittancePaiement] = useState<Paiement | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Subscription modal & checkout state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [latestSubReceipt, setLatestSubReceipt] = useState<Subscription | null>(null);

  // Persist state
  useEffect(() => {
    setStorageItem('locamanager_users', JSON.stringify(allUsers));
    setStorageItem('locamanager_active_user_id', currentUserId);
    setStorageItem('locamanager_logements', JSON.stringify(logements));
    setStorageItem('locamanager_pieces', JSON.stringify(pieces));
    setStorageItem('locamanager_history', JSON.stringify(occupationHistory));
    setStorageItem('locamanager_locataires', JSON.stringify(locataires));
    setStorageItem('locamanager_baux', JSON.stringify(baux));
    setStorageItem('locamanager_paiements', JSON.stringify(paiements));
    setStorageItem('locamanager_notifications', JSON.stringify(notifications));
    setStorageItem('locamanager_notif_settings', JSON.stringify(notificationSettings));
    setStorageItem('locamanager_plans', JSON.stringify(subscriptionPlans));
    setStorageItem('locamanager_subs', JSON.stringify(subscriptions));
    setStorageItem('locamanager_tickets', JSON.stringify(maintenanceTickets));
    setStorageItem('locamanager_activites_gerant', JSON.stringify(activitesGerant));
  }, [allUsers, currentUserId, logements, pieces, occupationHistory, locataires, baux, paiements, notifications, notificationSettings, subscriptionPlans, subscriptions, maintenanceTickets, activitesGerant]);

  const addActiviteGerant = (act: Omit<ActiviteGerant, 'id' | 'date' | 'heure'>) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);
    const newAct: ActiviteGerant = {
      ...act,
      id: `act_${Date.now()}`,
      date: dateStr,
      heure: timeStr
    };
    setActivitesGerant(prev => [newAct, ...prev]);
  };

  // Recalculate dynamic arrears and unpaid months for locataires
  useEffect(() => {
    const updated = locataires.map(loc => {
      // Find all payments for this tenant
      const locPaiements = paiements.filter(p => p.locataire_id === loc.id);
      const unpaidPaiements = locPaiements.filter(p => p.statut === 'impaye');
      const partialPaiements = locPaiements.filter(p => p.statut === 'partiel');

      let totalArrieres = 0;
      unpaidPaiements.forEach(p => {
        totalArrieres += (p.montant_attendu - p.montant_recu);
      });
      partialPaiements.forEach(p => {
        totalArrieres += (p.montant_attendu - p.montant_recu);
      });

      const unpaidCount = unpaidPaiements.length + (partialPaiements.length > 0 ? 0.5 : 0);

      return {
        ...loc,
        arrieres_montant: totalArrieres,
        mois_impayes: Math.ceil(unpaidCount)
      };
    });

    // Only update if changed
    const hasChanged = JSON.stringify(updated) !== JSON.stringify(locataires);
    if (hasChanged) {
      setLocataires(updated);
    }
  }, [paiements]);

  // Auth & Profile
  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    setIsAuthenticated(true);
    setStorageItem('locamanager_active_user_id', userId);
    setStorageItem('locamanager_is_authenticated', 'true');
    const targetUser = allUsers.find(u => u.id === userId);
    if (targetUser?.role === 'superadmin') {
      setActiveTab('superadmin');
    } else if (targetUser?.role === 'locataire') {
      setActiveTab('locataire_portal');
    } else {
      setActiveTab('dashboard');
    }
  };

  const loginWithEmail = (email: string, password?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return { success: false, error: 'Aucun compte associé à cette adresse email.' };
    }
    if (user.password && password && user.password !== password) {
      return { success: false, error: 'Mot de passe incorrect. Veuillez réessayer.' };
    }
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    setStorageItem('locamanager_active_user_id', user.id);
    setStorageItem('locamanager_is_authenticated', 'true');
    if (user.role === 'superadmin') {
      setActiveTab('superadmin');
    } else if (user.role === 'locataire') {
      setActiveTab('locataire_portal');
    } else {
      setActiveTab('dashboard');
    }
    return { success: true, user };
  };

  const loginWithPhone = (phone: string) => {
    const clean = phone.replace(/[\s\-\(\)\+]/g, '');
    const user = allUsers.find(u => {
      const userClean = u.phonenumber.replace(/[\s\-\(\)\+]/g, '');
      return userClean.endsWith(clean.slice(-8)) || userClean === clean;
    });
    if (!user) {
      return { success: false, error: 'Aucun compte trouvé avec ce numéro de téléphone.' };
    }
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    setStorageItem('locamanager_active_user_id', user.id);
    setStorageItem('locamanager_is_authenticated', 'true');
    if (user.role === 'superadmin') {
      setActiveTab('superadmin');
    } else if (user.role === 'locataire') {
      setActiveTab('locataire_portal');
    } else {
      setActiveTab('dashboard');
    }
    return { success: true, user };
  };

  const loginWithGoogle = (email?: string, name?: string) => {
    const targetEmail = (email || 'storetechlove@gmail.com').toLowerCase();
    let user = allUsers.find(u => u.email.toLowerCase() === targetEmail);
    if (!user) {
      // Auto-register as Owner/Bailleur with Google profile
      const newUser: UserAccount = {
        id: `user_google_${Date.now()}`,
        name: name || 'Propriétaire Google',
        email: targetEmail,
        phonenumber: '+237 699 11 22 33',
        pays: 'Cameroun',
        ville: 'Douala',
        entreprise: 'Gestion Foncière',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        abonnement_id: 'plan_starter',
        role: 'bailleur',
        created_at: new Date().toISOString().split('T')[0],
        emailVerified: true
      };
      setAllUsers(prev => [newUser, ...prev]);
      user = newUser;
    }
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    setStorageItem('locamanager_active_user_id', user.id);
    setStorageItem('locamanager_is_authenticated', 'true');
    if (user.role === 'superadmin') {
      setActiveTab('superadmin');
    } else if (user.role === 'locataire') {
      setActiveTab('locataire_portal');
    } else {
      setActiveTab('dashboard');
    }
    return { success: true, user };
  };

  const registerOwner = (data: {
    name: string;
    email: string;
    phonenumber: string;
    pays: string;
    password: string;
    entreprise?: string;
    ville?: string;
    planId: string;
    dureeMois: number;
    modePaiement: string;
    montantPaye: number;
    remise?: number;
    telephonePaiement?: string;
  }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return { success: false, error: 'Un compte propriétaire existe déjà avec cet email.' };
    }

    const plan = subscriptionPlans.find(p => p.id === data.planId) || subscriptionPlans[1];
    const dureeMois = data.dureeMois || 1;
    const today = new Date();
    const expDate = new Date(today);
    expDate.setMonth(expDate.getMonth() + dureeMois);

    const todayStr = today.toISOString().split('T')[0];
    const expDateStr = expDate.toISOString().split('T')[0];
    const invoiceNum = `FACT-DISCOM-${today.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const modeLabel = data.modePaiement || 'MTN Mobile Money Cameroun';
    const prefix = modeLabel.toUpperCase().includes('ORANGE') ? 'OM' : modeLabel.toUpperCase().includes('MTN') ? 'MOMO' : 'CB';
    const txnRef = `TXN-${prefix}-${Date.now().toString().slice(-8)}`;
    const newUserId = `user_bailleur_${Date.now()}`;

    const newUser: UserAccount = {
      id: newUserId,
      name: data.name.trim(),
      email: normalizedEmail,
      phonenumber: data.phonenumber.trim(),
      pays: data.pays.trim() || 'Cameroun',
      ville: data.ville?.trim() || 'Douala',
      entreprise: data.entreprise?.trim() || `Patrimoine ${data.name.trim()}`,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      abonnement_id: data.planId,
      role: 'bailleur',
      created_at: todayStr,
      password: data.password,
      emailVerified: true
    };

    const newSubRecord: Subscription = {
      id: `sub_${Date.now()}`,
      user_id: newUserId,
      plan_id: data.planId,
      statut: 'actif',
      date_debut: todayStr,
      date_expiration: expDateStr,
      montant_paye_fcfa: data.montantPaye,
      mode_paiement: modeLabel,
      auto_renew: true,
      duree_mois: dureeMois,
      facture_numero: invoiceNum,
      reference_transaction: txnRef,
      remise_fcfa: data.remise || 0,
      telephone_paiement: data.telephonePaiement || data.phonenumber
    };

    setAllUsers(prev => [newUser, ...prev]);
    setSubscriptions(prev => [newSubRecord, ...prev]);
    setLatestSubReceipt(newSubRecord);

    // Add welcome notification
    const welcomeNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      user_id: newUserId,
      type: 'abonnement',
      titre: `Bienvenue sur DISCOM ! Formule ${plan.nom} Activée`,
      message: `Votre compte propriétaire et votre abonnement ${plan.nom} (${dureeMois} mois) ont été créés et validés avec succès jusqu'au ${expDateStr}. Facture N° ${invoiceNum}.`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      is_read: false,
      canal: 'app',
      severity: 'success'
    };
    setNotifications(prev => [welcomeNotif, ...prev]);

    // Automatically set as authenticated and active user
    setCurrentUserId(newUserId);
    setIsAuthenticated(true);
    setStorageItem('locamanager_active_user_id', newUserId);
    setStorageItem('locamanager_is_authenticated', 'true');
    setActiveTab('dashboard');

    return { 
      success: true, 
      user: newUser, 
      subscription: newSubRecord 
    };
  };

  const addSubscriberByAdmin = (data: {
    name: string;
    email: string;
    phonenumber: string;
    entreprise?: string;
    ville?: string;
    planId: string;
    dureeMois: number;
    modePaiement?: string;
    password?: string;
  }): { success: boolean; user?: UserAccount; subscription?: Subscription; error?: string } => {
    if (allUsers.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Un compte avec cette adresse email existe déjà.' };
    }

    const plan = subscriptionPlans.find(p => p.id === data.planId) || subscriptionPlans[0];
    const newUserId = `user_bailleur_${Date.now()}`;
    const newSubId = `sub_${Date.now()}`;

    const startDate = new Date();
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + (data.dureeMois || 1));

    const newUser: UserAccount = {
      id: newUserId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phonenumber: data.phonenumber.trim(),
      pays: 'Cameroun',
      ville: data.ville || 'Douala',
      role: 'bailleur',
      entreprise: data.entreprise || undefined,
      abonnement_id: plan.id,
      statut_compte: 'actif',
      avatar_url: `https://picsum.photos/seed/${newUserId}/200/200`,
      created_at: new Date().toISOString().split('T')[0]
    };

    const newSubRecord: Subscription = {
      id: newSubId,
      user_id: newUserId,
      plan_id: plan.id,
      statut: 'actif',
      date_debut: startDate.toISOString().split('T')[0],
      date_expiration: expDate.toISOString().split('T')[0],
      montant_paye_fcfa: plan.prix_fcfa * (data.dureeMois || 1),
      facture_numero: `FAC-DISCOM-${Date.now().toString().slice(-6)}`,
      mode_paiement: data.modePaiement || 'MTN Mobile Money Cameroun',
      reference_transaction: `SUB-ADMIN-${Math.floor(100000 + Math.random() * 900000)}`,
      auto_renew: false,
      is_trial_applied: false
    };

    setAllUsers(prev => [newUser, ...prev]);
    setSubscriptions(prev => [newSubRecord, ...prev]);

    return { 
      success: true, 
      user: newUser, 
      subscription: newSubRecord 
    };
  };

  const updateSubscriberByAdmin = (
    userId: string, 
    data: { 
      name?: string; 
      email?: string; 
      phonenumber?: string; 
      entreprise?: string; 
      ville?: string; 
      planId?: string; 
      statut?: 'actif' | 'expire' | 'essai'; 
      date_expiration?: string;
    }
  ): { success: boolean; error?: string } => {
    const userToUpdate = allUsers.find(u => u.id === userId);
    if (!userToUpdate) return { success: false, error: 'Abonné introuvable.' };

    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          name: data.name !== undefined ? data.name : u.name,
          email: data.email !== undefined ? data.email : u.email,
          phonenumber: data.phonenumber !== undefined ? data.phonenumber : u.phonenumber,
          entreprise: data.entreprise !== undefined ? data.entreprise : u.entreprise,
          ville: data.ville !== undefined ? data.ville : u.ville,
          abonnement_id: data.planId !== undefined ? data.planId : u.abonnement_id,
          statut_compte: data.statut === 'expire' ? 'suspendu' : 'actif'
        };
      }
      return u;
    }));

    if (data.planId || data.statut || data.date_expiration) {
      setSubscriptions(prev => prev.map(s => {
        if (s.user_id === userId) {
          return {
            ...s,
            plan_id: data.planId || s.plan_id,
            statut: data.statut || s.statut,
            date_expiration: data.date_expiration || s.date_expiration
          };
        }
        return s;
      }));
    }

    return { success: true };
  };

  const deleteUser = (userId: string): { success: boolean; message?: string; error?: string } => {
    const userToDelete = allUsers.find(u => u.id === userId);
    if (!userToDelete) {
      return { success: false, error: 'Abonné ou utilisateur introuvable.' };
    }
    if (userToDelete.role === 'superadmin') {
      return { success: false, error: 'Impossible de supprimer le compte Super Administrateur racine.' };
    }

    // 1. Remove from allUsers
    setAllUsers(prev => prev.filter(u => u.id !== userId));

    // 2. Remove all subscriptions for this user
    setSubscriptions(prev => prev.filter(s => s.user_id !== userId));

    // 3. Remove user's logements, pieces, baux and paiements if any
    const userLogementIds = logements.filter(l => l.user_id === userId).map(l => l.id);
    if (userLogementIds.length > 0) {
      setLogements(prev => prev.filter(l => l.user_id !== userId));
      setPieces(prev => prev.filter(p => !userLogementIds.includes(p.logement_id)));
      setBaux(prev => prev.filter(b => !userLogementIds.includes(b.logement_id)));
      setPaiements(prev => prev.filter(p => !userLogementIds.includes(p.logement_id)));
    }

    // 4. Remove user's notifications
    setNotifications(prev => prev.filter(n => n.user_id !== userId));

    // 5. If currently logged in as this user, fallback to superadmin
    if (currentUserId === userId) {
      const superAdminUser = allUsers.find(u => u.role === 'superadmin') || allUsers[0];
      if (superAdminUser) {
        setCurrentUserId(superAdminUser.id);
        setStorageItem('locamanager_active_user_id', superAdminUser.id);
        setActiveTab('superadmin');
      }
    }

    return { 
      success: true, 
      message: `L'abonné "${userToDelete.name}" (${userToDelete.email}) et toutes ses données associées ont été supprimés de la plateforme.` 
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setStorageItem('locamanager_is_authenticated', 'false');
  };

  const disconnectUserByAdmin = (userId: string): { success: boolean; message?: string } => {
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) return { success: false, message: 'Utilisateur introuvable' };

    // If the active user in the app is this user, disconnect them and switch to superadmin
    if (currentUserId === userId) {
      const superAdmin = allUsers.find(u => u.role === 'superadmin') || allUsers[0];
      setCurrentUserId(superAdmin.id);
      setStorageItem('locamanager_active_user_id', superAdmin.id);
      setActiveTab('superadmin');
    }
    return { 
      success: true, 
      message: `La session du propriétaire "${targetUser.name}" a été déconnectée avec succès par la Direction DISCOM.` 
    };
  };

  const effectiveOwnerId = currentUser.role === 'gerant_adjoint' 
    ? (currentUser.proprietaire_id || currentUser.id) 
    : currentUser.id;

  const gerantsAdjoints = allUsers.filter(u => u.role === 'gerant_adjoint' && u.proprietaire_id === effectiveOwnerId);

  const createGerantAdjoint = (data: {
    name: string;
    email: string;
    phonenumber: string;
    password?: string;
    permissions?: UserAccount['permissions'];
  }) => {
    // Enforce strict limit of 1 Gérant per Landlord account
    if (gerantsAdjoints.length >= 1) {
      return {
        success: false,
        error: 'Limite de 1 Gérant atteinte. Vous ne pouvez pas créer de compte supplémentaire pour ce rôle.'
      };
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return { success: false, error: 'Une personne utilise déjà cette adresse email.' };
    }

    const newGerant: UserAccount = {
      id: `user_gerant_${Date.now()}`,
      name: data.name.trim(),
      email: normalizedEmail,
      phonenumber: data.phonenumber.trim(),
      pays: currentUser.pays || 'Cameroun',
      ville: currentUser.ville || 'Douala',
      entreprise: currentUser.entreprise || `Gestion Immobilière ${currentUser.name}`,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      role: 'gerant_adjoint',
      proprietaire_id: effectiveOwnerId,
      created_at: new Date().toISOString().split('T')[0],
      password: data.password || 'password123',
      emailVerified: true,
      statut_compte: 'actif',
      permissions: data.permissions || {
        gestion_biens: true,
        gestion_logements: true,
        gestion_locataires: true,
        gestion_baux: true,
        enregistrement_paiements: true,
        generation_quittances: true,
        acces_rapports: true,
      }
    };

    setAllUsers(prev => [newGerant, ...prev]);

    // Log activity
    addActiviteGerant({
      gerant_id: newGerant.id,
      gerant_nom: newGerant.name,
      bailleur_id: effectiveOwnerId,
      action_type: 'connexion',
      titre: 'Création du compte Gérant',
      description: `Nouveau compte Gérant créé pour ${newGerant.name} (${newGerant.email}) avec parité d'accès complète.`,
      statut: 'succes'
    });

    return { success: true, user: newGerant };
  };

  const updateGerantAdjoint = (id: string, updates: Partial<UserAccount>) => {
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    return { success: true };
  };

  const deleteGerantAdjoint = (id: string) => {
    const target = allUsers.find(u => u.id === id);
    if (target) {
      addActiviteGerant({
        gerant_id: target.id,
        gerant_nom: target.name,
        bailleur_id: effectiveOwnerId,
        action_type: 'resiliation_bail',
        titre: 'Suppression du compte Gérant',
        description: `Le compte Gérant "${target.name}" a été définitivement supprimé par le Bailleur.`,
        statut: 'alerte'
      });
    }
    setAllUsers(prev => prev.filter(u => u.id !== id));
    return { success: true };
  };

  const setUserRole = (role: UserRole) => {
    setAllUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, role } : u));
  };

  const updateUserProfile = (profileData: Partial<UserAccount>) => {
    setAllUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, ...profileData } : u));
  };

  // Logements
  const addLogement = (
    logementData: Omit<Logement, 'id' | 'user_id' | 'created_at'>,
    initialPiecesCount = 0,
    baseRentFCFA = 100000
  ): { success: boolean; error?: string; logement?: Logement } => {
    // Check subscription expiration for landlords
    if (currentUser.role === 'bailleur') {
      const userSub = subscriptions.find(s => s.user_id === currentUser.id);
      const isExpired = userSub ? (userSub.statut === 'expire' || new Date(userSub.date_expiration) < new Date()) : false;
      if (isExpired) {
        return {
          success: false,
          error: `Votre forfait DISCOM a expiré le ${userSub?.date_expiration || 'récemment'}. Veuillez renouveler votre abonnement pour pouvoir ajouter de nouveaux logements.`
        };
      }
    }

    const newId = `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newLogement: Logement = {
      ...logementData,
      id: newId,
      user_id: currentUser.id,
      created_at: new Date().toISOString().split('T')[0]
    };
    setLogements(prev => [newLogement, ...prev]);

    // Automatically create initial apartments/units if requested
    if (initialPiecesCount > 0) {
      const newPiecesList: Piece[] = [];
      for (let i = 1; i <= initialPiecesCount; i++) {
        const pieceId = `pc_${Date.now()}_${i}`;
        newPiecesList.push({
          id: pieceId,
          logement_id: newId,
          numero: `Porte ${i < 10 ? '0' + i : i}`,
          nom: `Appartement ${i}`,
          type: i % 2 === 0 ? '3_pieces' : '2_pieces',
          superficie: 45 + (i * 5),
          etage: Math.ceil(i / 2),
          loyer_reference: baseRentFCFA,
          charges_incluses: 10000,
          statut: 'libre',
          current_locataire_id: null,
          created_at: new Date().toISOString().split('T')[0]
        });
      }
      setPieces(prev => [...newPiecesList, ...prev]);
    }

    // Send notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      user_id: currentUser.id,
      type: 'system',
      titre: 'Nouveau logement créé',
      message: `Le logement "${newLogement.nom}" à ${newLogement.ville} a été ajouté avec succès${initialPiecesCount > 0 ? ` (${initialPiecesCount} pièces générées)` : ''}.`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      is_read: false,
      canal: 'app',
      logement_id: newId,
      severity: 'success'
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, logement: newLogement };
  };

  const addMultipleLogements = (
    logementsList: Array<Omit<Logement, 'id' | 'user_id' | 'created_at'>>
  ): { success: boolean; count: number; error?: string } => {
    if (currentUser.role === 'bailleur') {
      const userSub = subscriptions.find(s => s.user_id === currentUser.id);
      const isExpired = userSub ? (userSub.statut === 'expire' || new Date(userSub.date_expiration) < new Date()) : false;
      if (isExpired) {
        return {
          success: false,
          count: 0,
          error: `Votre forfait DISCOM a expiré le ${userSub?.date_expiration || 'récemment'}. Veuillez renouveler votre forfait pour pouvoir ajouter des logements.`
        };
      }
    }

    const createdList: Logement[] = logementsList.map((data, index) => ({
      ...data,
      id: `log_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`,
      user_id: currentUser.id,
      created_at: new Date().toISOString().split('T')[0]
    }));

    setLogements(prev => [...createdList, ...prev]);

    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      user_id: currentUser.id,
      type: 'system',
      titre: `${createdList.length} nouveaux logements créés`,
      message: `Un lot de ${createdList.length} logements a été créé avec succès dans votre portefeuille locatif.`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      is_read: false,
      canal: 'app',
      severity: 'success'
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, count: createdList.length };
  };

  const updateLogement = (id: string, updates: Partial<Logement>) => {
    setLogements(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const archiveLogement = (id: string) => {
    setLogements(prev => prev.map(l => l.id === id ? { ...l, is_archived: true } : l));
  };

  // Pieces
  const addPiece = (pieceData: Omit<Piece, 'id' | 'created_at'>) => {
    const newId = `piece_${Date.now()}`;
    const newPiece: Piece = {
      ...pieceData,
      id: newId,
      created_at: new Date().toISOString().split('T')[0]
    };
    setPieces(prev => [...prev, newPiece]);
  };

  const addMultiplePieces = (piecesData: Omit<Piece, 'id' | 'created_at'>[]) => {
    const timestamp = Date.now();
    const createdDate = new Date().toISOString().split('T')[0];
    const newItems: Piece[] = piecesData.map((data, index) => ({
      ...data,
      id: `piece_${timestamp}_${index}`,
      created_at: createdDate
    }));
    setPieces(prev => [...prev, ...newItems]);
  };

  const updatePiece = (id: string, updates: Partial<Piece>) => {
    setPieces(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePiece = (id: string) => {
    setPieces(prev => prev.filter(p => p.id !== id));
  };

  // Locataires & Baux
  const createLocataireAndBail = (
    locataireData: Omit<Locataire, 'id' | 'user_id' | 'created_at'>,
    bailData: Omit<Bail, 'id' | 'locataire_id' | 'date_echeance_theorique' | 'date_echeance_reelle' | 'statut'>
  ) => {
    const locId = `loc_${Date.now()}`;
    const bailId = `bail_${Date.now()}`;

    // Compute dates
    const { theoriqueDate, reelleDate } = computeLeaseExpiry(
      bailData.date_debut,
      bailData.duree_mois,
      bailData.mois_avance
    );

    const initialArrieres = Number(locataireData.arrieres_montant) || 0;
    const isAncien = Boolean(locataireData.is_ancien);

    const newLocataire: Locataire = {
      ...locataireData,
      id: locId,
      user_id: currentUser.id,
      statut: 'actif',
      created_at: new Date().toISOString().split('T')[0],
      is_ancien: isAncien,
      arrieres_montant: initialArrieres,
      arrieres_details: locataireData.arrieres_details || '',
      date_entree_initiale: locataireData.date_entree_initiale || '',
      mois_impayes: initialArrieres > 0 ? (locataireData.mois_impayes || 1) : 0
    };

    const newBail: Bail = {
      ...bailData,
      id: bailId,
      locataire_id: locId,
      date_echeance_theorique: theoriqueDate,
      date_echeance_reelle: reelleDate,
      statut: 'actif'
    };

    // Update all occupied pieces status to 'occupee' and link tenant
    const occupiedPieceIds = (locataireData.piece_ids && locataireData.piece_ids.length > 0)
      ? locataireData.piece_ids
      : [locataireData.piece_id];

    setPieces(prev => prev.map(p => occupiedPieceIds.includes(p.id) ? {
      ...p,
      statut: 'occupee',
      current_locataire_id: locId
    } : p));

    setLocataires(prev => [newLocataire, ...prev]);
    setBaux(prev => [newBail, ...prev]);

    // Create current month initial payment if started
    const currentMonth = new Date().toISOString().substring(0, 7);
    const quittanceNum = generateQuittanceNumber(newLocataire.nom_complet, currentMonth);

    const initialPay: Paiement = {
      id: `pay_${Date.now()}`,
      bailleur_id: currentUser.id,
      locataire_id: locId,
      piece_id: locataireData.piece_id,
      piece_ids: occupiedPieceIds,
      logement_id: locataireData.logement_id,
      mois_concerne: currentMonth,
      annee: new Date().getFullYear(),
      montant_attendu: newBail.montant_loyer_fcfa + (newBail.montant_charges_fcfa || 0),
      montant_recu: newBail.montant_loyer_fcfa + (newBail.montant_charges_fcfa || 0),
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'mobile_money',
      operateur_mobile: 'MTN Mobile Money Cameroun',
      statut: 'paye',
      type_paiement: 'standard',
      reference_recu: `ENTR-${Math.floor(100000 + Math.random() * 900000)}`,
      commentaire: `Paiement d'entrée + ${newBail.mois_avance} mois d'avance & caution (${occupiedPieceIds.length} lot(s))`,
      quittance_numero: quittanceNum,
      date_creation: new Date().toISOString().split('T')[0]
    };

    setPaiements(prev => [initialPay, ...prev]);

    // If tenant is ancien with initial arrears, record an impaye payment for previous period
    if (initialArrieres > 0) {
      const prevDate = new Date();
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevMonth = prevDate.toISOString().substring(0, 7);
      const arrearsPay: Paiement = {
        id: `pay_arr_${Date.now()}`,
        bailleur_id: currentUser.id,
        locataire_id: locId,
        piece_id: locataireData.piece_id,
        piece_ids: occupiedPieceIds,
        logement_id: locataireData.logement_id,
        mois_concerne: prevMonth,
        annee: prevDate.getFullYear(),
        montant_attendu: initialArrieres,
        montant_recu: 0,
        date_paiement: '',
        mode_paiement: 'especes',
        statut: 'impaye',
        type_paiement: 'standard',
        reference_recu: `ARR-${Math.floor(100000 + Math.random() * 900000)}`,
        commentaire: locataireData.arrieres_details 
          ? `Arriérés antérieurs déclarés : ${locataireData.arrieres_details}` 
          : `Arriérés antérieurs enregistrés lors de l'intégration du locataire`,
        quittance_numero: '',
        date_creation: new Date().toISOString().split('T')[0]
      };
      setPaiements(prev => [arrearsPay, ...prev]);
    }

    // Add notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      user_id: currentUser.id,
      type: 'system',
      titre: isAncien ? 'Ancien locataire enregistré' : 'Nouveau bail enregistré',
      message: isAncien
        ? `Ancien locataire ${newLocataire.nom_complet} enregistré avec succès.${initialArrieres > 0 ? ` Arriérés initiaux déclarés : ${initialArrieres} FCFA.` : ''}`
        : `Bail créé pour ${newLocataire.nom_complet}. Échéance réelle fixée au ${reelleDate}.`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      is_read: false,
      canal: 'app',
      locataire_id: locId,
      logement_id: locataireData.logement_id,
      severity: 'success'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addHousingToLocataire = (
    locataireId: string,
    logementId: string,
    pieceId: string,
    bailData: {
      date_debut: string;
      duree_mois: number;
      mois_avance: number;
      montant_loyer_fcfa: number;
      montant_charges_fcfa: number;
      montant_caution_fcfa: number;
      clause_renouvellement?: 'tacite_reconduction' | 'expres';
      piece_ids?: string[];
      usage?: string;
    }
  ): { success: boolean; newBail?: Bail; error?: string } => {
    const targetLoc = locataires.find(l => l.id === locataireId);
    if (!targetLoc) return { success: false, error: 'Locataire introuvable.' };

    const targetPiece = pieces.find(p => p.id === pieceId);
    if (!targetPiece) return { success: false, error: 'Logement/Lot introuvable.' };

    const allPieceIds = (bailData.piece_ids && bailData.piece_ids.length > 0)
      ? bailData.piece_ids
      : [pieceId];

    const { theoriqueDate, reelleDate } = computeLeaseExpiry(
      bailData.date_debut,
      bailData.duree_mois,
      bailData.mois_avance
    );

    const bailId = `bail_${Date.now()}`;
    const newBail: Bail = {
      id: bailId,
      locataire_id: locataireId,
      piece_id: pieceId,
      piece_ids: allPieceIds,
      logement_id: logementId,
      date_debut: bailData.date_debut,
      duree_mois: bailData.duree_mois,
      mois_avance: bailData.mois_avance,
      montant_loyer_fcfa: bailData.montant_loyer_fcfa,
      montant_charges_fcfa: bailData.montant_charges_fcfa,
      montant_caution_fcfa: bailData.montant_caution_fcfa,
      caution_versee_fcfa: bailData.montant_caution_fcfa,
      clause_renouvellement: bailData.clause_renouvellement || 'tacite_reconduction',
      date_echeance_theorique: theoriqueDate,
      date_echeance_reelle: reelleDate,
      statut: 'actif'
    };

    // 1. Update all selected pieces to 'occupee' with this tenant
    setPieces(prev => prev.map(p => allPieceIds.includes(p.id) ? {
      ...p,
      statut: 'occupee',
      current_locataire_id: locataireId
    } : p));

    // 2. Update tenant logement_id & piece_ids
    setLocataires(prev => prev.map(l => {
      if (l.id === locataireId) {
        const existingPieceIds = l.piece_ids && l.piece_ids.length > 0 ? l.piece_ids : (l.piece_id ? [l.piece_id] : []);
        const updated = Array.from(new Set([...existingPieceIds, ...allPieceIds]));
        return {
          ...l,
          logement_id: logementId,
          piece_id: pieceId,
          piece_ids: updated
        };
      }
      return l;
    }));

    // 3. Add lease
    setBaux(prev => [newBail, ...prev]);

    // 4. Create initial payment
    const currentMonth = new Date().toISOString().substring(0, 7);
    const quittanceNum = generateQuittanceNumber(targetLoc.nom_complet, currentMonth);
    const initialPay: Paiement = {
      id: `pay_${Date.now()}`,
      bailleur_id: currentUser.id,
      locataire_id: locataireId,
      piece_id: pieceId,
      piece_ids: [pieceId],
      logement_id: logementId,
      mois_concerne: currentMonth,
      annee: new Date().getFullYear(),
      montant_attendu: newBail.montant_loyer_fcfa + (newBail.montant_charges_fcfa || 0),
      montant_recu: newBail.montant_loyer_fcfa + (newBail.montant_charges_fcfa || 0),
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'mobile_money',
      operateur_mobile: 'MTN Mobile Money Cameroun',
      statut: 'paye',
      type_paiement: 'standard',
      reference_recu: `NOUV-${Math.floor(100000 + Math.random() * 900000)}`,
      commentaire: `Rattachement nouveau lot ${targetPiece.nom} (${targetPiece.numero}) - ${newBail.mois_avance} mois avance & caution`,
      quittance_numero: quittanceNum,
      date_creation: new Date().toISOString().split('T')[0]
    };
    setPaiements(prev => [initialPay, ...prev]);

    // 5. Add notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      user_id: currentUser.id,
      type: 'system',
      titre: 'Nouveau logement rattaché au locataire',
      message: `Le logement "${targetPiece.nom}" a été rattaché avec succès à ${targetLoc.nom_complet}. Nouveau contrat de bail généré.`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      is_read: false,
      canal: 'app',
      locataire_id: locataireId,
      logement_id: logementId,
      severity: 'success'
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, newBail };
  };

  const updateLocataire = (id: string, updates: Partial<Locataire>) => {
    setLocataires(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLocataire = (id: string): { success: boolean; error?: string } => {
    const locToDelete = locataires.find(l => l.id === id);
    if (!locToDelete) return { success: false, error: 'Locataire introuvable.' };

    // 1. Free up all occupied pieces linked to this tenant
    const targetPieceIds = locToDelete.piece_ids && locToDelete.piece_ids.length > 0 
      ? locToDelete.piece_ids 
      : (locToDelete.piece_id ? [locToDelete.piece_id] : []);

    setPieces(prev => prev.map(p => {
      if (p.current_locataire_id === id || targetPieceIds.includes(p.id)) {
        return {
          ...p,
          statut: 'libre',
          current_locataire_id: null
        };
      }
      return p;
    }));

    // 2. Remove baux associated with this tenant
    setBaux(prev => prev.filter(b => b.locataire_id !== id));

    // 3. Remove payments associated with this tenant
    setPaiements(prev => prev.filter(p => p.locataire_id !== id));

    // 4. Remove locataire from list
    setLocataires(prev => prev.filter(l => l.id !== id));

    // 5. Add notification
    const notif: NotificationItem = {
      id: `notif_${Date.now()}`,
      user_id: currentUser.id,
      type: 'system',
      titre: 'Locataire supprimé',
      message: `Le locataire ${locToDelete.nom_complet} et ses données ont été supprimés avec succès. Les lots associés ont été libérés.`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      is_read: false,
      canal: 'app',
      severity: 'warning'
    };
    setNotifications(prev => [notif, ...prev]);

    return { success: true };
  };

  const resilierBail = (
    bailId: string, 
    dateSortie: string, 
    motif: string, 
    etatLieux: string, 
    soldeCompte: Bail['solde_tout_compte']
  ) => {
    const targetBail = baux.find(b => b.id === bailId);
    if (!targetBail) return;

    const locataire = locataires.find(l => l.id === targetBail.locataire_id);

    // 1. Update bail
    setBaux(prev => prev.map(b => b.id === bailId ? {
      ...b,
      statut: 'resilie',
      date_resiliation: dateSortie,
      motif_resiliation: motif,
      etat_lieux_sortie: etatLieux,
      solde_tout_compte: soldeCompte
    } : b));

    // 2. Update locataire to 'resilie' or 'archive'
    setLocataires(prev => prev.map(l => l.id === targetBail.locataire_id ? {
      ...l,
      statut: 'resilie'
    } : l));

    // 3. Free up piece(s) and add occupation history
    const piecesToFree = targetBail.piece_ids && targetBail.piece_ids.length > 0 
      ? targetBail.piece_ids 
      : [targetBail.piece_id];

    setPieces(prev => prev.map(p => piecesToFree.includes(p.id) ? {
      ...p,
      statut: 'libre',
      current_locataire_id: null
    } : p));

    if (locataire) {
      const historyEntries: PieceOccupationHistory[] = piecesToFree.map(pId => ({
        id: `hist_${Date.now()}_${pId}`,
        piece_id: pId,
        locataire_nom: locataire.nom_complet,
        locataire_cni: locataire.cni_passeport,
        date_debut: targetBail.date_debut,
        date_fin: dateSortie,
        motif_sortie: motif,
        loyer_mensuel: targetBail.montant_loyer_fcfa
      }));
      setOccupationHistory(prev => [...historyEntries, ...prev]);
    }

    // 4. Notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      user_id: currentUser.id,
      type: 'system',
      titre: 'Bail résilié avec solde de tout compte',
      message: `Le bail de ${locataire?.nom_complet || 'locataire'} a été résilié le ${dateSortie}. ${piecesToFree.length} logement(s) libéré(s).`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      is_read: false,
      canal: 'app',
      severity: 'info'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Paiements & Quittances
  const quickTogglePayment = (locataireId: string, moisConcerne: string, montant: number) => {
    const locataire = locataires.find(l => l.id === locataireId);
    const existing = paiements.find(p => p.locataire_id === locataireId && p.mois_concerne === moisConcerne);

    if (existing) {
      if (existing.statut === 'paye') {
        // Toggle to unpaid
        setPaiements(prev => prev.map(p => p.id === existing.id ? {
          ...p,
          statut: 'impaye',
          montant_recu: 0,
          date_paiement: '',
          reference_recu: '',
          quittance_numero: ''
        } : p));
      } else {
        // Toggle to paid
        const quittanceNum = generateQuittanceNumber(locataire?.nom_complet || 'LOC', moisConcerne);
        setPaiements(prev => prev.map(p => p.id === existing.id ? {
          ...p,
          statut: 'paye',
          montant_recu: p.montant_attendu,
          date_paiement: new Date().toISOString().split('T')[0],
          reference_recu: `CONF-${Math.floor(100000 + Math.random() * 900000)}`,
          quittance_numero: quittanceNum
        } : p));
      }
    } else if (locataire) {
      // Create new payment row
      const quittanceNum = generateQuittanceNumber(locataire.nom_complet, moisConcerne);
      const newPay: Paiement = {
        id: `pay_${Date.now()}`,
        bailleur_id: currentUser.id,
        locataire_id: locataireId,
        piece_id: locataire.piece_id,
        piece_ids: locataire.piece_ids,
        logement_id: locataire.logement_id,
        mois_concerne: moisConcerne,
        annee: parseInt(moisConcerne.split('-')[0]),
        montant_attendu: montant,
        montant_recu: montant,
        date_paiement: new Date().toISOString().split('T')[0],
        mode_paiement: 'mobile_money',
        operateur_mobile: 'MTN Mobile Money Cameroun',
        statut: 'paye',
        type_paiement: 'standard',
        reference_recu: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
        commentaire: 'Paiement confirmé en un clic',
        quittance_numero: quittanceNum,
        date_creation: new Date().toISOString().split('T')[0]
      };
      setPaiements(prev => [newPay, ...prev]);
    }
  };

  const recordPayment = (paymentData: Omit<Paiement, 'id' | 'quittance_numero' | 'date_creation'>) => {
    const locataire = locataires.find(l => l.id === paymentData.locataire_id);
    const quittanceNum = paymentData.statut === 'paye' || paymentData.statut === 'partiel'
      ? generateQuittanceNumber(locataire?.nom_complet || 'LOC', paymentData.mois_concerne)
      : '';

    // Check if entry already exists for this tenant and month
    const existingIndex = paiements.findIndex(
      p => p.locataire_id === paymentData.locataire_id && p.mois_concerne === paymentData.mois_concerne
    );

    let mainPayId = `pay_${Date.now()}`;

    if (existingIndex >= 0) {
      mainPayId = paiements[existingIndex].id;
      setPaiements(prev => prev.map((p, idx) => idx === existingIndex ? {
        ...paymentData,
        id: p.id,
        quittance_numero: quittanceNum || p.quittance_numero,
        date_creation: p.date_creation
      } : p));
    } else {
      const newPay: Paiement = {
        ...paymentData,
        id: mainPayId,
        quittance_numero: quittanceNum,
        date_creation: new Date().toISOString().split('T')[0]
      };
      setPaiements(prev => [newPay, ...prev]);
    }

    // If current user is Gérant Adjoint, record in activity log
    if (currentUser.role === 'gerant_adjoint') {
      const targetBien = logements.find(l => l.id === paymentData.logement_id);
      addActiviteGerant({
        gerant_id: currentUser.id,
        gerant_nom: currentUser.name,
        bailleur_id: effectiveOwnerId,
        action_type: 'enregistrement_paiement',
        titre: `Encaissement Loyer ${paymentData.mois_concerne}`,
        description: `Enregistrement du règlement de ${paymentData.montant_recu.toLocaleString()} FCFA pour ${locataire?.nom_complet || 'Locataire'} (${paymentData.mode_paiement.toUpperCase()})`,
        montant_fcfa: paymentData.montant_recu,
        reference: paymentData.reference_recu,
        quittance_numero: quittanceNum,
        locataire_nom: locataire?.nom_complet,
        logement_nom: targetBien?.nom,
        statut: 'succes'
      });
    }

    // If multi_mois payment, also register or update subsequent months covered
    if (paymentData.type_paiement === 'multi_mois' && paymentData.mois_soldes && paymentData.mois_soldes.length > 1) {
      const otherMonths = paymentData.mois_soldes.filter(m => m !== paymentData.mois_concerne);
      const monthlyAmount = Math.round(paymentData.montant_recu / paymentData.mois_soldes.length);

      otherMonths.forEach((otherMois, oIdx) => {
        setTimeout(() => {
          const subQuittanceNum = generateQuittanceNumber(locataire?.nom_complet || 'LOC', otherMois);
          const subPay: Paiement = {
            id: `pay_multi_${Date.now()}_${oIdx}`,
            bailleur_id: paymentData.bailleur_id,
            locataire_id: paymentData.locataire_id,
            piece_id: paymentData.piece_id,
            piece_ids: paymentData.piece_ids,
            logement_id: paymentData.logement_id,
            mois_concerne: otherMois,
            annee: parseInt(otherMois.split('-')[0]),
            montant_attendu: monthlyAmount,
            montant_recu: monthlyAmount,
            date_paiement: paymentData.date_paiement,
            mode_paiement: paymentData.mode_paiement,
            operateur_mobile: paymentData.operateur_mobile,
            statut: 'paye',
            type_paiement: 'multi_mois',
            mois_soldes: paymentData.mois_soldes,
            mois_soldes_labels: paymentData.mois_soldes_labels,
            reference_recu: paymentData.reference_recu,
            commentaire: `Paiement multi-mois groupé soldé (inclus dans quittance N° ${quittanceNum})`,
            quittance_numero: subQuittanceNum,
            date_creation: new Date().toISOString().split('T')[0]
          };

          setPaiements(prev => {
            const exists = prev.find(p => p.locataire_id === paymentData.locataire_id && p.mois_concerne === otherMois);
            if (exists) {
              return prev.map(p => p.id === exists.id ? { ...subPay, id: exists.id } : p);
            }
            return [subPay, ...prev];
          });
        }, 10);
      });
    }
  };

  // Notifications
  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...settings }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const triggerManualCronCheck = () => {
    // Check all active leases and generate alerts
    const generated: NotificationItem[] = [];
    const now = new Date();

    baux.filter(b => b.statut === 'actif').forEach(bail => {
      const loc = locataires.find(l => l.id === bail.locataire_id);
      if (!loc) return;

      const target = new Date(bail.date_echeance_reelle);
      const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 30 && diffDays > 7 && notificationSettings.echeance_j30) {
        generated.push({
          id: `notif_${Date.now()}_${bail.id}_j30`,
          user_id: currentUser.id,
          type: 'echeance_j30',
          titre: `Échéance de bail dans ${diffDays} jours`,
          message: `Le bail de ${loc.nom_complet} expire le ${bail.date_echeance_reelle}. Pensez au renouvellement.`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          is_read: false,
          canal: 'email',
          locataire_id: loc.id,
          logement_id: bail.logement_id,
          severity: 'warning'
        });
      } else if (diffDays <= 7 && diffDays > 0 && notificationSettings.echeance_j7) {
        generated.push({
          id: `notif_${Date.now()}_${bail.id}_j7`,
          user_id: currentUser.id,
          type: 'echeance_j7',
          titre: `Alerte urgente : Fin de bail dans ${diffDays} jours`,
          message: `Le bail de ${loc.nom_complet} arrive à échéance le ${bail.date_echeance_reelle}.`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          is_read: false,
          canal: 'sms',
          locataire_id: loc.id,
          logement_id: bail.logement_id,
          severity: 'error'
        });
      }
    });

    if (generated.length > 0) {
      setNotifications(prev => [...generated, ...prev]);
    }
  };

  // SaaS Subscriptions & SuperAdmin
  const updateSubscriptionPlan = (planId: string, updates: Partial<SubscriptionPlan>) => {
    setSubscriptionPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p));
  };

  const addSubscriptionPlan = (planData: Omit<SubscriptionPlan, 'id'>) => {
    const newPlan: SubscriptionPlan = {
      ...planData,
      id: `plan_${Date.now()}`
    };
    setSubscriptionPlans(prev => [...prev, newPlan]);
  };

  const upgradeSubscription = (userId: string, planId: string) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, abonnement_id: planId } : u));
    setSubscriptions(prev => {
      const existing = prev.find(s => s.user_id === userId);
      const plan = subscriptionPlans.find(p => p.id === planId);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      if (existing) {
        return prev.map(s => s.user_id === userId ? {
          ...s,
          plan_id: planId,
          statut: 'actif',
          date_expiration: nextYear.toISOString().split('T')[0],
          montant_paye_fcfa: (plan?.prix_fcfa || 0) * 12
        } : s);
      } else {
        const newSub: Subscription = {
          id: `sub_${Date.now()}`,
          user_id: userId,
          plan_id: planId,
          statut: 'actif',
          date_debut: new Date().toISOString().split('T')[0],
          date_expiration: nextYear.toISOString().split('T')[0],
          montant_paye_fcfa: (plan?.prix_fcfa || 0) * 12,
          mode_paiement: 'Wave Mobile Money',
          auto_renew: true
        };
        return [newSub, ...prev];
      }
    });
  };

  const processSubscriptionPayment = ({
    planId,
    dureeMois,
    modePaiement,
    telephoneOuDetails,
    montantPaye,
    remise
  }: {
    planId: string;
    dureeMois: number;
    modePaiement: string;
    telephoneOuDetails: string;
    montantPaye: number;
    remise: number;
  }): Subscription => {
    const plan = subscriptionPlans.find(p => p.id === planId) || subscriptionPlans[0];
    const existing = subscriptions.find(s => s.user_id === currentUser.id);

    const today = new Date();
    let baseDate = new Date();
    if (existing && existing.date_expiration && new Date(existing.date_expiration) > today) {
      baseDate = new Date(existing.date_expiration);
    }

    const expDate = new Date(baseDate);
    expDate.setMonth(expDate.getMonth() + dureeMois);

    const startDateStr = today.toISOString().split('T')[0];
    const expDateStr = expDate.toISOString().split('T')[0];
    const invoiceNum = `FACT-DISCOM-${today.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const prefix = modePaiement.toUpperCase().includes('ORANGE') ? 'OM' : modePaiement.toUpperCase().includes('MTN') ? 'MOMO' : 'CB';
    const txnRef = `TXN-${prefix}-${Date.now().toString().slice(-8)}`;

    const newSubRecord: Subscription = {
      id: `sub_${Date.now()}`,
      user_id: currentUser.id,
      plan_id: planId,
      statut: 'actif',
      date_debut: startDateStr,
      date_expiration: expDateStr,
      montant_paye_fcfa: montantPaye,
      mode_paiement: modePaiement,
      auto_renew: true,
      duree_mois: dureeMois,
      facture_numero: invoiceNum,
      reference_transaction: txnRef,
      remise_fcfa: remise,
      telephone_paiement: telephoneOuDetails
    };

    // Update user profile abonnement
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, abonnement_id: planId } : u));
    setSubscriptions(prev => [newSubRecord, ...prev.filter(s => s.user_id !== currentUser.id)]);

    // Create confirmation notification
    const notif: NotificationItem = {
      id: `notif_sub_${Date.now()}`,
      user_id: currentUser.id,
      type: 'abonnement',
      titre: `Abonnement ${plan.nom} Activé (${dureeMois} mois)`,
      message: `Votre abonnement DISCOM a été renouvelé avec succès pour ${dureeMois} mois jusqu'au ${expDateStr}. Facture N° ${invoiceNum} disponible.`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      is_read: false,
      canal: 'sms',
      severity: 'success'
    };
    setNotifications(prev => [notif, ...prev]);
    setLatestSubReceipt(newSubRecord);

    return newSubRecord;
  };

  // Maintenance
  const addMaintenanceTicket = (ticketData: Omit<MaintenanceTicket, 'id' | 'date_creation'>) => {
    const newTicket: MaintenanceTicket = {
      ...ticketData,
      id: `tick_${Date.now()}`,
      date_creation: new Date().toISOString().split('T')[0]
    };
    setMaintenanceTickets(prev => [newTicket, ...prev]);
  };

  // Subscription status for current user
  const currentUserSubscription = subscriptions.find(s => s.user_id === currentUser.id) || null;
  const isCurrentUserSubscriptionExpired = currentUser.role === 'bailleur'
    ? (currentUserSubscription
        ? (currentUserSubscription.statut === 'expire' || new Date(currentUserSubscription.date_expiration) < new Date())
        : false)
    : false;
  const currentUserPlan = subscriptionPlans.find(p => p.id === (currentUserSubscription?.plan_id || currentUser.abonnement_id)) || subscriptionPlans[1];

  return (
    <AppContext.Provider value={{
      currentUser,
      allUsers,
      isAuthenticated,
      setIsAuthenticated,
      switchUser,
      setUserRole,
      updateUserProfile,
      loginWithEmail,
      loginWithPhone,
      loginWithGoogle,
      registerOwner,
      addSubscriberByAdmin,
      updateSubscriberByAdmin,
      deleteUser,
      logout,
      disconnectUserByAdmin,
      isAuthModalOpen,
      setIsAuthModalOpen,
      gerantsAdjoints,
      createGerantAdjoint,
      updateGerantAdjoint,
      deleteGerantAdjoint,
      effectiveOwnerId,
      activitesGerant,
      addActiviteGerant,
      logements,
      addLogement,
      addMultipleLogements,
      updateLogement,
      archiveLogement,
      pieces,
      addPiece,
      addMultiplePieces,
      updatePiece,
      deletePiece,
      occupationHistory,
      locataires,
      baux,
      createLocataireAndBail,
      addHousingToLocataire,
      updateLocataire,
      deleteLocataire,
      resilierBail,
      paiements,
      selectedQuittancePaiement,
      setSelectedQuittancePaiement,
      quickTogglePayment,
      recordPayment,
      notifications,
      notificationSettings,
      updateNotificationSettings,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      triggerManualCronCheck,
      subscriptionPlans,
      subscriptions,
      currentUserSubscription,
      isCurrentUserSubscriptionExpired,
      currentUserPlan,
      updateSubscriptionPlan,
      addSubscriptionPlan,
      upgradeSubscription,
      isPlanModalOpen,
      setIsPlanModalOpen,
      selectedPlanForCheckout,
      setSelectedPlanForCheckout,
      latestSubReceipt,
      setLatestSubReceipt,
      processSubscriptionPayment,
      maintenanceTickets,
      addMaintenanceTicket,
      activeTab,
      setActiveTab,
      searchQuery,
      setSearchQuery
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PhoneCountryInput } from '../components/PhoneCountryInput';
import { CountryCode, DEFAULT_COUNTRY } from '../utils/countryCodes';
import { formatFCFA } from '../utils/formatters';
import confetti from 'canvas-confetti';
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  ShieldCheck, 
  UserCheck, 
  User, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Globe, 
  MapPin, 
  Send,
  X,
  Smartphone,
  KeyRound,
  Crown,
  CreditCard,
  Check,
  Printer,
  FileText,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
  onClose?: () => void;
  isModal?: boolean;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onClose,
  isModal = false
}) => {
  const { 
    loginWithEmail, 
    loginWithPhone, 
    loginWithGoogle, 
    registerOwner, 
    allUsers, 
    switchUser,
    setIsAuthenticated,
    subscriptionPlans,
    setActiveTab
  } = useApp();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  // Login type: 'email' | 'phone'
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Phone OTP States (for login)
  const [loginPhoneCountry, setLoginPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [loginPhoneNumber, setLoginPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [isOtpTimerActive, setIsOtpTimerActive] = useState(false);

  // ============================================================================
  // MULTI-STEP REGISTRATION WIZARD (MANDATORY PRICING PLAN + PAYMENT)
  // Step 1: Informations & Coordonnées du Bailleur
  // Step 2: Choix Obligatoire du Forfait Tarifaire (Starter, Pro, Entreprise)
  // Step 3: Durée d'engagement & Modalité de Paiement
  // Step 4: Débit & Validation Sécurisée du Paiement
  // Step 5: Compte Activé avec Facture DISCOM Officielle
  // ============================================================================
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1 Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhoneCountry, setRegPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [regPhoneNumber, setRegPhoneNumber] = useState('');
  const [regCountry, setRegCountry] = useState<string>(DEFAULT_COUNTRY.country);
  const [regCity, setRegCity] = useState('Douala');
  const [regEntreprise, setRegEntreprise] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Step 2 Fields: Selected Plan
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_pro');

  // Step 3 Fields: Duration & Payment
  const [regDuration, setRegDuration] = useState<number>(1); // 1, 3, 6, 12 mois
  const [regPaymentMethod, setRegPaymentMethod] = useState<string>('MTN Mobile Money Cameroun (*126#)');
  const [regPaymentPhone, setRegPaymentPhone] = useState<string>('');

  // Step 4 & 5 Fields: Payment processing & Result
  const [paymentCountdown, setPaymentCountdown] = useState<number>(3);
  const [createdSubscription, setCreatedSubscription] = useState<any>(null);

  // UI status messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Automatic field population for Country
  const handleRegPhoneCountryChange = (country: CountryCode) => {
    setRegPhoneCountry(country);
    setRegCountry(country.country);
  };

  // OTP Timer countdown
  useEffect(() => {
    let interval: any;
    if (isOtpTimerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setIsOtpTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isOtpTimerActive, otpTimer]);

  // Payment Countdown timer for Step 4
  useEffect(() => {
    let timer: any;
    if (regStep === 4 && paymentCountdown > 0) {
      timer = setInterval(() => {
        setPaymentCountdown((prev) => prev - 1);
      }, 1000);
    } else if (regStep === 4 && paymentCountdown === 0) {
      // Complete payment & account activation
      finalizeRegistration();
    }
    return () => clearInterval(timer);
  }, [regStep, paymentCountdown]);

  // Calculated Pricing & Discounts
  const chosenPlan = subscriptionPlans.find(p => p.id === selectedPlanId) || subscriptionPlans[1];
  
  let discountPercent = 0;
  if (regDuration === 3) discountPercent = 5;
  else if (regDuration === 6) discountPercent = 10;
  else if (regDuration === 12) discountPercent = 16.67;

  const grossTotal = (chosenPlan?.prix_fcfa || 35000) * regDuration;
  const discountAmount = Math.round(grossTotal * (discountPercent / 100));
  const netAmount = grossTotal - discountAmount;

  // Handle Send OTP SMS
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginPhoneNumber.trim()) {
      setErrorMsg('Veuillez entrer votre numéro de téléphone.');
      return;
    }

    setIsLoading(true);
    const fullPhone = `${loginPhoneCountry.dialCode} ${loginPhoneNumber.trim()}`;

    setTimeout(() => {
      setIsLoading(false);
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(randomCode);
      setOtpSent(true);
      setOtpCode(randomCode);
      setOtpTimer(60);
      setIsOtpTimerActive(true);
      setSuccessMsg(`Code SMS de vérification envoyé au ${fullPhone} (Code simulé: ${randomCode})`);
    }, 500);
  };

  // Handle Verify OTP and Login
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otpCode || otpCode.trim() !== simulatedOtp) {
      setErrorMsg('Code SMS invalide ou expiré.');
      return;
    }

    setIsLoading(true);
    const fullPhone = `${loginPhoneCountry.dialCode} ${loginPhoneNumber.trim()}`;

    setTimeout(() => {
      const res = loginWithPhone(fullPhone);
      setIsLoading(false);
      if (res.success) {
        if (onClose) onClose();
      } else {
        setErrorMsg(res.error || 'Erreur lors de la connexion par SMS.');
      }
    }, 400);
  };

  // Handle Email Login
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginEmail.trim()) {
      setErrorMsg('Veuillez entrer votre adresse email.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithEmail(loginEmail, loginPassword);
      setIsLoading(false);
      if (res.success) {
        if (onClose) onClose();
      } else {
        setErrorMsg(res.error || 'Identifiants invalides.');
      }
    }, 400);
  };

  // Quick Demo Account Switcher
  const handleQuickLogin = (userId: string) => {
    setIsLoading(true);
    setTimeout(() => {
      switchUser(userId);
      setIsLoading(false);
      if (onClose) onClose();
    }, 300);
  };

  // ============================================================================
  // STEP 1 VALIDATION -> PROCEED TO MANDATORY PRICING PLAN SELECTION
  // ============================================================================
  const handleProceedToPlanSelection = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet ou raison sociale.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Veuillez renseigner une adresse email valide.');
      return;
    }
    if (!regPhoneNumber.trim()) {
      setErrorMsg('Veuillez renseigner votre numéro de téléphone.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!acceptTerms) {
      setErrorMsg('Veuillez accepter les conditions d\'utilisation.');
      return;
    }

    // Check if email already exists
    const normalized = regEmail.trim().toLowerCase();
    const existing = allUsers.find(u => u.email.toLowerCase() === normalized);
    if (existing) {
      setErrorMsg('Un compte propriétaire existe déjà avec cet email.');
      return;
    }

    // Pre-populate payment phone with user phone
    const fullPhone = `${regPhoneCountry.dialCode} ${regPhoneNumber.trim()}`;
    setRegPaymentPhone(fullPhone);

    // Advance to Step 2 (Mandatory plan selection)
    setRegStep(2);
  };

  // ============================================================================
  // STEP 3 -> TRIGGER STEP 4 (PAYMENT PROCESSING & USSD CONFIRMATION)
  // ============================================================================
  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPaymentCountdown(3);
    setRegStep(4);
  };

  // Finalize Registration upon Payment Completion
  const finalizeRegistration = () => {
    setIsLoading(true);
    const fullPhone = `${regPhoneCountry.dialCode} ${regPhoneNumber.trim()}`;

    const res = registerOwner({
      name: regName,
      email: regEmail,
      phonenumber: fullPhone,
      pays: regCountry,
      ville: regCity,
      entreprise: regEntreprise,
      password: regPassword,
      planId: selectedPlanId,
      dureeMois: regDuration,
      modePaiement: regPaymentMethod,
      montantPaye: netAmount,
      remise: discountAmount,
      telephonePaiement: regPaymentPhone || fullPhone
    });

    setIsLoading(false);

    if (res.success && res.subscription) {
      setCreatedSubscription(res.subscription);
      setRegStep(5);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // silent
      }
    } else {
      setErrorMsg(res.error || 'Erreur lors du traitement du paiement.');
      setRegStep(3);
    }
  };

  // Password strength calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    return Math.min(score, 4);
  };

  const pwdStrength = getPasswordStrength(regPassword);

  return (
    <div className={`min-h-full flex items-center justify-center p-4 sm:p-6 ${isModal ? 'bg-transparent' : 'bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-100 py-10'}`}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
        
        {/* Close button if in modal */}
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20 cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Header Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl"></div>
          <div className="absolute right-12 bottom-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-xl"></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md border border-indigo-400/40">
                LM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">DISCOM SaaS</h2>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                    Cameroun CEMAC
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gestion Locative & Quittances Numériques Conformes
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs (Only shown when not in middle of multi-step payment) */}
          {regStep === 1 && (
            <div className="mt-6 flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button
                type="button"
                id="btn-tab-connexion"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Se Connecter</span>
              </button>
              <button
                type="button"
                id="btn-tab-inscription"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setRegStep(1);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Créer un compte Propriétaire</span>
              </button>
            </div>
          )}

          {/* Wizard Step Progress Tracker (When in Registration Mode) */}
          {mode === 'register' && regStep < 5 && (
            <div className="mt-5 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-bold">
                {[
                  { step: 1, label: '1. Coordonnées' },
                  { step: 2, label: '2. Forfait (Obligatoire)' },
                  { step: 3, label: '3. Durée & Paiement' },
                  { step: 4, label: '4. Validation' },
                ].map((s) => {
                  const isDone = regStep > s.step;
                  const isCurrent = regStep === s.step;
                  return (
                    <div 
                      key={s.step} 
                      className={`flex items-center gap-1.5 ${
                        isCurrent 
                          ? 'text-amber-400 font-extrabold' 
                          : isDone 
                          ? 'text-emerald-400' 
                          : 'text-slate-500'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        isCurrent 
                          ? 'bg-amber-400 text-slate-900 font-black' 
                          : isDone 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isDone ? '✓' : s.step}
                      </span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <div className="flex-1 font-medium">{successMsg}</div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-6 sm:p-7">
          
          {/* ========================================================= */}
          {/* LOGIN VIEW                                                */}
          {/* ========================================================= */}
          {mode === 'login' ? (
            <div className="space-y-5">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  id="btn-login-by-email"
                  onClick={() => setLoginType('email')}
                  className={`flex-1 py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginType === 'email' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email & Mot de passe</span>
                </button>
                <button
                  type="button"
                  id="btn-login-by-phone"
                  onClick={() => setLoginType('phone')}
                  className={`flex-1 py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginType === 'phone' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>SMS Code Téléphone</span>
                </button>
              </div>

              {loginType === 'email' ? (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adresse Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        id="login-email-input"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="nom@domaine.cm"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Mot de passe
                      </label>
                      <button 
                        type="button"
                        onClick={() => alert("Pour réinitialiser votre mot de passe, un lien sera envoyé à votre adresse email.")}
                        className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        id="login-password-input"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Rester connecté</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-email-login"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Se Connecter</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Numéro de Téléphone Portable
                    </label>
                    <PhoneCountryInput
                      id="login-phone-input"
                      value={loginPhoneNumber}
                      onChange={setLoginPhoneNumber}
                      selectedCountry={loginPhoneCountry}
                      onCountryChange={setLoginPhoneCountry}
                      placeholder={loginPhoneCountry.placeholder}
                      disabled={otpSent}
                      required
                    />
                  </div>

                  {otpSent && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Code de Vérification SMS (6 chiffres)
                      </label>
                      <input
                        type="text"
                        id="login-otp-code-input"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono tracking-widest text-center text-slate-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    id="btn-submit-phone-login"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : otpSent ? (
                      <span>Valider le Code & Se Connecter</span>
                    ) : (
                      <span>Recevoir le Code SMS</span>
                    )}
                  </button>
                </form>
              )}

              {/* Quick Demo Switcher */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-center text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">
                  Accès Démo Rapide (Tester un Profil)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('user_bailleur_1')}
                    className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Bailleur</span>
                    <span className="text-xs font-bold text-slate-800 block truncate">Ibrahim Fotso</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('user_superadmin')}
                    className="p-2 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">SuperAdmin</span>
                    <span className="text-xs font-bold text-slate-800 block truncate">Direction DISCOM</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* MULTI-STEP OWNER REGISTRATION WIZARD                              */
            /* ================================================================= */
            <div className="space-y-4">
              
              {/* =============================================================== */}
              {/* STEP 1: INFORMATIONS DU BAILLEUR                                */}
              {/* =============================================================== */}
              {regStep === 1 && (
                <form onSubmit={handleProceedToPlanSelection} className="space-y-4">
                  <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Étape 1 sur 4 : Vos Coordonnées Propriétaire / Bailleur</span>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        Renseignez vos coordonnées. Le choix de votre forfait tarifaire DISCOM et son règlement se feront à l'étape suivante avant la validation finale de votre compte.
                      </p>
                    </div>
                  </div>

                  {/* Nom complet */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nom complet du Propriétaire ou Raison sociale <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        id="reg-name-input"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Ex: Paul Kemgang ou SCI Immobilière du Littoral"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adresse Email (Pour alertes & notifications) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        id="reg-email-input"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="paul.kemgang@immo.cm"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Numéro de téléphone portable <span className="text-red-500">*</span>
                    </label>
                    <PhoneCountryInput
                      id="reg-phone-input"
                      value={regPhoneNumber}
                      onChange={setRegPhoneNumber}
                      selectedCountry={regPhoneCountry}
                      onCountryChange={handleRegPhoneCountryChange}
                      placeholder={regPhoneCountry.placeholder}
                      required
                    />
                  </div>

                  {/* Pays & Ville Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Pays</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          ✨ Auto-rempli
                        </span>
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          id="reg-pays-input"
                          value={regCountry}
                          onChange={(e) => setRegCountry(e.target.value)}
                          placeholder="Cameroun"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ville principale
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          id="reg-ville-input"
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          placeholder="Ex: Douala, Yaoundé"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Entreprise (Optionnel) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nom de l'agence ou du parc immobilier (Optionnel)
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        id="reg-entreprise-input"
                        value={regEntreprise}
                        onChange={(e) => setRegEntreprise(e.target.value)}
                        placeholder="Ex: Kemgang Patrimoine SARL"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mot de passe <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          id="reg-password-input"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 6 caractères"
                          required
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirmer mot de passe <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          id="reg-confirm-password-input"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Répétez mot de passe"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password strength */}
                  {regPassword && (
                    <div className="space-y-1">
                      <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full flex-1 ${pwdStrength >= 1 ? 'bg-red-500' : 'bg-transparent'}`}></div>
                        <div className={`h-full flex-1 ${pwdStrength >= 2 ? 'bg-amber-500' : 'bg-transparent'}`}></div>
                        <div className={`h-full flex-1 ${pwdStrength >= 3 ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                        <div className={`h-full flex-1 ${pwdStrength >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                      </div>
                      <span className="text-[10px] text-slate-500 block text-right">
                        Force : {pwdStrength <= 1 ? 'Faible' : pwdStrength === 2 ? 'Moyen' : pwdStrength === 3 ? 'Bon' : 'Fort'}
                      </span>
                    </div>
                  )}

                  {/* Terms */}
                  <div className="flex items-start gap-2 pt-1 text-xs">
                    <input
                      type="checkbox"
                      id="reg-accept-terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      required
                      className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="reg-accept-terms" className="text-slate-600 cursor-pointer text-[11px] leading-tight">
                      J'accepte les conditions d'utilisation de DISCOM SaaS Cameroun.
                    </label>
                  </div>

                  {/* Next Step Button */}
                  <button
                    type="submit"
                    id="btn-step1-next"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuer vers le Choix du Forfait (Obligatoire)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* =============================================================== */}
              {/* STEP 2: CHOIX OBLIGATOIRE DU FORFAIT TARIFAIRE                  */}
              {/* =============================================================== */}
              {regStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
                    <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Option Obligatoire : Choix du Forfait Tarifaire DISCOM</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        La souscription à un forfait est obligatoire pour activer votre compte. Sélectionnez la formule adaptée à votre patrimoine locatif avant de procéder au règlement.
                      </p>
                    </div>
                  </div>

                  {/* Pricing Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {subscriptionPlans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`
                            p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between
                            ${isSelected 
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20' 
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }
                          `}
                        >
                          {plan.is_popular && (
                            <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-extrabold uppercase rounded-full shadow-2xs">
                              Recommandé
                            </span>
                          )}

                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-slate-800">{plan.nom}</h4>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>

                            <p className="text-base font-black text-slate-900 mt-2">
                              {formatFCFA(plan.prix_fcfa)} <span className="text-[10px] font-normal text-slate-500">/mois</span>
                            </p>

                            <p className="text-[11px] text-slate-500 mt-1 leading-tight line-clamp-2">
                              {plan.description}
                            </p>

                            <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                              <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span>Max {plan.max_logements >= 999 ? 'Illimité' : `${plan.max_logements} logements`}</span>
                              </div>
                              <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Quittances & reçus conformes</span>
                              </div>
                              <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                                <Smartphone className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Alertes WhatsApp & SMS</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`w-full mt-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? 'Forfait Choisi' : 'Sélectionner'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Modifier mes Coordonnées</span>
                    </button>

                    <button
                      type="button"
                      id="btn-step2-next"
                      onClick={() => setRegStep(3)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Continuer vers la Durée & Paiement</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* STEP 3: DURÉE D'ENGAGEMENT & MODALITÉ DE PAIEMENT               */}
              {/* =============================================================== */}
              {regStep === 3 && (
                <form onSubmit={handleStartPayment} className="space-y-4 animate-in fade-in">
                  <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
                    <CreditCard className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Étape 3 sur 4 : Durée d'engagement & Modalité de Paiement</span>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        Choisissez votre période de paiement (bénéficiez de remises pour plusieurs mois) et votre méthode de règlement sécurisé.
                      </p>
                    </div>
                  </div>

                  {/* 1. Durée Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Durée d'abonnement souhaitée :
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { mois: 1, label: '1 Mois', discount: 'Tarif standard' },
                        { mois: 3, label: '3 Mois', discount: '-5% remise' },
                        { mois: 6, label: '6 Mois', discount: '-10% remise' },
                        { mois: 12, label: '12 Mois (1 An)', discount: '2 mois offerts' },
                      ].map((item) => (
                        <button
                          key={item.mois}
                          type="button"
                          onClick={() => setRegDuration(item.mois)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            regDuration === item.mois
                              ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-extrabold text-xs text-slate-800 block">{item.label}</span>
                          <span className={`text-[10px] font-bold block mt-0.5 ${item.mois > 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {item.discount}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Moyen de Paiement Sécurisé (Zone CEMAC Cameroun) :
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { 
                          id: 'MTN Mobile Money Cameroun (*126#)', 
                          label: 'MTN Mobile Money (*126#)', 
                          sub: 'Validation push USSD sur téléphone', 
                          color: 'amber' 
                        },
                        { 
                          id: 'Orange Money Cameroun (*150#)', 
                          label: 'Orange Money (*150#)', 
                          sub: 'Notification immédiate push', 
                          color: 'orange' 
                        },
                        { 
                          id: 'Carte Bancaire (Visa / Mastercard CEMAC)', 
                          label: 'Carte Bancaire Visa / Mastercard', 
                          sub: 'Chiffrement bancaire 3D-Secure', 
                          color: 'indigo' 
                        },
                        { 
                          id: 'Virement Bancaire (Afriland First Bank)', 
                          label: 'Virement DISCOM SARL', 
                          sub: 'Compte Afriland First Bank Cameroun', 
                          color: 'slate' 
                        },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setRegPaymentMethod(pm.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            regPaymentMethod === pm.id
                              ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">{pm.label}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{pm.sub}</span>
                          </div>
                          {regPaymentMethod === pm.id && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Numéro de téléphone pour prélèvement Mobile Money */}
                  {(regPaymentMethod.includes('MTN') || regPaymentMethod.includes('Orange')) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Numéro Mobile Money pour le débit push :
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          id="reg-payment-phone-input"
                          value={regPaymentPhone}
                          onChange={(e) => setRegPaymentPhone(e.target.value)}
                          placeholder="+237 6XX XX XX XX"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Un message push avec demande de code PIN apparaîtra sur ce numéro.
                      </span>
                    </div>
                  )}

                  {/* Financial Breakdown Summary Box */}
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Formule choisie :</span>
                      <span className="font-bold text-white">{chosenPlan.nom} ({regDuration} mois)</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Sous-total brut :</span>
                      <span>{formatFCFA(grossTotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                        <span>Remise accordée ({discountPercent}%) :</span>
                        <span>- {formatFCFA(discountAmount)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-300 block">
                          Total Net à Régler :
                        </span>
                        <span className="text-[10px] text-slate-400">Toutes taxes comprises (TTC)</span>
                      </div>
                      <span className="text-xl font-black text-amber-400">
                        {formatFCFA(netAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Changer de Forfait</span>
                    </button>

                    <button
                      type="submit"
                      id="btn-step3-submit-payment"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Valider le Paiement & Activer mon Compte</span>
                    </button>
                  </div>
                </form>
              )}

              {/* =============================================================== */}
              {/* STEP 4: TRAITEMENT & SIMULATION DU PAIEMENT EN COURS            */}
              {/* =============================================================== */}
              {regStep === 4 && (
                <div className="text-center py-6 space-y-5 animate-in fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>

                  <div>
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold mb-2">
                      Validation en cours...
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Communication sécurisée avec la passerelle {regPaymentMethod.includes('Orange') ? 'Orange Money' : 'MTN MoMo'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
                      Une invite de prélèvement de <strong className="text-slate-900 font-bold">{formatFCFA(netAmount)}</strong> a été transmise au numéro <strong className="text-slate-900 font-bold">{regPaymentPhone}</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-sm mx-auto space-y-1 text-left">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      Consigne sur votre téléphone :
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      1. Tapez votre code secret PIN pour confirmer la transaction.<br />
                      2. Validation automatique dans <strong className="text-indigo-600 font-mono font-bold text-sm">{paymentCountdown}s</strong>...
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={finalizeRegistration}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Confirmer Immédiatement le Paiement</span>
                  </button>
                </div>
              )}

              {/* =============================================================== */}
              {/* STEP 5: COMPTE CRÉÉ & FACTURE OFFICIELLE DISCOM                 */}
              {/* =============================================================== */}
              {regStep === 5 && createdSubscription && (
                <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-2">
                      Compte Activé & Abonnement Validé
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Bienvenue sur DISCOM, {regName} !
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                      Votre compte bailleur a été configuré avec succès avec le forfait{' '}
                      <strong className="text-indigo-600">{chosenPlan.nom}</strong> pour une durée de {regDuration} mois.
                    </p>
                  </div>

                  {/* Facture DISCOM Acquittée */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-3 max-w-md mx-auto">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <div>
                        <span className="font-black text-slate-800 text-xs block">DISCOM SARL Cameroun</span>
                        <span className="text-[10px] text-slate-400">RC/DLA/2024/B/1892 · Douala Bonanjo</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                        FACTURE ACQUITTÉE
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span>N° Facture :</span>
                        <span className="font-mono font-bold text-slate-800">{createdSubscription.facture_numero}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Réf. Transaction :</span>
                        <span className="font-mono text-slate-800">{createdSubscription.reference_transaction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Montant Réglé :</span>
                        <span className="font-bold text-emerald-700">{formatFCFA(createdSubscription.montant_paye_fcfa)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mode de Paiement :</span>
                        <span>{createdSubscription.mode_paiement}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Validité de l'Abonnement :</span>
                        <span className="font-bold text-indigo-700">Jusqu'au {createdSubscription.date_expiration}</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimer le Reçu</span>
                    </button>

                    <button
                      type="button"
                      id="btn-access-dashboard-after-registration"
                      onClick={() => {
                        if (onClose) onClose();
                        setActiveTab('dashboard');
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Accéder à mon Espace Propriétaire</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-6">
          <span>🔒 Chiffrement SSL 256 bits · DISCOM SaaS</span>
          <span>Support : support@discom.cm</span>
        </div>

      </div>
    </div>
  );
};

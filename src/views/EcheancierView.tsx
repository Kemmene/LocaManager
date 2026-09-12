import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CalendarClock, 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Sliders, 
  Play, 
  Clock, 
  Check, 
  User, 
  Building,
  Sparkles,
  Info,
  ShieldCheck,
  MessageCircle
} from 'lucide-react';
import { formatDateFR, formatFCFA } from '../utils/formatters';

export const EcheancierView: React.FC = () => {
  const { 
    baux, 
    locataires, 
    logements, 
    pieces, 
    notifications, 
    notificationSettings, 
    updateNotificationSettings, 
    triggerManualCronCheck,
    markNotificationAsRead,
    currentUser,
    subscriptions,
    subscriptionPlans,
    allUsers
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState<'chronologie' | 'alertes' | 'parametres'>('chronologie');
  const [cronRunning, setCronRunning] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  const handleRunCron = () => {
    setCronRunning(true);
    setCronMessage('Exécution du robot de détection automatique...');
    setTimeout(() => {
      triggerManualCronCheck();
      setCronRunning(false);
      setCronMessage('Simulation terminée ! Les alertes applicables ont été générées avec succès.');
      setTimeout(() => setCronMessage(null), 4000);
    }, 1000);
  };

  // -------------------------------------------------------------
  // SUPERADMIN VIEW: ÉCHÉANCIER DES ABONNEMENTS ET ALERTES SAAS
  // -------------------------------------------------------------
  if (currentUser.role === 'superadmin') {
    const now = new Date();
    const subsWithDiff = subscriptions.map(sub => {
      const user = allUsers.find(u => u.id === sub.user_id);
      const plan = subscriptionPlans.find(p => p.id === sub.plan_id);
      const expDate = new Date(sub.date_expiration);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        sub,
        user,
        plan,
        daysRemaining: diffDays,
        isExpired: diffDays < 0 || sub.statut === 'expire'
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h1 className="text-xl font-bold tracking-tight">
                Alertes & Échéancier SaaS DISCOM
              </h1>
            </div>
            <p className="text-xs text-slate-300">
              Supervision des échéances d'abonnements, rappels automatiques et alertes d'impayés de forfaits
            </p>
          </div>

          <button 
            onClick={handleRunCron}
            disabled={cronRunning}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${cronRunning ? 'animate-spin' : ''}`} />
            <span>{cronRunning ? 'Analyse...' : 'Déclencher Vérification SaaS'}</span>
          </button>
        </div>

        {cronMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cronMessage}</span>
          </div>
        )}

        {/* Subscriptions Expiration Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Échéances des Abonnements Bailleurs ({subsWithDiff.length})
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">Relances automatiques J-30 et J-7 actives</span>
          </div>

          <div className="divide-y divide-slate-200">
            {subsWithDiff.map(({ sub, user, plan, daysRemaining, isExpired }) => (
              <div key={sub.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isExpired 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : daysRemaining <= 30 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {isExpired ? 'ÉCHU' : `J-${daysRemaining}`}
                  </div>

                  <div>
                    <h3 className="font-bold text-xs text-slate-800">
                      {user?.name || 'Bailleur'} ({user?.entreprise || 'Particulier'})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Forfait : <strong className="text-indigo-600">{plan?.nom}</strong> • {user?.phonenumber} • {user?.ville || 'Douala'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Paiement : {sub.mode_paiement} • Expiration le {formatDateFR(sub.date_expiration)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isExpired 
                      ? 'bg-red-100 text-red-800' 
                      : daysRemaining <= 30 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isExpired ? 'Expiré - Renouvellement Requis' : `${daysRemaining} jours restants`}
                  </span>

                  <button 
                    onClick={() => {
                      const msg = `Bonjour ${user?.name}, votre abonnement ${plan?.nom} LocaManager arrive à échéance le ${formatDateFR(sub.date_expiration)}. Renouvelez par MTN ou Orange Money pour continuer à gérer vos logements sans interruption.`;
                      const cleanPhone = user?.phonenumber?.replace(/\D/g, '') || '';
                      window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>Relance WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // BAILLEUR VIEW: ÉCHÉANCIER DES BAUX ET ALERTES DE LOYERS
  // -------------------------------------------------------------
  const now = new Date();
  const activeBaux = baux.filter(b => b.statut === 'actif').map(b => {
    const loc = locataires.find(l => l.id === b.locataire_id);
    const log = logements.find(l => l.id === b.logement_id);
    const piece = pieces.find(p => p.id === b.piece_id);
    const expiryDate = new Date(b.date_echeance_reelle);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      bail: b,
      locataire: loc,
      logement: log,
      piece: piece,
      daysRemaining: diffDays,
      expiryDateFormatted: formatDateFR(b.date_echeance_reelle),
      theoriqueFormatted: formatDateFR(b.date_echeance_theorique),
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Échéancier Intelligent & Alertes de Paiement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Surveillance automatique des échéances de baux, calcul des mois d'avance et relances d'impayés
          </p>
        </div>

        <button 
          onClick={handleRunCron}
          disabled={cronRunning}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${cronRunning ? 'animate-spin' : ''}`} />
          <span>{cronRunning ? 'Vérification...' : 'Lancer Simulation Robot'}</span>
        </button>
      </div>

      {/* Feedback banner */}
      {cronMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cronMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'chronologie', label: 'Calendrier des Échéances de Baux', icon: CalendarClock },
          { id: 'alertes', label: `Alertes Actives (${notifications.length})`, icon: Bell },
          { id: 'parametres', label: 'Paramètres & Modèles SMS/WhatsApp', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTabSub === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabSub(tab.id as any)}
              className={`
                px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Chronologie des baux */}
      {activeTabSub === 'chronologie' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contrats de bail en cours & échéances réelles
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">Prend en compte les mois d'avance versés</span>
            </div>

            <div className="divide-y divide-slate-200">
              {activeBaux.map(({ bail, locataire, logement, piece, daysRemaining, expiryDateFormatted, theoriqueFormatted }) => {
                const isUrgent = daysRemaining <= 30;
                const isVeryUrgent = daysRemaining <= 7;

                return (
                  <div key={bail.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold text-xs shrink-0 border ${
                        isVeryUrgent 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : isUrgent 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Reste</span>
                        <span className="text-xs font-extrabold">{daysRemaining > 0 ? `${daysRemaining}j` : 'Échu'}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xs text-slate-800">{locataire?.nom_complet}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {piece?.nom} ({piece?.type})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {logement?.nom} • {logement?.adresse}, {logement?.ville}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-1 font-medium">
                          <span>Loyer : {formatFCFA(bail.montant_loyer_fcfa + bail.montant_charges_fcfa)}/mois</span>
                          <span>Avance versée : {bail.mois_avance} mois ({formatFCFA(bail.montant_avance_fcfa)})</span>
                          <span>Fin réelle : <strong>{expiryDateFormatted}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button 
                        onClick={() => {
                          const cleanPhone = locataire?.telephone_principal?.replace(/\D/g, '') || '';
                          const text = `Bonjour ${locataire?.nom_complet}, nous vous rappelons que votre contrat de bail pour ${piece?.nom} (${logement?.nom}) arrive à échéance le ${expiryDateFormatted}. Merci de nous contacter pour convenir du renouvellement. Cordialement.`;
                          window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>Relance WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Alertes et Notifications */}
      {activeTabSub === 'alertes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Flux des Alertes & Notifications Récentes ({notifications.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucune alerte en attente. Tous les paiements et baux sont à jour.
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`p-4 flex items-start justify-between gap-3 ${notif.is_read ? 'bg-white' : 'bg-slate-50/70'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      notif.severity === 'error' ? 'bg-red-100 text-red-700' : notif.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">{notif.titre}</h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{notif.date} • Canal : {notif.canal.toUpperCase()}</span>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <button 
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                    >
                      Marquer lu
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Paramètres */}
      {activeTabSub === 'parametres' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Configuration des Paliers de Relances Automatiques
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
              <span className="text-xs font-semibold text-slate-700">Rappel fin de bail J-30</span>
              <input 
                type="checkbox" 
                checked={notificationSettings.echeance_j30} 
                onChange={(e) => updateNotificationSettings({ echeance_j30: e.target.checked })} 
                className="rounded text-indigo-600" 
              />
            </label>
            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
              <span className="text-xs font-semibold text-slate-700">Rappel urgent fin de bail J-7</span>
              <input 
                type="checkbox" 
                checked={notificationSettings.echeance_j7} 
                onChange={(e) => updateNotificationSettings({ echeance_j7: e.target.checked })} 
                className="rounded text-indigo-600" 
              />
            </label>
            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
              <span className="text-xs font-semibold text-slate-700">Alerte impayé dès J+1</span>
              <input 
                type="checkbox" 
                checked={notificationSettings.impaye_j1} 
                onChange={(e) => updateNotificationSettings({ impaye_j1: e.target.checked })} 
                className="rounded text-indigo-600" 
              />
            </label>
            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
              <span className="text-xs font-semibold text-slate-700">Relance ferme J+15 avec mise en demeure</span>
              <input 
                type="checkbox" 
                checked={notificationSettings.impaye_j15} 
                onChange={(e) => updateNotificationSettings({ impaye_j15: e.target.checked })} 
                className="rounded text-indigo-600" 
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

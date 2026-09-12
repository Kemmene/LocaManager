import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Menu, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  User, 
  Building2, 
  LogOut, 
  Layers, 
  ChevronDown,
  Info,
  Check,
  Crown,
  Sparkles,
  Lock
} from 'lucide-react';
import { formatDateFR } from '../utils/formatters';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenHelpModal: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onOpenHelpModal,
  onOpenAuthModal
}) => {
  const { 
    currentUser, 
    allUsers, 
    switchUser, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    searchQuery, 
    setSearchQuery,
    setActiveTab,
    logout,
    setIsPlanModalOpen,
    subscriptionPlans
  } = useApp();

  const userPlan = subscriptionPlans.find(p => p.id === currentUser.abonnement_id) || subscriptionPlans[1];

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button 
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            L
          </div>
          <span className="font-bold text-slate-800 text-sm">LocaManager</span>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex items-center relative w-72 lg:w-84">
          <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un locataire, bien, lot..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-[10px] text-slate-400 hover:text-slate-600 font-medium"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Middle/Role Switcher */}
      <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-600" /> Profil:
        </span>
        {allUsers.map((u) => {
          const isSelected = u.id === currentUser.id;
          let roleLabel = 'Bailleur';
          if (u.role === 'superadmin') roleLabel = 'SuperAdmin';
          if (u.role === 'locataire') roleLabel = 'Locataire';
          if (u.role === 'gerant_adjoint') roleLabel = 'Gérant';

          return (
            <button
              key={u.id}
              onClick={() => switchUser(u.id)}
              className={`
                px-2 py-0.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer
                ${isSelected 
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <span>{roleLabel}</span>
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
            </button>
          );
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Version Badge */}
        <div className="hidden lg:block px-2 py-1 bg-slate-100 rounded text-slate-600 text-[10px] font-mono font-bold tracking-wider border border-slate-200">
          DISCOM-V1.0
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Notifications</h4>
                  <p className="text-[10px] text-slate-500">
                    {unreadCount > 0 ? `${unreadCount} alerte(s) non lue(s)` : 'Toutes les alertes sont à jour'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllNotificationsAsRead}
                    className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Tout marquer lu
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Aucune notification
                  </div>
                ) : (
                  notifications.map((n) => {
                    let Icon = Info;
                    let iconBg = 'text-blue-600 bg-blue-50';
                    if (n.severity === 'error') {
                      Icon = ShieldAlert;
                      iconBg = 'text-red-600 bg-red-50';
                    } else if (n.severity === 'warning') {
                      Icon = AlertTriangle;
                      iconBg = 'text-orange-600 bg-orange-50';
                    } else if (n.severity === 'success') {
                      Icon = CheckCircle2;
                      iconBg = 'text-emerald-600 bg-emerald-50';
                    }

                    return (
                      <div 
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.type.startsWith('impaye_')) setActiveTab('paiements');
                          else if (n.type.startsWith('echeance_')) setActiveTab('echeancier');
                        }}
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors flex gap-2.5 ${!n.is_read ? 'bg-indigo-50/40' : ''}`}
                      >
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className={`text-xs font-bold truncate ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                              {n.titre}
                            </h5>
                            {!n.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 ml-1"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-tight">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                            <span>{formatDateFR(n.date)}</span>
                            <span className="uppercase font-semibold px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                              {n.canal}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button 
                  onClick={() => {
                    setIsNotifOpen(false);
                    setActiveTab('echeancier');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Voir tout l'échéancier & configurer alertes →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help button */}
        <button 
          onClick={onOpenHelpModal}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors hidden sm:flex"
          title="Guide & Aide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

        {/* User profile dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            <img 
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-400 block capitalize">
                {currentUser.role === 'superadmin' ? 'SuperAdmin' : currentUser.role === 'locataire' ? 'Locataire' : currentUser.role === 'gerant_adjoint' ? 'Gérant' : 'Bailleur'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 z-50 p-1.5">
              <div className="p-2.5 border-b border-slate-100">
                <p className="font-bold text-xs text-slate-800">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                {currentUser.entreprise && (
                  <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                    {currentUser.entreprise}
                  </span>
                )}
              </div>

              <div className="py-1 space-y-0.5">
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setActiveTab('parametres');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mon Profil & Abonnement</span>
                </button>

                {currentUser.role === 'bailleur' && (
                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('logements');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md transition-colors text-left"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mon Portefeuille de Biens</span>
                  </button>
                )}

                <div className="my-1 border-t border-slate-100"></div>

                <button 
                  id="header-switch-account-btn"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors font-medium text-left cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Connexion / Inscription Propriétaire</span>
                </button>

                {currentUser.role !== 'bailleur' && currentUser.role !== 'gerant_adjoint' ? (
                  <button 
                    id="header-logout-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Se déconnecter</span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 mt-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Session Propriétaire Verrouillée</span>
                    </div>
                    <p className="text-[10px] text-amber-800 mt-1 leading-tight">
                      Conformément à la politique DISCOM, seul le SuperAdmin peut déconnecter un compte propriétaire.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


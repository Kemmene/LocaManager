import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Building2, 
  DoorOpen, 
  Users, 
  CalendarClock, 
  CreditCard, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  UserCheck, 
  X,
  PackageCheck,
  LogOut,
  UserPlus,
  Crown,
  Sparkles,
  Lock
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenNewHousingModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    notifications, 
    logout, 
    setIsAuthModalOpen,
    setIsPlanModalOpen,
    subscriptionPlans,
    subscriptions
  } = useApp();

  const userSub = subscriptions.find(s => s.user_id === currentUser.id && s.statut === 'actif');
  const currentPlan = subscriptionPlans.find(p => p.id === currentUser.abonnement_id) || subscriptionPlans[1];

  const unreadAlertsCount = notifications.filter(
    n => !n.is_read && (n.type.startsWith('echeance_') || n.type.startsWith('impaye_'))
  ).length;

  // Items configuration based on role
  let navItems: Array<{
    id: string;
    label: string;
    icon: any;
    badge?: number;
    highlight?: boolean;
  }> = [];

  if (currentUser.role === 'superadmin') {
    // SuperAdmin menu: Back-office first, no housing/tenants pages, Paiements renamed to Abonnements, Paramètres at the bottom
    navItems = [
      { id: 'superadmin', label: 'Back-Office DISCOM', icon: ShieldCheck, highlight: true },
      { id: 'paiements', label: 'Abonnements', icon: CreditCard },
      { 
        id: 'echeancier', 
        label: 'Échéancier & Alertes', 
        icon: CalendarClock,
        badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined 
      },
      { id: 'rapports', label: 'Rapports Plateforme', icon: BarChart3 },
      { id: 'parametres', label: 'Paramètres', icon: Settings },
    ];
  } else if (currentUser.role === 'locataire') {
    // Locataire menu
    navItems = [
      { id: 'locataire_portal', label: 'Espace Locataire', icon: UserCheck, highlight: true },
      { id: 'parametres', label: 'Paramètres', icon: Settings },
    ];
  } else {
    // Bailleur menu (Bailleur Pro / Agence)
    navItems = [
      { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
      { id: 'logements', label: 'Biens', icon: Building2 },
      { id: 'pieces', label: 'Logements', icon: DoorOpen },
      { id: 'gerants', label: 'Gérant', icon: UserPlus },
      { id: 'locataires', label: 'Locataires', icon: Users },
      { 
        id: 'echeancier', 
        label: 'Échéancier & Alertes', 
        icon: CalendarClock,
        badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined 
      },
      { id: 'paiements', label: 'Paiements & Quittances', icon: CreditCard },
      { id: 'abonnement_modal', label: 'Forfaits & Tarifs CA', icon: Crown, highlight: true },
      { id: 'rapports', label: 'Rapports Financiers', icon: BarChart3 },
      { id: 'parametres', label: 'Paramètres', icon: Settings },
    ];
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out
          lg:static lg:inset-auto lg:h-screen lg:translate-x-0 lg:z-30 lg:flex-shrink-0
          ${isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-xs">
                LM
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-800 block leading-tight">
                  LocaManager
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  {currentUser.role === 'superadmin' ? 'DISCOM Back-Office' : 'DISCOM Cameroun'}
                </span>
              </div>
            </div>

            <button 
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role Pill */}
          <div className="px-3 pt-3">
            <div className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold flex items-center justify-between ${
              currentUser.role === 'superadmin' 
                ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                : currentUser.role === 'locataire' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : currentUser.role === 'gerant_adjoint'
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
            }`}>
              <span className="uppercase tracking-wider">
                {currentUser.role === 'superadmin' 
                  ? '🛡️ Administration DISCOM' 
                  : currentUser.role === 'locataire' 
                  ? '👤 Espace Locataire' 
                  : currentUser.role === 'gerant_adjoint'
                  ? '📋 Espace Gérant'
                  : '🏢 Gestion Bailleur'}
              </span>
              <span className="text-[10px] bg-white px-1.5 py-0.5 rounded shadow-2xs font-bold">
                {currentUser.role === 'superadmin' ? 'SaaS' : currentUser.role === 'gerant_adjoint' ? 'Délégué' : 'Cameroun'}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => {
                    if (item.id === 'abonnement_modal') {
                      setIsPlanModalOpen(true);
                    } else {
                      setActiveTab(item.id);
                    }
                    onCloseMobile();
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-md font-medium text-xs transition-colors group text-left cursor-pointer
                    ${item.id === 'abonnement_modal'
                      ? 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 font-bold border border-indigo-100/80'
                      : isActive 
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${
                      item.id === 'abonnement_modal' 
                        ? 'text-amber-500' 
                        : isActive 
                        ? 'text-white' 
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                      isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.id === 'abonnement_modal' && (
                    <span className="text-[9px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                      SaaS
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User profile footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2.5 p-1 rounded-md">
              <img 
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                className="w-8 h-8 rounded-full bg-slate-100 object-cover border border-slate-200 shrink-0" 
                alt="" 
              />
              <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-slate-800 uppercase tracking-wide">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {currentUser.role === 'superadmin' 
                    ? 'SuperAdmin DISCOM' 
                    : currentUser.role === 'locataire' 
                    ? 'Locataire' 
                    : currentUser.role === 'gerant_adjoint'
                    ? 'Gérant'
                    : 'Bailleur Douala'}
                </p>
              </div>
              {currentUser.role !== 'bailleur' && currentUser.role !== 'gerant_adjoint' ? (
                <button
                  type="button"
                  id="sidebar-logout-icon-btn"
                  onClick={logout}
                  title="Se déconnecter"
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <span title="Session active verrouillée. Seul le SuperAdmin DISCOM peut déconnecter ce propriétaire.">
                  <Lock className="w-4 h-4 text-amber-600" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
              {currentUser.role === 'superadmin' && (
                <button
                  type="button"
                  id="sidebar-auth-modal-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex-1 py-1 px-2 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-100 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Nouveau compte</span>
                </button>
              )}
              {currentUser.role !== 'bailleur' && currentUser.role !== 'gerant_adjoint' ? (
                <button
                  type="button"
                  id="sidebar-logout-text-btn"
                  onClick={logout}
                  className="py-1 px-2 text-[10px] font-semibold text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded text-center transition-colors cursor-pointer"
                >
                  Déconnexion
                </button>
              ) : (
                <div 
                  className="w-full py-1 px-2 text-[9px] font-bold text-amber-800 bg-amber-50 rounded border border-amber-200/60 text-center flex items-center justify-center gap-1"
                  title="Session active gérée par la plateforme DISCOM"
                >
                  <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Espace Gestionnaire Actif</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

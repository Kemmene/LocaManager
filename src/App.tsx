'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { QuittanceModal } from './components/QuittanceModal';
import { NewPieceModal } from './components/NewPieceModal';
import { NewLeaseModal } from './components/NewLeaseModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { NewHousingModal } from './components/NewHousingModal';

// Views
import { DashboardView } from './views/DashboardView';
import { LogementsView } from './views/LogementsView';
import { PiecesView } from './views/PiecesView';
import { LocatairesView } from './views/LocatairesView';
import { EcheancierView } from './views/EcheancierView';
import { PaiementsView } from './views/PaiementsView';
import { RapportsView } from './views/RapportsView';
import { SuperAdminView } from './views/SuperAdminView';
import { LocatairePortalView } from './views/LocatairePortalView';
import { ParametresView } from './views/ParametresView';
import { AuthView } from './views/AuthView';
import { GerantsAdjointsView } from './views/GerantsAdjointsView';

const MainLayout: React.FC = () => {
  const { 
    activeTab, 
    currentUser, 
    selectedQuittancePaiement,
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isPlanModalOpen,
    setIsPlanModalOpen,
    selectedPlanForCheckout
  } = useApp();

  // Mobile sidebar state
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Modals control
  const [isHousingModalOpen, setIsHousingModalOpen] = useState(false);
  const [housingModalMode, setHousingModalMode] = useState<'single' | 'batch'>('single');
  const [isPieceModalOpen, setIsPieceModalOpen] = useState(false);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleOpenNewHousing = (mode: 'single' | 'batch' = 'single') => {
    setHousingModalMode(mode);
    setIsHousingModalOpen(true);
  };

  // If user is not authenticated, display full AuthView page
  if (!isAuthenticated) {
    return <AuthView />;
  }

  // Render the matching view based on role & active tab
  const renderCurrentView = () => {
    // If tenant role, default to tenant portal
    if (currentUser.role === 'locataire' && activeTab !== 'parametres') {
      return <LocatairePortalView />;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            onOpenNewHousing={() => handleOpenNewHousing('single')}
            onOpenNewPiece={() => setIsPieceModalOpen(true)}
            onOpenNewLease={() => setIsLeaseModalOpen(true)}
          />
        );
      case 'logements':
        return (
          <LogementsView 
            onOpenNewHousing={handleOpenNewHousing}
            onOpenNewPiece={() => setIsPieceModalOpen(true)} 
          />
        );
      case 'pieces':
        return (
          <PiecesView 
            onOpenNewPiece={() => setIsPieceModalOpen(true)} 
            onOpenNewLeaseForPiece={() => setIsLeaseModalOpen(true)}
          />
        );
      case 'gerants':
        return <GerantsAdjointsView />;
      case 'locataires':
        return <LocatairesView onOpenNewLease={() => setIsLeaseModalOpen(true)} />;
      case 'echeancier':
        return <EcheancierView />;
      case 'paiements':
        return <PaiementsView />;
      case 'rapports':
        return <RapportsView />;
      case 'superadmin':
        return <SuperAdminView />;
      case 'locataire_portal':
        return <LocatairePortalView />;
      case 'parametres':
        return <ParametresView />;
      default:
        if (currentUser.role === 'superadmin') {
          return <SuperAdminView />;
        }
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header 
          onToggleMobileSidebar={() => setIsSidebarMobileOpen(prev => !prev)}
          onOpenHelpModal={() => setIsHelpModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic View Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Auth Modal (when triggered while authenticated) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <AuthView isModal onClose={() => setIsAuthModalOpen(false)} />
        </div>
      )}

      {/* Official Quittance Print / Share / WhatsApp Modal */}
      {selectedQuittancePaiement && (
        <QuittanceModal />
      )}

      {/* Other Modals */}
      <NewHousingModal 
        isOpen={isHousingModalOpen}
        onClose={() => setIsHousingModalOpen(false)}
        initialMode={housingModalMode}
      />

      {isPlanModalOpen && (
        <SubscriptionModal 
          onClose={() => setIsPlanModalOpen(false)}
          initialPlan={selectedPlanForCheckout}
        />
      )}

      <NewPieceModal 
        isOpen={isPieceModalOpen}
        onClose={() => setIsPieceModalOpen(false)}
      />

      <NewLeaseModal 
        isOpen={isLeaseModalOpen}
        onClose={() => setIsLeaseModalOpen(false)}
      />

      <HelpGuideModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

import React from 'react';
import { X, BookOpen, CheckCircle2, ShieldCheck, Zap, Bell, FileText, Smartphone } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 bg-[#0b1c30] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#6cf8bb]" />
            <h3 className="font-bold text-[17px]">Guide Complet d'Utilisation - LocaManager SaaS</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-[13px] text-[#45464d]">
          {/* Intro */}
          <div>
            <h4 className="font-bold text-[15px] text-[#0b1c30] mb-1">
              Bienvenue sur LocaManager SaaS DISCOM
            </h4>
            <p>
              LocaManager est la plateforme tout-en-un conçue pour les bailleurs immobiliers, agences et locataires en Afrique de l'Ouest et zone OHADA.
            </p>
          </div>

          {/* Key modules */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#c6c6cd]/50 space-y-1">
              <div className="flex items-center gap-2 text-[#0b1c30] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#006c49]" />
                <span>1. Structure : Logements & Pièces (Lots)</span>
              </div>
              <p>
                Un propriétaire crée un <strong>Logement</strong> (Immeuble, Villa, Résidence) puis lui rattache ses <strong>Pièces</strong> (studios, 2 pièces, commerces). Vous pouvez filtrer et suivre les unités libres ou occupées par statut Kanban.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#c6c6cd]/50 space-y-1">
              <div className="flex items-center gap-2 text-[#0b1c30] font-bold">
                <Bell className="w-4 h-4 text-[#006c49]" />
                <span>2. Échéances Théoriques vs Réelles & Alertes J-30 à J+15</span>
              </div>
              <p>
                Le moteur calcule l'échéance théorique du bail et réajuste immédiatement l'échéance réelle en fonction des mois d'avance versés. Les alertes SMS, WhatsApp et Email partent automatiquement à chaque palier.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#c6c6cd]/50 space-y-1">
              <div className="flex items-center gap-2 text-[#0b1c30] font-bold">
                <FileText className="w-4 h-4 text-[#006c49]" />
                <span>3. Encaissements en 1 Clic & Quittances de Loyer A4</span>
              </div>
              <p>
                Basculez un loyer en payé d'un clic dans la matrice. La quittance officielle conforme avec QR Code et signature est prête à être imprimée ou partagée directement sur WhatsApp.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#c6c6cd]/50 space-y-1">
              <div className="flex items-center gap-2 text-[#0b1c30] font-bold">
                <Zap className="w-4 h-4 text-[#006c49]" />
                <span>4. Multi-Rôles : SuperAdmin, Bailleur, Locataire</span>
              </div>
              <p>
                Changez instantanément d'utilisateur et de rôle à l'aide du sélecteur en haut à droite pour tester l'expérience de chaque acteur.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#c6c6cd]/40">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-[#0b1c30] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1f2d40]"
            >
              Compris, j'ai tout ce qu'il me faut !
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

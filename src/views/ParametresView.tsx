import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  User, 
  Building, 
  CreditCard, 
  Bell, 
  ShieldCheck, 
  Check, 
  CheckCircle2, 
  Zap, 
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { formatFCFA } from '../utils/formatters';

export const ParametresView: React.FC = () => {
  const { 
    currentUser, 
    updateUserProfile, 
    subscriptionPlans, 
    subscriptions, 
    upgradeSubscription,
    setIsPlanModalOpen,
    setSelectedPlanForCheckout,
    deleteUser
  } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phonenumber, setPhonenumber] = useState(currentUser.phonenumber);
  const [pays, setPays] = useState(currentUser.pays);
  const [ville, setVille] = useState(currentUser.ville || 'Douala');
  const [entreprise, setEntreprise] = useState(currentUser.entreprise || 'DISCOM Immo SARL');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentPlan = subscriptionPlans.find(p => p.id === currentUser.abonnement_id) || subscriptionPlans[1];
  const userSub = subscriptions.find(s => s.user_id === currentUser.id && s.statut === 'actif');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      email,
      phonenumber,
      pays,
      ville,
      entreprise
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="font-extrabold text-[26px] sm:text-[30px] text-[#0b1c30] tracking-tight">
          Paramètres & Profil
        </h2>
        <p className="text-[14px] text-[#45464d] mt-0.5">
          Gérez votre profil bailleur, les mentions légales de vos quittances et votre abonnement SaaS
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-[13px] font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Vos informations et mentions de quittance ont été enregistrées avec succès.</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl p-6 border border-[#c6c6cd]/50 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#c6c6cd]/40">
          <img 
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
            alt={currentUser.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#0b1c30]"
          />
          <div>
            <h3 className="font-bold text-[18px] text-[#0b1c30]">{currentUser.name}</h3>
            <p className="text-[12px] text-[#76777d]">
              Rôle : <span className="font-bold text-[#0b1c30]">
                {currentUser.role === 'superadmin' ? 'SuperAdmin DISCOM' : currentUser.role === 'locataire' ? 'Locataire' : currentUser.role === 'gerant_adjoint' ? 'Gérant' : 'Bailleur'}
              </span> • Compte actif depuis le {currentUser.created_at}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#45464d] mb-1">Nom complet / Gérant</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c6c6cd] rounded-xl text-[13px] text-[#0b1c30] focus:outline-none focus:border-[#0b1c30]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#45464d] mb-1">Société / Raison Sociale</label>
              <input 
                type="text"
                value={entreprise}
                onChange={(e) => setEntreprise(e.target.value)}
                placeholder="Ex: Immobilière du Golfe SARL"
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c6c6cd] rounded-xl text-[13px] text-[#0b1c30] focus:outline-none focus:border-[#0b1c30]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#45464d] mb-1">Email professionnel</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c6c6cd] rounded-xl text-[13px] text-[#0b1c30] focus:outline-none focus:border-[#0b1c30]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#45464d] mb-1">Téléphone de contact</label>
              <input 
                type="tel"
                value={phonenumber}
                onChange={(e) => setPhonenumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c6c6cd] rounded-xl text-[13px] text-[#0b1c30] focus:outline-none focus:border-[#0b1c30]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#45464d] mb-1">Ville de rattachement</label>
              <input 
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c6c6cd] rounded-xl text-[13px] text-[#0b1c30] focus:outline-none focus:border-[#0b1c30]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#45464d] mb-1">Pays</label>
              <input 
                type="text"
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c6c6cd] rounded-xl text-[13px] text-[#0b1c30] focus:outline-none focus:border-[#0b1c30]"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit"
              className="px-6 py-2.5 bg-[#0b1c30] text-white font-semibold text-[13px] rounded-xl hover:bg-[#1f2d40] transition-colors shadow-sm"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>

      {/* Subscription Tier Section (For Bailleurs) */}
      {currentUser.role === 'bailleur' && (
        <div className="bg-white rounded-2xl p-6 border border-[#c6c6cd]/50 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#006c49]">Abonnement SaaS DISCOM</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                  3 Mois Offerts sur tous les forfaits
                </span>
              </div>
              <h3 className="font-bold text-[18px] text-[#0b1c30]">
                Votre Formule Actuelle : <span className="text-[#006c49]">{currentPlan.nom}</span>
              </h3>
              {userSub?.date_expiration && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Valide jusqu'au <strong>{new Date(userSub.date_expiration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[12px] font-bold self-start">
                Actif & Certifié
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlanForCheckout(currentPlan);
                  setIsPlanModalOpen(true);
                }}
                className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Prolonger / Changer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subscriptionPlans.map((plan) => {
              const isCurrent = plan.id === currentPlan.id;

              return (
                <div 
                  key={plan.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${isCurrent ? 'border-[#0b1c30] bg-[#f8f9ff]' : 'border-[#c6c6cd]/40 bg-white'}`}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded block w-fit mb-1.5">
                      {plan.tranche_ca_label || 'Paliers CA'}
                    </span>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[15px] text-[#0b1c30]">{plan.nom}</h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-[#0b1c30] text-white px-2 py-0.5 rounded">
                          Actuel
                        </span>
                      )}
                    </div>
                    <div className="my-2">
                      <span className="text-[20px] font-extrabold text-[#006c49]">
                        {formatFCFA(plan.prix_fcfa)}
                      </span>
                      <span className="text-[11px] text-[#76777d]"> /mois</span>
                      <p className="text-[10px] font-bold text-emerald-700">3 premiers mois gratuits</p>
                    </div>

                    <p className="text-[11px] text-[#45464d] mb-3 leading-tight">
                      Jusqu'à <strong>{plan.max_logements >= 999 ? 'Illimités' : `${plan.max_logements} biens`}</strong> et <strong>{plan.max_pieces >= 999 ? 'Illimités' : `${plan.max_pieces} logements`}</strong>.
                    </p>

                    <ul className="space-y-1 text-[11px] text-[#45464d]">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
                          <span className="line-clamp-1">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#c6c6cd]/30">
                    <button 
                      type="button"
                      id={`choose-plan-settings-${plan.id}`}
                      onClick={() => {
                        setSelectedPlanForCheckout(plan);
                        setIsPlanModalOpen(true);
                      }}
                      className={`w-full py-2 font-bold text-[12px] rounded-xl transition-colors shadow-xs cursor-pointer ${
                        isCurrent 
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white' 
                          : 'bg-[#0b1c30] hover:bg-[#1f2d40] text-white'
                      }`}
                    >
                      {isCurrent ? 'Renouveler' : `Choisir ${plan.nom}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Danger Zone: Supprimer un compte Propriétaire / Bailleur */}
      {currentUser.role === 'bailleur' && (
        <div className="bg-red-50/70 rounded-2xl p-6 border border-red-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-[16px] text-red-900">
                  Zone de Danger : Suppression du Propriétaire (Bailleur)
                </h3>
              </div>
              <p className="text-[12px] text-red-700 mt-1 max-w-2xl">
                Permet au bailleur de supprimer définitivement son compte propriétaire. Cette action irréversible efface l'ensemble de ses biens immobiliers, logements, contrats de bail, locataires et quittances associées.
              </p>
            </div>

            <button
              type="button"
              id="btn-delete-bailleur-account"
              onClick={() => {
                setDeleteError(null);
                setDeleteConfirmationText('');
                setIsDeleteModalOpen(true);
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer le compte Propriétaire</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Owner Deletion */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Confirmer la suppression du Propriétaire
                  </h4>
                  <p className="text-xs text-slate-500">
                    Propriétaire : <strong>{currentUser.name}</strong> ({currentUser.entreprise || 'Bailleur'})
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-2">
              <p className="font-bold">
                ⚠️ Attention : Cette suppression est définitive et irréversible !
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-red-700">
                <li>Tous vos biens immobiliers et logements seront supprimés</li>
                <li>Tous les locataires rattachés et contrats de baux seront archivés/supprimés</li>
                <li>Toutes les quittances et historiques de paiement seront purgés</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tapez <strong>SUPPRIMER</strong> pour confirmer :
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            {deleteError && (
              <p className="text-xs text-red-600 font-semibold">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText !== 'SUPPRIMER'}
                onClick={() => {
                  if (deleteConfirmationText !== 'SUPPRIMER') return;
                  const res = deleteUser(currentUser.id);
                  if (res.success) {
                    setIsDeleteModalOpen(false);
                  } else {
                    setDeleteError(res.error || 'Erreur lors de la suppression.');
                  }
                }}
                className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                  deleteConfirmationText === 'SUPPRIMER' 
                    ? 'bg-red-600 hover:bg-red-700 cursor-pointer shadow-xs' 
                    : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

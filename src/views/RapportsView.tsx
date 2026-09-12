import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  Download, 
  Printer, 
  TrendingUp, 
  DollarSign, 
  Building, 
  PieChart as PieIcon, 
  FileSpreadsheet, 
  CheckCircle2,
  Users,
  ShieldCheck,
  Smartphone,
  Globe
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { formatFCFA, formatDateFR } from '../utils/formatters';

export const RapportsView: React.FC = () => {
  const { logements, pieces, locataires, paiements, subscriptions, subscriptionPlans, allUsers, currentUser } = useApp();

  // -------------------------------------------------------------
  // SUPERADMIN VIEW: RAPPORT DE GESTION DE LA PLATEFORME SAAS DISCOM
  // -------------------------------------------------------------
  if (currentUser.role === 'superadmin') {
    const bailleurs = allUsers.filter(u => u.role === 'bailleur');
    const totalAbonnementsEncaisse = subscriptions.reduce((sum, s) => sum + s.montant_paye_fcfa, 0);
    const mrr = subscriptions.filter(s => s.statut === 'actif').reduce((sum, s) => {
      const plan = subscriptionPlans.find(p => p.id === s.plan_id);
      return sum + (plan?.prix_fcfa || 0);
    }, 0);
    const arr = mrr * 12;

    const saasMonthlyData = [
      { mois: 'Oct 2025', mrr: 210000, nouveauxBailleurs: 4, volumeLoyers: 14500000 },
      { mois: 'Nov 2025', mrr: 280000, nouveauxBailleurs: 6, volumeLoyers: 19800000 },
      { mois: 'Déc 2025', mrr: 350000, nouveauxBailleurs: 7, volumeLoyers: 24200000 },
      { mois: 'Jan 2026', mrr: 455000, nouveauxBailleurs: 9, volumeLoyers: 31000000 },
      { mois: 'Fév 2026', mrr: 560000, nouveauxBailleurs: 12, volumeLoyers: 38500000 },
      { mois: 'Mar 2026', mrr: 685000, nouveauxBailleurs: 15, volumeLoyers: 45000000 },
    ];

    const planDistribution = [
      { name: 'Starter Bailleur (15k)', value: 18, color: '#6366f1' },
      { name: 'Professionnel (35k)', value: 42, color: '#059669' },
      { name: 'Entreprise & Agence (75k)', value: 12, color: '#0b1c30' },
    ];

    const geoDistribution = [
      { ville: 'Douala (Littoral)', bailleurs: 45, volume: '28.5M FCFA' },
      { ville: 'Yaoundé (Centre)', bailleurs: 22, volume: '14.2M FCFA' },
      { ville: 'Kribi / Limbé (Côte)', bailleurs: 5, volume: '2.3M FCFA' },
    ];

    const handleExportSaaSReport = () => {
      let csv = 'Mois,MRR (FCFA),Nouveaux Bailleurs,Volume Loyers Traités (FCFA)\n';
      saasMonthlyData.forEach(r => {
        csv += `"${r.mois}",${r.mrr},${r.nouveauxBailleurs},${r.volumeLoyers}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rapport_DISCOM_SaaS_Cameroun_2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="space-y-6">
        {/* Header SuperAdmin */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h1 className="text-xl font-bold tracking-tight">
                Rapports & Statistiques Plateforme DISCOM SaaS
              </h1>
            </div>
            <p className="text-xs text-slate-300">
              Indicateurs de performance SaaS, croissance des abonnements et flux financiers au Cameroun
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportSaaSReport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exporter CSV</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI SaaS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              MRR (Revenu Récurrent Mensuel)
            </span>
            <span className="text-xl font-extrabold text-indigo-700 block mt-1">
              {formatFCFA(mrr)}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +22.4% ce mois
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              ARR Projeté (Annuel)
            </span>
            <span className="text-xl font-extrabold text-slate-900 block mt-1">
              {formatFCFA(arr)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Sur base des souscriptions actives
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Volume de Loyers Traités
            </span>
            <span className="text-xl font-extrabold text-emerald-700 block mt-1">
              45.0M FCFA
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Gérés par les bailleurs via l'app
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Taux de Rétention SaaS
            </span>
            <span className="text-xl font-extrabold text-slate-800 block mt-1">
              96.8%
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              Churn très faible (Cameroun)
            </span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MRR Growth BarChart */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
              Évolution du MRR SaaS & Nouveaux Bailleurs (Semestre)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={saasMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip 
                    formatter={(val: any) => [`${formatFCFA(Number(val))}`, 'MRR']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="mrr" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Plan Distribution PieChart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Répartition par Forfait
            </h2>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val} bailleurs`, 'Nombre']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {planDistribution.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-bold text-slate-800">{item.value} clients</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Couverture Géographique au Cameroun
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">DISCOM SaaS Hub</span>
          </div>
          <div className="divide-y divide-slate-200">
            {geoDistribution.map((geo) => (
              <div key={geo.ville} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">{geo.ville}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-slate-600">{geo.bailleurs} Bailleurs inscrits</span>
                  <span className="font-bold text-emerald-700">{geo.volume} loyers mensuels</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // BAILLEUR VIEW: RAPPORT FINANCIER DU PARC LOCATIF
  // -------------------------------------------------------------
  const totalEncaisseAnnuel = paiements
    .filter(p => p.statut === 'paye' || p.statut === 'partiel')
    .reduce((sum, p) => sum + p.montant_recu, 0);

  const totalAttenduAnnuel = paiements.reduce((sum, p) => sum + p.montant_attendu, 0);
  const globalRecoveryRate = totalAttenduAnnuel > 0 ? Math.round((totalEncaisseAnnuel / totalAttenduAnnuel) * 100) : 98;

  const monthlyData = [
    { mois: 'Janvier', attendu: 2900000, encaisse: 2700000, impaye: 200000, taux: 93 },
    { mois: 'Février', attendu: 3045000, encaisse: 2970000, impaye: 75000, taux: 97 },
    { mois: 'Mars', attendu: 3045000, encaisse: 2975000, impaye: 70000, taux: 98 },
    { mois: 'Avril (Proj)', attendu: 3045000, encaisse: 3045000, impaye: 0, taux: 100 },
    { mois: 'Mai (Proj)', attendu: 3200000, encaisse: 3200000, impaye: 0, taux: 100 },
    { mois: 'Juin (Proj)', attendu: 3200000, encaisse: 3200000, impaye: 0, taux: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Rapports & Analyses Financières
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bilan d'exploitation, recouvrement des loyers et rentabilité de vos logements au Cameroun
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer Bilan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            CA Global Encaissé 2026
          </span>
          <span className="text-xl font-extrabold text-emerald-700 block mt-1">
            {formatFCFA(totalEncaisseAnnuel)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Sur {formatFCFA(totalAttenduAnnuel)} attendus
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Taux de Recouvrement
          </span>
          <span className="text-xl font-extrabold text-slate-800 block mt-1">
            {globalRecoveryRate}%
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            Objectif 95% dépassé
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Nombre de Logements
          </span>
          <span className="text-xl font-extrabold text-slate-800 block mt-1">
            {logements.length} Biens
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {pieces.length} unités locatives au total
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Locataires Actifs
          </span>
          <span className="text-xl font-extrabold text-indigo-700 block mt-1">
            {locataires.filter(l => l.statut === 'actif').length} Locataires
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Douala, Yaoundé & Kribi
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
          Évolution Mensuelle des Encaissements vs Loyers Attendus (FCFA)
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000000}M`} />
              <Tooltip formatter={(val: any) => [`${formatFCFA(Number(val))}`, '']} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="attendu" name="Loyer Attendu" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="encaisse" name="Loyer Encaissé" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

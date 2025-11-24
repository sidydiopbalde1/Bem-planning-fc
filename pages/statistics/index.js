// pages/statistics/index.js
// Page des statistiques avancees

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import StatisticsPanel from '../../components/statistics/StatisticsPanel';
import {
  BarChart3,
  Users,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';

const STAT_TYPES = [
  { id: 'global', label: 'Vue globale', icon: BarChart3, description: 'Statistiques generales du systeme' },
  { id: 'intervenants', label: 'Intervenants', icon: Users, description: 'Charge et performance des intervenants' },
  { id: 'performance', label: 'Performance (KPIs)', icon: Activity, description: 'Indicateurs cles de performance' },
  { id: 'planning', label: 'Planning', icon: Calendar, description: 'Analyse temporelle des seances' }
];

export default function StatisticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeType, setActiveType] = useState('global');
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirection si non authentifie
  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/statistics?type=${activeType}`);
      const data = await response.json();

      // Creer le fichier JSON a telecharger
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistiques-${activeType}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        {/* En-tete */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistiques et Analyses</h1>
            <p className="text-gray-600 mt-1">Visualisez les performances et indicateurs de votre planning</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>

        {/* Navigation par type */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {STAT_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = activeType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                    : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                }`}
              >
                <div className={`inline-flex p-2 rounded-lg mb-2 ${
                  isActive ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-600'}`} />
                </div>
                <h3 className={`font-medium ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                  {type.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
              </button>
            );
          })}
        </div>

        {/* Panneau de statistiques */}
        <div className="bg-white rounded-lg border p-6">
          <StatisticsPanel key={refreshKey} type={activeType} />
        </div>

        {/* Legende / Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            A propos de ces statistiques
          </h4>
          <p className="text-sm text-gray-600">
            Les statistiques sont calculees en temps reel a partir de vos donnees.
            {activeType === 'global' && ' La vue globale presente un apercu general de votre activite.'}
            {activeType === 'intervenants' && ' Cette vue analyse la charge de travail et la performance de chaque intervenant.'}
            {activeType === 'performance' && ' Les KPIs vous permettent de suivre vos objectifs mensuels et hebdomadaires.'}
            {activeType === 'planning' && ' L\'analyse du planning montre la distribution temporelle de vos seances.'}
          </p>
        </div>
      </div>
    </Layout>
  );
}

// pages/admin/rapports.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout.js';
import PageTransition, { AnimatedCard, SlideIn } from '../../components/ui/PageTransition.js';
import {
  BarChart3, Download, Calendar, TrendingUp, Users, DoorClosed,
  Activity, AlertCircle, CheckCircle, FileText, ArrowUp, ArrowDown
} from 'lucide-react';

export default function RapportsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [statsSalles, setStatsSalles] = useState(null);
  const [statsIntervenants, setStatsIntervenants] = useState(null);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashResp] = await Promise.all([
        fetch('/api/admin/stats/dashboard')
      ]);

      const dashData = await dashResp.json();
      setDashboardData(dashData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsSalles = async () => {
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const response = await fetch(`/api/admin/stats/salles?${params}`);
      const data = await response.json();
      setStatsSalles(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchStatsIntervenants = async () => {
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const response = await fetch(`/api/admin/stats/intervenants?${params}`);
      const data = await response.json();
      setStatsIntervenants(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleExport = (type) => {
    const params = new URLSearchParams({ type });
    if (dateDebut) params.append('dateDebut', dateDebut);
    if (dateFin) params.append('dateFin', dateFin);

    window.open(`/api/admin/export/excel?${params}`, '_blank');
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <PageTransition>
      <Layout>
        <Head>
          <title>Rapports et Statistiques - BEM Planning</title>
        </Head>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
              Rapports et Statistiques
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Tableaux de bord et analyses de performance
            </p>
          </div>

          {/* Onglets */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setActiveTab('salles');
                    if (!statsSalles) fetchStatsSalles();
                  }}
                  className={`${
                    activeTab === 'salles'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Salles
                </button>
                <button
                  onClick={() => {
                    setActiveTab('intervenants');
                    if (!statsIntervenants) fetchStatsIntervenants();
                  }}
                  className={`${
                    activeTab === 'intervenants'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Intervenants
                </button>
              </nav>
            </div>
          </div>

          {/* Contenu Dashboard */}
          {activeTab === 'dashboard' && dashboardData && (
            <DashboardTab data={dashboardData} onExport={handleExport} />
          )}

          {/* Contenu Salles */}
          {activeTab === 'salles' && (
            <SallesTab
              data={statsSalles}
              dateDebut={dateDebut}
              dateFin={dateFin}
              onDateChange={(debut, fin) => {
                setDateDebut(debut);
                setDateFin(fin);
              }}
              onRefresh={fetchStatsSalles}
              onExport={() => handleExport('stats-salles')}
            />
          )}

          {/* Contenu Intervenants */}
          {activeTab === 'intervenants' && (
            <IntervenantsTab
              data={statsIntervenants}
              dateDebut={dateDebut}
              dateFin={dateFin}
              onDateChange={(debut, fin) => {
                setDateDebut(debut);
                setDateFin(fin);
              }}
              onRefresh={fetchStatsIntervenants}
              onExport={() => handleExport('stats-intervenants')}
            />
          )}
        </div>
      </Layout>
    </PageTransition>
  );
}

function DashboardTab({ data, onExport }) {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Score de santé */}
      <AnimatedCard delay={0.1}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Santé du Système
            </h2>
            <button
              onClick={() => onExport('dashboard')}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
          </div>
          <div className="flex items-center">
            <div className={`text-6xl font-bold ${getScoreColor(data.sante.score)}`}>
              {data.sante.score}
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Score de santé global
              </p>
              {data.sante.alertes.length > 0 && (
                <div className="mt-2 space-y-1">
                  {data.sante.alertes.map((alerte, i) => (
                    <div key={i} className="flex items-start text-sm">
                      <AlertCircle className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{alerte.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Utilisateurs */}
        <AnimatedCard delay={0.2}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.kpis.utilisateurs.total}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-400" />
            </div>
          </div>
        </AnimatedCard>

        {/* Programmes */}
        <AnimatedCard delay={0.3}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Programmes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.kpis.programmes.total}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {data.kpis.programmes.progressionMoyenne}% progression
                </p>
              </div>
              <FileText className="w-10 h-10 text-green-400" />
            </div>
          </div>
        </AnimatedCard>

        {/* Modules */}
        <AnimatedCard delay={0.4}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Modules</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.kpis.modules.total}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {data.kpis.modules.tauxCompletion}% complétés
                </p>
              </div>
              <Activity className="w-10 h-10 text-purple-400" />
            </div>
          </div>
        </AnimatedCard>

        {/* Séances ce mois */}
        <AnimatedCard delay={0.5}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Séances (ce mois)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.kpis.seances.ceMois}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {data.kpis.seances.total} total
                </p>
              </div>
              <Calendar className="w-10 h-10 text-orange-400" />
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Conflits */}
      {data.kpis.conflits.total > 0 && (
        <AnimatedCard delay={0.6}>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                  {data.kpis.conflits.total} conflit(s) non résolu(s)
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Ces conflits nécessitent votre attention
                </p>
              </div>
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Top utilisateurs actifs */}
      <AnimatedCard delay={0.7}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Utilisateurs les plus actifs (30 derniers jours)
          </h3>
          <div className="space-y-3">
            {data.activite.topUtilisateurs.map((user, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{user.nom}</span>
                <span className="text-sm font-medium text-blue-600">{user.actions} actions</span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}

function SallesTab({ data, dateDebut, dateFin, onDateChange, onRefresh, onExport }) {
  return (
    <div className="space-y-6">
      {/* Filtres de date */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => onDateChange(e.target.value, dateFin)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => onDateChange(dateDebut, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={onRefresh}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Actualiser
            </button>
            <button
              onClick={onExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {data ? (
        <>
          {/* Stats générales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Taux d'occupation global</p>
              <p className="text-3xl font-bold text-blue-600">{data.occupation.tauxGlobal}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Salles disponibles</p>
              <p className="text-3xl font-bold text-green-600">{data.general.sallesDisponibles}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Capacité totale</p>
              <p className="text-3xl font-bold text-purple-600">{data.general.capaciteTotale}</p>
            </div>
          </div>

          {/* Top 10 salles */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 10 des salles les plus utilisées
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Salle</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Bâtiment</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Séances</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Heures</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Occupation</th>
                  </tr>
                </thead>
                <tbody>
                  {data.occupation.top10.map((salle, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 text-sm text-gray-900 dark:text-white">{salle.salle}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{salle.batiment}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{salle.nombreSeances}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{salle.heuresUtilisees}h</td>
                      <td className="py-3 text-sm font-medium text-right">
                        <span className={`${
                          salle.tauxOccupation >= 70 ? 'text-red-600' :
                          salle.tauxOccupation >= 40 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {salle.tauxOccupation}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Sélectionnez une période et cliquez sur Actualiser</p>
        </div>
      )}
    </div>
  );
}

function IntervenantsTab({ data, dateDebut, dateFin, onDateChange, onRefresh, onExport }) {
  return (
    <div className="space-y-6">
      {/* Filtres de date */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => onDateChange(e.target.value, dateFin)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => onDateChange(dateDebut, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={onRefresh}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Actualiser
            </button>
            <button
              onClick={onExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {data ? (
        <>
          {/* Stats générales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Taux de charge moyen</p>
              <p className="text-3xl font-bold text-blue-600">{data.general.tauxChargeMoyen}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">En surcharge</p>
              <p className="text-3xl font-bold text-red-600">{data.alertes.nombreSurcharges}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Sous-utilisés</p>
              <p className="text-3xl font-bold text-yellow-600">{data.alertes.nombreSousUtilises}</p>
            </div>
          </div>

          {/* Top 10 intervenants */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 10 des intervenants les plus chargés
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Intervenant</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Spécialité</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">CM</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">TD</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">TP</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Total</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {data.charge.top10Charges.map((int, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 text-sm text-gray-900 dark:text-white">{int.nom}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{int.specialite || '-'}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{int.heuresParType.CM}h</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{int.heuresParType.TD}h</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{int.heuresParType.TP}h</td>
                      <td className="py-3 text-sm font-medium text-gray-900 dark:text-white text-right">{int.totalHeures}h</td>
                      <td className="py-3 text-sm font-medium text-right">
                        <span className={`${
                          int.tauxCharge >= 90 ? 'text-red-600' :
                          int.tauxCharge >= 70 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {int.tauxCharge}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertes */}
          {data.charge.surcharge.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-3">
                Intervenants en surcharge
              </h3>
              <div className="space-y-2">
                {data.charge.surcharge.map((int, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-red-700 dark:text-red-300">{int.nom}</span>
                    <span className="text-red-900 dark:text-red-100 font-medium">
                      {int.totalHeures}h ({int.tauxCharge}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Sélectionnez une période et cliquez sur Actualiser</p>
        </div>
      )}
    </div>
  );
}

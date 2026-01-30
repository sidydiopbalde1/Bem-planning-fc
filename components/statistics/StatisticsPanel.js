// components/statistics/StatisticsPanel.js
// Composant de visualisation des statistiques avancées

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from '../../lib/api-client';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Sparkles
} from 'lucide-react';

// Composant de carte statistique avec tendance
function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    indigo: 'bg-indigo-100'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

// Composant de barre de progression
function ProgressBar({ label, value, max, color = 'blue' }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  const barColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value}/{max} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${barColors[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Composant de distribution (mini graphique)
function DistributionChart({ data, title }) {
  const maxValue = Math.max(...Object.values(data), 1);

  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16 truncate" title={key}>{key}</span>
            <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded transition-all duration-300"
                style={{ width: `${(value / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium w-8 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant d'alerte KPI
function KPIAlert({ type, message, suggestion }) {
  const alertStyles = {
    INFO: 'bg-blue-50 border-blue-200 text-blue-800',
    WARNING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    ERROR: 'bg-red-50 border-red-200 text-red-800'
  };

  const icons = {
    INFO: Activity,
    WARNING: AlertTriangle,
    ERROR: AlertTriangle
  };

  const Icon = icons[type] || Activity;

  return (
    <div className={`p-3 rounded-lg border ${alertStyles[type]} mb-2`}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">{message}</p>
          {suggestion && <p className="text-xs mt-1 opacity-80">{suggestion}</p>}
        </div>
      </div>
    </div>
  );
}

// Composant principal du panneau de statistiques
export default function StatisticsPanel({ type = 'global' }) {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      fetchStatistics();
    }
  }, [type, session]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.statistics.getAll({ type });
      console.log('Statistics data:', data);
      setStats(data.statistics);
    } catch (err) {
      console.error('Erreur fetch statistics:', err);
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Chargement des statistiques...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <AlertTriangle className="w-5 h-5 inline mr-2" />
        {error}
      </div>
    );
  }

  if (!stats) return null;

  // Rendu selon le type de statistiques
  switch (type) {
    case 'global':
      return <GlobalStats stats={stats} />;
    case 'intervenants':
      return <IntervenantsStats stats={stats} />;
    case 'performance':
      return <PerformanceStats stats={stats} />;
    case 'planning':
      return <PlanningStats stats={stats} />;
    default:
      return <GlobalStats stats={stats} />;
  }
}

// Vue des statistiques globales
function GlobalStats({ stats }) {
  return (
    <div className="space-y-6">
      {/* Cartes principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Programmes"
          value={stats.totaux?.programmes || 0}
          subtitle={`${stats.activite?.programmesEnCours || 0} en cours`}
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          title="Modules"
          value={stats.totaux?.modules || 0}
          icon={PieChart}
          color="purple"
        />
        <StatCard
          title="Intervenants"
          value={stats.totaux?.intervenants || stats.intervenants?.total || 0}
          subtitle={`${stats.intervenants?.disponibles || 0} disponible(s)`}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Seances"
          value={stats.totaux?.seances || 0}
          subtitle={`${stats.activite?.seancesTerminees || 0} terminee(s)`}
          icon={Calendar}
          color="indigo"
        />
      </div>

      {/* Nouveaux ce mois */}
      {stats.nouveauxCeMois && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-4">
          <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Nouveaux ce mois
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.nouveauxCeMois.programmes || 0}</p>
              <p className="text-xs text-emerald-700">Programmes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.nouveauxCeMois.modules || 0}</p>
              <p className="text-xs text-emerald-700">Modules</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.nouveauxCeMois.intervenants || 0}</p>
              <p className="text-xs text-emerald-700">Intervenants</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.nouveauxCeMois.seances || 0}</p>
              <p className="text-xs text-emerald-700">Seances</p>
            </div>
          </div>
        </div>
      )}

      {/* Section heures et qualite */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Heures */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Volume Horaire
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Heures planifiees</span>
              <span className="text-2xl font-bold text-indigo-600">
                {stats.heures?.totalPlanifie || 0}h
              </span>
            </div>
            <ProgressBar
              label="Heures realisees"
              value={stats.heures?.totalRealise || 0}
              max={stats.heures?.totalPlanifie || 1}
              color="green"
            />
          </div>
        </div>

        {/* Intervenants */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Disponibilite Intervenants
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taux de disponibilite</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.intervenants?.tauxDisponibilite || 100}%
              </span>
            </div>
            <ProgressBar
              label="Intervenants disponibles"
              value={stats.intervenants?.disponibles || 0}
              max={stats.intervenants?.total || stats.totaux?.intervenants || 1}
              color="green"
            />
          </div>
        </div>
      </div>

      {/* Qualite */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Indicateurs Qualite
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Progression moyenne des modules</span>
              <span className="text-xl font-bold text-purple-600">
                {stats.qualite?.progressionMoyenne || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-purple-500 transition-all duration-300"
                style={{ width: `${stats.qualite?.progressionMoyenne || 0}%` }}
              />
            </div>
          </div>
          <div>
            {stats.qualite?.conflitsEnAttente > 0 ? (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <span className="text-sm font-medium text-yellow-800">
                    {stats.qualite.conflitsEnAttente} conflit(s) en attente
                  </span>
                  <p className="text-xs text-yellow-600">A resoudre rapidement</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <span className="text-sm font-medium text-green-800">Aucun conflit detecte</span>
                  <p className="text-xs text-green-600">Planning optimal</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Taux de completion */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm">Taux de completion global</p>
            <p className="text-4xl font-bold mt-1">{stats.activite?.tauxCompletion || 0}%</p>
            <p className="text-indigo-200 text-sm mt-2">
              {stats.activite?.seancesTerminees || 0} seances terminees sur {stats.totaux?.seances || 0}
            </p>
          </div>
          <div className="w-24 h-24 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeDasharray={`${(stats.activite?.tauxCompletion || 0) * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// Vue des statistiques intervenants
function IntervenantsStats({ stats }) {
  // S'assurer que intervenants est un tableau
  const intervenantsList = Array.isArray(stats.intervenants) ? stats.intervenants : [];

  if (intervenantsList.length === 0 && !stats.resume) return null;

  return (
    <div className="space-y-6">
      {/* Resume */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Intervenants"
          value={stats.resume?.totalIntervenants || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Disponibles"
          value={stats.resume?.disponibles || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="En surcharge"
          value={stats.resume?.enSurcharge || 0}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Charge moyenne"
          value={`${stats.resume?.chargeGlobaleMoyenne || 0}h`}
          subtitle="par semaine"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Liste des intervenants */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">Detail par Intervenant</h3>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {intervenantsList.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucun intervenant trouve
            </div>
          ) : intervenantsList.slice(0, 10).map((intervenant) => (
            <div key={intervenant.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{intervenant.nom}</p>
                  <p className="text-sm text-gray-500">{intervenant.specialite || intervenant.grade}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600">
                    {intervenant.statistiques.totalHeures}h
                  </p>
                  <p className="text-xs text-gray-500">
                    {intervenant.statistiques.totalSeances} seance(s)
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <ProgressBar
                  label="Taux realisation"
                  value={intervenant.statistiques.seancesTerminees}
                  max={intervenant.statistiques.totalSeances || 1}
                  color={intervenant.indicateurs.surcharge ? 'red' : 'green'}
                />
              </div>
              {intervenant.indicateurs.surcharge && (
                <span className="inline-block px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded mt-1">
                  Surcharge detectee
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Vue des indicateurs de performance (KPIs)
function PerformanceStats({ stats }) {
  return (
    <div className="space-y-6">
      {/* Periode */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <p className="text-sm text-indigo-600">{stats.periode?.mois}</p>
        <p className="text-xs text-indigo-500">{stats.periode?.semaineCourante}</p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Taux realisation"
          value={`${stats.kpi?.tauxRealisation || 0}%`}
          icon={TrendingUp}
          color={stats.kpi?.tauxRealisation >= 80 ? 'green' : stats.kpi?.tauxRealisation >= 50 ? 'yellow' : 'red'}
        />
        <StatCard
          title="Seances ce mois"
          value={stats.kpi?.seancesRealiseesMois || 0}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Heures ce mois"
          value={`${stats.kpi?.heuresRealiseesMois || 0}h`}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Cette semaine"
          value={stats.kpi?.seancesRealiseesSemaine || 0}
          subtitle="seance(s)"
          icon={Activity}
          color="indigo"
        />
        <StatCard
          title="Conflits generes"
          value={stats.kpi?.conflitsGeneres || 0}
          icon={AlertTriangle}
          color={stats.kpi?.conflitsGeneres > 5 ? 'red' : 'green'}
        />
        <StatCard
          title="Programmes actifs"
          value={stats.kpi?.programmesActifs || 0}
          icon={BarChart3}
          color="blue"
        />
      </div>

      {/* Progression objectif */}
      {stats.tendances && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Progression vers l objectif mensuel</h3>
          <ProgressBar
            label={`${stats.kpi?.seancesRealiseesMois || 0} / ${stats.tendances.objectifMensuel} seances`}
            value={stats.kpi?.seancesRealiseesMois || 0}
            max={stats.tendances.objectifMensuel}
            color={stats.tendances.progressionObjectif >= 100 ? 'green' : 'blue'}
          />
        </div>
      )}

      {/* Alertes */}
      {stats.alertes && stats.alertes.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Alertes et Recommandations</h3>
          {stats.alertes.map((alerte, index) => (
            <KPIAlert
              key={index}
              type={alerte.type}
              message={alerte.message}
              suggestion={alerte.suggestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Vue des statistiques de planning
function PlanningStats({ stats }) {
  return (
    <div className="space-y-6">
      {/* Resume */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Periode analysee</h3>
          <span className="text-sm text-gray-500">
            {new Date(stats.periode?.debut).toLocaleDateString('fr-FR')} - {new Date(stats.periode?.fin).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <div className="text-3xl font-bold text-indigo-600">
          {stats.totalSeances} seances
        </div>
      </div>

      {/* Distributions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Par jour */}
        {stats.distributions?.parJourSemaine && (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 mb-3">Distribution par jour</h4>
            <div className="space-y-2">
              {stats.distributions.parJourSemaine.map((jour) => (
                <div key={jour.jour} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-20">{jour.jour}</span>
                  <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden relative">
                    <div
                      className="h-full bg-indigo-500 rounded transition-all duration-300"
                      style={{ width: `${jour.pourcentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {jour.nombreSeances}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Par type */}
        {stats.distributions?.parType && (
          <DistributionChart
            data={stats.distributions.parType}
            title="Distribution par type"
          />
        )}

        {/* Par status */}
        {stats.distributions?.parStatus && (
          <DistributionChart
            data={stats.distributions.parStatus}
            title="Distribution par statut"
          />
        )}
      </div>

      {/* Moyennes */}
      {stats.moyennes && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Seances/jour (moyenne)"
            value={stats.moyennes.seancesParJour}
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="Heures/semaine (moyenne)"
            value={`${stats.moyennes.heuresParSemaine}h`}
            icon={Clock}
            color="green"
          />
        </div>
      )}
    </div>
  );
}

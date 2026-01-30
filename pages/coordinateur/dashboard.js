// pages/coordinateur/dashboard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout';
import apiClient from '../../lib/api-client';
import {
  BookOpen, Clock, TrendingUp, AlertTriangle, User, CheckCircle, Calendar,
  BarChart3, Activity, FileText, Play, Pause, XCircle, Layers, Edit as EditIcon
} from 'lucide-react';
import Link from 'next/link';

export default function CoordinateurDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['COORDINATOR', 'ADMIN'].includes(session?.user?.role)) {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await apiClient.coordinateur.getDashboard();
      console.log('Données du dashboard',dashboardData);
      setData(dashboardData);
    } catch (error) {
      setError(error.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PLANIFIE: 'bg-blue-100 text-blue-800',
      EN_COURS: 'bg-green-100 text-green-800',
      TERMINE: 'bg-gray-100 text-gray-800',
      SUSPENDU: 'bg-yellow-100 text-yellow-800',
      ANNULE: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PLANIFIE: 'Planifié',
      EN_COURS: 'En cours',
      TERMINE: 'Terminé',
      SUSPENDU: 'Suspendu',
      ANNULE: 'Annulé'
    };
    return labels[status] || status;
  };

  const getActionColor = (action) => {
    const colors = {
      CREATION: 'text-green-600',
      MODIFICATION: 'text-blue-600',
      SUPPRESSION: 'text-red-600'
    };
    return colors[action] || 'text-gray-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressColor = (progression) => {
    if (progression >= 80) return 'bg-green-500';
    if (progression >= 50) return 'bg-blue-500';
    if (progression >= 25) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Erreur lors du chargement'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Coordinateur</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de vos programmes et modules</p>
        </div>

        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Programmes Card */}
          <Link href="/coordinateur/programmes">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-10 h-10" />
                <div className="text-right">
                  <p className="text-3xl font-bold">{data.programmesStats.total}</p>
                  <p className="text-blue-100 text-sm">Programmes</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{data.programmesStats.enCours} en cours</span>
                <span>{data.programmesStats.termines} terminés</span>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-400">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progression moyenne</span>
                  <span className="text-lg font-bold">{data.programmesStats.progressionMoyenne}%</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Modules Card */}
          <Link href="/coordinateur/modules">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Layers className="w-10 h-10" />
                <div className="text-right">
                  <p className="text-3xl font-bold">{data.modulesStats.total}</p>
                  <p className="text-green-100 text-sm">Modules</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{data.modulesStats.enCours} en cours</span>
                <span>{data.modulesStats.termines} terminés</span>
              </div>
              <div className="mt-3 pt-3 border-t border-green-400">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Volume horaire total</span>
                  <span className="text-lg font-bold">{data.modulesStats.totalVHT}h</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Séances Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-10 h-10" />
              <div className="text-right">
                <p className="text-3xl font-bold">{data.modulesStats.totalSeances}</p>
                <p className="text-purple-100 text-sm">Séances</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-400">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>CM: {data.vhtParType?.CM || 0}h</span>
                  <span>TD: {data.vhtParType?.TD || 0}h</span>
                </div>
                <div className="flex justify-between">
                  <span>TP: {data.vhtParType?.TP || 0}h</span>
                  <span>TPE: {data.vhtParType?.TPE || 0}h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Intervenants Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <User className="w-10 h-10" />
              <div className="text-right">
                <p className="text-3xl font-bold">{data.modulesStats.avecIntervenant}</p>
                <p className="text-orange-100 text-sm">Avec intervenant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{data.modulesStats.sansIntervenant} module(s) sans intervenant</span>
            </div>
            <div className="mt-3 pt-3 border-t border-orange-400">
              <div className="text-sm">
                {data.modulesStats.sansIntervenant > 0 ? (
                  <span className="flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    Action requise
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Tous assignés
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {(data.programmesEnRetard?.length > 0 || data.modulesSansIntervenant?.length > 0) && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="font-semibold text-yellow-900">Alertes et actions requises</h3>
            </div>
            <div className="space-y-2 text-sm text-yellow-800">
              {data.programmesEnRetard?.length > 0 && (
                <p>• {data.programmesEnRetard.length} programme(s) en retard</p>
              )}
              {data.modulesSansIntervenant?.length > 0 && (
                <p>• {data.modulesSansIntervenant.length} module(s) sans intervenant</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Programmes en retard */}
          {data.programmesEnRetard?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Programmes en retard ({data.programmesEnRetard.length})
              </h3>
              <div className="space-y-3">
                {data.programmesEnRetard.map((programme) => (
                  <Link key={programme.id} href={`/coordinateur/programmes/${programme.id}`}>
                    <div className="p-3 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{programme.code}</p>
                          <p className="text-sm text-gray-600">{programme.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">{programme.progression}%</p>
                          <p className="text-xs text-gray-500">Fin: {formatDate(programme.dateFin)}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Modules sans intervenant */}
          {data.modulesSansIntervenant?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 text-orange-500 mr-2" />
                Modules sans intervenant ({data.modulesSansIntervenant.length})
              </h3>
              <div className="space-y-3">
                {data.modulesSansIntervenant.map((module) => (
                  <div key={module.id} className="p-3 border border-orange-200 rounded-lg hover:bg-orange-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{module.code}</p>
                        <p className="text-sm text-gray-600">{module.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{module.vht}h</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(module.status)}`}>
                          {getStatusLabel(module.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/coordinateur/modules">
                <button className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  Gérer les modules
                </button>
              </Link>
            </div>
          )}

          {/* Modules à venir */}
          {data.modulesProchains?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                Modules à venir (30 prochains jours)
              </h3>
              <div className="space-y-3">
                {data.modulesProchains.map((module) => (
                  <div key={module.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{module.code}</p>
                        <p className="text-sm text-gray-600">{module.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Début: {formatDate(module.dateDebut)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{module.vht}h</p>
                        {module.intervenantId ? (
                          <span className="text-xs text-green-600 flex items-center justify-end mt-1">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Assigné
                          </span>
                        ) : (
                          <span className="text-xs text-orange-600 flex items-center justify-end mt-1">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Non assigné
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 text-gray-500 mr-2" />
              Activité récente
            </h3>
            <div className="space-y-3">
              {data.recentActivity?.length > 0 ? (
                data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                    <div className={`mt-1 ${getActionColor(activity.action)}`}>
                      {activity.action === 'CREATION' && <Play className="w-4 h-4" />}
                      {activity.action === 'MODIFICATION' && <EditIcon className="w-4 h-4" />}
                      {activity.action === 'SUPPRESSION' && <XCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">{activity.userName}</p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">{formatDateTime(activity.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Aucune activité récente</p>
              )}
            </div>
          </div>
        </div>

        {/* Progression by Programme */}
        {data.progressionParProgramme?.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 text-gray-500 mr-2" />
              Progression des programmes
            </h3>
            <div className="space-y-4">
              {data.progressionParProgramme.map((programme) => (
                <Link key={programme.id} href={`/coordinateur/programmes/${programme.id}`}>
                  <div className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{programme.code} - {programme.name}</p>
                        <p className="text-xs text-gray-500">{programme.modulesCount} module(s)</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(programme.status)}`}>
                          {getStatusLabel(programme.status)}
                        </span>
                        <span className="text-lg font-bold text-gray-900">{programme.progression}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(programme.progression)}`}
                        style={{ width: `${programme.progression}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

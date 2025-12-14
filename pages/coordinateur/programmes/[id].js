// pages/coordinateur/programmes/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/layout';
import {
  BookOpen, Calendar, Clock, TrendingUp, AlertTriangle, User, Edit2, Trash2, Plus,
  FileText, CheckCircle, XCircle, BarChart3, Download, ArrowLeft
} from 'lucide-react';

export default function ProgrammeDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [programme, setProgramme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['COORDINATOR', 'ADMIN'].includes(session?.user?.role)) {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (id) {
      fetchProgramme();
    }
  }, [id]);

  const fetchProgramme = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coordinateur/programmes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProgramme(data.programme);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors du chargement du programme');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/coordinateur/programmes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/coordinateur/programmes');
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    }
    setShowDeleteConfirm(false);
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

  const getProgressColor = (progression) => {
    if (progression >= 80) return 'bg-green-500';
    if (progression >= 50) return 'bg-blue-500';
    if (progression >= 25) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculateModuleStats = () => {
    if (!programme?.modules || programme.modules.length === 0) {
      return {
        totalCM: 0,
        totalTD: 0,
        totalTP: 0,
        totalTPE: 0,
        totalVHT: 0,
        totalModules: 0,
        modulesTermines: 0,
        modulesEnCours: 0,
        modulesPlanifies: 0
      };
    }

    const modules = programme.modules;
    return {
      totalCM: modules.reduce((sum, m) => sum + (m.cm || 0), 0),
      totalTD: modules.reduce((sum, m) => sum + (m.td || 0), 0),
      totalTP: modules.reduce((sum, m) => sum + (m.tp || 0), 0),
      totalTPE: modules.reduce((sum, m) => sum + (m.tpe || 0), 0),
      totalVHT: modules.reduce((sum, m) => sum + (m.vht || 0), 0),
      totalModules: modules.length,
      modulesTermines: modules.filter(m => m.status === 'TERMINE').length,
      modulesEnCours: modules.filter(m => m.status === 'EN_COURS').length,
      modulesPlanifies: modules.filter(m => m.status === 'PLANIFIE').length
    };
  };

  const getAlerts = () => {
    if (!programme) return [];
    const alerts = [];

    const now = new Date();
    const fin = new Date(programme.dateFin);

    if (programme.enRetard) {
      alerts.push({
        type: 'error',
        message: `Programme en retard (${programme.progression}% complété)`
      });
    }

    const daysUntilEnd = Math.ceil((fin - now) / (1000 * 60 * 60 * 24));
    if (daysUntilEnd <= 30 && daysUntilEnd > 0 && programme.progression < 80) {
      alerts.push({
        type: 'warning',
        message: `Échéance dans ${daysUntilEnd} jours (${programme.progression}% complété)`
      });
    }

    if (programme.progressionReelle < programme.progression) {
      alerts.push({
        type: 'warning',
        message: 'La progression réelle est inférieure à la progression déclarée'
      });
    }

    const stats = calculateModuleStats();
    if (stats.totalModules === 0) {
      alerts.push({
        type: 'info',
        message: 'Aucun module associé à ce programme'
      });
    }

    return alerts;
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

  if (!programme) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Programme non trouvé'}</p>
          <button
            onClick={() => router.push('/coordinateur/programmes')}
            className="mt-4 text-green-600 hover:text-green-700"
          >
            Retour aux programmes
          </button>
        </div>
      </Layout>
    );
  }

  const stats = calculateModuleStats();
  const alerts = getAlerts();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/coordinateur/programmes')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{programme.name}</h1>
              <p className="text-sm text-gray-500 mt-1">Code: {programme.code}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-center space-x-2 p-4 rounded-lg ${
                  alert.type === 'error' ? 'bg-red-50 text-red-800' :
                  alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                  'bg-blue-50 text-blue-800'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status and Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Statut</label>
              <div className="mt-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(programme.status)}`}>
                  {getStatusLabel(programme.status)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Coordinateur</label>
              <div className="mt-2 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900">{programme.user?.name || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Progression</label>
              <span className="text-2xl font-bold text-gray-900">{programme.progression}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${getProgressColor(programme.progression)}`}
                style={{ width: `${programme.progression}%` }}
              />
            </div>
            {programme.progressionReelle !== programme.progression && (
              <p className="text-sm text-gray-600 mt-2">
                Progression réelle (basée sur les modules): {programme.progressionReelle}%
              </p>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Date de début</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{formatDate(programme.dateDebut)}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Date de fin</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{formatDate(programme.dateFin)}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Volume horaire total</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{programme.totalVHT}h</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Program Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Niveau</label>
              <p className="mt-1 text-gray-900">{programme.niveau}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Semestre</label>
              <p className="mt-1 text-gray-900">Semestre {programme.semestre}</p>
            </div>
            {programme.description && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-900">{programme.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Module Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Statistiques des modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats.totalModules}</p>
              <p className="text-sm text-gray-600 mt-1">Total modules</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats.modulesTermines}</p>
              <p className="text-sm text-gray-600 mt-1">Terminés</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{stats.modulesEnCours}</p>
              <p className="text-sm text-gray-600 mt-1">En cours</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-600">{stats.modulesPlanifies}</p>
              <p className="text-sm text-gray-600 mt-1">Planifiés</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.totalCM}h</p>
              <p className="text-sm text-gray-600 mt-1">CM</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.totalTD}h</p>
              <p className="text-sm text-gray-600 mt-1">TD</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.totalTP}h</p>
              <p className="text-sm text-gray-600 mt-1">TP</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.totalTPE}h</p>
              <p className="text-sm text-gray-600 mt-1">TPE</p>
            </div>
            <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{stats.totalVHT}h</p>
              <p className="text-sm text-gray-600 mt-1">VHT Total</p>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Modules ({programme.modules?.length || 0})</h2>
            <button
              onClick={() => router.push(`/coordinateur/modules?programmeId=${id}`)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un module</span>
            </button>
          </div>

          {programme.modules && programme.modules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intervenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VHT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Séances</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {programme.modules.map((module) => (
                    <tr key={module.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{module.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{module.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {module.intervenant ? `${module.intervenant.prenom} ${module.intervenant.nom}` : 'Non assigné'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{module.vht}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{module._count?.seances || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(module.status)}`}>
                          {getStatusLabel(module.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(module.progression || 0)}`}
                              style={{ width: `${module.progression || 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{module.progression || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Aucun module associé à ce programme</p>
              <button
                onClick={() => router.push(`/coordinateur/modules?programmeId=${id}`)}
                className="mt-4 text-green-600 hover:text-green-700 font-medium"
              >
                Ajouter le premier module
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer ce programme ? Cette action est irréversible.
              </p>
              {programme._count && (programme._count.modules > 0 || programme._count.activitesAcademiques > 0) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800">
                    Ce programme contient {programme._count.modules} module(s) et {programme._count.activitesAcademiques} activité(s).
                    Vous devez d'abord les supprimer.
                  </p>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

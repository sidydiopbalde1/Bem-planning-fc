// pages/coordinateur/evaluations.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout';
import apiClient from '../../lib/api-client';
import {
  FileText, Plus, Send, CheckCircle, XCircle, Clock, BarChart3,
  Calendar, Users, TrendingUp, AlertCircle, Eye, Trash2, Edit as EditIcon
} from 'lucide-react';
import AnimatedPagination from '../../components/ui/AnimatedPagination';
import { useTableAnimation } from '../../components/ui/AnimatedTable';

export default function EvaluationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['COORDINATOR', 'ADMIN'].includes(session?.user?.role)) {
      router.push('/');
    }
  }, [status, session, router]);

  const fetchEvaluations = async (currentPage) => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 5 };
      if (filter !== 'all') params.statut = filter;

      const data = await apiClient.coordinateur.getEvaluations(params);
      console.log(data);

      setEvaluations(data.evaluations || data.data || []);
      setStats(data.stats);
      // Normaliser la pagination (l'API retourne totalPages au lieu de pages)
      if (data.pagination) {
        setPagination({
          ...data.pagination,
          pages: data.pagination.pages || data.pagination.totalPages
        });
      }
    } catch (error) {
      setError(error.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvaluations(page);
    }
  }, [status, filter, page]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatutColor = (statut) => {
    const colors = {
      BROUILLON: 'bg-gray-100 text-gray-800',
      ENVOYEE: 'bg-blue-100 text-blue-800',
      EN_COURS: 'bg-yellow-100 text-yellow-800',
      TERMINEE: 'bg-green-100 text-green-800',
      ANNULEE: 'bg-red-100 text-red-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatutLabel = (statut) => {
    const labels = {
      BROUILLON: 'Brouillon',
      ENVOYEE: 'Envoyée',
      EN_COURS: 'En cours',
      TERMINEE: 'Terminée',
      ANNULEE: 'Annulée'
    };
    return labels[statut] || statut;
  };

  const getStatutIcon = (statut) => {
    switch (statut) {
      case 'BROUILLON': return <EditIcon className="w-4 h-4" />;
      case 'ENVOYEE': return <Send className="w-4 h-4" />;
      case 'EN_COURS': return <Clock className="w-4 h-4" />;
      case 'TERMINEE': return <CheckCircle className="w-4 h-4" />;
      case 'ANNULEE': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleEnvoyerCampagne = async (evaluationId) => {
    if (!confirm('Êtes-vous sûr de vouloir envoyer cette campagne d\'évaluation ?')) {
      return;
    }

    try {
      await apiClient.evaluations.update(evaluationId, { action: 'envoyer' });
      alert('Campagne envoyée avec succès');
      fetchEvaluations(page);
    } catch (error) {
      alert(`Erreur: ${error.message || 'Impossible d\'envoyer la campagne'}`);
    }
  };

  const handleTerminerCampagne = async (evaluationId) => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette campagne d\'évaluation ?')) {
      return;
    }

    try {
      await apiClient.evaluations.update(evaluationId, { action: 'terminer' });
      alert('Campagne terminée avec succès');
      fetchEvaluations(page);
    } catch (error) {
      alert(`Erreur: ${error.message || 'Impossible de terminer la campagne'}`);
    }
  };

  // Hook pour les animations du tableau
  const { animatedData, isAnimating, getRowAnimation } = useTableAnimation(evaluations, page);

  if (status === 'loading' || (loading && evaluations.length === 0)) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campagnes d'Évaluation</h1>
            <p className="text-gray-600 mt-1">Gérer les évaluations des enseignements</p>
          </div>
          <button
            onClick={() => router.push('/coordinateur/evaluations/create')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle campagne
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Brouillon</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.brouillon}</p>
                </div>
                <EditIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Envoyées</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.envoyees}</p>
                </div>
                <Send className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En cours</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.enCours}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Terminées</p>
                  <p className="text-2xl font-bold text-green-600">{stats.terminees}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('BROUILLON')}
              className={`px-4 py-2 rounded-lg ${filter === 'BROUILLON' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Brouillon
            </button>
            <button
              onClick={() => setFilter('ENVOYEE')}
              className={`px-4 py-2 rounded-lg ${filter === 'ENVOYEE' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Envoyées
            </button>
            <button
              onClick={() => setFilter('EN_COURS')}
              className={`px-4 py-2 rounded-lg ${filter === 'EN_COURS' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              En cours
            </button>
            <button
              onClick={() => setFilter('TERMINEE')}
              className={`px-4 py-2 rounded-lg ${filter === 'TERMINEE' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Terminées
            </button>
          </div>
        </div>

        {/* Evaluations List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
          {/* Loading overlay */}
          {loading && evaluations.length > 0 && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-30 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-10 h-10 border-4 border-green-200 rounded-full animate-spin border-t-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Chargement...</span>
              </div>
            </div>
          )}

          {animatedData.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400">Aucune campagne d'evaluation trouvee</p>
              <button
                onClick={() => router.push('/coordinateur/evaluations/create')}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Creer une campagne
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Intervenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Periode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Participation</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {animatedData.map((evaluation, index) => {
                    const rowAnim = getRowAnimation(index);
                    return (
                      <tr
                        key={evaluation.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${rowAnim.className}`}
                        style={rowAnim.style}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{evaluation.module.code}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{evaluation.module.name}</p>
                            <p className="text-xs text-gray-500">{evaluation.module.programme.code}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {evaluation.intervenant.prenom} {evaluation.intervenant.nom}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{evaluation.intervenant.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900 dark:text-white">{formatDate(evaluation.dateDebut)}</p>
                            <p className="text-gray-600 dark:text-gray-400">au {formatDate(evaluation.dateFin)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${getStatutColor(evaluation.statut)}`}>
                            {getStatutIcon(evaluation.statut)}
                            <span>{getStatutLabel(evaluation.statut)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {evaluation.statut === 'TERMINEE' ? (
                            <div className="text-sm">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {evaluation.tauxParticipation?.toFixed(1)}%
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {evaluation.nombreReponses}/{evaluation.nombreInvitations}
                              </p>
                            </div>
                          ) : evaluation.statut === 'BROUILLON' ? (
                            <span className="text-sm text-gray-400">-</span>
                          ) : (
                            <div className="text-sm text-yellow-600 animate-pulse">
                              En cours...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => router.push(`/coordinateur/evaluations/${evaluation.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                              title="Voir les details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {evaluation.statut === 'BROUILLON' && (
                              <button
                                onClick={() => handleEnvoyerCampagne(evaluation.id)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200"
                                title="Envoyer la campagne"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}

                            {['ENVOYEE', 'EN_COURS'].includes(evaluation.statut) && (
                              <button
                                onClick={() => handleTerminerCampagne(evaluation.id)}
                                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-200"
                                title="Terminer la campagne"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination animee */}
          <AnimatedPagination
            pagination={pagination}
            currentPage={page}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </Layout>
  );
}

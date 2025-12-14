// pages/coordinateur/evaluations.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout';
import {
  FileText, Plus, Send, CheckCircle, XCircle, Clock, BarChart3,
  Calendar, Users, TrendingUp, AlertCircle, Eye, Trash2, Edit
} from 'lucide-react';

export default function EvaluationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['COORDINATOR', 'ADMIN'].includes(session?.user?.role)) {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvaluations();
    }
  }, [status, filter]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('statut', filter);

      const response = await fetch(`/api/coordinateur/evaluations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data.evaluations);
        setStats(data.stats);
      } else {
        setError('Erreur lors du chargement des campagnes d\'évaluation');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
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
      case 'BROUILLON': return <Edit className="w-4 h-4" />;
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
      const response = await fetch(`/api/coordinateur/evaluations/${evaluationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'envoyer' })
      });

      if (response.ok) {
        alert('Campagne envoyée avec succès');
        fetchEvaluations();
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error || 'Impossible d\'envoyer la campagne'}`);
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    }
  };

  const handleTerminerCampagne = async (evaluationId) => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette campagne d\'évaluation ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/coordinateur/evaluations/${evaluationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'terminer' })
      });

      if (response.ok) {
        alert('Campagne terminée avec succès');
        fetchEvaluations();
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error || 'Impossible de terminer la campagne'}`);
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    }
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
                <Edit className="w-8 h-8 text-gray-400" />
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
        <div className="bg-white rounded-lg shadow">
          {evaluations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucune campagne d'évaluation trouvée</p>
              <button
                onClick={() => router.push('/coordinateur/evaluations/create')}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Créer une campagne
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intervenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participation</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {evaluations.map((evaluation) => (
                    <tr key={evaluation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{evaluation.module.code}</p>
                          <p className="text-sm text-gray-600">{evaluation.module.name}</p>
                          <p className="text-xs text-gray-500">{evaluation.module.programme.code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {evaluation.intervenant.prenom} {evaluation.intervenant.nom}
                        </p>
                        <p className="text-xs text-gray-600">{evaluation.intervenant.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{formatDate(evaluation.dateDebut)}</p>
                          <p className="text-gray-600">au {formatDate(evaluation.dateFin)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(evaluation.statut)}`}>
                          {getStatutIcon(evaluation.statut)}
                          <span>{getStatutLabel(evaluation.statut)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {evaluation.statut === 'TERMINEE' ? (
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {evaluation.tauxParticipation?.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-600">
                              {evaluation.nombreReponses}/{evaluation.nombreInvitations}
                            </p>
                          </div>
                        ) : evaluation.statut === 'BROUILLON' ? (
                          <span className="text-sm text-gray-400">-</span>
                        ) : (
                          <div className="text-sm text-yellow-600">
                            En cours...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/coordinateur/evaluations/${evaluation.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {evaluation.statut === 'BROUILLON' && (
                            <button
                              onClick={() => handleEnvoyerCampagne(evaluation.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Envoyer la campagne"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {['ENVOYEE', 'EN_COURS'].includes(evaluation.statut) && (
                            <button
                              onClick={() => handleTerminerCampagne(evaluation.id)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="Terminer la campagne"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

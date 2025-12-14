// pages/coordinateur/evaluations/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/layout';
import {
  ArrowLeft, Calendar, Users, BookOpen, Send, CheckCircle, XCircle,
  Edit, Copy, ExternalLink, BarChart3, Clock, AlertCircle, Star
} from 'lucide-react';
import Link from 'next/link';

export default function EvaluationDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['COORDINATOR', 'ADMIN'].includes(session?.user?.role)) {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchEvaluation();
    }
  }, [status, id]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coordinateur/evaluations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEvaluation(data.evaluation);
      } else {
        setError('Campagne d\'évaluation introuvable');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleEnvoyer = async () => {
    if (!confirm('Êtes-vous sûr de vouloir envoyer cette campagne d\'évaluation ? Une notification sera envoyée à l\'intervenant.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/coordinateur/evaluations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'envoyer' })
      });

      if (response.ok) {
        alert('Campagne envoyée avec succès!');
        fetchEvaluation();
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error || 'Impossible d\'envoyer la campagne'}`);
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminer = async () => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette campagne ? Les résultats seront calculés et la campagne ne pourra plus être modifiée.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/coordinateur/evaluations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'terminer' })
      });

      if (response.ok) {
        alert('Campagne terminée avec succès!');
        fetchEvaluation();
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error || 'Impossible de terminer la campagne'}`);
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    } finally {
      setActionLoading(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (evaluation?.lienEvaluation) {
      navigator.clipboard.writeText(evaluation.lienEvaluation);
      alert('Lien copié dans le presse-papier!');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
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

  if (error || !evaluation) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Campagne introuvable'}</p>
          <Link href="/coordinateur/evaluations">
            <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Retour aux campagnes
            </button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/coordinateur/evaluations">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campagne d'Évaluation</h1>
              <p className="text-gray-600 mt-1">
                {evaluation.module.code} - {evaluation.module.name}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {evaluation.statut === 'BROUILLON' && (
              <button
                onClick={handleEnvoyer}
                disabled={actionLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </button>
            )}

            {['ENVOYEE', 'EN_COURS'].includes(evaluation.statut) && (
              <button
                onClick={handleTerminer}
                disabled={actionLoading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Terminer
              </button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-4">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatutColor(evaluation.statut)}`}>
            {getStatutLabel(evaluation.statut)}
          </span>
          {evaluation.dateEnvoi && (
            <span className="text-sm text-gray-600">
              Envoyée le {formatDate(evaluation.dateEnvoi)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Module & Intervenant Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Informations</h2>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Module
                  </label>
                  <p className="text-gray-900">
                    {evaluation.module.code} - {evaluation.module.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Programme: {evaluation.module.programme.code} - {evaluation.module.programme.name}
                  </p>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <Users className="w-4 h-4 mr-2" />
                    Intervenant
                  </label>
                  <p className="text-gray-900">
                    {evaluation.intervenant.civilite} {evaluation.intervenant.prenom} {evaluation.intervenant.nom}
                  </p>
                  <p className="text-sm text-gray-600">{evaluation.intervenant.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-500 mb-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      Date de début
                    </label>
                    <p className="text-gray-900">{formatDate(evaluation.dateDebut)}</p>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-500 mb-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      Date de fin
                    </label>
                    <p className="text-gray-900">{formatDate(evaluation.dateFin)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lien d'évaluation */}
            {evaluation.lienEvaluation && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Lien d'Évaluation</h2>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 mb-1">URL publique</p>
                      <p className="text-sm text-gray-600 truncate">
                        {evaluation.lienEvaluation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyLinkToClipboard}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier le lien
                    </button>

                    <a
                      href={evaluation.lienEvaluation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ouvrir
                    </a>
                  </div>

                  <p className="text-xs text-gray-500">
                    Partagez ce lien avec les étudiants pour qu'ils puissent évaluer le cours.
                  </p>
                </div>
              </div>
            )}

            {/* Résultats */}
            {evaluation.statut === 'TERMINEE' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Résultats de l'Évaluation
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  {evaluation.noteQualiteCours !== null && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-700 font-medium mb-1">Qualité du cours</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {evaluation.noteQualiteCours.toFixed(1)}/5
                      </p>
                    </div>
                  )}

                  {evaluation.noteQualitePedagogie !== null && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-700 font-medium mb-1">Qualité pédagogique</p>
                      <p className="text-2xl font-bold text-green-900">
                        {evaluation.noteQualitePedagogie.toFixed(1)}/5
                      </p>
                    </div>
                  )}

                  {evaluation.noteDisponibilite !== null && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-700 font-medium mb-1">Disponibilité</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {evaluation.noteDisponibilite.toFixed(1)}/5
                      </p>
                    </div>
                  )}

                  {evaluation.noteMoyenne !== null && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-yellow-700 font-medium mb-1">Moyenne générale</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {evaluation.noteMoyenne.toFixed(1)}/5
                      </p>
                    </div>
                  )}
                </div>

                {evaluation.commentaires && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Commentaires</p>
                    <p className="text-sm text-gray-600">{evaluation.commentaires}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Statistics */}
          <div className="space-y-6">
            {/* Participation Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Participation
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Invitations envoyées</span>
                    <span className="text-lg font-bold text-gray-900">{evaluation.nombreInvitations}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Réponses reçues</span>
                    <span className="text-lg font-bold text-green-600">{evaluation.nombreReponses}</span>
                  </div>
                </div>

                {evaluation.tauxParticipation !== null && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Taux de participation</span>
                      <span className="text-lg font-bold text-blue-600">
                        {evaluation.tauxParticipation.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${evaluation.tauxParticipation}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Historique
              </h2>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-gray-400 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Création</p>
                    <p className="text-xs text-gray-600">{formatDate(evaluation.createdAt)}</p>
                  </div>
                </div>

                {evaluation.dateEnvoi && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-400 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Envoyée</p>
                      <p className="text-xs text-gray-600">{formatDate(evaluation.dateEnvoi)}</p>
                    </div>
                  </div>
                )}

                {evaluation.statut === 'TERMINEE' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-400 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Terminée</p>
                      <p className="text-xs text-gray-600">{formatDate(evaluation.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// pages/intervenant/mes-seances.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Filter
} from 'lucide-react';

export default function MesSeances() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [seances, setSeances] = useState([]);
  const [stats, setStats] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [showPastOnly, setShowPastOnly] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchSeances();
    }
  }, [status, filterStatus, filterModule]);

  const fetchSeances = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        includeStats: 'true',
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterModule !== 'all' && { moduleId: filterModule })
      });

      const response = await fetch(`/api/intervenants/mes-seances?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des séances');
      }

      setSeances(data.seances || []);
      setStats(data.stats || null);
      setModules(data.modules || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSeance = async (seanceId, notes = '') => {
    if (!confirm('Êtes-vous sûr de vouloir marquer cette séance comme terminée ?')) {
      return;
    }

    try {
      setCompletingId(seanceId);
      setError(null);

      const response = await fetch(`/api/seances/${seanceId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la complétion de la séance');
      }

      // Show success message
      alert(`Séance marquée comme terminée !\n\nModule: ${data.module.code}\nProgression: ${data.module.progression}%\nHeures effectuées: ${data.module.heuresEffectuees}/${data.module.heuresTotal}h`);

      // Refresh data
      await fetchSeances();
    } catch (err) {
      setError(err.message);
      alert('Erreur: ' + err.message);
    } finally {
      setCompletingId(null);
    }
  };

  const getFilteredSeances = () => {
    let filtered = seances;

    if (showPastOnly) {
      const now = new Date();
      filtered = filtered.filter(seance => {
        const seanceDate = new Date(seance.dateSeance);
        return seanceDate < now;
      });
    }

    return filtered;
  };

  const getStatusBadge = (status) => {
    const badges = {
      PLANIFIE: { text: 'Planifiée', color: 'bg-gray-100 text-gray-800' },
      CONFIRME: { text: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
      EN_COURS: { text: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
      TERMINE: { text: 'Terminée', color: 'bg-green-100 text-green-800' },
      REPORTE: { text: 'Reportée', color: 'bg-orange-100 text-orange-800' },
      ANNULE: { text: 'Annulée', color: 'bg-red-100 text-red-800' }
    };

    const badge = badges[status] || badges.PLANIFIE;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const isSeancePast = (seance) => {
    const now = new Date();
    const seanceDateTime = new Date(seance.dateSeance);
    const [hours, minutes] = seance.heureFin.split(':');
    seanceDateTime.setHours(parseInt(hours), parseInt(minutes));
    return seanceDateTime < now;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Mes Séances">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const filteredSeances = getFilteredSeances();

  return (
    <Layout title="Mes Séances">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Séances</h1>
              <p className="text-gray-600 mt-1">Gérez vos cours et suivez votre progression</p>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Séances</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Terminées</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{stats.terminees}</p>
                    <p className="text-xs text-green-600 mt-1">{stats.tauxCompletion}% complété</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">En Retard</p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">{stats.enRetard}</p>
                    <p className="text-xs text-orange-600 mt-1">À compléter</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Heures</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {stats.heuresEffectuees}/{stats.totalHeures}h
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Effectuées</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alert for pending sessions */}
        {stats && stats.enRetard > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-orange-800">
                  Séances en attente de validation
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Vous avez {stats.enRetard} séance{stats.enRetard > 1 ? 's' : ''} passée{stats.enRetard > 1 ? 's' : ''} qui n'a{stats.enRetard > 1 ? 'ont' : ''} pas encore été marquée{stats.enRetard > 1 ? 's' : ''} comme terminée{stats.enRetard > 1 ? 's' : ''}.
                  Veuillez les compléter pour mettre à jour la progression de vos modules.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtres:</span>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="PLANIFIE">Planifiées</option>
              <option value="CONFIRME">Confirmées</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminées</option>
              <option value="REPORTE">Reportées</option>
            </select>

            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les modules</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.code} - {module.name}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPastOnly}
                onChange={(e) => setShowPastOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Séances passées uniquement</span>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Liste des séances ({filteredSeances.length})
            </h2>
          </div>

          {filteredSeances.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune séance trouvée</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSeances.map((seance) => {
                const isPast = isSeancePast(seance);
                const canComplete = isPast && seance.status !== 'TERMINE' && seance.status !== 'ANNULE';

                return (
                  <div
                    key={seance.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      canComplete ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {seance.module.code} - {seance.module.name}
                          </h3>
                          {getStatusBadge(seance.status)}
                          {canComplete && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                              À compléter
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(seance.dateSeance)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {seance.heureDebut} - {seance.heureFin} ({seance.duree}h)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>{seance.typeSeance}</span>
                          </div>
                        </div>

                        {seance.salle && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Salle:</span> {seance.salle}
                            {seance.batiment && ` - ${seance.batiment}`}
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${seance.module.progression}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {seance.module.progression}%
                          </span>
                        </div>

                        {seance.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Notes:</span> {seance.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {canComplete && (
                        <button
                          onClick={() => handleCompleteSeance(seance.id)}
                          disabled={completingId === seance.id}
                          className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                        >
                          {completingId === seance.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>En cours...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Marquer comme terminée</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modules Progress */}
        {modules.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Progression par Module
            </h2>
            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {module.code} - {module.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {module.programme.name} ({module.programme.code})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{module.progression}%</p>
                      <p className="text-xs text-gray-500">
                        {module.seancesCompletees}/{module.seancesTotal} séances
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        module.progression >= 100
                          ? 'bg-green-600'
                          : module.progression > 0
                          ? 'bg-blue-600'
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${module.progression}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// pages/rotations-weekend/index.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import Layout from '../../components/layout';
import {
  Calendar,
  Users,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  UserX,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function RotationsWeekendPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rotations, setRotations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar'); // 'calendar' ou 'list'
  const [filtreStatus, setFiltreStatus] = useState('all');
  const [filtreResponsable, setFiltreResponsable] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRotations();
    }
  }, [status, currentMonth, filtreStatus, filtreResponsable]);

  const fetchRotations = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        annee: currentMonth.getFullYear(),
        mois: currentMonth.getMonth() + 1,
        includeStats: 'true'
      });

      if (filtreStatus !== 'all') {
        params.append('status', filtreStatus);
      }

      if (filtreResponsable !== 'all') {
        params.append('responsableId', filtreResponsable);
      }

      const response = await fetch(`/api/rotations-weekend?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRotations(data.rotations);
        setStats(data.stats);
      } else {
        console.error('Erreur:', data.error);
      }
    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenererRotations = async () => {
    if (!confirm('Générer les rotations pour les 12 prochaines semaines ?')) {
      return;
    }

    try {
      const response = await fetch('/api/rotations-weekend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nbSemaines: 12,
          dateDebut: new Date()
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`${data.rotations.length} rotations générées avec succès !`);
        fetchRotations();
      } else {
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur génération:', error);
      alert('Erreur lors de la génération');
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getStatusBadge = (status) => {
    const badges = {
      PLANIFIE: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Planifié' },
      CONFIRME: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Confirmé' },
      EN_COURS: { color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp, text: 'En cours' },
      TERMINE: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, text: 'Terminé' },
      TERMINE_SANS_RAPPORT: { color: 'bg-gray-100 text-gray-600', icon: AlertCircle, text: 'Terminé' },
      ABSENT: { color: 'bg-red-100 text-red-800', icon: UserX, text: 'Absent' },
      ANNULE: { color: 'bg-gray-300 text-gray-600', icon: AlertCircle, text: 'Annulé' }
    };

    const badge = badges[status] || badges.PLANIFIE;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Rotations Weekend - Planning FC">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rotations Weekend</h1>
            <p className="text-gray-600 mt-1">
              Gestion des rotations de supervision des cours du weekend
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button
              onClick={fetchRotations}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={handleGenererRotations}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Plus className="w-4 h-4" />
              Générer Rotations
            </button>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Weekends</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalWeekends}</p>
                </div>
                <Calendar className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Terminés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.weekendsTermines}</p>
                  <p className="text-xs text-gray-500">{stats.tauxCompletion}% taux</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Absences</p>
                  <p className="text-2xl font-bold text-red-600">{stats.weekendsAbsences}</p>
                  <p className="text-xs text-gray-500">{stats.tauxAbsence}% taux</p>
                </div>
                <UserX className="w-10 h-10 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Satisfaction</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.moyenneSatisfaction ? `${stats.moyenneSatisfaction}/5` : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Moyenne</p>
                </div>
                <TrendingUp className="w-10 h-10 text-yellow-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filtres et Vue */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filtreStatus}
                onChange={(e) => setFiltreStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="PLANIFIE">Planifiés</option>
                <option value="CONFIRME">Confirmés</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminés</option>
                <option value="ABSENT">Absents</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-lg transition ${
                  view === 'calendar'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg transition ${
                  view === 'list'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation mois */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">
              {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Liste des rotations */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Séances
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rotations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Aucune rotation trouvée pour ce mois
                    </td>
                  </tr>
                ) : (
                  rotations.map((rotation) => (
                    <tr key={rotation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(rotation.dateDebut).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                          {' - '}
                          {new Date(rotation.dateFin).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          Semaine {rotation.semaineNumero}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-sm font-medium">
                              {rotation.responsable.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {rotation.responsable.name}
                            </div>
                            {rotation.substitut && (
                              <div className="text-xs text-gray-500">
                                Remplacé par {rotation.substitut.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(rotation.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rotation.nbSeancesRealisees}/{rotation.nbSeancesTotal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/rotations-weekend/${rotation.id}`)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Protection côté serveur
export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // Seuls ADMIN et COORDINATOR peuvent accéder
  if (!['ADMIN', 'COORDINATOR'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

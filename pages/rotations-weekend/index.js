// pages/rotations-weekend/index.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import ConfirmModal from '../../components/modals/ConfirmModal';
import apiClient from '../../lib/api-client';
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'confirm', title: '', message: '', onConfirm: null });
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      // Seuls ADMIN et COORDINATOR peuvent accéder
      if (!['ADMIN', 'COORDINATOR'].includes(session?.user?.role)) {
        router.push('/dashboard');
        return;
      }
      fetchRotations();
    }
  }, [status, session, router, currentMonth, filtreStatus, filtreResponsable, page]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [currentMonth, filtreStatus, filtreResponsable]);

  const fetchRotations = async () => {
    try {
      setLoading(true);

      const params = {
        annee: currentMonth.getFullYear(),
        page,
        limit: 10,
        includeStats: 'true'
      };

      if (filtreStatus !== 'all') {
        params.status = filtreStatus;
      }

      if (filtreResponsable !== 'all') {
        params.responsableId = filtreResponsable;
      }

      const response = await apiClient.rotationsWeekend.getAll(params);
      console.log('rotations weekends', response);

      setRotations(response.data || response.data || []);
      setStats(response.stats || null);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Erreur API rotations-weekend:', error);
      setRotations([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const handleGenererRotations = () => {
    setConfirmModal({
      isOpen: true,
      type: 'confirm',
      title: 'Générer les rotations',
      message: 'Voulez-vous générer les rotations pour les 12 prochaines semaines ?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const data = await apiClient.rotationsWeekend.generate({
            nbSemaines: 12,
            dateDebut: new Date().toISOString()
          });

          setAlertModal({
            isOpen: true,
            type: 'success',
            title: 'Rotations générées',
            message: `${data.rotations?.length || data.total} rotations ont été générées avec succès !`
          });
          fetchRotations();
        } catch (error) {
          console.error('Erreur génération:', error);
          setAlertModal({
            isOpen: true,
            type: 'error',
            title: 'Erreur',
            message: error.message || 'Erreur lors de la génération'
          });
        }
      }
    });
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
                  <p className="text-2xl font-bold text-gray-900">{stats.totalWeekends || stats.total || 0}</p>
                </div>
                <Calendar className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Terminés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.weekendsTermines || stats.termines || 0}</p>
                  <p className="text-xs text-gray-500">{stats.tauxCompletion || 0}% taux</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Absences</p>
                  <p className="text-2xl font-bold text-red-600">{stats.weekendsAbsences || stats.absences || 0}</p>
                  <p className="text-xs text-gray-500">{stats.tauxAbsence || 0}% taux</p>
                </div>
                <UserX className="w-10 h-10 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Satisfaction</p>
                  <p className="text-xs text-gray-500">Moyenne</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.moyenneSatisfaction || (stats.weekendsTermines ? `${stats.weekendsTermines}/${stats.totalWeekends}` : '0')}
                  </p>
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

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Affichage <span className="font-medium">{((page - 1) * (pagination.limit || 10)) + 1}</span> à{' '}
                    <span className="font-medium">{Math.min(page * (pagination.limit || 10), pagination.total)}</span> sur{' '}
                    <span className="font-medium">{pagination.total}</span> résultats
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {page} sur {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Générer"
        cancelText="Annuler"
      />

      {/* Modal d'alerte/notification */}
      <ConfirmModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="OK"
        showCancel={false}
      />
    </Layout>
  );
}

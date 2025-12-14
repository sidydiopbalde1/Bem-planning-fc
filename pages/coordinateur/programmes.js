// pages/coordinateur/programmes.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout.js';
import PageTransition, { AnimatedCard } from '../../components/ui/PageTransition.js';
import {
  BookOpen, Plus, Search, Edit2, Trash2, AlertCircle, Calendar,
  TrendingUp, Clock, CheckCircle, XCircle, Eye
} from 'lucide-react';

export default function ProgrammesManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [programmes, setProgrammes] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && !['COORDINATOR', 'ADMIN'].includes(session?.user?.role)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && ['COORDINATOR', 'ADMIN'].includes(session?.user?.role)) {
      fetchProgrammes();
    }
  }, [status, session, searchTerm, statusFilter]);

  const fetchProgrammes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/coordinateur/programmes?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProgrammes(data.programmes);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PLANIFIE: 'bg-gray-100 text-gray-800',
      EN_COURS: 'bg-blue-100 text-blue-800',
      TERMINE: 'bg-green-100 text-green-800',
      SUSPENDU: 'bg-yellow-100 text-yellow-800',
      ANNULE: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.PLANIFIE;
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
          <title>Mes Programmes - BEM Planning</title>
        </Head>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
                  Mes Programmes
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Gérez vos programmes et suivez leur progression
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouveau Programme
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <AnimatedCard delay={0.1}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total || 0}</p>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.2}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Progression moyenne</p>
                <p className="text-2xl font-bold text-blue-600">{stats.progressionMoyenne || 0}%</p>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.3}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">En cours</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.parStatut?.find(s => s.status === 'EN_COURS')?._count.status || 0}
                </p>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.4}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">En retard</p>
                <p className="text-2xl font-bold text-red-600">{stats.enRetard || 0}</p>
              </div>
            </AnimatedCard>
          </div>

          {/* Filtres */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un programme..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tous les statuts</option>
                <option value="PLANIFIE">Planifié</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
                <option value="SUSPENDU">Suspendu</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>

          {/* Liste des programmes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programmes.map((programme) => (
              <AnimatedCard key={programme.id} delay={0.1}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {programme.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{programme.code}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(programme.status)}`}>
                      {getStatusLabel(programme.status)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(programme.dateDebut).toLocaleDateString('fr-FR')} - {new Date(programme.dateFin).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <BookOpen className="w-4 h-4 mr-2" />
                      {programme._count.modules} module(s)
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      {programme.totalVHT}h VHT
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Progression</span>
                      <span className="font-medium text-gray-900 dark:text-white">{programme.progression}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(programme.progression)}`}
                        style={{ width: `${programme.progression}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => router.push(`/coordinateur/programmes/${programme.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir détails
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProgramme(programme);
                          setShowEditModal(true);
                        }}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>

          {programmes.length === 0 && !loading && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Aucun programme trouvé
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Commencez par créer un nouveau programme
              </p>
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateProgrammeModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchProgrammes();
            }}
          />
        )}

        {showEditModal && selectedProgramme && (
          <EditProgrammeModal
            programme={selectedProgramme}
            onClose={() => {
              setShowEditModal(false);
              setSelectedProgramme(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedProgramme(null);
              fetchProgrammes();
            }}
          />
        )}
      </Layout>
    </PageTransition>
  );
}

function CreateProgrammeModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    niveau: 'L1',
    semestre: 'SEMESTRE_1',
    totalVHT: '',
    dateDebut: '',
    dateFin: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const response = await fetch('/api/coordinateur/programmes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-md z-50">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0" onClick={onClose}></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-6 z-10" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Créer un nouveau programme
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: INFO-L1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Niveau *</label>
                <select
                  required
                  value={formData.niveau}
                  onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="L1">Licence 1</option>
                  <option value="L2">Licence 2</option>
                  <option value="L3">Licence 3</option>
                  <option value="M1">Master 1</option>
                  <option value="M2">Master 2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Informatique Générale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semestre *</label>
                <select
                  required
                  value={formData.semestre}
                  onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <option key={i} value={`SEMESTRE_${i}`}>Semestre {i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">VHT Total *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.totalVHT}
                  onChange={(e) => setFormData({ ...formData, totalVHT: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date début *</label>
                <input
                  type="date"
                  required
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin *</label>
                <input
                  type="date"
                  required
                  value={formData.dateFin}
                  onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditProgrammeModal({ programme, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: programme.name,
    description: programme.description || '',
    niveau: programme.niveau,
    semestre: programme.semestre,
    totalVHT: programme.totalVHT,
    dateDebut: programme.dateDebut.split('T')[0],
    dateFin: programme.dateFin.split('T')[0],
    status: programme.status,
    progression: programme.progression
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const response = await fetch(`/api/coordinateur/programmes/${programme.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-md z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0" onClick={onClose}></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-6 z-10" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Modifier le programme
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="PLANIFIE">Planifié</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="SUSPENDU">Suspendu</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progression *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.progression}
                  onChange={(e) => setFormData({ ...formData, progression: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// pages/coordinateur/modules.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout';
import CreateModuleModal from '../../components/modals/CreateModuleModal';
import AnimatedPagination from '../../components/ui/AnimatedPagination';
import { useTableAnimation } from '../../components/ui/AnimatedTable';
import apiClient from '../../lib/api-client';
import {
  BookOpen, Search, Plus, Edit2, Trash2, User, Calendar, Clock, BarChart3,
  Filter, X, ChevronDown, AlertTriangle, CheckCircle
} from 'lucide-react';

export default function ModulesPage() {
  const router = useRouter();
  const { programmeId } = router.query;
  const { data: session, status } = useSession();
  const [modules, setModules] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [intervenants, setIntervenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState(programmeId || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // ===== AUTHENTIFICATION =====
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['COORDINATOR', 'ADMIN'].includes(session?.user?.role)) {
      router.push('/');
    }
  }, [status, session, router]);

  // ===== CHARGEMENT INITIAL =====
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProgrammes();
      fetchIntervenants();
    }
  }, [status]);

  useEffect(() => {
    if (programmeId) {
      setSelectedProgramme(programmeId);
    }
  }, [programmeId]);

  // ===== DEBOUNCE SEARCH =====
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ===== FETCH MODULES =====
  const fetchModules = async (currentPage) => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 10 };
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (statusFilter) params.status = statusFilter;
      if (selectedProgramme) params.programmeId = selectedProgramme;

      const data = await apiClient.coordinateur.getModules(params);
      console.log("modules coordinateur", data);

      setModules(data.modules || data);
      setPagination(data.pagination || null);
    } catch (error) {
      setError(error.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchModules(page);
    }
  }, [status, debouncedSearchTerm, statusFilter, selectedProgramme, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, statusFilter, selectedProgramme]);

  const fetchProgrammes = async () => {
    try {
      const data = await apiClient.coordinateur.getProgrammes();
      setProgrammes(data.programmes || data);
    } catch (error) {
      console.error('Erreur:', error.message || error);
    }
  };

  const fetchIntervenants = async () => {
    try {
      const intervenants = await apiClient.intervenants.getAll();
      const list = intervenants?.data || intervenants;
      setIntervenants(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Erreur:', error.message || error);
      setIntervenants([]);
    }
  };

  // ===== HANDLERS =====
  const handleCreateModule = async (formData) => {
    try {
      await apiClient.modules.create(formData);
      setSuccess('Module créé avec succès');
      setShowCreateModal(false);
      fetchModules(page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateModule = async (formData) => {
    try {
      await apiClient.modules.update(selectedModule.id, formData);
      setSuccess('Module mis à jour avec succès');
      setShowEditModal(false);
      fetchModules(page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteModule = async () => {
    try {
      await apiClient.modules.delete(selectedModule.id);
      setSuccess('Module supprimé avec succès');
      setShowDeleteConfirm(false);
      setSelectedModule(null);
      fetchModules(page);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Erreur lors de la suppression');
    }
  };

  const handlePageChange = (
    
    
  ) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== UTILS =====
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

  const calculateStats = () => {
    return {
      total: modules.length,
      totalVHT: modules.reduce((sum, m) => sum + (m.vht || 0), 0),
      termines: modules.filter(m => m.status === 'TERMINE').length,
      enCours: modules.filter(m => m.status === 'EN_COURS').length,
      avecIntervenant: modules.filter(m => m.intervenant).length,
      sansIntervenant: modules.filter(m => !m.intervenant).length
    };
  };

  const stats = calculateStats();

  // Hook pour les animations du tableau
  const { animatedData, isAnimating, getRowAnimation } = useTableAnimation(modules, page);

  if (status === 'loading' || (loading && modules.length === 0)) {
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
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Modules</h1>
            <p className="text-gray-600 mt-1">Gérez les modules de vos programmes</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau module</span>
          </button>
        </div>

        {/* ===== MESSAGES ===== */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===== STATISTICS CARDS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">VHT Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVHT}h</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminés</p>
                <p className="text-2xl font-bold text-green-600">{stats.termines}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avec intervenant</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avecIntervenant}</p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sans intervenant</p>
                <p className="text-2xl font-bold text-orange-600">{stats.sansIntervenant}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par code ou nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Tous les programmes</option>
              {programmes.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.code} - {prog.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

        {/* ===== TABLE ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
          {/* Loading overlay */}
          {loading && modules.length > 0 && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-30 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className="w-10 h-10 border-4 border-green-200 rounded-full animate-spin border-t-green-600" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Chargement...</span>
              </div>
            </div>
          )}

          {animatedData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Programme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Intervenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">VHT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seances</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progression</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {animatedData.map((module, index) => {
                    const rowAnim = getRowAnimation(index);
                    return (
                      <tr
                        key={module.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${rowAnim.className}`}
                        style={rowAnim.style}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {module.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {module.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {module.programme?.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {module.intervenant ? (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{module.intervenant.prenom} {module.intervenant.nom}</span>
                            </div>
                          ) : (
                            <span className="text-orange-600 flex items-center space-x-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Non assigne</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="text-sm">
                            <div>{module.vht}h</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              CM:{module.cm} TD:{module.td} TP:{module.tp}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {module._count?.seances || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full transition-all duration-300 ${getStatusColor(module.status)}`}>
                            {getStatusLabel(module.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressColor(module.progression || 0)}`}
                                style={{ width: `${module.progression || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{module.progression || 0}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedModule(module);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
                              title="Editer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedModule(module);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Aucun module trouve</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                Creer le premier module
              </button>
            </div>
          )}

          {/* ===== PAGINATION ANIMEE ===== */}
          <AnimatedPagination
            pagination={pagination}
            currentPage={page}
            onPageChange={handlePageChange}
          />
        </div>

        {/* ===== MODALS ===== */}
        {/* Create Modal */}
        <CreateModuleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateModule}
          programmeId={selectedProgramme}
        />

        {/* Edit Modal */}
        {showEditModal && selectedModule && (
          <ModuleEditModal
            isOpen={showEditModal}
            module={selectedModule}
            programmes={programmes}
            intervenants={intervenants}
            onClose={() => {
              setShowEditModal(false);
              setSelectedModule(null);
            }}
            onSuccess={handleUpdateModule}
          />
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && selectedModule && (
          <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            module={selectedModule}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeleteModule}
          />
        )}
      </div>
    </Layout>
  );
}

/**
 * Composant Modal d'édition
 */
function ModuleEditModal({ isOpen, module, programmes, intervenants, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    code: module?.code || '',
    name: module?.name || '',
    description: module?.description || '',
    cm: module?.cm || 0,
    td: module?.td || 0,
    tp: module?.tp || 0,
    tpe: module?.tpe || 0,
    coefficient: module?.coefficient || 1,
    credits: module?.credits || 1,
    programmeId: module?.programmeId || '',
    intervenantId: module?.intervenantId || '',
    dateDebut: module?.dateDebut ? new Date(module.dateDebut).toISOString().split('T')[0] : '',
    dateFin: module?.dateFin ? new Date(module.dateFin).toISOString().split('T')[0] : '',
    status: module?.status || 'PLANIFIE',
    progression: module?.progression || 0
  });
  const [loading, setLoading] = useState(false);

  const vht = parseInt(formData.cm || 0) + parseInt(formData.td || 0) + parseInt(formData.tp || 0) + parseInt(formData.tpe || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSuccess(formData);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose}></div>
      <div className="fixed inset-0 z-35 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h3 className="text-lg font-medium text-gray-900">Modifier le module</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Programme</label>
                <select
                  value={formData.programmeId}
                  onChange={(e) => setFormData({ ...formData, programmeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner</option>
                  {programmes.map((prog) => (
                    <option key={prog.id} value={prog.id}>{prog.code}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <input
                type="number"
                placeholder="CM"
                value={formData.cm}
                onChange={(e) => setFormData({ ...formData, cm: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="TD"
                value={formData.td}
                onChange={(e) => setFormData({ ...formData, td: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="TP"
                value={formData.tp}
                onChange={(e) => setFormData({ ...formData, tp: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="TPE"
                value={formData.tpe}
                onChange={(e) => setFormData({ ...formData, tpe: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-xs text-blue-600 font-bold">VHT: {vht}h</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Progression: {formData.progression}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progression}
                onChange={(e) => setFormData({ ...formData, progression: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/**
 * Composant Modal de confirmation de suppression
 */
function DeleteConfirmModal({ isOpen, module, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose}></div>
      <div className="fixed inset-0 z-35 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-lg p-6 max-w-md w-full pointer-events-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
          <p className="text-gray-600 mb-4">
            Êtes-vous sûr de vouloir supprimer le module <strong>{module.code}</strong> ?
          </p>
          {module._count?.seances > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                Ce module contient {module._count.seances} séance(s). Vous devez d'abord les supprimer.
              </p>
            </div>
          )}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={module._count?.seances > 0}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
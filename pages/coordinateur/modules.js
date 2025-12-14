// pages/coordinateur/modules.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout';
import {
  BookOpen, Search, Plus, Edit2, Trash2, User, Calendar, Clock, BarChart3,
  Filter, X, ChevronDown, AlertTriangle, CheckCircle, Calendar as CalendarIcon
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
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState(programmeId || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchModules();
    }
  }, [status, searchTerm, statusFilter, selectedProgramme]);

  const fetchProgrammes = async () => {
    try {
      const response = await fetch('/api/coordinateur/programmes');
      if (response.ok) {
        const data = await response.json();
        setProgrammes(data.programmes);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchIntervenants = async () => {
    try {
      const response = await fetch('/api/intervenants');
      if (response.ok) {
        const data = await response.json();
        setIntervenants(data.intervenants);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (selectedProgramme) params.append('programmeId', selectedProgramme);

      const response = await fetch(`/api/coordinateur/modules?${params}`);
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules);
      } else {
        setError('Erreur lors du chargement des modules');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async (formData) => {
    try {
      const response = await fetch('/api/coordinateur/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Module créé avec succès');
        setShowCreateModal(false);
        fetchModules();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    }
  };

  const handleUpdateModule = async (formData) => {
    try {
      const response = await fetch(`/api/coordinateur/modules/${selectedModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Module mis à jour avec succès');
        setShowEditModal(false);
        fetchModules();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    }
  };

  const handleDeleteModule = async () => {
    try {
      const response = await fetch(`/api/coordinateur/modules/${selectedModule.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Module supprimé avec succès');
        setShowDeleteConfirm(false);
        setSelectedModule(null);
        fetchModules();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
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

        {/* Success/Error Messages */}
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

        {/* Statistics Cards */}
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

        {/* Filters */}
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

        {/* Modules Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {modules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intervenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VHT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Séances</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modules.map((module) => (
                    <tr key={module.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {module.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {module.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {module.programme?.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {module.intervenant ? (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{module.intervenant.prenom} {module.intervenant.nom}</span>
                          </div>
                        ) : (
                          <span className="text-orange-600 flex items-center space-x-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Non assigné</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-sm">
                          <div>{module.vht}h</div>
                          <div className="text-xs text-gray-500">
                            CM:{module.cm} TD:{module.td} TP:{module.tp}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {module._count?.seances || 0}
                      </td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedModule(module);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedModule(module);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucun module trouvé</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Créer le premier module
              </button>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <ModuleModal
            mode="create"
            programmes={programmes}
            intervenants={intervenants}
            initialProgrammeId={programmeId}
            onSubmit={handleCreateModule}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && selectedModule && (
          <ModuleModal
            mode="edit"
            module={selectedModule}
            programmes={programmes}
            intervenants={intervenants}
            onSubmit={handleUpdateModule}
            onClose={() => {
              setShowEditModal(false);
              setSelectedModule(null);
            }}
          />
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && selectedModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
              <p className="text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer le module <strong>{selectedModule.code}</strong> ?
              </p>
              {selectedModule._count?.seances > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800">
                    Ce module contient {selectedModule._count.seances} séance(s). Vous devez d'abord les supprimer.
                  </p>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteModule}
                  disabled={selectedModule._count?.seances > 0}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
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

function ModuleModal({ mode, module, programmes, intervenants, initialProgrammeId, onSubmit, onClose }) {
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
    programmeId: module?.programmeId || initialProgrammeId || '',
    intervenantId: module?.intervenantId || '',
    dateDebut: module?.dateDebut ? new Date(module.dateDebut).toISOString().split('T')[0] : '',
    dateFin: module?.dateFin ? new Date(module.dateFin).toISOString().split('T')[0] : '',
    status: module?.status || 'PLANIFIE',
    progression: module?.progression || 0
  });

  const vht = parseInt(formData.cm || 0) + parseInt(formData.td || 0) + parseInt(formData.tp || 0) + parseInt(formData.tpe || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {mode === 'create' ? 'Nouveau Module' : 'Modifier le Module'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: INF101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Programme *</label>
              <select
                required
                value={formData.programmeId}
                onChange={(e) => setFormData({ ...formData, programmeId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Sélectionner un programme</option>
                {programmes.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.code} - {prog.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom du module *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ex: Introduction à l'Informatique"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Description du module..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CM (h)</label>
              <input
                type="number"
                min="0"
                value={formData.cm}
                onChange={(e) => setFormData({ ...formData, cm: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TD (h)</label>
              <input
                type="number"
                min="0"
                value={formData.td}
                onChange={(e) => setFormData({ ...formData, td: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TP (h)</label>
              <input
                type="number"
                min="0"
                value={formData.tp}
                onChange={(e) => setFormData({ ...formData, tp: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TPE (h)</label>
              <input
                type="number"
                min="0"
                value={formData.tpe}
                onChange={(e) => setFormData({ ...formData, tpe: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="bg-purple-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-purple-700 mb-1">VHT Total</label>
              <p className="text-2xl font-bold text-purple-900">{vht}h</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coefficient</label>
              <input
                type="number"
                min="1"
                value={formData.coefficient}
                onChange={(e) => setFormData({ ...formData, coefficient: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crédits ECTS</label>
              <input
                type="number"
                min="1"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Intervenant</label>
            <select
              value={formData.intervenantId}
              onChange={(e) => setFormData({ ...formData, intervenantId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Aucun (à assigner plus tard)</option>
              {intervenants.map((intervenant) => (
                <option key={intervenant.id} value={intervenant.id}>
                  {intervenant.prenom} {intervenant.nom} - {intervenant.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
              <input
                type="date"
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {mode === 'edit' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="PLANIFIE">Planifié</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="SUSPENDU">Suspendu</option>
                  <option value="ANNULE">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progression ({formData.progression}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progression}
                  onChange={(e) => setFormData({ ...formData, progression: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {mode === 'create' ? 'Créer' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

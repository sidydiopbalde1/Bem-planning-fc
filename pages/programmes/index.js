// pages/programmes/index.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout';
import CreateProgrammeModal from '../../components/modals/CreateProgrammeModal';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  Settings,
  Copy,
  Archive
} from 'lucide-react';

export default function ProgrammesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [programmes, setProgrammes] = useState([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSemestre, setFilterSemestre] = useState('all');
  const [filterNiveau, setFilterNiveau] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedProgramme, setSelectedProgramme] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated') {
      fetchProgrammes();
    }
  }, [status, router]);

  useEffect(() => {
    filterProgrammes();
  }, [programmes, searchTerm, filterStatus, filterSemestre, filterNiveau, sortBy]);

  const fetchProgrammes = async () => {
    try {
      const response = await fetch('/api/programmes');
      const data = await response.json();
      
      if (response.ok) {
        setProgrammes(data.programmes);
      } else {
        console.error('Erreur:', data.error);
      }
    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProgrammes = () => {
    let filtered = [...programmes];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(prog => 
        prog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prog.description && prog.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(prog => prog.status === filterStatus);
    }

    // Filtre par semestre
    if (filterSemestre !== 'all') {
      filtered = filtered.filter(prog => prog.semestre === filterSemestre);
    }

    // Filtre par niveau
    if (filterNiveau !== 'all') {
      filtered = filtered.filter(prog => prog.niveau === filterNiveau);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'date':
          return new Date(a.dateDebut) - new Date(b.dateDebut);
        case 'recent':
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

    setFilteredProgrammes(filtered);
  };

  const handleCreateSuccess = (newProgramme) => {
    setProgrammes(prev => [newProgramme, ...prev]);
    setShowCreateModal(false);
  };

  const handleDelete = async (programmeId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce programme ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/programmes/${programmeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProgrammes(prev => prev.filter(p => p.id !== programmeId));
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      alert('Erreur de connexion');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'EN_COURS': 'bg-green-100 text-green-800 border-green-200',
      'PLANIFIE': 'bg-blue-100 text-blue-800 border-blue-200',
      'TERMINE': 'bg-gray-100 text-gray-800 border-gray-200',
      'SUSPENDU': 'bg-red-100 text-red-800 border-red-200',
      'ANNULE': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status) => {
    const texts = {
      'EN_COURS': 'En cours',
      'PLANIFIE': 'Planifié',
      'TERMINE': 'Terminé',
      'SUSPENDU': 'Suspendu',
      'ANNULE': 'Annulé'
    };
    return texts[status] || status;
  };

  const getSemestreText = (semestre) => {
    const texts = {
      'SEMESTRE_1': 'S1',
      'SEMESTRE_2': 'S2',
      'SEMESTRE_3': 'S3',
      'SEMESTRE_4': 'S4',
      'SEMESTRE_5': 'S5',
      'SEMESTRE_6': 'S6'
    };
    return texts[semestre] || semestre;
  };

  const calculateProgress = (programme) => {
    if (!programme.modules || programme.modules.length === 0) return 0;
    const completedModules = programme.modules.filter(m => m.status === 'TERMINE').length;
    return Math.round((completedModules / programme.modules.length) * 100);
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Programmes de Formation - Planning FC</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Programmes de Formation</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos maquettes pédagogiques et programmes de formation continue
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 lg:mt-0 flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Programme
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{programmes.length}</p>
                <p className="text-sm text-gray-600">Total programmes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {programmes.filter(p => p.status === 'EN_COURS').length}
                </p>
                <p className="text-sm text-gray-600">En cours</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {programmes.filter(p => p.status === 'PLANIFIE').length}
                </p>
                <p className="text-sm text-gray-600">Planifiés</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {programmes.reduce((total, p) => total + (p.totalVHT || 0), 0)}h
                </p>
                <p className="text-sm text-gray-600">Volume horaire total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, code ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="EN_COURS">En cours</option>
                <option value="PLANIFIE">Planifiés</option>
                <option value="TERMINE">Terminés</option>
                <option value="SUSPENDU">Suspendus</option>
              </select>

              <select
                value={filterSemestre}
                onChange={(e) => setFilterSemestre(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">Tous les semestres</option>
                <option value="SEMESTRE_1">Semestre 1</option>
                <option value="SEMESTRE_2">Semestre 2</option>
                <option value="SEMESTRE_3">Semestre 3</option>
                <option value="SEMESTRE_4">Semestre 4</option>
                <option value="SEMESTRE_5">Semestre 5</option>
                <option value="SEMESTRE_6">Semestre 6</option>
              </select>

              <select
                value={filterNiveau}
                onChange={(e) => setFilterNiveau(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">Tous les niveaux</option>
                <option value="L1">Licence 1</option>
                <option value="L2">Licence 2</option>
                <option value="L3">Licence 3</option>
                <option value="M1">Master 1</option>
                <option value="M2">Master 2</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="recent">Plus récents</option>
                <option value="name">Nom A-Z</option>
                <option value="code">Code A-Z</option>
                <option value="date">Date de début</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>{filteredProgrammes.length} programme(s) trouvé(s)</span>
          </div>
        </div>

        {/* Liste des programmes */}
        {filteredProgrammes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {programmes.length === 0 ? 'Aucun programme' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-500 mb-6">
              {programmes.length === 0 
                ? 'Commencez par créer votre premier programme de formation'
                : 'Aucun programme ne correspond à vos critères de recherche'
              }
            </p>
            {programmes.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer un programme
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProgrammes.map((programme) => {
              const progress = calculateProgress(programme);
              const isOverdue = new Date(programme.dateFin) < new Date() && programme.status !== 'TERMINE';
              
              return (
                <div key={programme.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Header avec statut et actions */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {programme.name}
                          </h3>
                          {isOverdue && (
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" title="En retard" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {programme.code}
                          </span>
                          <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded">
                            {getSemestreText(programme.semestre)} - {programme.niveau}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(programme.status)}`}>
                          {getStatusText(programme.status)}
                        </span>
                        
                        <div className="relative">
                          <button
                            onClick={() => setSelectedProgramme(selectedProgramme === programme.id ? null : programme.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {selectedProgramme === programme.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                              <Link
                                href={`/programmes/${programme.id}`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setSelectedProgramme(null)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir le détail
                              </Link>
                              <Link
                                href={`/programmes/${programme.id}/edit`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setSelectedProgramme(null)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </Link>
                              <Link
                                href={`/programmes/${programme.id}/modules`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setSelectedProgramme(null)}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Gérer modules
                              </Link>
                              <button
                                onClick={() => {
                                  setSelectedProgramme(null);
                                  // Logique de duplication
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliquer
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => {
                                  setSelectedProgramme(null);
                                  handleDelete(programme.id);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {programme.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {programme.description}
                      </p>
                    )}

                    {/* Métriques */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Users className="h-4 w-4 text-gray-400 mr-1" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {programme.modules?.length || 0}
                        </p>
                        <p className="text-xs text-gray-600">Modules</p>
                      </div>
                      
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {programme.totalVHT || 0}h
                        </p>
                        <p className="text-xs text-gray-600">Volume horaire</p>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progression</span>
                        <span className="text-xs text-gray-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(programme.dateDebut).toLocaleDateString('fr-FR')} - 
                          {new Date(programme.dateFin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Actions principales */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <Link
                        href={`/programmes/${programme.id}`}
                        className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir détail
                      </Link>
                      
                      <div className="text-xs text-gray-500">
                        Mis à jour le {new Date(programme.updatedAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <CreateProgrammeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </Layout>
  );
}
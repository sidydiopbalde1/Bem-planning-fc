import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout';
import CreateProgrammeModal from '../../components/modals/CreateProgrammeModal';
import ImportExcelModal from '../../components/modals/ImportExcelModal';
import PageTransition, { AnimatedCard, AnimatedButton, AnimatedStats, SlideIn, FadeIn } from '../../components/ui/PageTransition';
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
  Archive,
  Upload
} from 'lucide-react';

export default function ProgrammesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [programmes, setProgrammes] = useState([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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

    if (searchTerm) {
      filtered = filtered.filter(prog =>
        prog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prog.description && prog.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(prog => prog.status === filterStatus);
    }

    if (filterSemestre !== 'all') {
      filtered = filtered.filter(prog => prog.semestre === filterSemestre);
    }

    if (filterNiveau !== 'all') {
      filtered = filtered.filter(prog => prog.niveau === filterNiveau);
    }

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

  const handleImportSuccess = (data) => {
    // Rafraîchir la liste des programmes après l'importation
    fetchProgrammes();
    setShowImportModal(false);
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
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-red-600 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const statsData = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      value: programmes.length,
      label: 'Total programmes',
      color: 'bg-red-100 text-red-600',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      value: programmes.filter(p => p.status === 'EN_COURS').length,
      label: 'En cours',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      value: programmes.filter(p => p.status === 'PLANIFIE').length,
      label: 'Planifiés',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: `${programmes.reduce((total, p) => total + (p.totalVHT || 0), 0)}h`,
      label: 'Volume horaire total',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <Layout>
      <Head>
        <title>Programmes de Formation - BEM Planning FC</title>
      </Head>

      <div className="space-y-8 p-6">
        {/* Header animé */}
        <SlideIn direction="down">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                Programmes de Formation
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Gérez vos maquettes pédagogiques et programmes de formation continue
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                <Upload className="h-5 w-5" />
                <span>Importer Excel</span>
              </button>
              <AnimatedButton
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                className="shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Nouveau Programme</span>
              </AnimatedButton>
            </div>
          </div>
        </SlideIn>

        {/* Statistiques animées */}
        <AnimatedStats stats={statsData} />

        {/* Filtres et recherche animés */}
        <FadeIn delay={300}>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, code ou description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white font-medium"
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
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white font-medium"
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
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white font-medium"
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
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white font-medium"
                >
                  <option value="recent">Plus récents</option>
                  <option value="name">Nom A-Z</option>
                  <option value="code">Code A-Z</option>
                  <option value="date">Date de début</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm font-semibold">
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700">
                {filteredProgrammes.length} programme(s) trouvé(s)
              </span>
            </div>
          </div>
        </FadeIn>

        {/* Liste des programmes animée */}
        {filteredProgrammes.length === 0 ? (
          <FadeIn delay={400}>
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-md">
              <div className="animate-bounce">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {programmes.length === 0 ? 'Aucun programme' : 'Aucun résultat'}
              </h3>
              <p className="text-gray-500 mb-6">
                {programmes.length === 0
                  ? 'Commencez par créer votre premier programme de formation'
                  : 'Aucun programme ne correspond à vos critères de recherche'
                }
              </p>
              {programmes.length === 0 && (
                <AnimatedButton
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                >
                  Créer un programme
                </AnimatedButton>
              )}
            </div>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProgrammes.map((programme, index) => {
              const progress = calculateProgress(programme);
              const isOverdue = new Date(programme.dateFin) < new Date() && programme.status !== 'TERMINE';

              return (
                <PageTransition key={programme.id} delay={index * 100} variant="fade-slide-up">
                  <AnimatedCard
                    hoverable
                    className="bg-white rounded-xl border-2 border-gray-200 shadow-md overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Header avec statut et actions */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {programme.name}
                            </h3>
                            {isOverdue && (
                              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 animate-pulse" title="En retard" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-mono font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                              {programme.code}
                            </span>
                            <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                              {getSemestreText(programme.semestre)} - {programme.niveau}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${getStatusColor(programme.status)}`}>
                            {getStatusText(programme.status)}
                          </span>

                          <div className="relative">
                            <button
                              onClick={() => setSelectedProgramme(selectedProgramme === programme.id ? null : programme.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-110"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>

                            {selectedProgramme === programme.id && (
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2 border-gray-200 py-2 z-10 animate-scale-in">
                                <Link
                                  href={`/programmes/${programme.id}`}
                                  className="flex items-center px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  onClick={() => setSelectedProgramme(null)}
                                >
                                  <Eye className="h-4 w-4 mr-3" />
                                  Voir le détail
                                </Link>
                                <Link
                                  href={`/programmes/${programme.id}/edit`}
                                  className="flex items-center px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                                  onClick={() => setSelectedProgramme(null)}
                                >
                                  <Edit className="h-4 w-4 mr-3" />
                                  Modifier
                                </Link>
                                <Link
                                  href={`/programmes/${programme.id}/modules`}
                                  className="flex items-center px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                  onClick={() => setSelectedProgramme(null)}
                                >
                                  <Settings className="h-4 w-4 mr-3" />
                                  Gérer modules
                                </Link>
                                <button
                                  onClick={() => {
                                    setSelectedProgramme(null);
                                  }}
                                  className="flex items-center w-full px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                                >
                                  <Copy className="h-4 w-4 mr-3" />
                                  Dupliquer
                                </button>
                                <div className="border-t-2 border-gray-100 my-2"></div>
                                <button
                                  onClick={() => {
                                    setSelectedProgramme(null);
                                    handleDelete(programme.id);
                                  }}
                                  className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4 mr-3" />
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
                        <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-center mb-2">
                            <Users className="h-5 w-5 text-red-600" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {programme.modules?.length || 0}
                          </p>
                          <p className="text-xs font-semibold text-gray-600 mt-1">Modules</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-center mb-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {programme.totalVHT || 0}h
                          </p>
                          <p className="text-xs font-semibold text-gray-600 mt-1">Volume horaire</p>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-700">Progression</span>
                          <span className="text-xs font-bold text-gray-700">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              progress === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                              progress > 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              'bg-gradient-to-r from-yellow-500 to-yellow-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <div className="flex items-center font-semibold">
                          <Calendar className="h-4 w-4 mr-1 text-red-600" />
                          <span>
                            {new Date(programme.dateDebut).toLocaleDateString('fr-FR')} -
                            {new Date(programme.dateFin).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      {/* Actions principales */}
                      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                        <Link
                          href={`/programmes/${programme.id}`}
                          className="flex items-center px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all transform hover:scale-105"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détail
                        </Link>

                        <div className="text-xs text-gray-500 font-semibold">
                          Mis à jour {new Date(programme.updatedAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>
                </PageTransition>
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

      {/* Modal d'importation Excel */}
      <ImportExcelModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </Layout>
  );
}

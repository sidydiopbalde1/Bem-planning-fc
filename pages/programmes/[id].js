import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout';
import CreateModuleModal from '../../components/modals/CreateModuleModal.js';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus,
  Calendar,
  Clock,
  Users,
  BookOpen,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Settings,
  FileText
} from 'lucide-react';

export default function ProgrammeDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [programme, setProgramme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('modules');
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);

 
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated' && id) {
      fetchProgramme();
    }
  }, [status, id, router]);

 const handleModuleCreated = (newModule) => {
    setProgramme(prev => ({
      ...prev,
      modules: [...(prev.modules || []), newModule]
    }));
    setShowCreateModuleModal(false);
  };

  const fetchProgramme = async () => {
    try {
      const response = await fetch(`/api/programmes/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setProgramme(data.programme);
      } else {
        console.error('Erreur:', data.error);
        if (response.status === 404) {
          router.push('/programmes');
        }
      }
    } catch (error) {
      console.error('Erreur fetch:', error);
      router.push('/programmes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce programme ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/programmes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/programmes');
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

  const getModuleStatusIcon = (status) => {
    switch (status) {
      case 'TERMINE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'EN_COURS':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'REPORTE':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'ANNULE':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const calculateProgress = () => {
    if (!programme?.modules || programme.modules.length === 0) return 0;
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

  if (!programme) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Programme non trouvé</h2>
          <p className="text-gray-600 mb-6">Le programme demandé n'existe pas ou a été supprimé.</p>
          <Link href="/programmes" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Retour aux programmes
          </Link>
        </div>
      </Layout>
    );
  }

  const progress = calculateProgress();

  return (
    <Layout>
      <Head>
        <title>{programme.name} - Planning FC</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/programmes"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{programme.name}</h1>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {programme.code}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(programme.status)}`}>
                  {getStatusText(programme.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/programmes/${programme.id}/edit`}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 mb-4">
                {programme.description || 'Aucune description disponible'}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Semestre:</span>
                  <span className="ml-2 text-gray-600">{programme.semestre.replace('SEMESTRE_', 'S')}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Niveau:</span>
                  <span className="ml-2 text-gray-600">{programme.niveau}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date de début:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(programme.dateDebut).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date de fin:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(programme.dateFin).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistiques</h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{programme.modules?.length || 0}</div>
                  <div className="text-sm text-blue-600">Modules</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{programme.totalVHT}h</div>
                  <div className="text-sm text-purple-600">Volume horaire</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progression</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('modules')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'modules'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="inline h-4 w-4 mr-2" />
                Modules ({programme.modules?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('planning')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'planning'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="inline h-4 w-4 mr-2" />
                Planning
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="inline h-4 w-4 mr-2" />
                Documents
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Onglet Modules */}
            {activeTab === 'modules' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Modules du programme</h3>
                                <button
                onClick={() => setShowCreateModuleModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un module
                </button>
                </div>

                {programme.modules && programme.modules.length > 0 ? (
                  <div className="space-y-4">
                    {programme.modules.map((module) => (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {getModuleStatusIcon(module.status)}
                              <h4 className="font-medium text-gray-900">{module.name}</h4>
                              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {module.code}
                              </span>
                            </div>
                            
                            {module.description && (
                              <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                            )}

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">CM:</span>
                                <span className="ml-1 text-gray-600">{module.cm}h</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">TD:</span>
                                <span className="ml-1 text-gray-600">{module.td}h</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">TP:</span>
                                <span className="ml-1 text-gray-600">{module.tp}h</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">VHT:</span>
                                <span className="ml-1 text-gray-600 font-semibold">{module.vht}h</span>
                              </div>
                            </div>

                            {module.intervenant && (
                              <div className="flex items-center mt-3 text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2" />
                                <span>
                                  {module.intervenant.civilite} {module.intervenant.prenom} {module.intervenant.nom}
                                </span>
                              </div>
                            )}

                            {module.seances && module.seances.length > 0 && (
                              <div className="mt-3 text-sm text-gray-600">
                                <span className="font-medium">{module.seances.length}</span> séance(s) planifiée(s)
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Link
                              href={`/modules/${module.id}`}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir le détail"
                            >
                              <Settings className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun module</h3>
                    <p className="text-gray-500 mb-6">Ce programme ne contient pas encore de modules</p>
                    <button
  onClick={() => setShowCreateModuleModal(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
>
  Créer le premier module
</button>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Planning */}
            {activeTab === 'planning' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Planning des séances</h3>
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Le planning détaillé sera disponible prochainement</p>
                </div>
              </div>
            )}

            {/* Onglet Documents */}
            {activeTab === 'documents' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Documents du programme</h3>
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Gestion des documents à implémenter</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showCreateModuleModal && (
        <CreateModuleModal
            isOpen={showCreateModuleModal}
            onClose={() => setShowCreateModuleModal(false)}
            onSuccess={handleModuleCreated}
            programmeId={programme.id}
        />
        )}
    </Layout>
  );
}
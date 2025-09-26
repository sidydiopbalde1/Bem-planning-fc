// pages/modules/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout';
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
  MapPin,
  FileText,
  Award,
  BarChart3
} from 'lucide-react';

export default function ModuleDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated' && id) {
      fetchModule();
    }
  }, [status, id, router]);

  const fetchModule = async () => {
    try {
      const response = await fetch(`/api/modules/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setModule(data.module);
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce module ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/modules/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/programmes/${module.programme.id}`);
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
      'REPORTE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ANNULE': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status) => {
    const texts = {
      'EN_COURS': 'En cours',
      'PLANIFIE': 'Planifié',
      'TERMINE': 'Terminé',
      'REPORTE': 'Reporté',
      'ANNULE': 'Annulé'
    };
    return texts[status] || status;
  };

  const getSeanceStatusIcon = (status) => {
    switch (status) {
      case 'TERMINE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'EN_COURS':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'CONFIRME':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'REPORTE':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'ANNULE':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeSeanceColor = (type) => {
    const colors = {
      'CM': 'bg-purple-100 text-purple-800',
      'TD': 'bg-blue-100 text-blue-800',
      'TP': 'bg-green-100 text-green-800',
      'EXAMEN': 'bg-red-100 text-red-800',
      'RATTRAPAGE': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const calculateProgress = () => {
    if (!module?.seances || module.seances.length === 0) return 0;
    const completedSeances = module.seances.filter(s => s.status === 'TERMINE').length;
    return Math.round((completedSeances / module.seances.length) * 100);
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

  if (!module) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Module non trouvé</h2>
          <p className="text-gray-600 mb-6">Le module demandé n'existe pas ou a été supprimé.</p>
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
        <title>{module.name} - Planning FC</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/programmes/${module.programme.id}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{module.name}</h1>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {module.code}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(module.status)}`}>
                  {getStatusText(module.status)}
                </span>
                <Link 
                  href={`/programmes/${module.programme.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {module.programme.name}
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/modules/${module.id}/edit`}
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 mb-4">
                {module.description || 'Aucune description disponible'}
              </p>

              {module.intervenant && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Intervenant assigné</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {module.intervenant.civilite} {module.intervenant.prenom} {module.intervenant.nom}
                      </p>
                      <p className="text-sm text-gray-600">{module.intervenant.grade}</p>
                      <p className="text-sm text-gray-500">{module.intervenant.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Volume horaire</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">CM:</span>
                  <span className="font-medium">{module.cm}h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">TD:</span>
                  <span className="font-medium">{module.td}h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">TP:</span>
                  <span className="font-medium">{module.tp}h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">TPE:</span>
                  <span className="font-medium">{module.tpe}h</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">VHT:</span>
                    <span className="text-lg font-bold text-blue-600">{module.vht}h</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Évaluation</h3>
              <div className="space-y-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{module.coefficient}</div>
                  <div className="text-sm text-purple-600">Coefficient</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{module.credits}</div>
                  <div className="text-sm text-green-600">Crédits ECTS</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progression</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
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
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="inline h-4 w-4 mr-2" />
                Vue d'ensemble
              </button>
              <button
                onClick={() => setActiveTab('seances')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'seances'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="inline h-4 w-4 mr-2" />
                Séances ({module.seances?.length || 0})
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
            {/* Onglet Vue d'ensemble */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Informations temporelles</h4>
                    <div className="space-y-3 text-sm">
                      {module.dateDebut && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Date de début:</span>
                          <span className="font-medium">
                            {new Date(module.dateDebut).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      {module.dateFin && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Date de fin:</span>
                          <span className="font-medium">
                            {new Date(module.dateFin).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Dernière mise à jour:</span>
                        <span className="font-medium">
                          {new Date(module.updatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Statistiques</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{module.seances?.length || 0}</div>
                        <div className="text-xs text-blue-600">Séances</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {module.seances?.filter(s => s.status === 'TERMINE').length || 0}
                        </div>
                        <div className="text-xs text-green-600">Terminées</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Séances */}
            {activeTab === 'seances' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Séances du module</h3>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    Planifier une séance
                  </button>
                </div>

                {module.seances && module.seances.length > 0 ? (
                  <div className="space-y-4">
                    {module.seances.map((seance) => (
                      <div key={seance.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {getSeanceStatusIcon(seance.status)}
                              <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeSeanceColor(seance.typeSeance)}`}>
                                {seance.typeSeance}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(seance.dateSeance).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {seance.heureDebut} - {seance.heureFin}
                                </span>
                              </div>
                              
                              {seance.salle && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">{seance.salle}</span>
                                </div>
                              )}
                              
                              {seance.intervenant && (
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    {seance.intervenant.prenom} {seance.intervenant.nom}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(seance.status)}`}>
                                  {getStatusText(seance.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune séance planifiée</h3>
                    <p className="text-gray-500 mb-6">Ce module ne contient pas encore de séances</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Planifier la première séance
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Documents */}
            {activeTab === 'documents' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Documents du module</h3>
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Gestion des documents à implémenter</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
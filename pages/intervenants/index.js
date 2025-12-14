// pages/intervenants/index.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout.js';
import CreateIntervenantModal from '../../components/modals/CreateIntervenantModal.js';
import ImportExcelModal from '../../components/modals/ImportExcelModal';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Star,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Download
} from 'lucide-react';

export default function IntervenantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [intervenants, setIntervenants] = useState([]);
  const [filteredIntervenants, setFilteredIntervenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated') {
      fetchIntervenants();
    }
  }, [status, router]);

  useEffect(() => {
    filterIntervenants();
  }, [intervenants, searchTerm, filterStatus, filterGrade]);

  const fetchIntervenants = async () => {
    try {
      const response = await fetch('/api/intervenants');
      const data = await response.json();
      
      if (response.ok) {
        setIntervenants(data.intervenants);
      } else {
        console.error('Erreur:', data.error);
      }
    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIntervenants = () => {
    let filtered = [...intervenants];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(intervenant => 
        `${intervenant.prenom} ${intervenant.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (intervenant.specialite && intervenant.specialite.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(intervenant => {
        if (filterStatus === 'disponible') return intervenant.disponible;
        if (filterStatus === 'indisponible') return !intervenant.disponible;
        return true;
      });
    }

    // Filtre par grade
    if (filterGrade !== 'all') {
      filtered = filtered.filter(intervenant => intervenant.grade === filterGrade);
    }

    setFilteredIntervenants(filtered);
  };

  const handleCreateSuccess = (newIntervenant) => {
    setIntervenants(prev => [newIntervenant, ...prev]);
    setShowCreateModal(false);
  };

  const handleDelete = async (intervenantId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet intervenant ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/intervenants/${intervenantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIntervenants(prev => prev.filter(i => i.id !== intervenantId));
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      alert('Erreur de connexion');
    }
  };

  const toggleDisponibilite = async (intervenantId, disponible) => {
    try {
      const response = await fetch(`/api/intervenants/${intervenantId}/disponibilite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ disponible: !disponible }),
      });

      if (response.ok) {
        setIntervenants(prev => prev.map(i => 
          i.id === intervenantId ? { ...i, disponible: !disponible } : i
        ));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
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
        <title>Gestion des Intervenants - Planning FC</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Intervenants</h1>
            <p className="text-gray-600 mt-1">
              Gérez votre équipe d'intervenants et formateurs
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 lg:mt-0 flex items-center px-4 py-2 bg-red-600 text-black rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Intervenant
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{intervenants.length}</p>
                <p className="text-sm text-gray-600">Total intervenants</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {intervenants.filter(i => i.disponible).length}
                </p>
                <p className="text-sm text-gray-600">Disponibles</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {intervenants.filter(i => !i.disponible).length}
                </p>
                <p className="text-sm text-gray-600">Indisponibles</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {intervenants.filter(i => i.grade?.includes('Professeur')).length}
                </p>
                <p className="text-sm text-gray-600">Professeurs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou spécialité..."
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
                <option value="disponible">Disponible</option>
                <option value="indisponible">Indisponible</option>
              </select>

              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">Tous les grades</option>
                <option value="Professeur">Professeur</option>
                <option value="Maître de conférences">Maître de conférences</option>
                <option value="Docteur">Docteur</option>
                <option value="Ingénieur">Ingénieur</option>
                <option value="Consultant">Consultant</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des intervenants */}
        {filteredIntervenants.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {intervenants.length === 0 ? 'Aucun intervenant' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-500 mb-6">
              {intervenants.length === 0 
                ? 'Commencez par ajouter votre premier intervenant'
                : 'Aucun intervenant ne correspond à vos critères de recherche'
              }
            </p>
            {intervenants.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-red-600 text-black rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ajouter un intervenant
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntervenants.map((intervenant) => (
              <div key={intervenant.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header avec statut */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-300 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {intervenant.prenom.charAt(0)}{intervenant.nom.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {intervenant.civilite} {intervenant.prenom} {intervenant.nom}
                        </h3>
                        {intervenant.grade && (
                          <p className="text-sm text-gray-600">{intervenant.grade}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleDisponibilite(intervenant.id, intervenant.disponible)}
                        className={`p-1 rounded-full transition-colors ${
                          intervenant.disponible 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={intervenant.disponible ? 'Disponible' : 'Indisponible'}
                      >
                        {intervenant.disponible ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </button>
                      
                      <div className="relative">
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Informations de contact */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`mailto:${intervenant.email}`} className="hover:text-blue-600 transition-colors">
                        {intervenant.email}
                      </a>
                    </div>
                    
                    {intervenant.telephone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`tel:${intervenant.telephone}`} className="hover:text-blue-600 transition-colors">
                          {intervenant.telephone}
                        </a>
                      </div>
                    )}
                    
                    {intervenant.etablissement && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{intervenant.etablissement}</span>
                      </div>
                    )}
                  </div>

                  {/* Spécialité */}
                  {intervenant.specialite && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-black-800">
                        {intervenant.specialite}
                      </span>
                    </div>
                  )}

                  {/* Modules assignés */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Modules assignés</p>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="text-gray-700">
                        {intervenant.modules?.length || 0} module(s)
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => router.push(`/intervenants/${intervenant.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Voir le détail"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button 
                        onClick={() => router.push(`/intervenants/${intervenant.id}/edit`)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(intervenant.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      intervenant.disponible 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {intervenant.disponible ? 'Disponible' : 'Indisponible'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <CreateIntervenantModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </Layout>
  );
}
// Modification du dashboard pour inclure le modal
// Dans votre dashboard.js existant, ajoutez ces imports et modifications

import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout.js';
import StatCard from '../../components/ui/StatCard.js';
import ProgrammeTable from '../../components/dashbord/ProgrammeTable.js';
import CreateProgrammeModal from '../../components/modals/CreateProgrammeModal.js'; // Ajout
import { Calendar, Clock, Users, BookOpen, AlertTriangle, Plus, Search } from 'lucide-react';

export default function Dashboard({ initialProgrammes, initialStats }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [programmes, setProgrammes] = useState(initialProgrammes || []);
  const [stats, setStats] = useState(initialStats || {});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false); // Ajout

  // Fonction pour gérer le succès de création
  const handleProgrammeCreated = (newProgramme) => {
    setProgrammes(prev => [newProgramme, ...prev]);
    // Mettre à jour les stats
    setStats(prev => ({
      ...prev,
      programmesActifs: prev.programmesActifs + (newProgramme.status === 'EN_COURS' ? 1 : 0),
      nouveauxCeMois: prev.nouveauxCeMois + 1
    }));
  };
  // Redirection si non authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch programmes avec filtres
  const fetchProgrammes = async (search = '', status = 'all') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);

      const response = await fetch(`/api/programmes?${params}`);
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

  // Effect pour les filtres
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProgrammes(searchTerm, filterStatus);
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus]);

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null; 
  }

  return (
    <Layout>
      <Head>
        <title>Tableau de Bord - Planning FC</title>
        <meta name="description" content="Gestion des programmes de formation continue" />
      </Head>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de Bord
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue, {session.user.name}. Vue d'ensemble de vos programmes de formation continue.
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
          <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-black rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Programme
            </button>
          </div>
        </div>

        {/* Statistics Cards - avec onClick pour ouvrir le modal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={BookOpen}
            title="Programmes Actifs"
            value={stats.programmesActifs || '0'}
            subtitle={`${stats.nouveauxCeMois || 0} nouveaux ce mois`}
            onClick={() => setShowCreateModal(true)} // Ajout
          />
          <StatCard 
            icon={Users}
            title="Intervenants"
            value={stats.totalIntervenants || '0'}
            subtitle={`${stats.intervenantsDisponibles || 0}% disponibles`}
            onClick={() => router.push('/intervenants')} // Ajout
          />
          <StatCard 
            icon={Clock}
            title="Heures Planifiées"
            value={stats.heuresPlanifiees || '0'}
            subtitle="Ce semestre"
          />
          <StatCard 
            icon={AlertTriangle}
            title="Alertes"
            value={stats.totalAlertes || '0'}
            subtitle="Nécessitent attention"
            color="text-red-600"
          />
        </div>

         {/* Quick Actions - modifier les liens pour utiliser le modal */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Modifier pour utiliser le modal */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 group text-left"
            >
              <Plus className="h-8 w-8 text-red-600 mr-3 group-hover:text-red-700" />
              <div>
                <p className="font-medium text-gray-900">Créer un Programme</p>
                <p className="text-sm text-gray-600">Nouvelle maquette pédagogique</p>
              </div>
            </button>
            
            <Link href="/calendar" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 group">
              <Calendar className="h-8 w-8 text-red-600 mr-3 group-hover:text-red-700" />
              <div>
                <p className="font-medium text-gray-900">Voir le Calendrier</p>
                <p className="text-sm text-gray-600">Planning global</p>
              </div>
            </Link>
            
            <Link href="/intervenants" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 group">
              <Users className="h-8 w-8 text-red-600 mr-3 group-hover:text-red-700" />
              <div>
                <p className="font-medium text-gray-900">Gérer Intervenants</p>
                <p className="text-sm text-gray-600">Disponibilités et planning</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un programme..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors w-full md:w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
              >
                <option value="all">Tous les programmes</option>
                <option value="EN_COURS">En cours</option>
                <option value="PLANIFIE">Planifiés</option>
                <option value="TERMINE">Terminés</option>
                <option value="SUSPENDU">Suspendus</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{programmes.length} programme(s)</span>
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          </div>
        </div>

        {/* Programmes Table */}
        <ProgrammeTable 
          programmes={programmes} 
          loading={loading}
          onProgrammeUpdate={fetchProgrammes}
        />

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activités Récentes</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                <span className="text-gray-600 flex-1">Module "Marketing Digital" terminé</span>
                <span className="text-xs text-gray-400">Il y a 2h</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                <span className="text-gray-600 flex-1">Nouveau programme "Gestion RH" créé</span>
                <span className="text-xs text-gray-400">Hier</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3 flex-shrink-0"></div>
                <span className="text-gray-600 flex-1">Intervenant assigné au module "Comptabilité"</span>
                <span className="text-xs text-gray-400">Il y a 3j</span>
              </div>
            </div>
          </div>
             {/* Modal de création de programme */}
      {showCreateModal && (
        <CreateProgrammeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProgrammeCreated}
        />
      )}   
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertes & Notifications</h3>
            <div className="space-y-3">
              {stats.alertes && stats.alertes.length > 0 ? (
                stats.alertes.map((alerte, index) => (
                  <div key={index} className="flex items-start text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-800 font-medium">{alerte.titre}</p>
                      <p className="text-red-600 text-xs mt-1">{alerte.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Aucune alerte active</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
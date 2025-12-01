import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout.js';
import StatCard from '../../components/ui/StatCard.js';
import ProgrammeTable from '../../components/dashbord/ProgrammeTable.js';
import CreateProgrammeModal from '../../components/modals/CreateProgrammeModal.js';
import PageTransition, { AnimatedCard, AnimatedButton, AnimatedStats, SlideIn, FadeIn } from '../../components/ui/PageTransition.js';
import { Calendar, Clock, Users, BookOpen, AlertTriangle, Plus, Search, TrendingUp, Activity } from 'lucide-react';

export default function Dashboard({ initialProgrammes, initialStats }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [programmes, setProgrammes] = useState(initialProgrammes || []);
  const [stats, setStats] = useState(initialStats || {});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleProgrammeCreated = (newProgramme) => {
    setProgrammes(prev => [newProgramme, ...prev]);
    setStats(prev => ({
      ...prev,
      programmesActifs: prev.programmesActifs + (newProgramme.status === 'EN_COURS' ? 1 : 0),
      nouveauxCeMois: prev.nouveauxCeMois + 1
    }));
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

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
      }
    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProgrammes(searchTerm, filterStatus);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus]);

  if (status === 'loading') {
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

  if (!session) return null;

  const statsData = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      value: stats.programmesActifs || '0',
      label: 'Programmes Actifs',
      color: 'bg-red-100 text-red-600',
      trend: 'up',
      trendValue: `+${stats.nouveauxCeMois || 0} ce mois`,
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: stats.totalIntervenants || '0',
      label: 'Intervenants',
      color: 'bg-blue-100 text-blue-600',
      trendValue: `${stats.intervenantsDisponibles || 0}% dispo`,
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: stats.heuresPlanifiees || '0',
      label: 'Heures Planifiées',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      value: stats.totalAlertes || '0',
      label: 'Alertes Actives',
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  return (
    <Layout>
      <Head>
        <title>Tableau de Bord - BEM Planning FC</title>
        <meta name="description" content="Gestion des programmes de formation continue" />
      </Head>

      <div className="space-y-8 p-6">
        {/* Header avec animation */}
        <SlideIn direction="down">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                Tableau de Bord
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Bienvenue, <span className="font-semibold text-red-600">{session.user.name}</span> 👋
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
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

        {/* Statistics Cards avec animations */}
        <AnimatedStats stats={statsData} />

        {/* Quick Actions avec animations */}
        <SlideIn direction="up" delay={200}>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <Activity className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Actions Rapides</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AnimatedCard
                hoverable
                onClick={() => setShowCreateModal(true)}
                className="flex items-center p-5 border-2 border-gray-200 rounded-xl bg-white cursor-pointer group"
              >
                <div className="p-3 bg-red-100 rounded-xl mr-4 group-hover:bg-red-200 transition-colors">
                  <Plus className="h-7 w-7 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">Créer un Programme</p>
                  <p className="text-sm text-gray-600">Nouvelle maquette pédagogique</p>
                </div>
              </AnimatedCard>

              <AnimatedCard hoverable className="border-2 border-gray-200 rounded-xl bg-white">
                <Link href="/calendar" className="flex items-center p-5 group">
                  <div className="p-3 bg-blue-100 rounded-xl mr-4 group-hover:bg-blue-200 transition-colors">
                    <Calendar className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Voir le Calendrier</p>
                    <p className="text-sm text-gray-600">Planning global</p>
                  </div>
                </Link>
              </AnimatedCard>

              <AnimatedCard hoverable className="border-2 border-gray-200 rounded-xl bg-white">
                <Link href="/intervenants" className="flex items-center p-5 group">
                  <div className="p-3 bg-green-100 rounded-xl mr-4 group-hover:bg-green-200 transition-colors">
                    <Users className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">Gérer Intervenants</p>
                    <p className="text-sm text-gray-600">Disponibilités et planning</p>
                  </div>
                </Link>
              </AnimatedCard>
            </div>
          </div>
        </SlideIn>

        {/* Filters and Search avec animations */}
        <FadeIn delay={300}>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Search className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un programme..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all w-full md:w-80 font-medium"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white font-medium"
                >
                  <option value="all">Tous les programmes</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="PLANIFIE">Planifiés</option>
                  <option value="TERMINE">Terminés</option>
                  <option value="SUSPENDU">Suspendus</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 text-sm text-gray-600 font-semibold">
                <span className="px-3 py-1 bg-gray-100 rounded-lg">{programmes.length} programme(s)</span>
                {loading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                )}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Programmes Table avec animation */}
        <FadeIn delay={400}>
          <ProgrammeTable
            programmes={programmes}
            loading={loading}
            onProgrammeUpdate={fetchProgrammes}
          />
        </FadeIn>

        {/* Recent Activities & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SlideIn direction="right" delay={500}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full">
              <div className="flex items-center mb-5">
                <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-900">Activités Récentes</h3>
              </div>
              <div className="space-y-4">
                {[
                  { color: 'green', text: 'Module "Marketing Digital" terminé', time: 'Il y a 2h' },
                  { color: 'blue', text: 'Nouveau programme "Gestion RH" créé', time: 'Hier' },
                  { color: 'yellow', text: 'Intervenant assigné au module "Comptabilité"', time: 'Il y a 3j' },
                ].map((activity, index) => (
                  <FadeIn key={index} delay={550 + index * 50}>
                    <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-3 h-3 bg-${activity.color}-500 rounded-full mr-4 flex-shrink-0`}></div>
                      <span className="text-gray-700 flex-1 font-medium">{activity.text}</span>
                      <span className="text-xs text-gray-400 font-semibold">{activity.time}</span>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </SlideIn>

          <SlideIn direction="left" delay={500}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full">
              <div className="flex items-center mb-5">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-900">Alertes & Notifications</h3>
              </div>
              <div className="space-y-3">
                {stats.alertes && stats.alertes.length > 0 ? (
                  stats.alertes.map((alerte, index) => (
                    <FadeIn key={index} delay={550 + index * 50}>
                      <div className="flex items-start p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-l-4 border-red-500 hover:shadow-md transition-shadow">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-red-900 font-bold">{alerte.titre}</p>
                          <p className="text-red-700 text-sm mt-1">{alerte.message}</p>
                        </div>
                      </div>
                    </FadeIn>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-semibold">Aucune alerte active</p>
                    <p className="text-sm mt-1">Tout est sous contrôle</p>
                  </div>
                )}
              </div>
            </div>
          </SlideIn>
        </div>
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <CreateProgrammeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProgrammeCreated}
        />
      )}
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const [programmesRes, statsRes] = await Promise.all([
      fetch(`${baseUrl}/api/programmes?limit=10`, {
        headers: { Cookie: context.req.headers.cookie || '' },
      }),
      fetch(`${baseUrl}/api/statistics?type=global`, {
        headers: { Cookie: context.req.headers.cookie || '' },
      }),
    ]);

    const programmesData = programmesRes.ok ? await programmesRes.json() : { programmes: [] };
    const statsData = statsRes.ok ? await statsRes.json() : {};

    return {
      props: {
        initialProgrammes: programmesData.programmes || [],
        initialStats: {
          programmesActifs: statsData.programmesActifs || 0,
          nouveauxCeMois: statsData.nouveauxCeMois || 0,
          totalIntervenants: statsData.totalIntervenants || 0,
          intervenantsDisponibles: statsData.intervenantsDisponibles || 100,
          heuresPlanifiees: statsData.heuresPlanifiees || 0,
          totalAlertes: statsData.totalAlertes || 0,
          alertes: statsData.alertes || [],
        },
      },
    };
  } catch (error) {
    console.error('Erreur SSR:', error);
    return {
      props: {
        initialProgrammes: [],
        initialStats: {},
      },
    };
  }
}

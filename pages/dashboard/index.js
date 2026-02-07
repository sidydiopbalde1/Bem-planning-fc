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
import apiClient from '../../lib/api-client';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Dashboard({ initialProgrammes, initialStats, initialActivities }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [programmes, setProgrammes] = useState(initialProgrammes || []);
  const [stats, setStats] = useState(initialStats || {});
  const [activities, setActivities] = useState(initialActivities || []);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  console.log('Initial Programmes:', initialProgrammes);
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

  // Synchroniser le token de session avec l'apiClient
  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }
  }, [session]);

  const fetchProgrammes = async (search = '', statusFilter = 'all') => {
    if (!session?.accessToken) {
      return; // Ne pas faire de requête si pas de session
    }

    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await apiClient.programmes.getAll(params);
      setProgrammes(data.programmes || data || []);

    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      return; // Attendre que la session soit chargée
    }

    const timeoutId = setTimeout(() => {
      fetchProgrammes(searchTerm, filterStatus);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus, status, session]);

  // Fetch des activités récentes (API Backend NestJS)
  const fetchActivities = async () => {
    if (!session?.accessToken) {
      return; // Ne pas faire de requête si pas de token
    }


    setActivitiesLoading(true);
    try {
      const data = await apiClient.get('/activities/recent', { limit: 10 });
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Erreur fetch activités:', error);
      console.error('Détails de l\'erreur:', error.response?.data || error.message);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchActivities();
    }
  }, [status, session]);

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
      label: t('dashboard.activeProgrammes'),
      color: 'bg-red-100 text-red-600',
      trend: 'up',
      trendValue: `+${stats.nouveauxCeMois || 0} ${t('dashboard.thisMonth')}`,
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: stats.totalIntervenants || '0',
      label: t('dashboard.intervenants'),
      color: 'bg-blue-100 text-blue-600',
      trendValue: `${stats.intervenantsDisponibles || 0}% ${t('dashboard.available')}`,
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: stats.heuresPlanifiees || '0',
      label: t('dashboard.plannedHours'),
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      value: stats.totalAlertes || '0',
      label: t('dashboard.activeAlerts'),
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  return (
    <Layout>
      <Head>
        <title>{t('dashboard.title')} - BEM Planning FC</title>
        <meta name="description" content="Gestion des programmes de formation continue" />
      </Head>

      <div className="space-y-8 p-6">
        {/* Header avec animation */}
        <SlideIn direction="down">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                {t('dashboard.title')}
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                {t('dashboard.welcome', { name: session.user.name })}
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <AnimatedButton
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                className="shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>{t('programmes.newProgramme')}</span>
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
              <h2 className="text-xl font-bold text-gray-900">{t('dashboard.quickActions')}</h2>
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
                  <p className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{t('dashboard.createProgramme')}</p>
                  <p className="text-sm text-gray-600">{t('dashboard.newPedagogicalTemplate')}</p>
                </div>
              </AnimatedCard>

              <AnimatedCard hoverable className="border-2 border-gray-200 rounded-xl bg-white">
                <Link href="/calendar" className="flex items-center p-5 group">
                  <div className="p-3 bg-blue-100 rounded-xl mr-4 group-hover:bg-blue-200 transition-colors">
                    <Calendar className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{t('dashboard.viewCalendar')}</p>
                    <p className="text-sm text-gray-600">{t('dashboard.globalPlanning')}</p>
                  </div>
                </Link>
              </AnimatedCard>
              
              <AnimatedCard hoverable className="border-2 border-gray-200 rounded-xl bg-white">
                <Link href="/intervenants" className="flex items-center p-5 group">
                  <div className="p-3 bg-green-100 rounded-xl mr-4 group-hover:bg-green-200 transition-colors">
                    <Users className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{t('dashboard.manageIntervenants')}</p>
                    <p className="text-sm text-gray-600">{t('dashboard.availabilityPlanning')}</p>
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
                    placeholder={t('programmes.searchPlaceholder')}
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
                  <option value="all">{t('programmes.filters.all')}</option>
                  <option value="EN_COURS">{t('programmes.filters.inProgress')}</option>
                  <option value="PLANIFIE">{t('programmes.filters.planned')}</option>
                  <option value="TERMINE">{t('programmes.filters.completed')}</option>
                  <option value="SUSPENDU">{t('programmes.filters.suspended')}</option>
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
                <h3 className="text-lg font-bold text-gray-900">{t('dashboard.recentActivities')}</h3>
              </div>
              <div className="space-y-4">
                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent"></div>
                  </div>
                ) : activities.length > 0 ? (
                  activities.map((activity, index) => {
                    // Mapping des couleurs Tailwind (classes complètes pour éviter le purge)
                    const colorClasses = {
                      green: 'bg-green-500',
                      blue: 'bg-blue-500',
                      red: 'bg-red-500',
                      yellow: 'bg-yellow-500',
                      purple: 'bg-purple-500',
                      gray: 'bg-gray-500',
                      indigo: 'bg-indigo-500',
                      orange: 'bg-orange-500',
                      cyan: 'bg-cyan-500',
                    };
                    const bgClass = colorClasses[activity.color] || 'bg-gray-500';

                    return (
                      <FadeIn key={activity.id || index} delay={550 + index * 50}>
                        <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className={`w-3 h-3 ${bgClass} rounded-full mr-4 flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-700 font-medium block truncate">{activity.text}</span>
                            {activity.user && (
                              <span className="text-xs text-gray-400">par {activity.user}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 font-semibold ml-2 whitespace-nowrap">{activity.time}</span>
                        </div>
                      </FadeIn>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Activity className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-semibold">{t('dashboard.noRecentActivities')}</p>
                    <p className="text-sm mt-1">{t('dashboard.activitiesWillAppear')}</p>
                  </div>
                )}
              </div>
            </div>
          </SlideIn>

          <SlideIn direction="left" delay={500}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full">
              <div className="flex items-center mb-5">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-900">{t('dashboard.alertsNotifications')}</h3>
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
                    <p className="font-semibold">{t('dashboard.noActiveAlerts')}</p>
                    <p className="text-sm mt-1">{t('dashboard.allUnderControl')}</p>
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
    // const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bem-planning-fc-backend-latest.onrender.com/api';
    const token = session.accessToken;

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const [programmesRes, statsRes, activitiesRes] = await Promise.all([
      fetch(`${apiBaseUrl}/programmes?limit=10`, { headers }),
      fetch(`${apiBaseUrl}/statistics?type=global`, { headers }),
      fetch(`${apiBaseUrl}/activities/recent?limit=5`, { headers }),
    ]);
    


    const programmesData = programmesRes.ok ? await programmesRes.json() : { programmes: [] };
    const statsData = statsRes.ok ? await statsRes.json() : {};
    const activitiesData = activitiesRes.ok ? await activitiesRes.json() : { activities: [] };

    // console.log('SSR Programmes Data:', programmesData);
    // console.log('SSR Stats Data:', statsData);

    // Ensure programmes is always an array
    let programmes = [];
    if (Array.isArray(programmesData)) {
      programmes = programmesData;
    } else if (programmesData && Array.isArray(programmesData.programmes)) {
      programmes = programmesData.programmes;
    } else if (programmesData && Array.isArray(programmesData.data)) {
      programmes = programmesData.data;
      // console.log('Using programmesData.data for programmes', programmes);
    }

    // Map the statistics from API response format to dashboard format
    const stats = statsData.statistics || {};
    console.log('Mapped Stats for Dashboard:', stats);
    return {
      props: {
        initialProgrammes: programmes,
        initialStats: {
          programmesActifs: stats.activite?.programmesEnCours || stats.totaux?.programmes || 0,
          nouveauxCeMois: stats.nouveauxCeMois || 0,
          totalIntervenants: stats.totaux?.intervenants || 0,
          intervenantsDisponibles: 100, // Default to 100% if not available
          heuresPlanifiees: stats.heures?.totalPlanifie || 0,
          totalAlertes: stats.qualite?.conflitsEnAttente || 0,
          alertes: stats.alertes || [],
        },
        initialActivities: activitiesData.activities || [],
      },
    };
  } catch (error) {
    console.error('Erreur SSR:', error);
    return {
      props: {
        initialProgrammes: [],
        initialStats: {},
        initialActivities: [],
      },
    };
  }
}

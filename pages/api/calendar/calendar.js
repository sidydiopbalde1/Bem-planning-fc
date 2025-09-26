
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/layout.js';
import CalendarView from '../../../components/calendar/CalendarView.js';
import { ChevronLeft, ChevronRight, Plus, Filter, Download } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
export default function Calendar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'week', 'month', 'day'
  const [seances, setSeances] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    programmes: [],
    intervenants: [],
    types: ['CM', 'TD', 'TP'],
    status: ['PLANIFIE', 'CONFIRME', 'EN_COURS']
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCalendarData();
    }
  }, [session, currentDate, viewMode, filters]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();
      
      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        view: viewMode,
        ...filters
      });

      const [seancesResponse, conflictsResponse] = await Promise.all([
        fetch(`/api/seances?${params}`),
        fetch(`/api/planning/conflicts?${params}`)
      ]);

      if (seancesResponse.ok) {
        const seancesData = await seancesResponse.json();
        setSeances(seancesData.seances || []);
      }

      if (conflictsResponse.ok) {
        const conflictsData = await conflictsResponse.json();
        setConflicts(conflictsData.conflicts || []);
      }
    } catch (error) {
      console.error('Erreur fetch calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'week':
        date.setDate(date.getDate() - date.getDay());
        break;
      case 'month':
        date.setDate(1);
        break;
      case 'day':
        break;
    }
    return date;
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'week':
        date.setDate(date.getDate() - date.getDay() + 6);
        break;
      case 'month':
        date.setMonth(date.getMonth() + 1, 0);
        break;
      case 'day':
        break;
    }
    return date;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
    }
    setCurrentDate(newDate);
  };

  const formatCurrentPeriod = () => {
    switch (viewMode) {
      case 'week':
        const startWeek = getViewStartDate();
        const endWeek = getViewEndDate();
        return `${startWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      case 'day':
        return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!session) return null;

  return (
    <Layout>
      <Head>
        <title>Calendrier - Planning FC</title>
      </Head>

      <div className="space-y-6">
        {/* Header avec contrôles */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendrier Académique</h1>
            <p className="text-gray-600">Planification des séances et détection des conflits</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Navigation temporelle */}
            <div className="flex items-center bg-white rounded-lg shadow-md">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-100 rounded-l-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="px-4 py-2 font-medium text-gray-700 min-w-48 text-center">
                {formatCurrentPeriod()}
              </div>
              <button
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-gray-100 rounded-r-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Sélecteur de vue */}
            <div className="flex bg-white rounded-lg shadow-md overflow-hidden">
              {['day', 'week', 'month'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-sm font-medium capitalize ${
                    viewMode === mode
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Mois'}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button className="flex items-center px-3 py-2 bg-white text-gray-700 rounded-lg shadow-md hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </button>
              <button className="flex items-center px-3 py-2 bg-white text-gray-700 rounded-lg shadow-md hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button className="flex items-center px-3 py-2 bg-primary text-white rounded-lg shadow-md hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Séance
              </button>
            </div>
          </div>
        </div>

        {/* Alertes de conflits */}
        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {conflicts.length} conflit(s) détecté(s)
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  Vérifiez les créneaux en double ou les chevauchements d'horaires
                </p>
              </div>
              <div className="ml-auto">
                <button className="text-sm font-medium text-red-700 hover:text-red-900">
                  Résoudre →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vue Calendrier */}
        <CalendarView
          viewMode={viewMode}
          currentDate={currentDate}
          seances={seances}
          conflicts={conflicts}
          loading={loading}
          onSeanceClick={(seance) => {
            // Handler pour clic sur séance
            console.log('Séance cliquée:', seance);
          }}
          onTimeSlotClick={(date, hour) => {
            // Handler pour création nouvelle séance
            console.log('Nouveau créneau:', date, hour);
          }}
        />

        {/* Statistiques de la période */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{seances.length}</div>
            <div className="text-sm text-gray-600">Séances planifiées</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {seances.filter(s => s.status === 'TERMINE').length}
            </div>
            <div className="text-sm text-gray-600">Séances terminées</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{conflicts.length}</div>
            <div className="text-sm text-gray-600">Conflits détectés</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {seances.reduce((total, seance) => total + seance.duree, 0)} min
            </div>
            <div className="text-sm text-gray-600">Temps total</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
// pages/calendar/index.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout';
import CreateSeanceModal from '../../components/modals/CreateSeanceModal';
import apiClient from '../../lib/api-client';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  Users,
  MapPin,
  BookOpen,
  Eye
} from 'lucide-react';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const Calendar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [seances, setSeances] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    programme: 'all',
    status: 'all',
    intervenant: 'all'
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && session?.accessToken) {
      apiClient.setToken(session.accessToken);
      fetchData();
    }
  }, [status, session, router, currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch séances et programmes en parallèle
      const [seancesData, programmesData] = await Promise.all([
        apiClient.seances.getAll(),
        apiClient.programmes.getAll()
      ]);
      console.log('Seances data brut:', JSON.stringify(seancesData).substring(0, 500));
      console.log('Programmes data brut:', JSON.stringify(programmesData).substring(0, 500));
      // Debug: voir le format exact de dateSeance
      const extractedSeances = Array.isArray(seancesData?.data) ? seancesData.data : Array.isArray(seancesData) ? seancesData : [];
      if (extractedSeances.length > 0) {
        console.log('Première séance dateSeance:', extractedSeances[0].dateSeance, 'type:', typeof extractedSeances[0].dateSeance);
      }
      console.log('Nombre de séances extraites:', extractedSeances.length);
      setSeances(extractedSeances);
      setProgrammes(Array.isArray(programmesData?.data) ? programmesData.data : Array.isArray(programmesData) ? programmesData : []);
    } catch (error) {
      console.error('Erreur fetch:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  // Générer les jours du mois
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 42); // 6 semaines

    while (startDate < endDate) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }

    return days;
  };

  // Helper pour extraire YYYY-MM-DD sans problème de timezone
  const toDateKey = (date) => {
    if (typeof date === 'string') {
      // Extraire directement depuis la chaîne ISO pour éviter le décalage timezone
      return date.substring(0, 10);
    }
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Appliquer les filtres sur les séances
  const filteredSeances = seances.filter(seance => {
   // console.log('Seance:', seance.module?.programme?.id, 'Filter:', filters.programme);
    if (filters.programme !== 'all' && seance.module?.programme?.id !== filters.programme) {
      return false;
    }
    if (filters.status !== 'all' && seance.status !== filters.status) {
      return false;
    }
    if (filters.intervenant !== 'all' && seance.intervenant?.id !== filters.intervenant) {
      return false;
    }
    return true;
  });

  // Obtenir les séances filtrées pour une date donnée
  const getSeancesForDate = (date) => {
    // console.log('Checking seances for date:', date);
    const dateKey = toDateKey(date);
    // console.log('Date key:', dateKey);
    return filteredSeances.filter(seance => toDateKey(seance.dateSeance) === dateKey);
  };
  // console.log('Seances filtrés:', getSeancesForDate(date));
// console.log('Filtered seances:', filteredSeances);
  // Navigation du calendrier
  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  // Obtenir la couleur selon le statut
  const getStatusColor = (status) => {
    const colors = {
      'PLANIFIE': 'bg-blue-100 text-blue-800 border-blue-200',
      'CONFIRME': 'bg-green-100 text-green-800 border-green-200',
      'EN_COURS': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'TERMINE': 'bg-gray-100 text-gray-800 border-gray-200',
      'REPORTE': 'bg-orange-100 text-orange-800 border-orange-200',
      'ANNULE': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Obtenir la couleur selon le type de séance
  const getTypeColor = (type) => {
    const colors = {
      'CM': 'bg-purple-500',
      'TD': 'bg-blue-500',
      'TP': 'bg-green-500',
      'EXAMEN': 'bg-red-500',
      'RATTRAPAGE': 'bg-orange-500'
    };
    return colors[type] || 'bg-gray-500';
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

  const calendarDays = generateCalendarDays();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  return (
    <Layout>
      <Head>
        <title>Calendrier - Planning FC</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendrier</h1>
            <p className="text-gray-600 mt-1">
              Planning des séances et événements de formation
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'day' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Jour
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mois
              </button>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Séance
            </button>
          </div>
        </div>

        {/* Navigation et Filtres */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateCalendar(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              
              <button
                onClick={() => navigateCalendar(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Aujourd'hui
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={filters.programme}
              onChange={(e) => setFilters(prev => ({ ...prev, programme: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les programmes</option>
              {programmes.map(prog => (
                <option key={prog.id} value={prog.id}>{prog.name}</option>
              ))}
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="CONFIRME">Confirmé</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
            </select>
          </div>
        </div>

        {/* Vue Mois */}
        {view === 'month' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {DAYS.map(day => (
                <div key={day} className="p-3 text-sm font-medium text-gray-700 text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille du calendrier */}
            <div className="grid grid-cols-7 gap-0">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentMonth;
                const isToday = day.toDateString() === new Date().toDateString();
                const daySeances = getSeancesForDate(day);
                // console.log('Day:', day, 'Seances:', daySeances);
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-b border-r border-gray-200 ${
                      !isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                    } cursor-pointer transition-colors`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-sm mb-2 ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    } ${isToday ? 'font-bold text-blue-600' : ''}`}>
                      {day.getDate()}
                      {isToday && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full ml-1 inline-block"></div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {daySeances.slice(0, 3).map((seance, i) => (
                        <div
                          key={seance.id}
                          className={`text-xs p-1 rounded border ${getStatusColor(seance.status)}`}
                          title={`${seance.module?.name} - ${seance.heureDebut}`}
                        >
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${getTypeColor(seance.typeSeance)}`}></div>
                            <span className="truncate">
                              {seance.heureDebut} {seance.module?.name}
                            </span>
                          </div>
                        </div>
                      ))}
                      {daySeances.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{daySeances.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Légende */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Légende</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-gray-600">CM - Cours Magistral</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">TD - Travaux Dirigés</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">TP - Travaux Pratiques</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Examen</span>
            </div>
          </div>
        </div>

        {/* Panel de détail pour date sélectionnée */}
        {selectedDate && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Séances du {selectedDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {getSeancesForDate(selectedDate).length > 0 ? (
                getSeancesForDate(selectedDate).map(seance => (
                  <div key={seance.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getTypeColor(seance.typeSeance)}`}></div>
                          <h4 className="font-medium text-gray-900">{seance.module?.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(seance.status)}`}>
                            {seance.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{seance.heureDebut} - {seance.heureFin}</span>
                          </div>
                          {seance.salle && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{seance.salle}</span>
                            </div>
                          )}
                          {seance.intervenant && (
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>
                                {seance.intervenant.civilite} {seance.intervenant.prenom} {seance.intervenant.nom}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{seance.typeSeance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune séance planifiée pour cette date</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de création de séance */}
      <CreateSeanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setIsModalOpen(false);
        }}
        selectedDate={selectedDate}
      />
    </Layout>
  );
};

export default Calendar;
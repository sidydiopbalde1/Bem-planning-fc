// components/settings/UserStats.js
import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen,
  Activity,
  Target
} from 'lucide-react';

const UserStats = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // all, month, week

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/stats?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Statistiques d'utilisation
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Depuis le début</option>
                <option value="month">Ce mois</option>
                <option value="week">Cette semaine</option>
              </select>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* Vue d'ensemble */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{stats.totalProgrammes}</div>
                    <div className="text-sm text-blue-600">Programmes créés</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{stats.totalModules}</div>
                    <div className="text-sm text-green-600">Modules planifiés</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{stats.totalSeances}</div>
                    <div className="text-sm text-purple-600">Séances organisées</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{stats.totalHeures}h</div>
                    <div className="text-sm text-yellow-600">Volume horaire total</div>
                  </div>
                </div>

                {/* Détails par statut */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Programmes par statut</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">En cours</span>
                        <span className="font-medium text-green-600">{stats.programmesEnCours}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Planifiés</span>
                        <span className="font-medium text-blue-600">{stats.programmesPlanifies}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Terminés</span>
                        <span className="font-medium text-gray-600">{stats.programmesTermines}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Activité récente</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Dernière connexion</span>
                        <span className="font-medium">{new Date(stats.lastLogin).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Séances cette semaine</span>
                        <span className="font-medium">{stats.seancesCetteSemaine}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Taux de complétion</span>
                        <span className="font-medium">{stats.tauxCompletion}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Graphiques simplifiés */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Évolution dans le temps</h4>
                  <div className="text-sm text-gray-500 text-center py-8">
                    Graphiques détaillés disponibles prochainement
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserStats;
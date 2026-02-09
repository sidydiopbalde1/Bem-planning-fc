import { useState } from 'react';
import { Clock, User, MapPin, AlertTriangle } from 'lucide-react';

export default function CalendarView({
  viewMode,
  currentDate,
  seances,
  conflicts,
  loading,
  onSeanceClick,
  onTimeSlotClick
}) {
  const [selectedSeance, setSelectedSeance] = useState(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Chargement du calendrier...</span>
        </div>
      </div>
    );
  }

  const getSeanceColor = (seance) => {
    // Vérifier s'il y a un conflit
    const hasConflict = conflicts.some(conflict => 
      conflict.seanceId1 === seance.id || conflict.seanceId2 === seance.id
    );

    if (hasConflict) return 'bg-red-500 border-red-600';

    switch (seance.status) {
      case 'TERMINE': return 'bg-green-500 border-green-600';
      case 'EN_COURS': return 'bg-blue-500 border-blue-600';
      case 'CONFIRME': return 'bg-purple-500 border-purple-600';
      case 'PLANIFIE': return 'bg-yellow-500 border-yellow-600';
      case 'REPORTE': return 'bg-orange-500 border-orange-600';
      case 'ANNULE': return 'bg-gray-500 border-gray-600';
      default: return 'bg-gray-400 border-gray-500';
    }
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5); // HH:MM
  };

  const SeanceCard = ({ seance, isConflict = false }) => (
    <div
      className={`p-2 rounded-md border-l-4 text-white text-xs cursor-pointer hover:shadow-lg transition-shadow ${getSeanceColor(seance)}`}
      onClick={() => {
        setSelectedSeance(seance);
        onSeanceClick(seance);
      }}
    >
      <div className="font-semibold limittruncate">{seance.module.name}</div>
      <div className="flex items-center mt-1 opacity-90">
        <Clock className="h-3 w-3 mr-1" />
        {formatTime(seance.heureDebut)} - {formatTime(seance.heureFin)}
      </div>
      <div className="flex items-center mt-1 opacity-90">
        <User className="h-3 w-3 mr-1" />
        {seance.intervenant.civilite} {seance.intervenant.nom}
      </div>
      {seance.salle && (
        <div className="flex items-center mt-1 opacity-90">
          <MapPin className="h-3 w-3 mr-1" />
          {seance.salle}
        </div>
      )}
      {isConflict && (
        <div className="flex items-center mt-1">
          <AlertTriangle className="h-3 w-3 mr-1" />
          <span className="text-xs">Conflit</span>
        </div>
      )}
    </div>  
  );

  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());

    const days = [];
    const currentDateIter = new Date(startDate);

    // Générer 42 jours (6 semaines)
    for (let i = 0; i < 42; i++) {
      const daySeances = seances.filter(seance => {
        const seanceDate = new Date(seance.dateSeance);
        return seanceDate.toDateString() === currentDateIter.toDateString();
      });

      days.push({
        date: new Date(currentDateIter),
        seances: daySeances,
        isCurrentMonth: currentDateIter.getMonth() === currentDate.getMonth(),
        isToday: currentDateIter.toDateString() === new Date().toDateString()
      });

      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* En-tête des jours */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="p-4 text-center font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-32 border-r border-b p-2 ${
                !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              } ${day.isToday ? 'bg-blue-50' : ''}`}
              onClick={() => onTimeSlotClick(day.date)}
            >
              <div className={`text-sm mb-2 ${
                day.isToday ? 'font-bold text-blue-600' : 
                !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
              }`}>
                {day.date.getDate()}
              </div>

              <div className="space-y-1">
                {day.seances.slice(0, 3).map((seance, idx) => {
                  const hasConflict = conflicts.some(conflict => 
                    conflict.seanceId1 === seance.id || conflict.seanceId2 === seance.id
                  );
                  return (
                    <SeanceCard 
                      key={idx} 
                      seance={seance} 
                      isConflict={hasConflict}
                    />
                  );
                })}
                {day.seances.length > 3 && (
                  <div className="text-xs text-gray-500 pl-2">
                    +{day.seances.length - 3} autres...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7h à 20h
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* En-tête avec jours de la semaine */}
        <div className="grid grid-cols-8 border-b bg-gray-50">
          <div className="p-4"></div> {/* Colonne heures */}
          {weekDays.map((day, index) => (
            <div key={index} className="p-4 text-center">
              <div className="font-medium text-gray-900">
                {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className={`text-2xl font-bold ${
                day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grille horaire */}
        <div className="overflow-y-auto max-h-96">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-4 text-sm text-gray-500 font-medium bg-gray-50">
                {hour}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                const daySeances = seances.filter(seance => {
                  const seanceDate = new Date(seance.dateSeance);
                  const seanceHour = parseInt(seance.heureDebut.split(':')[0]);
                  return seanceDate.toDateString() === day.toDateString() && 
                         seanceHour === hour;
                });

                return (
                  <div
                    key={dayIndex}
                    className="p-2 border-r border-gray-100 min-h-16 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onTimeSlotClick(day, hour)}
                  >
                    {daySeances.map((seance, idx) => {
                      const hasConflict = conflicts.some(conflict => 
                        conflict.seanceId1 === seance.id || conflict.seanceId2 === seance.id
                      );
                      return (
                        <SeanceCard 
                          key={idx} 
                          seance={seance} 
                          isConflict={hasConflict}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7);
    const daySeances = seances.filter(seance => {
      const seanceDate = new Date(seance.dateSeance);
      return seanceDate.toDateString() === currentDate.toDateString();
    });

    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-900">
            {currentDate.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>
          <p className="text-sm text-gray-600">
            {daySeances.length} séance(s) planifiée(s)
          </p>
        </div>

        <div className="overflow-y-auto max-h-96">
          {hours.map(hour => {
            const hourSeances = daySeances.filter(seance => {
              const seanceHour = parseInt(seance.heureDebut.split(':')[0]);
              return seanceHour === hour;
            });

            return (
              <div key={hour} className="flex border-b border-gray-100">
                <div className="w-20 p-4 text-sm text-gray-500 font-medium bg-gray-50">
                  {hour}:00
                </div>
                <div 
                  className="flex-1 p-4 min-h-16 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onTimeSlotClick(currentDate, hour)}
                >
                  <div className="space-y-2">
                    {hourSeances.map((seance, idx) => {
                      const hasConflict = conflicts.some(conflict => 
                        conflict.seanceId1 === seance.id || conflict.seanceId2 === seance.id
                      );
                      return (
                        <SeanceCard 
                          key={idx} 
                          seance={seance} 
                          isConflict={hasConflict}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
}
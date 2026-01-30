// components/dashbord/ProgrammeTable.js
import { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  Edit as EditIcon,
  Trash2,
  MoreHorizontal,
  Calendar,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react';


const ProgrammeTable = ({ programmes = [], loading = false, onProgrammeUpdate }) => {
  const [selectedProgramme, setSelectedProgramme] = useState(null);
   console.log('Programmes prop in ProgrammeTable:', programmes.data);
  const getStatusColor = (status) => {
    const colors = {
      'EN_COURS': 'bg-green-100 text-green-800',
      'PLANIFIE': 'bg-blue-100 text-blue-800',
      'TERMINE': 'bg-gray-100 text-gray-800',
      'SUSPENDU': 'bg-red-100 text-red-800',
      'BROUILLON': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'EN_COURS': 'En cours',
      'PLANIFIE': 'Planifié',
      'TERMINE': 'Terminé',
      'SUSPENDU': 'Suspendu',
      'BROUILLON': 'Brouillon'
    };
    return texts[status] || status;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure programmes is always an array
  const programmesList = Array.isArray(programmes.data) ? programmes.data : [];
  console.log('Programme List in ProgrammeTable:', programmesList);
  if (programmesList.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun programme trouvé</h3>
          <p className="text-gray-500 mb-6">Commencez par créer votre premier programme de formation.</p>
          <Link 
            href="/programmes/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer un programme
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Programmes de Formation</h3>
        <p className="text-sm text-gray-600 mt-1">{programmesList.length} programme(s) au total</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Programme
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modules
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Heures
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {programmesList.map((programme) => (
              <tr key={programme.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {programme.name || 'Programme sans nom'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {programme.description?.substring(0, 60)}
                      {programme.description?.length > 60 ? '...' : ''}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(programme.status)}`}>
                    {getStatusText(programme.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <div>
                      <div>{formatDate(programme.dateDebut)}</div>
                      <div className="text-xs">au {formatDate(programme.dateFin)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-gray-400" />
                    {programme.modules?.length || 0} module(s)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {programme.totalVHT || 0}h
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      href={`/programmes/${programme.id}`}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="Voir le détail"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/programmes/${programme.id}/edit`}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50 transition-colors"
                      title="Modifier"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setSelectedProgramme(programme.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Plus d'actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {programmesList.length > 10 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">1</span> à <span className="font-medium">10</span> sur{' '}
              <span className="font-medium">{programmesList.length}</span> résultats
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors">
                Précédent
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors">
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgrammeTable;
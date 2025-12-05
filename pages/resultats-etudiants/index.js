import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import {
  Search,
  Filter,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ResultatsEtudiants() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [resultats, setResultats] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Filtres
  const [filtres, setFiltres] = useState({
    programmeId: '',
    moduleId: '',
    numeroEtudiant: '',
    statut: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      chargerProgrammes();
      chargerResultats();
    }
  }, [status, filtres, pagination.page]);

  const chargerProgrammes = async () => {
    try {
      const res = await fetch('/api/programmes');
      const data = await res.json();
      setProgrammes(data.programmes || data);
    } catch (error) {
      console.error('Erreur chargement programmes:', error);
    }
  };

  const chargerModules = async (programmeId) => {
    if (!programmeId) {
      setModules([]);
      return;
    }

    try {
      const res = await fetch(`/api/modules?programmeId=${programmeId}`);
      const data = await res.json();
      setModules(data.modules || data);
    } catch (error) {
      console.error('Erreur chargement modules:', error);
    }
  };

  const chargerResultats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      if (filtres.programmeId) params.append('programmeId', filtres.programmeId);
      if (filtres.moduleId) params.append('moduleId', filtres.moduleId);
      if (filtres.numeroEtudiant) params.append('numeroEtudiant', filtres.numeroEtudiant);
      if (filtres.statut) params.append('statut', filtres.statut);

      const res = await fetch(`/api/resultats-etudiants?${params}`);
      const data = await res.json();

      setResultats(data.resultats || []);
      setStats(data.stats || null);
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Erreur chargement résultats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltreChange = (key, value) => {
    setFiltres(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));

    if (key === 'programmeId') {
      chargerModules(value);
      setFiltres(prev => ({ ...prev, moduleId: '' }));
    }
  };

  const getMentionBadge = (mention) => {
    const styles = {
      TB: 'bg-purple-100 text-purple-800',
      B: 'bg-blue-100 text-blue-800',
      AB: 'bg-green-100 text-green-800',
      PASSABLE: 'bg-yellow-100 text-yellow-800'
    };
    return styles[mention] || 'bg-gray-100 text-gray-800';
  };

  const getStatutBadge = (statut) => {
    const styles = {
      VALIDE: 'bg-green-100 text-green-800',
      INVALIDE: 'bg-red-100 text-red-800',
      ABANDONNE: 'bg-gray-100 text-gray-800',
      EN_COURS: 'bg-blue-100 text-blue-800'
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const exporterResultats = () => {
    const csv = [
      ['Numéro', 'Nom', 'Prénom', 'Programme', 'Module', 'Note CC', 'Note Examen', 'Note Finale', 'Mention', 'Statut', 'Présences', 'Absences', 'Taux Présence'].join(','),
      ...resultats.map(r => [
        r.numeroEtudiant,
        r.nomEtudiant,
        r.prenomEtudiant,
        r.module?.programme?.name || '',
        r.module?.name || '',
        r.noteCC || '',
        r.noteExamen || '',
        r.noteFinale || '',
        r.mention || '',
        r.statut,
        r.presences,
        r.absences,
        r.tauxPresence ? r.tauxPresence.toFixed(2) + '%' : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultats-etudiants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Résultats des Étudiants</h1>
          <p className="text-gray-600">Consultation et analyse des résultats académiques</p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Note Moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.noteMoyenne.toFixed(2)}/20
                  </p>
                </div>
                <Award className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux de Présence</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.tauxPresenceMoyen.toFixed(1)}%
                  </p>
                </div>
                <Users className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Validés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.parStatut?.VALIDE || 0}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Invalidés</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.parStatut?.INVALIDE || 0}
                  </p>
                </div>
                <TrendingDown className="h-10 w-10 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Programme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programme
              </label>
              <select
                value={filtres.programmeId}
                onChange={(e) => handleFiltreChange('programmeId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les programmes</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Module */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module
              </label>
              <select
                value={filtres.moduleId}
                onChange={(e) => handleFiltreChange('moduleId', e.target.value)}
                disabled={!filtres.programmeId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Tous les modules</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Numéro étudiant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro Étudiant
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filtres.numeroEtudiant}
                  onChange={(e) => handleFiltreChange('numeroEtudiant', e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filtres.statut}
                onChange={(e) => handleFiltreChange('statut', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les statuts</option>
                <option value="VALIDE">Validé</option>
                <option value="INVALIDE">Invalidé</option>
                <option value="EN_COURS">En cours</option>
                <option value="ABANDONNE">Abandonné</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-600">
            {pagination.total} résultat{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}
          </p>
          <button
            onClick={exporterResultats}
            disabled={resultats.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </button>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {resultats.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun résultat trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Étudiant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Programme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CC
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Examen
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Finale
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mention
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Présence
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resultats.map((resultat) => (
                    <tr key={resultat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {resultat.nomEtudiant} {resultat.prenomEtudiant}
                          </div>
                          <div className="text-sm text-gray-500">
                            {resultat.numeroEtudiant}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {resultat.module?.programme?.code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resultat.module?.programme?.niveau}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {resultat.module?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resultat.module?.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {resultat.noteCC !== null ? resultat.noteCC.toFixed(2) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {resultat.noteExamen !== null ? resultat.noteExamen.toFixed(2) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-gray-900">
                          {resultat.noteFinale !== null ? resultat.noteFinale.toFixed(2) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {resultat.mention ? (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getMentionBadge(resultat.mention)}`}>
                            {resultat.mention}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {resultat.tauxPresence !== null ? `${resultat.tauxPresence.toFixed(0)}%` : '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {resultat.presences}/{resultat.presences + resultat.absences}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadge(resultat.statut)}`}>
                          {resultat.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Affichage de{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    à{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    sur{' '}
                    <span className="font-medium">{pagination.total}</span> résultats
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {pagination.page} sur {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

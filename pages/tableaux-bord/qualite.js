import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout.js';
import { Award, TrendingUp, Target, Calendar, Plus, Edit as EditIcon, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { FadeIn, SlideIn } from '../../components/ui/PageTransition.js';
import apiClient from '../../lib/api-client';

export default function TableauBordQualite({ initialProgrammes, initialPeriodes }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [programmes, setProgrammes] = useState(initialProgrammes || []);
  const [periodes, setPeriodes] = useState(initialPeriodes || []);
  const [indicateurs, setIndicateurs] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState(
    initialProgrammes && initialProgrammes.length > 0 ? initialProgrammes[0].id : ''
  );
  const [selectedPeriode, setSelectedPeriode] = useState(
    initialPeriodes && initialPeriodes.length > 0 ? initialPeriodes[0].id : ''
  );
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingIndicateur, setEditingIndicateur] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedProgramme && selectedPeriode) {
      fetchIndicateurs();
    }
  }, [selectedProgramme, selectedPeriode]);

  const fetchIndicateurs = async () => {
    setLoading(true);
    try {
      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }

      const data = await apiClient.indicateursAcademiques.getAll({
        programmeId: selectedProgramme,
        periodeId: selectedPeriode
      });

      setIndicateurs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = async (formData) => {
    try {
      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }

      const dataToSend = {
        ...formData,
        programmeId: selectedProgramme,
        periodeId: selectedPeriode,
        responsableId: session.user.id
      };

      if (editingIndicateur) {
        await apiClient.indicateursAcademiques.update(editingIndicateur.id, dataToSend);
      } else {
        await apiClient.indicateursAcademiques.create(dataToSend);
      }

      setShowFormModal(false);
      setEditingIndicateur(null);
      fetchIndicateurs();
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet indicateur ?')) return;

    try {
      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }

      await apiClient.indicateursAcademiques.delete(id);
      fetchIndicateurs();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getIndicateurStatus = (indicateur) => {
    if (!indicateur.valeurCible || !indicateur.valeurReelle) return 'N/A';

    const pourcentageAtteint = (indicateur.valeurReelle / indicateur.valeurCible) * 100;

    if (pourcentageAtteint >= 100) return 'excellent';
    if (pourcentageAtteint >= 80) return 'bon';
    if (pourcentageAtteint >= 60) return 'moyen';
    return 'faible';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'bon': return 'bg-blue-100 text-blue-800';
      case 'moyen': return 'bg-yellow-100 text-yellow-800';
      case 'faible': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'excellent':
      case 'bon':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'moyen':
        return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      case 'faible':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const typesIndicateurs = [
    { value: 'REUSSITE', label: 'Taux de réussite' },
    { value: 'ABANDON', label: 'Taux d\'abandon' },
    { value: 'RESPECT_ECHEANCES', label: 'Respect des échéances' },
    { value: 'TRAITEMENT_VACATIONS', label: 'Traitement des vacations' },
    { value: 'SATISFACTION', label: 'Satisfaction étudiants' },
    { value: 'QUALITE_ENSEIGNEMENT', label: 'Qualité enseignement' }
  ];

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-red-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!session) return null;

  // Calculer les statistiques globales
  const stats = {
    totalIndicateurs: indicateurs.length,
    excellent: indicateurs.filter(i => getIndicateurStatus(i) === 'excellent').length,
    bon: indicateurs.filter(i => getIndicateurStatus(i) === 'bon').length,
    moyen: indicateurs.filter(i => getIndicateurStatus(i) === 'moyen').length,
    faible: indicateurs.filter(i => getIndicateurStatus(i) === 'faible').length
  };     

  return (
    <Layout>
      <Head>
        <title>Tableau de Bord Qualité - BEM Planning FC</title>
      </Head>

      <div className="space-y-6 p-6">
        {/* Header */}
        <SlideIn direction="down">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Award className="h-8 w-8 mr-3 text-yellow-600" />
                Tableau de Bord Qualité
              </h1>
              <p className="text-gray-600 mt-2">
                Suivi des indicateurs académiques et pédagogiques
              </p>
            </div>
          </div>
        </SlideIn>

        {/* Filtres */}
        <FadeIn>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programme
                </label>
                <select
                  value={selectedProgramme}
                  onChange={(e) => setSelectedProgramme(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="">Sélectionner un programme</option>
                  {programmes.map(prog => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name} ({prog.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Période académique
                </label>
                <select
                  value={selectedPeriode}
                  onChange={(e) => setSelectedPeriode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="">Sélectionner une période</option>
                  {periodes.map(periode => (
                    <option key={periode.id} value={periode.id}>
                      {periode.nom} - {periode.annee}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </FadeIn>

        {selectedProgramme && selectedPeriode && (
          <>
            {/* Statistiques globales */}
            <SlideIn direction="up">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Indicateurs</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalIndicateurs}</p>
                    </div>
                    <Target className="h-10 w-10 text-gray-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Excellent</p>
                      <p className="text-3xl font-bold text-green-600">{stats.excellent}</p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Bon</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.bon}</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-blue-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg p-6 border-2 border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Moyen</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.moyen}</p>
                    </div>
                    <Target className="h-10 w-10 text-yellow-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-white rounded-lg p-6 border-2 border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Faible</p>
                      <p className="text-3xl font-bold text-red-600">{stats.faible}</p>
                    </div>
                    <XCircle className="h-10 w-10 text-red-400" />
                  </div>
                </div>
              </div>
            </SlideIn>

            {/* Tableau des indicateurs */}
            <SlideIn direction="up" delay={200}>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Award className="h-6 w-6 mr-2 text-yellow-600" />
                    Indicateurs de Qualité
                  </h2>
                  <button
                    onClick={() => {
                      setEditingIndicateur(null);
                      setShowFormModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                  >
                    <Plus className="h-5 w-5" />
                    Ajouter un indicateur
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-600 border-t-transparent mx-auto"></div>
                  </div>
                ) : indicateurs.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Aucun indicateur enregistré</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-yellow-50 to-orange-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">N°</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Activité</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Objectif</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Indicateur(s)</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Valeur Cible</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Périodicité</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Méthode de Calcul</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Résultat</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Statut</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {indicateurs.map((indicateur, index) => {
                          const status = getIndicateurStatus(indicateur);
                          return (
                            <tr key={indicateur.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{index + 1}</td>
                              <td className="px-6 py-4">
                                <div>
                                  <div className="font-medium text-gray-900">{indicateur.type.replace('_', ' ')}</div>
                                  {indicateur.responsable && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Responsable: {indicateur.responsable.name}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{indicateur.nom}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{indicateur.description || '-'}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex px-3 py-1 text-sm font-bold text-green-700 bg-green-100 rounded-full">
                                  {indicateur.valeurCible || '-'} {indicateur.unite}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center text-sm text-gray-700">{indicateur.periodicite}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                <div className="truncate" title={indicateur.methodeCalcul}>
                                  {indicateur.methodeCalcul || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex px-3 py-1 text-sm font-bold text-blue-700 bg-blue-100 rounded-full">
                                  {indicateur.valeurReelle || '-'} {indicateur.unite}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {getStatusIcon(status)}
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                    {status === 'excellent' && 'Excellent'}
                                    {status === 'bon' && 'Bon'}
                                    {status === 'moyen' && 'Moyen'}
                                    {status === 'faible' && 'Faible'}
                                    {status === 'N/A' && 'N/A'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingIndicateur(indicateur);
                                    setShowFormModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <EditIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(indicateur.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </SlideIn>
          </>
        )}

        {!selectedProgramme && !selectedPeriode && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Award className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sélectionnez un programme et une période
            </h3>
            <p className="text-gray-600">
              Choisissez un programme et une période académique pour afficher les indicateurs qualité
            </p>
          </div>
        )}
      </div>

      {/* Modal de formulaire */}
      {showFormModal && (
        <FormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingIndicateur(null);
          }}
          onSubmit={handleSubmitForm}
          editingIndicateur={editingIndicateur}
          typesIndicateurs={typesIndicateurs}
        />
      )}
    </Layout>
  );
}

// Composant Modal de formulaire
function FormModal({ isOpen, onClose, onSubmit, editingIndicateur, typesIndicateurs }) {
  const [formData, setFormData] = useState({
    type: editingIndicateur?.type || 'REUSSITE',
    nom: editingIndicateur?.nom || '',
    description: editingIndicateur?.description || '',
    valeurCible: editingIndicateur?.valeurCible || '',
    valeurReelle: editingIndicateur?.valeurReelle || '',
    periodicite: editingIndicateur?.periodicite || 'SEMESTRIELLE',
    methodeCalcul: editingIndicateur?.methodeCalcul || '',
    unite: editingIndicateur?.unite || '%',
    dateCollecte: editingIndicateur?.dateCollecte?.split('T')[0] || new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-grey bg-opacity-1 backdrop-blur-sm  flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingIndicateur ? 'Modifier' : 'Ajouter'} un indicateur de qualité
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'indicateur *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              >
                {typesIndicateurs.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Périodicité *</label>
              <select
                name="periodicite"
                value={formData.periodicite}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              >
                <option value="SEMESTRIELLE">Semestrielle</option>
                <option value="ANNUELLE">Annuelle</option>
                <option value="MENSUELLE">Mensuelle</option>
                <option value="PAR_MODULE">Par module</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'objectif *</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              placeholder="Ex: Piloter la performance académique"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="Description de l'indicateur"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            ></textarea>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur cible</label>
              <input
                type="number"
                step="0.01"
                name="valeurCible"
                value={formData.valeurCible}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur réelle</label>
              <input
                type="number"
                step="0.01"
                name="valeurReelle"
                value={formData.valeurReelle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
              <input
                type="text"
                name="unite"
                value={formData.unite}
                onChange={handleChange}
                placeholder="%"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de calcul</label>
            <textarea
              name="methodeCalcul"
              value={formData.methodeCalcul}
              onChange={handleChange}
              rows="2"
              placeholder="Ex: (Nb étudiants validés / Nb total étudiants inscrits) × 100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de collecte</label>
            <input
              type="date"
              name="dateCollecte"
              value={formData.dateCollecte}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              {editingIndicateur ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
    const token = session.accessToken;

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const [programmesRes, periodesRes] = await Promise.all([
      fetch(`${apiBaseUrl}/programmes`, { headers }),
      fetch(`${apiBaseUrl}/periodes-academiques`, { headers }),
    ]);

    const programmesData = programmesRes.ok ? await programmesRes.json() : { programmes: [] };
    const periodesData = periodesRes.ok ? await periodesRes.json() : [];

    // Ensure programmes is always an array
    let programmes = [];
    if (Array.isArray(programmesData)) {
      programmes = programmesData;
    } else if (programmesData && Array.isArray(programmesData.programmes)) {
      programmes = programmesData.programmes;
    } else if (programmesData && Array.isArray(programmesData.data)) {
      programmes = programmesData.data;
    }

    // Ensure periodes is always an array
    let periodes = [];
    if (Array.isArray(periodesData)) {
      periodes = periodesData;
    } else if (periodesData && Array.isArray(periodesData.data)) {
      periodes = periodesData.data;
    }

    return {
      props: {
        initialProgrammes: programmes,
        initialPeriodes: periodes,
      },
    };
  } catch (error) {
    console.error('Erreur SSR:', error);
    return {
      props: {
        initialProgrammes: [],
        initialPeriodes: [],
      },
    };
  }
}

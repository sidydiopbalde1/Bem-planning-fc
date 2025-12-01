import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout.js';
import { Calendar, Clock, Plus, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { FadeIn, SlideIn } from '../../components/ui/PageTransition.js';

export default function EchéancesAcademiques({ initialProgrammes, initialPeriodes }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [programmes, setProgrammes] = useState(initialProgrammes || []);
  const [periodes, setPeriodes] = useState(initialPeriodes || []);
  const [activites, setActivites] = useState([]);
  const [indicateurs, setIndicateurs] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState(
    initialProgrammes && initialProgrammes.length > 0 ? initialProgrammes[0].id : ''
  );
  const [selectedPeriode, setSelectedPeriode] = useState(
    initialPeriodes && initialPeriodes.length > 0 ? initialPeriodes[0].id : ''
  );
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState('activite'); // 'activite' ou 'indicateur'
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedProgramme && selectedPeriode) {
      fetchData();
    }
  }, [selectedProgramme, selectedPeriode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activitesRes, indicateursRes] = await Promise.all([
        fetch(`/api/activites-academiques?programmeId=${selectedProgramme}&periodeId=${selectedPeriode}`),
        fetch(`/api/indicateurs-academiques?programmeId=${selectedProgramme}&periodeId=${selectedPeriode}`)
      ]);

      if (activitesRes.ok) {
        const data = await activitesRes.json();
        setActivites(data);
      }

      if (indicateursRes.ok) {
        const data = await indicateursRes.json();
        setIndicateurs(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivite = () => {
    setFormType('activite');
    setEditingItem(null);
    setShowFormModal(true);
  };

  const handleCreateIndicateur = () => {
    setFormType('indicateur');
    setEditingItem(null);
    setShowFormModal(true);
  };

  const handleSubmitForm = async (formData) => {
    try {
      const endpoint = formType === 'activite'
        ? '/api/activites-academiques'
        : '/api/indicateurs-academiques';

      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          programmeId: selectedProgramme,
          periodeId: selectedPeriode
        })
      });

      if (response.ok) {
        setShowFormModal(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || 'Une erreur est survenue'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      const endpoint = type === 'activite'
        ? `/api/activites-academiques/${id}`
        : `/api/indicateurs-academiques/${id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const typesActivites = [
    { value: 'DEMARRAGE_COURS', label: 'Démarrage officiel des cours' },
    { value: 'ARRET_COURS', label: 'Arrêt des cours' },
    { value: 'EXAMEN', label: 'Examens de fin de semestre' },
    { value: 'DELIBERATION', label: 'Conseil de classe / délibération' },
    { value: 'BULLETINS', label: 'Remise des bulletins de note' },
    { value: 'RATTRAPAGE', label: 'Sessions de rattrapage' }
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

  return (
    <Layout>
      <Head>
        <title>Suivi des Échéances Académiques - BEM Planning FC</title>
      </Head>

      <div className="space-y-6 p-6">
        {/* Header */}
        <SlideIn direction="down">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tableau de suivi des échéances académiques
              </h1>
              <p className="text-gray-600 mt-2">
                Gestion des activités et indicateurs de réussite
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
            {/* Activités Académiques */}
            <SlideIn direction="up">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Calendar className="h-6 w-6 mr-2 text-red-600" />
                    Activités Académiques
                  </h2>
                  <button
                    onClick={handleCreateActivite}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <Plus className="h-5 w-5" />
                    Ajouter une activité
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activité</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Prévue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Réelle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mx-auto"></div>
                          </td>
                        </tr>
                      ) : activites.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            Aucune activité enregistrée
                          </td>
                        </tr>
                      ) : (
                        activites.map(activite => (
                          <tr key={activite.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{activite.nom}</div>
                              {activite.description && (
                                <div className="text-sm text-gray-500">{activite.description}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {activite.datePrevue ? new Date(activite.datePrevue).toLocaleDateString('fr-FR') : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {activite.dateReelle ? new Date(activite.dateReelle).toLocaleDateString('fr-FR') : '-'}
                            </td>
                            <td className="px-6 py-4">
                              {activite.dateReelle ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Réalisé
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="h-4 w-4 mr-1" />
                                  En attente
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setEditingItem(activite);
                                  setFormType('activite');
                                  setShowFormModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete('activite', activite.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </SlideIn>

            {/* Indicateurs de Réussite */}
            <SlideIn direction="up" delay={200}>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <AlertCircle className="h-6 w-6 mr-2 text-blue-600" />
                    Indicateurs de Réussite
                  </h2>
                  <button
                    onClick={handleCreateIndicateur}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="h-5 w-5" />
                    Ajouter un indicateur
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {indicateurs.map(indicateur => (
                    <div key={indicateur.id} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-900">{indicateur.nom}</h3>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingItem(indicateur);
                              setFormType('indicateur');
                              setShowFormModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('indicateur', indicateur.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Valeur cible:</span>
                          <span className="font-bold text-green-600">
                            {indicateur.valeurCible || '-'} {indicateur.unite}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Valeur réelle:</span>
                          <span className="font-bold text-blue-600">
                            {indicateur.valeurReelle || '-'} {indicateur.unite}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-3">
                          Périodicité: {indicateur.periodicite}
                        </div>
                      </div>
                    </div>
                  ))}

                  {indicateurs.length === 0 && !loading && (
                    <div className="col-span-3 text-center py-8 text-gray-500">
                      Aucun indicateur enregistré
                    </div>
                  )}
                </div>
              </div>
            </SlideIn>
          </>
        )}

        {!selectedProgramme && !selectedPeriode && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sélectionnez un programme et une période
            </h3>
            <p className="text-gray-600">
              Choisissez un programme et une période académique pour afficher les données
            </p>
          </div>
        )}
      </div>

      {/* Modal de formulaire */}
      {showFormModal && (
        <FormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleSubmitForm}
          formType={formType}
          editingItem={editingItem}
          typesActivites={typesActivites}
        />
      )}
    </Layout>
  );
}

// Composant Modal de formulaire
function FormModal({ isOpen, onClose, onSubmit, formType, editingItem, typesActivites }) {
  const [formData, setFormData] = useState({
    nom: editingItem?.nom || '',
    description: editingItem?.description || '',
    datePrevue: editingItem?.datePrevue?.split('T')[0] || '',
    dateReelle: editingItem?.dateReelle?.split('T')[0] || '',
    type: editingItem?.type || 'DEMARRAGE_COURS',
    valeurCible: editingItem?.valeurCible || '',
    valeurReelle: editingItem?.valeurReelle || '',
    periodicite: editingItem?.periodicite || 'SEMESTRIELLE',
    methodeCalcul: editingItem?.methodeCalcul || '',
    unite: editingItem?.unite || '%'
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
    <div className="fixed inset-0 bg-grey bg-opacity-1 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingItem ? 'Modifier' : 'Ajouter'} {formType === 'activite' ? 'une activité' : 'un indicateur'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formType === 'activite' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'activité *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  {typesActivites.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'activité *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date prévue</label>
                  <input
                    type="date"
                    name="datePrevue"
                    value={formData.datePrevue}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date réelle</label>
                  <input
                    type="date"
                    name="dateReelle"
                    value={formData.dateReelle}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'indicateur *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Taux de réussite des étudiants"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Périodicité *</label>
                <select
                  name="periodicite"
                  value={formData.periodicite}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SEMESTRIELLE">Semestrielle</option>
                  <option value="ANNUELLE">Annuelle</option>
                  <option value="MENSUELLE">Mensuelle</option>
                  <option value="PAR_MODULE">Par module</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de calcul</label>
                <textarea
                  name="methodeCalcul"
                  value={formData.methodeCalcul}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Ex: (Nb étudiants validés / Nb total étudiants inscrits) × 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-white transition ${
                formType === 'activite'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {editingItem ? 'Modifier' : 'Créer'}
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
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const [programmesRes, periodesRes] = await Promise.all([
      fetch(`${baseUrl}/api/programmes`, {
        headers: { Cookie: context.req.headers.cookie || '' },
      }),
      fetch(`${baseUrl}/api/periodes-academiques`, {
        headers: { Cookie: context.req.headers.cookie || '' },
      }),
    ]);

    const programmesData = programmesRes.ok ? await programmesRes.json() : {};
    const periodesData = periodesRes.ok ? await periodesRes.json() : [];

    return {
      props: {
        initialProgrammes: programmesData.programmes || [],
        initialPeriodes: periodesData || [],
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

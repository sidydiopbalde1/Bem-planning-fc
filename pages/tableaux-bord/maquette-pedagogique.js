import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout.js';
import { BookOpen, Plus, Edit as EditIcon, Trash2, Users, Calendar, TrendingUp, Download } from 'lucide-react';
import { FadeIn, SlideIn } from '../../components/ui/PageTransition.js';
import apiClient from '../../lib/api-client';

export default function MaquettePedagogique({ initialProgrammes }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [programmes, setProgrammes] = useState(initialProgrammes || []);
  const [selectedProgramme, setSelectedProgramme] = useState(
    initialProgrammes && initialProgrammes.length > 0 ? initialProgrammes[0].id : ''
  );
  const [modules, setModules] = useState([]);
  const [resultats, setResultats] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [formType, setFormType] = useState('resultat'); // 'resultat' ou 'evaluation'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedProgramme) {
      fetchModules();
    }
  }, [selectedProgramme]);

  const fetchModules = async () => {
    setLoading(true);
    try {
      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }

      const data = await apiClient.modules.getAll({ programmeId: selectedProgramme });
      const modulesData = data.data || data || [];
      setModules(modulesData);

      // Charger les résultats et évaluations pour chaque module
      modulesData.forEach(module => {
        fetchModuleData(module.id);
      });
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleData = async (moduleId) => {
    try {
      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }

      const [resultatsData, evaluationsData] = await Promise.all([
        apiClient.resultatsEtudiants.getAll({ moduleId }),
        apiClient.evaluationsEnseignements.getAll({ moduleId })
      ]);

      setResultats(prev => ({ ...prev, [moduleId]: resultatsData || [] }));
      setEvaluations(prev => ({ ...prev, [moduleId]: (evaluationsData || [])[0] })); // Prendre la première évaluation
    } catch (error) {
      console.error('Erreur lors du chargement des données du module:', error);
    }
  };

  const calculateModuleStats = (moduleId) => {
    const moduleResultats = resultats[moduleId] || [];

    const total = moduleResultats.length;
    if (total === 0) return { progression: 0, tauxReussite: 0, tauxPresence: 0 };

    const progressionMoyenne = moduleResultats.reduce((sum, r) => sum + (r.progressionPct || 0), 0) / total;
    const reussis = moduleResultats.filter(r => r.statut === 'VALIDE').length;
    const tauxReussite = (reussis / total) * 100;
    const tauxPresenceMoyenne = moduleResultats.reduce((sum, r) => sum + (r.tauxPresence || 0), 0) / total;

    return {
      progression: Math.round(progressionMoyenne),
      tauxReussite: Math.round(tauxReussite),
      tauxPresence: Math.round(tauxPresenceMoyenne),
      nbEtudiants: total
    };
  };

  const handleExport = () => {
    // Logique d'export en CSV ou Excel
    alert('Fonctionnalité d\'export en cours de développement');
  };

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
        <title>Maquette Pédagogique Détaillée - BEM Planning FC</title>
      </Head>

      <div className="space-y-6 p-6">
        {/* Header */}
        <SlideIn direction="down">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Maquette Pédagogique Détaillée
              </h1>
              <p className="text-gray-600 mt-2">
                Suivi des modules, résultats étudiants et évaluations
              </p>
            </div>
            {selectedProgramme && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="h-5 w-5" />
                Exporter
              </button>
            )}
          </div>
        </SlideIn>

        {/* Filtre Programme */}
        <FadeIn>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="max-w-xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un programme
              </label>
              <select
                value={selectedProgramme}
                onChange={(e) => setSelectedProgramme(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Choisir un programme...</option>
                {programmes.map(prog => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name} ({prog.code}) - {prog.niveau}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FadeIn>

        {selectedProgramme && (
          <>
            {/* Statistiques globales */}
            <SlideIn direction="up">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-white rounded-lg p-6 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Modules</p>
                      <p className="text-3xl font-bold text-red-600">{modules.length}</p>
                    </div>
                    <BookOpen className="h-10 w-10 text-red-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Crédits ECTS</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {modules.reduce((sum, m) => sum + (m.credits || 0), 0)}
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-blue-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Volume Horaire Total</p>
                      <p className="text-3xl font-bold text-green-600">
                        {modules.reduce((sum, m) => sum + (m.vht || 0), 0)}h
                      </p>
                    </div>
                    <Calendar className="h-10 w-10 text-green-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Intervenants</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {new Set(modules.filter(m => m.intervenant).map(m => m.intervenant.id)).size}
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-purple-600 opacity-20" />
                  </div>
                </div>
              </div>
            </SlideIn>

            {/* Tableau des modules */}
            <SlideIn direction="up" delay={200}>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <BookOpen className="h-6 w-6 mr-2 text-red-600" />
                    Modules et Unités d'Enseignement
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-red-600 to-red-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Module</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">CM</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">TD</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">TP</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">TPE</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">VHT</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Coef.</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Crédits</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Intervenant</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Étudiants</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Progression</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Taux Réussite</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan="14" className="px-6 py-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mx-auto"></div>
                          </td>
                        </tr>
                      ) : modules.length === 0 ? (
                        <tr>
                          <td colSpan="14" className="px-6 py-8 text-center text-gray-500">
                            Aucun module trouvé pour ce programme
                          </td>
                        </tr>
                      ) : (
                        modules.map((module, index) => {
                          const stats = calculateModuleStats(module.id);
                          const evaluation = evaluations[module.id];

                          return (
                            <tr key={module.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-4 py-3 text-sm font-mono text-gray-900">{module.code}</td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{module.name}</div>
                                {module.description && (
                                  <div className="text-xs text-gray-500">{module.description.substring(0, 50)}...</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-gray-900">{module.cm}</td>
                              <td className="px-4 py-3 text-center text-sm text-gray-900">{module.td}</td>
                              <td className="px-4 py-3 text-center text-sm text-gray-900">{module.tp}</td>
                              <td className="px-4 py-3 text-center text-sm text-gray-900">{module.tpe}</td>
                              <td className="px-4 py-3 text-center text-sm font-bold text-red-600">{module.vht}</td>
                              <td className="px-4 py-3 text-center text-sm text-gray-900">{module.coefficient}</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold text-blue-600">{module.credits}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {module.intervenant ? (
                                  <div>
                                    <div className="font-medium">{module.intervenant.civilite} {module.intervenant.nom}</div>
                                    <div className="text-xs text-gray-500">{module.intervenant.email}</div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">Non assigné</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {stats.nbEtudiants || 0}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center">
                                  <div className="w-full max-w-[80px]">
                                    <div className="bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-green-600 h-2 rounded-full"
                                        style={{ width: `${stats.progression || 0}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-center mt-1 font-medium text-gray-700">
                                      {stats.progression || 0}%
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  stats.tauxReussite >= 75 ? 'bg-green-100 text-green-800' :
                                  stats.tauxReussite >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {stats.tauxReussite || 0}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedModule(module);
                                      setFormType('resultat');
                                      setShowFormModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                    title="Gérer les résultats"
                                  >
                                    <Users className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedModule(module);
                                      setFormType('evaluation');
                                      setShowFormModal(true);
                                    }}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                    title="Évaluation du cours"
                                  >
                                    <TrendingUp className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </SlideIn>
          </>
        )}

        {!selectedProgramme && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sélectionnez un programme
            </h3>
            <p className="text-gray-600">
              Choisissez un programme pour afficher sa maquette pédagogique détaillée
            </p>
          </div>
        )}
      </div>

      {/* Modal de gestion */}
      {showFormModal && selectedModule && (
        <ManageModuleModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setSelectedModule(null);
          }}
          module={selectedModule}
          formType={formType}
          resultats={resultats[selectedModule.id] || []}
          evaluation={evaluations[selectedModule.id]}
          onDataUpdated={() => fetchModuleData(selectedModule.id)}
        />
      )}
    </Layout>
  );
}

// Composant Modal de gestion des résultats et évaluations
function ManageModuleModal({ isOpen, onClose, module, formType, resultats, evaluation, onDataUpdated }) {
  const [activeTab, setActiveTab] = useState(formType);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setActiveTab(formType);
  }, [formType]);

  const handleAddResultat = async (e) => {
    e.preventDefault();
    try {
      await apiClient.resultatsEtudiants.create({
        ...formData,
        moduleId: module.id
      });

      setShowAddForm(false);
      setFormData({});
      onDataUpdated();
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message || 'Erreur lors de l\'ajout'}`);
    }
  };

  const handleUpdateEvaluation = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        moduleId: module.id,
        intervenantId: module.intervenantId || formData.intervenantId
      };

      if (evaluation) {
        await apiClient.evaluationsEnseignements.update(evaluation.id, dataToSend);
      } else {
        await apiClient.evaluationsEnseignements.create(dataToSend);
      }

      onDataUpdated();
      alert('Évaluation enregistrée avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message || 'Erreur lors de l\'enregistrement'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{module.name}</h2>
              <p className="text-sm text-gray-600 mt-1">Code: {module.code}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('resultat')}
              className={`pb-2 px-4 font-medium transition ${
                activeTab === 'resultat'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Résultats Étudiants ({resultats.length})
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`pb-2 px-4 font-medium transition ${
                activeTab === 'evaluation'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Évaluation du Cours
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'resultat' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Liste des étudiants</h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un étudiant
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleAddResultat} className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="N° Étudiant *"
                    required
                    onChange={(e) => setFormData({ ...formData, numeroEtudiant: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nom *"
                    required
                    onChange={(e) => setFormData({ ...formData, nomEtudiant: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Prénom *"
                    required
                    onChange={(e) => setFormData({ ...formData, prenomEtudiant: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <select
                    required
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Statut *</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="VALIDE">Validé</option>
                    <option value="INVALIDE">Invalidé</option>
                    <option value="ABANDONNE">Abandonné</option>
                  </select>
                  <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    Annuler
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">N°</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom & Prénom</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Progression</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Note Finale</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resultats.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500 text-sm">
                          Aucun résultat enregistré
                        </td>
                      </tr>
                    ) : (
                      resultats.map(resultat => (
                        <tr key={resultat.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">{resultat.numeroEtudiant}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {resultat.nomEtudiant} {resultat.prenomEtudiant}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">{resultat.progressionPct}%</td>
                          <td className="px-4 py-3 text-center text-sm font-semibold">{resultat.noteFinale || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              resultat.statut === 'VALIDE' ? 'bg-green-100 text-green-800' :
                              resultat.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-800' :
                              resultat.statut === 'ABANDONNE' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {resultat.statut}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'evaluation' && (
            <form onSubmit={handleUpdateEvaluation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'envoi du lien</label>
                  <input
                    type="date"
                    defaultValue={evaluation?.dateEnvoi?.split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, dateEnvoi: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lien d'évaluation</label>
                  <input
                    type="url"
                    defaultValue={evaluation?.lienEvaluation}
                    onChange={(e) => setFormData({ ...formData, lienEvaluation: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note qualité cours (/10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    defaultValue={evaluation?.noteQualiteCours}
                    onChange={(e) => setFormData({ ...formData, noteQualiteCours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note pédagogie (/10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    defaultValue={evaluation?.noteQualitePedagogie}
                    onChange={(e) => setFormData({ ...formData, noteQualitePedagogie: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note disponibilité (/10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    defaultValue={evaluation?.noteDisponibilite}
                    onChange={(e) => setFormData({ ...formData, noteDisponibilite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de réponses</label>
                  <input
                    type="number"
                    min="0"
                    defaultValue={evaluation?.nombreReponses}
                    onChange={(e) => setFormData({ ...formData, nombreReponses: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux de participation (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    defaultValue={evaluation?.tauxParticipation}
                    onChange={(e) => setFormData({ ...formData, tauxParticipation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires</label>
                <textarea
                  rows="3"
                  defaultValue={evaluation?.commentaires}
                  onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Enregistrer l'évaluation
                </button>
              </div>
            </form>
          )}
        </div>
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

    const programmesRes = await fetch(`${apiBaseUrl}/programmes`, { headers });
    const programmesData = programmesRes.ok ? await programmesRes.json() : { programmes: [] };

    // Ensure programmes is always an array
    let programmes = [];
    if (Array.isArray(programmesData)) {
      programmes = programmesData;
    } else if (programmesData && Array.isArray(programmesData.programmes)) {
      programmes = programmesData.programmes;
    } else if (programmesData && Array.isArray(programmesData.data)) {
      programmes = programmesData.data;
    }

    return {
      props: {
        initialProgrammes: programmes,
      },
    };
  } catch (error) {
    console.error('Erreur SSR:', error);
    return {
      props: {
        initialProgrammes: [],
      },
    };
  }
}

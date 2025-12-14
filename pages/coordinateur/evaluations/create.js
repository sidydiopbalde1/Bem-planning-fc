// pages/coordinateur/evaluations/create.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/layout';
import { ArrowLeft, Calendar, Users, BookOpen, Save, Send } from 'lucide-react';
import Link from 'next/link';

export default function CreateEvaluationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
  const [intervenants, setIntervenants] = useState([]);
  const [formData, setFormData] = useState({
    moduleId: '',
    intervenantId: '',
    dateDebut: '',
    dateFin: '',
    nombreInvitations: 0
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['COORDINATOR', 'ADMIN'].includes(session?.user?.role)) {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchModules();
      fetchIntervenants();
    }
  }, [status]);

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/coordinateur/modules?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchIntervenants = async () => {
    try {
      const response = await fetch('/api/intervenants?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setIntervenants(data.intervenants || []);
      }
    } catch (error) {
      console.error('Error fetching intervenants:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.moduleId) newErrors.moduleId = 'Module requis';
    if (!formData.intervenantId) newErrors.intervenantId = 'Intervenant requis';
    if (!formData.dateDebut) newErrors.dateDebut = 'Date de début requise';
    if (!formData.dateFin) newErrors.dateFin = 'Date de fin requise';

    if (formData.dateDebut && formData.dateFin) {
      const debut = new Date(formData.dateDebut);
      const fin = new Date(formData.dateFin);
      if (debut >= fin) {
        newErrors.dateFin = 'La date de fin doit être après la date de début';
      }
    }

    if (formData.nombreInvitations < 0) {
      newErrors.nombreInvitations = 'Le nombre doit être positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/coordinateur/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        alert('Campagne d\'évaluation créée avec succès!');
        router.push(`/coordinateur/evaluations/${data.evaluation.id}`);
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.error || 'Impossible de créer la campagne'}`);
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleModuleChange = (moduleId) => {
    setFormData({ ...formData, moduleId });

    // Auto-select intervenant if module has one
    const selectedModule = modules.find(m => m.id === moduleId);
    if (selectedModule?.intervenantId) {
      setFormData(prev => ({
        ...prev,
        moduleId,
        intervenantId: selectedModule.intervenantId
      }));
    }
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/coordinateur/evaluations">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nouvelle Campagne d'Évaluation</h1>
            <p className="text-gray-600 mt-1">Créer une campagne d'évaluation des enseignements</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Module Selection */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 mr-2" />
                Module <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={formData.moduleId}
                onChange={(e) => handleModuleChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.moduleId ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Sélectionner un module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.code} - {module.name} ({module.programme?.code})
                  </option>
                ))}
              </select>
              {errors.moduleId && (
                <p className="text-red-500 text-xs mt-1">{errors.moduleId}</p>
              )}
            </div>

            {/* Intervenant Selection */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 mr-2" />
                Intervenant <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={formData.intervenantId}
                onChange={(e) => setFormData({ ...formData, intervenantId: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.intervenantId ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Sélectionner un intervenant</option>
                {intervenants.map((intervenant) => (
                  <option key={intervenant.id} value={intervenant.id}>
                    {intervenant.civilite} {intervenant.prenom} {intervenant.nom}
                  </option>
                ))}
              </select>
              {errors.intervenantId && (
                <p className="text-red-500 text-xs mt-1">{errors.intervenantId}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date de début <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.dateDebut ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.dateDebut && (
                  <p className="text-red-500 text-xs mt-1">{errors.dateDebut}</p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date de fin <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.dateFin ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.dateFin && (
                  <p className="text-red-500 text-xs mt-1">{errors.dateFin}</p>
                )}
              </div>
            </div>

            {/* Nombre d'invitations */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 mr-2" />
                Nombre d'étudiants invités
              </label>
              <input
                type="number"
                min="0"
                value={formData.nombreInvitations}
                onChange={(e) => setFormData({ ...formData, nombreInvitations: parseInt(e.target.value) || 0 })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.nombreInvitations ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: 30"
              />
              {errors.nombreInvitations && (
                <p className="text-red-500 text-xs mt-1">{errors.nombreInvitations}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Nombre d'étudiants qui recevront le lien d'évaluation
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    La campagne sera créée avec le statut <strong>Brouillon</strong>. Un lien d'évaluation unique sera généré automatiquement. Vous pourrez l'envoyer aux étudiants depuis la page de détails.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link href="/coordinateur/evaluations">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Créer la campagne
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

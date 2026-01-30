// pages/programmes/[id]/edit.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout';
import { ArrowLeft, Save, Loader2, Calendar, Clock, Hash, BookOpen } from 'lucide-react';
import apiClient from '../../../lib/api-client';

export default function EditProgramme() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    semestre: '',
    niveau: '',
    dateDebut: '',
    dateFin: '',
    totalVHT: '',
    status: 'PLANIFIE'
  });

  const semestreOptions = [
    { value: 'SEMESTRE_1', label: 'Semestre 1' },
    { value: 'SEMESTRE_2', label: 'Semestre 2' },
    { value: 'SEMESTRE_3', label: 'Semestre 3' },
    { value: 'SEMESTRE_4', label: 'Semestre 4' },
    { value: 'SEMESTRE_5', label: 'Semestre 5' },
    { value: 'SEMESTRE_6', label: 'Semestre 6' }
  ];

  const niveauOptions = [
    { value: 'L1', label: 'Licence 1' },
    { value: 'L2', label: 'Licence 2' },
    { value: 'L3', label: 'Licence 3' },
    { value: 'M1', label: 'Master 1' },
    { value: 'M2', label: 'Master 2' }
  ];

  const statusOptions = [
    { value: 'PLANIFIE', label: 'Planifié' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'TERMINE', label: 'Terminé' },
    { value: 'SUSPENDU', label: 'Suspendu' },
    { value: 'ANNULE', label: 'Annulé' }
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // Bloquer l'accès aux TEACHER (intervenants)
      if (session?.user?.role === 'TEACHER') {
        router.push('/intervenant/mes-seances');
        return;
      }
      if (id) {
        fetchProgramme();
      }
    }
  }, [status, session, id]);

  const fetchProgramme = async () => {
    try {
      setLoading(true);
      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }

      const data = await apiClient.programmes.getById(id);
      const programme = data.programme || data;

      // Format dates for input fields (YYYY-MM-DD)
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        name: programme.name || '',
        code: programme.code || '',
        description: programme.description || '',
        semestre: programme.semestre || '',
        niveau: programme.niveau || '',
        dateDebut: formatDate(programme.dateDebut),
        dateFin: formatDate(programme.dateFin),
        totalVHT: programme.totalVHT || '',
        status: programme.status || 'PLANIFIE'
      });
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du programme est requis';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Le code du programme est requis';
    }

    if (!formData.semestre) {
      newErrors.semestre = 'Le semestre est requis';
    }

    if (!formData.niveau) {
      newErrors.niveau = 'Le niveau est requis';
    }

    if (!formData.dateDebut) {
      newErrors.dateDebut = 'La date de début est requise';
    }

    if (!formData.dateFin) {
      newErrors.dateFin = 'La date de fin est requise';
    }

    if (formData.dateDebut && formData.dateFin && new Date(formData.dateDebut) >= new Date(formData.dateFin)) {
      newErrors.dateFin = 'La date de fin doit être postérieure à la date de début';
    }

    if (!formData.totalVHT || formData.totalVHT <= 0) {
      newErrors.totalVHT = 'Le volume horaire total doit être supérieur à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setErrors({});

      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }

      await apiClient.programmes.update(id, {
        ...formData,
        totalVHT: parseInt(formData.totalVHT),
        dateDebut: new Date(formData.dateDebut).toISOString(),
        dateFin: new Date(formData.dateFin).toISOString()
      });

      router.push(`/programmes/${id}`);
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setError(err.message || 'Erreur lors de la mise à jour');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Modifier Programme">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Modifier Programme">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Modifier Programme</h1>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Nom et Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du programme <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Introduction au Marketing Digital"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={(e) => handleChange({ target: { name: 'code', value: e.target.value.toUpperCase() } })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: MKT-101"
                />
              </div>
              {errors.code && (
                <p className="mt-1 text-sm text-red-500">{errors.code}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description détaillée du programme de formation..."
            />
          </div>

          {/* Semestre, Niveau, Statut */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semestre <span className="text-red-500">*</span>
              </label>
              <select
                name="semestre"
                value={formData.semestre}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors.semestre ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner...</option>
                {semestreOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.semestre && (
                <p className="mt-1 text-sm text-red-500">{errors.semestre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau <span className="text-red-500">*</span>
              </label>
              <select
                name="niveau"
                value={formData.niveau}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors.niveau ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner...</option>
                {niveauOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.niveau && (
                <p className="mt-1 text-sm text-red-500">{errors.niveau}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="dateDebut"
                  value={formData.dateDebut}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dateDebut ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.dateDebut && (
                <p className="mt-1 text-sm text-red-500">{errors.dateDebut}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="dateFin"
                  value={formData.dateFin}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dateFin ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.dateFin && (
                <p className="mt-1 text-sm text-red-500">{errors.dateFin}</p>
              )}
            </div>
          </div>

          {/* Volume horaire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume horaire total (VHT) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="totalVHT"
                  min="1"
                  value={formData.totalVHT}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-16 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.totalVHT ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="120"
                />
                <div className="absolute right-3 top-2.5 text-sm text-gray-500">heures</div>
              </div>
              {errors.totalVHT && (
                <p className="mt-1 text-sm text-red-500">{errors.totalVHT}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

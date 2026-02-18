// pages/modules/[id]/edit.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout';
import { ArrowLeft, Save, Loader2, Hash, BookOpen, Clock, Calendar, Users } from 'lucide-react';
import apiClient from '../../../lib/api-client';

export default function EditModule() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [intervenants, setIntervenants] = useState([]);
  const [programmeName, setProgrammeName] = useState('');
  const [programmeId, setProgrammeId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    cm: 0,
    td: 0,
    tp: 0,
    tpe: 0,
    vht: 0,
    coefficient: 1,
    credits: 1,
    intervenantId: '',
    dateDebut: '',
    dateFin: '',
    status: 'PLANIFIE'
  });

  const statusOptions = [
    { value: 'PLANIFIE', label: 'Planifie' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'TERMINE', label: 'Termine' },
    { value: 'REPORTE', label: 'Reporte' },
    { value: 'ANNULE', label: 'Annule' }
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      if (session?.user?.role === 'TEACHER') {
        router.push('/intervenant/mes-seances');
        return;
      }
      if (id) {
        fetchModule();
        fetchIntervenants();
      }
    }
  }, [status, session, id]);

  // Recalculate VHT when CM, TD, TP, TPE change
  useEffect(() => {
    const cm = parseInt(formData.cm) || 0;
    const td = parseInt(formData.td) || 0;
    const tp = parseInt(formData.tp) || 0;
    const tpe = parseInt(formData.tpe) || 0;
    setFormData(prev => ({ ...prev, vht: cm + td + tp + tpe }));
  }, [formData.cm, formData.td, formData.tp, formData.tpe]);

  const fetchModule = async () => {
    try {
      setLoading(true);
      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }

      const data = await apiClient.modules.getById(id);
      const mod = data.module || data;

      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };

      setProgrammeName(mod.programme?.name || '');
      setProgrammeId(mod.programme?.id || '');

      setFormData({
        name: mod.name || '',
        code: mod.code || '',
        description: mod.description || '',
        cm: mod.cm || 0,
        td: mod.td || 0,
        tp: mod.tp || 0,
        tpe: mod.tpe || 0,
        vht: mod.vht || 0,
        coefficient: mod.coefficient || 1,
        credits: mod.credits || 1,
        intervenantId: mod.intervenant?.id || '',
        dateDebut: formatDate(mod.dateDebut),
        dateFin: formatDate(mod.dateFin),
        status: mod.status || 'PLANIFIE'
      });
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchIntervenants = async () => {
    try {
      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }
      const data = await apiClient.intervenants.getAll();
      setIntervenants(data.data || data || []);
    } catch (err) {
      console.error('Erreur chargement intervenants:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du module est requis';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Le code du module est requis';
    }

    if (formData.dateDebut && formData.dateFin && new Date(formData.dateDebut) >= new Date(formData.dateFin)) {
      newErrors.dateFin = 'La date de fin doit etre posterieure a la date de debut';
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

      await apiClient.modules.update(id, {
        ...formData,
        cm: parseInt(formData.cm) || 0,
        td: parseInt(formData.td) || 0,
        tp: parseInt(formData.tp) || 0,
        tpe: parseInt(formData.tpe) || 0,
        vht: parseInt(formData.vht) || 0,
        coefficient: parseFloat(formData.coefficient) || 1,
        credits: parseInt(formData.credits) || 1,
        intervenantId: formData.intervenantId || null,
        dateDebut: formData.dateDebut ? new Date(formData.dateDebut).toISOString() : null,
        dateFin: formData.dateFin ? new Date(formData.dateFin).toISOString() : null
      });

      router.push(`/modules/${id}`);
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setError(err.message || 'Erreur lors de la mise a jour');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Modifier Module">
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
    <Layout title="Modifier Module">
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modifier Module</h1>
              {programmeName && (
                <p className="text-sm text-gray-500">Programme : {programmeName}</p>
              )}
            </div>
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
                Nom du module <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Algorithmique"
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
                  placeholder="Ex: ALG-101"
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
              placeholder="Description du module..."
            />
          </div>

          {/* Volume horaire */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Volume horaire
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CM</label>
                <div className="relative">
                  <input
                    type="number"
                    name="cm"
                    min="0"
                    value={formData.cm}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-gray-400">h</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TD</label>
                <div className="relative">
                  <input
                    type="number"
                    name="td"
                    min="0"
                    value={formData.td}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-gray-400">h</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TP</label>
                <div className="relative">
                  <input
                    type="number"
                    name="tp"
                    min="0"
                    value={formData.tp}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-gray-400">h</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TPE</label>
                <div className="relative">
                  <input
                    type="number"
                    name="tpe"
                    min="0"
                    value={formData.tpe}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-gray-400">h</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VHT</label>
                <div className="relative">
                  <input
                    type="number"
                    name="vht"
                    value={formData.vht}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 font-semibold"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-gray-400">h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Coefficient et Credits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coefficient
              </label>
              <input
                type="number"
                name="coefficient"
                min="1"
                step="0.5"
                value={formData.coefficient}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credits ECTS
              </label>
              <input
                type="number"
                name="credits"
                min="1"
                value={formData.credits}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Intervenant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="inline h-4 w-4 mr-1 text-gray-500" />
              Intervenant
            </label>
            <select
              name="intervenantId"
              value={formData.intervenantId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Aucun intervenant</option>
              {intervenants.map(interv => (
                <option key={interv.id} value={interv.id}>
                  {interv.civilite} {interv.prenom} {interv.nom} - {interv.grade || interv.specialite || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de debut
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
                Date de fin
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

          {/* Statut */}
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

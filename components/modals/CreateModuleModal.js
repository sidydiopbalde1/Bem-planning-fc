// components/modals/CreateModuleModal.js
import { useState, useEffect } from 'react';
import { X, Save, BookOpen, Hash, Users, Clock, AlertCircle } from 'lucide-react';
import apiClient from '../../lib/api-client';

const CreateModuleModal = ({ isOpen, onClose, onSuccess, programmeId }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    cm: 0,
    td: 0,
    tp: 0,
    tpe: 0,
    coefficient: 1,
    credits: 1,
    intervenantId: '',
    dateDebut: '',
    dateFin: '',
    status: 'PLANIFIE'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [intervenants, setIntervenants] = useState([]);
  const [loadingIntervenants, setLoadingIntervenants] = useState(true);

  const statusOptions = [
    { value: 'PLANIFIE', label: 'Planifié' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'TERMINE', label: 'Terminé' },
    { value: 'REPORTE', label: 'Reporté' },
    { value: 'ANNULE', label: 'Annulé' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchIntervenants();
      // Empêcher le scroll du body quand modal ouvert
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchIntervenants = async () => {
    try {
      const intervenants = await apiClient.intervenants.getAll();
      const list = intervenants?.data || intervenants;
      setIntervenants(list.filter(i => i.disponible));
    } catch (error) {
      console.error('Erreur fetch intervenants:', error.message || error);
    } finally {
      setLoadingIntervenants(false);
    }
  };

  const calculateVHT = () => {
    const cm = parseInt(formData.cm) || 0;
    const td = parseInt(formData.td) || 0;
    const tp = parseInt(formData.tp) || 0;
    const tpe = parseInt(formData.tpe) || 0;
    return cm + td + tp + tpe;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Le code du module est requis';
    } else if (!/^[A-Z0-9-_]+$/.test(formData.code)) {
      newErrors.code = 'Le code doit contenir uniquement des majuscules, chiffres, tirets et underscores';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du module est requis';
    }

    const vht = calculateVHT();
    if (vht === 0) {
      newErrors.vht = 'Le volume horaire total doit être supérieur à 0';
    }

    if (formData.coefficient <= 0) {
      newErrors.coefficient = 'Le coefficient doit être supérieur à 0';
    }

    if (formData.credits <= 0) {
      newErrors.credits = 'Le nombre de crédits doit être supérieur à 0';
    }

    if (formData.dateDebut && formData.dateFin && new Date(formData.dateDebut) >= new Date(formData.dateFin)) {
      newErrors.dateFin = 'La date de fin doit être postérieure à la date de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const vht = calculateVHT();
      const data = await apiClient.modules.create({
        ...formData,
        programmeId,
        cm: parseInt(formData.cm) || 0,
        td: parseInt(formData.td) || 0,
        tp: parseInt(formData.tp) || 0,
        tpe: parseInt(formData.tpe) || 0,
        vht,
        coefficient: parseInt(formData.coefficient),
        credits: parseInt(formData.credits),
        intervenantId: formData.intervenantId || null,
        dateDebut: formData.dateDebut ? new Date(formData.dateDebut).toISOString() : null,
        dateFin: formData.dateFin ? new Date(formData.dateFin).toISOString() : null
      });

      onSuccess && onSuccess(data.module || data);
      onClose();
      setFormData({
        code: '',
        name: '',
        description: '',
        cm: 0,
        td: 0,
        tp: 0,
        tpe: 0,
        coefficient: 1,
        credits: 1,
        intervenantId: '',
        dateDebut: '',
        dateFin: '',
        status: 'PLANIFIE'
      });
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors({ general: error.message || 'Erreur lors de la création du module' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  if (!isOpen) return null;

  const vht = calculateVHT();

  return (
    <>
      {/* Overlay - z-30: behind table but in front of main content */}
      <div 
        className="fixed inset-0 bg-black/50 z-30" 
        onClick={onClose}
      ></div>
      
      {/* Modal Container - z-35: in front of overlay, behind top elements */}
      <div className="fixed inset-0 z-35 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          {/* Header - Sticky */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Créer un nouveau module
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Error général */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">{errors.general}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Informations de base */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informations générales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code du module *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                          errors.code ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Ex: MKT-101-M1"
                      />
                    </div>
                    {errors.code && (
                      <p className="mt-1 text-xs text-red-600">{errors.code}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du module *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ex: Stratégies Marketing Digital"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Description détaillée du module..."
                  />
                </div>
              </div>

              {/* Volume horaire */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Volume horaire</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CM (Cours Magistraux)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={formData.cm}
                        onChange={(e) => handleChange('cm', e.target.value)}
                        className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-gray-500">h</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TD (Travaux Dirigés)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={formData.td}
                        onChange={(e) => handleChange('td', e.target.value)}
                        className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-gray-500">h</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TP (Travaux Pratiques)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={formData.tp}
                        onChange={(e) => handleChange('tp', e.target.value)}
                        className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-gray-500">h</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TPE (Travail Personnel)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={formData.tpe}
                        onChange={(e) => handleChange('tpe', e.target.value)}
                        className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-gray-500">h</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">Volume Horaire Total (VHT)</span>
                    <span className="text-lg font-bold text-blue-600">{vht}h</span>
                  </div>
                </div>

                {errors.vht && (
                  <p className="mt-1 text-xs text-red-600">{errors.vht}</p>
                )}
              </div>

              {/* Évaluation et crédits */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Évaluation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coefficient *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.coefficient}
                      onChange={(e) => handleChange('coefficient', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                        errors.coefficient ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.coefficient && (
                      <p className="mt-1 text-xs text-red-600">{errors.coefficient}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Crédits ECTS *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.credits}
                      onChange={(e) => handleChange('credits', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                        errors.credits ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.credits && (
                      <p className="mt-1 text-xs text-red-600">{errors.credits}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Intervenant et planning */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Planification</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intervenant assigné
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <select
                        value={formData.intervenantId}
                        onChange={(e) => handleChange('intervenantId', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                        disabled={loadingIntervenants}
                      >
                        <option value="">Sélectionner un intervenant...</option>
                        {intervenants.map(intervenant => (
                          <option key={intervenant.id} value={intervenant.id}>
                            {intervenant.civilite} {intervenant.prenom} {intervenant.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    {loadingIntervenants && (
                      <p className="mt-1 text-xs text-gray-500">Chargement des intervenants...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={formData.dateDebut}
                      onChange={(e) => handleChange('dateDebut', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={formData.dateFin}
                      onChange={(e) => handleChange('dateFin', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                        errors.dateFin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.dateFin && (
                      <p className="mt-1 text-xs text-red-600">{errors.dateFin}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || vht === 0}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Créer le module</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateModuleModal;
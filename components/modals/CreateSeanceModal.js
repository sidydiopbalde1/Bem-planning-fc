// components/modals/CreateSeanceModal.js
import { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, MapPin, Users, BookOpen, AlertCircle } from 'lucide-react';
import apiClient from '../../lib/api-client';

const CreateSeanceModal = ({ isOpen, onClose, onSuccess, selectedDate = null }) => {
  const [formData, setFormData] = useState({
    moduleId: '',
    intervenantId: '',
    salleId: '',
    dateSeance: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    heureDebut: '08:00',
    heureFin: '10:00',
    typeSeance: 'CM',
    status: 'PLANIFIE',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
  const [intervenants, setIntervenants] = useState([]);
  const [salles, setSalles] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const typeSeanceOptions = [
    { value: 'CM', label: 'Cours Magistral (CM)', color: 'bg-purple-500' },
    { value: 'TD', label: 'Travaux Dirigés (TD)', color: 'bg-blue-500' },
    { value: 'TP', label: 'Travaux Pratiques (TP)', color: 'bg-green-500' },
    { value: 'EXAMEN', label: 'Examen', color: 'bg-red-500' },
    { value: 'RATTRAPAGE', label: 'Rattrapage', color: 'bg-orange-500' }
  ];

  const statusOptions = [
    { value: 'PLANIFIE', label: 'Planifié' },
    { value: 'CONFIRME', label: 'Confirmé' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'TERMINE', label: 'Terminé' },
    { value: 'REPORTE', label: 'Reporté' },
    { value: 'ANNULE', label: 'Annulé' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchData();
      document.body.style.overflow = 'hidden';

      // Mettre à jour la date si selectedDate change
      if (selectedDate) {
        setFormData(prev => ({
          ...prev,
          dateSeance: selectedDate.toISOString().split('T')[0]
        }));
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, selectedDate]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [modulesData, intervenantsData, sallesData] = await Promise.all([
        apiClient.modules.getAll(),
        apiClient.intervenants.getAll(),
        apiClient.salles.getAll()
      ]);
      console.log('Modules data:', modulesData);
      console.log('Intervenants data:', intervenantsData);
      console.log('Salles data:', sallesData);

      const modulesList = modulesData?.data || modulesData.modules || [];
      const intervenantsList = intervenantsData?.data || intervenantsData || [];
      const sallesList = sallesData?.data || sallesData.salles || [];

      setModules(Array.isArray(modulesList) ? modulesList : []);
      setIntervenants(Array.isArray(intervenantsList) ? intervenantsList.filter(i => i.disponible !== false) : []);
      setSalles(Array.isArray(sallesList) ? sallesList.filter(s => s.disponible !== false) : []);
    } catch (error) {
      console.error('Erreur fetch data:', error.message || error);
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.moduleId) {
      newErrors.moduleId = 'Le module est requis';
    }

    if (!formData.dateSeance) {
      newErrors.dateSeance = 'La date de la séance est requise';
    }

    if (!formData.heureDebut) {
      newErrors.heureDebut = "L'heure de début est requise";
    }

    if (!formData.heureFin) {
      newErrors.heureFin = "L'heure de fin est requise";
    }

    if (formData.heureDebut && formData.heureFin && formData.heureDebut >= formData.heureFin) {
      newErrors.heureFin = "L'heure de fin doit être postérieure à l'heure de début";
    }

    if (!formData.typeSeance) {
      newErrors.typeSeance = 'Le type de séance est requis';
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
      // Trouver le nom de la salle sélectionnée
      const selectedSalle = salles.find(s => s.id === formData.salleId);
      const salleName = selectedSalle ? selectedSalle.nom : null;

      const data = await apiClient.seances.create({
        moduleId: formData.moduleId,
        intervenantId: formData.intervenantId || null,
        salle: salleName,
        dateSeance: new Date(formData.dateSeance).toISOString(),
        heureDebut: formData.heureDebut,
        heureFin: formData.heureFin,
        typeSeance: formData.typeSeance,
        status: formData.status,
        notes: formData.description || null
      });

      onSuccess && onSuccess(data.seance || data);
      handleClose();
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors({ general: error.message || 'Erreur lors de la création de la séance' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      moduleId: '',
      intervenantId: '',
      salleId: '',
      dateSeance: '',
      heureDebut: '08:00',
      heureFin: '10:00',
      typeSeance: 'CM',
      status: 'PLANIFIE',
      description: ''
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Calculer la durée de la séance
  const calculateDuration = () => {
    if (!formData.heureDebut || !formData.heureFin) return null;

    const [startH, startM] = formData.heureDebut.split(':').map(Number);
    const [endH, endM] = formData.heureFin.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = endMinutes - startMinutes;

    if (duration <= 0) return null;

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };

  if (!isOpen) return null;

  const duration = calculateDuration();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-30"
        onClick={handleClose}
      ></div>

      {/* Modal Container */}
      <div className="fixed inset-0 z-35 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Nouvelle séance
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Erreur générale */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">{errors.general}</span>
              </div>
            )}

            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Chargement des données...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Module */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module *
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <select
                      value={formData.moduleId}
                      onChange={(e) => handleChange('moduleId', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white ${
                        errors.moduleId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Sélectionner un module...</option>
                      {modules.map(module => (
                        <option key={module.id} value={module.id}>
                          {module.code} - {module.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.moduleId && (
                    <p className="mt-1 text-xs text-red-600">{errors.moduleId}</p>
                  )}
                </div>

                {/* Type de séance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de séance *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {typeSeanceOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChange('typeSeance', option.value)}
                        className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                          formData.typeSeance === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.typeSeance && (
                    <p className="mt-1 text-xs text-red-600">{errors.typeSeance}</p>
                  )}
                </div>

                {/* Date et horaires */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Date et horaires</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          value={formData.dateSeance}
                          onChange={(e) => handleChange('dateSeance', e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                            errors.dateSeance ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.dateSeance && (
                        <p className="mt-1 text-xs text-red-600">{errors.dateSeance}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heure de début *
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="time"
                          value={formData.heureDebut}
                          onChange={(e) => handleChange('heureDebut', e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                            errors.heureDebut ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.heureDebut && (
                        <p className="mt-1 text-xs text-red-600">{errors.heureDebut}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heure de fin *
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="time"
                          value={formData.heureFin}
                          onChange={(e) => handleChange('heureFin', e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                            errors.heureFin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.heureFin && (
                        <p className="mt-1 text-xs text-red-600">{errors.heureFin}</p>
                      )}
                    </div>
                  </div>

                  {duration && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                      <span className="text-sm text-blue-700">
                        Durée de la séance : <strong>{duration}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Intervenant et Salle */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Affectations</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intervenant
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                          value={formData.intervenantId}
                          onChange={(e) => handleChange('intervenantId', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                        >
                          <option value="">Sélectionner un intervenant...</option>
                          {intervenants.map(intervenant => (
                            <option key={intervenant.id} value={intervenant.id}>
                              {intervenant.civilite} {intervenant.prenom} {intervenant.nom}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salle
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                          value={formData.salleId}
                          onChange={(e) => handleChange('salleId', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                        >
                          <option value="">Sélectionner une salle...</option>
                          {salles.map(salle => (
                            <option key={salle.id} value={salle.id}>
                              {salle.nom} {salle.capacite ? `(${salle.capacite} places)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statut */}
                <div>
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Informations supplémentaires sur la séance..."
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || loadingData}
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
                    <span>Créer la séance</span>
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

export default CreateSeanceModal;

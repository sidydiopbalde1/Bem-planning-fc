// components/modals/CreateIntervenantModal.js - Version corrigée
import { useState } from 'react';
import { X, Save, User, Mail, Phone, MapPin, GraduationCap, Building2, AlertCircle } from 'lucide-react';

const CreateIntervenantModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    civilite: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    grade: '',
    specialite: '',
    etablissement: '',
    disponible: true
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const civiliteOptions = [
    { value: 'M.', label: 'Monsieur' },
    { value: 'Mme', label: 'Madame' },
    { value: 'Dr', label: 'Docteur' },
    { value: 'Pr', label: 'Professeur' }
  ];

  const gradeOptions = [
    { value: 'Professeur', label: 'Professeur' },
    { value: 'Maître de conférences', label: 'Maître de conférences' },
    { value: 'Docteur', label: 'Docteur' },
    { value: 'Ingénieur', label: 'Ingénieur' },
    { value: 'Consultant', label: 'Consultant' },
    { value: 'Expert', label: 'Expert' },
    { value: 'Formateur', label: 'Formateur' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.civilite) {
      newErrors.civilite = 'La civilité est requise';
    }

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (formData.telephone && !/^[\d\s\-\+\(\)\.]+$/.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
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
      const response = await fetch('/api/intervenants/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess && onSuccess(data.intervenant);
        onClose();
        // Reset form
        setFormData({
          civilite: '',
          nom: '',
          prenom: '',
          email: '',
          telephone: '',
          grade: '',
          specialite: '',
          etablissement: '',
          disponible: true
        });
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.error || 'Erreur lors de la création de l\'intervenant' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Erreur de connexion. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - Fond semi-transparent */}
      // Avec effet de flou en arrière-plan
<div className="fixed inset-0 bg-grey bg-opacity-1 backdrop-blur-sm z-40" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Ajouter un nouvel intervenant
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Error général */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">{errors.general}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Informations personnelles */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informations personnelles</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Civilité *
                    </label>
                    <select
                      value={formData.civilite}
                      onChange={(e) => handleChange('civilite', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white ${
                        errors.civilite ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Sélectionner...</option>
                      {civiliteOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.civilite && (
                      <p className="mt-1 text-xs text-red-600">{errors.civilite}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => handleChange('nom', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                        errors.nom ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Nom de famille"
                    />
                    {errors.nom && (
                      <p className="mt-1 text-xs text-red-600">{errors.nom}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) => handleChange('prenom', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                        errors.prenom ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Prénom"
                    />
                    {errors.prenom && (
                      <p className="mt-1 text-xs text-red-600">{errors.prenom}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informations de contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="email@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => handleChange('telephone', e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                          errors.telephone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                    {errors.telephone && (
                      <p className="mt-1 text-xs text-red-600">{errors.telephone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations professionnelles */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informations professionnelles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <select
                        value={formData.grade}
                        onChange={(e) => handleChange('grade', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                      >
                        <option value="">Sélectionner...</option>
                        {gradeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Établissement
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.etablissement}
                        onChange={(e) => handleChange('etablissement', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder="Université, École, Entreprise..."
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spécialité
                  </label>
                  <input
                    type="text"
                    value={formData.specialite}
                    onChange={(e) => handleChange('specialite', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Ex: Marketing Digital, Intelligence Artificielle, Gestion de Projet..."
                  />
                </div>
              </div>

              {/* Disponibilité */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Statut</h4>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="disponible"
                    checked={formData.disponible}
                    onChange={(e) => handleChange('disponible', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="disponible" className="ml-2 block text-sm text-gray-900">
                    Disponible pour de nouvelles missions
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Un intervenant indisponible ne pourra pas être assigné à de nouveaux modules
                </p>
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
                disabled={loading}
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
                    <span>Créer l'intervenant</span>
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

export default CreateIntervenantModal;
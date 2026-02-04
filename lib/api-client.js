/**
 * Client API pour communiquer avec le backend NestJS
 * Utilisez ce client pour migrer progressivement les appels API
 * du frontend Next.js vers le backend NestJS
 */

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bem-planning-fc-backend-latest.onrender.com/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = null;
  }

  /**
   * Définir le token JWT pour les requêtes authentifiées
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Récupérer le token depuis le localStorage (côté client uniquement)
   */
  getStoredToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  /**
   * Headers par défaut pour les requêtes
   */
  getHeaders(customHeaders = {}) {
    const token = this.token || this.getStoredToken();
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Gestion des erreurs de réponse
   */
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Une erreur est survenue',
      }));

      // Si token expiré, nettoyer le stockage
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
      }

      throw {
        status: response.status,
        message: error.message || error.error || 'Erreur serveur',
        errors: error.errors || [],
      };
    }

    // Gérer les réponses vides (204 No Content)
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  /**
   * Requête GET
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    });

    return this.handleResponse(response);
  }

  /**
   * Requête POST
   */
  async post(endpoint, data = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * Requête PUT
   */
  async put(endpoint, data = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * Requête PATCH
   */
  async patch(endpoint, data = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  /**
   * Requête DELETE
   */
  async delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });

    return this.handleResponse(response);
  }

  /**
   * Upload de fichier
   */
  async upload(endpoint, formData) {
    const token = this.token || this.getStoredToken();
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    return this.handleResponse(response);
  }

  // ============================================
  // ENDPOINTS AUTH
  // ============================================

  auth = {
    login: (credentials) => this.post('/auth/login', credentials),
    register: (data) => this.post('/auth/register', data),
    logout: () => this.post('/auth/logout'),
    me: () => this.get('/auth/me'),
    refreshToken: () => this.post('/auth/refresh'),
  };

  // ============================================
  // ENDPOINTS USERS
  // ============================================

  users = {
    getAll: (params) => this.get('/users', params),
    getById: (id) => this.get(`/users/${id}`),
    create: (data) => this.post('/users', data),
    update: (id, data) => this.patch(`/users/${id}`, data),
    delete: (id) => this.delete(`/users/${id}`),
    getProfile: () => this.get('/users/profile'),
    updateProfile: (data) => this.patch('/users/profile', data),
  };

  // ============================================
  // ENDPOINTS USER (profil utilisateur connecté)
  // ============================================

  user = {
    getProfile: () => this.get('/user/profile'),
    updateProfile: (data) => this.patch('/user/profile', data),
    getPreferences: () => this.get('/user/preferences'),
    updatePreferences: (data) => this.patch('/user/preferences', data),
    getStats: (params) => this.get('/user/stats', params),
    exportData: () => this.get('/user/export-data'),
    deleteAccount: () => this.delete('/user/delete-account'),
  };

  // ============================================
  // ENDPOINTS PROGRAMMES
  // ============================================

  programmes = {
    getAll: (params) => this.get('/programmes', params),
    getById: (id) => this.get(`/programmes/${id}`),
    create: (data) => this.post('/programmes', data),
    update: (id, data) => this.patch(`/programmes/${id}`, data),
    delete: (id) => this.delete(`/programmes/${id}`),
    import: (formData) => this.upload('/programmes/import', formData),
    export: (params) => this.get('/programmes/export', params),
  };

  // ============================================
  // ENDPOINTS MODULES
  // ============================================

  modules = {
    getAll: (params) => this.get('/modules', params),
    getById: (id) => this.get(`/modules/${id}`),
    create: (data) => this.post('/modules', data),
    update: (id, data) => this.patch(`/modules/${id}`, data),
    delete: (id) => this.delete(`/modules/${id}`),
    getByProgramme: (programmeId) => this.get(`/modules/programme/${programmeId}`),
  };

  // ============================================
  // ENDPOINTS SEANCES
  // ============================================

  seances = {
    getAll: (params) => this.get('/seances', params),
    getById: (id) => this.get(`/seances/${id}`),
    create: (data) => this.post('/seances', data),
    update: (id, data) => this.patch(`/seances/${id}`, data),
    delete: (id) => this.delete(`/seances/${id}`),
    complete: (id, data) => this.patch(`/seances/${id}/complete`, data),
    import: (formData) => this.upload('/seances/import', formData),
    export: (params) => this.get('/seances/export', params),
  };

  // ============================================
  // ENDPOINTS INTERVENANTS
  // ============================================

  intervenants = {
    getAll: (params) => this.get('/intervenants', params),
    getById: (id) => this.get(`/intervenants/${id}`),
    create: (data) => this.post('/intervenants', data),
    update: (id, data) => this.patch(`/intervenants/${id}`, data),
    delete: (id) => this.delete(`/intervenants/${id}`),
    getMesSeances: (params) => this.get('/intervenants/mes-seances', params),
    getDisponibilite: (id) => this.get(`/intervenants/${id}/disponibilite`),
    updateDisponibilite: (id, data) => this.patch(`/intervenants/${id}/disponibilite`, data),
    import: (formData) => this.upload('/intervenants/import', formData),
    export: (params) => this.get('/intervenants/export', params),
  };

  // ============================================
  // ENDPOINTS SALLES
  // ============================================

  salles = {
    getAll: (params) => this.get('/admin/salles', params),
    getById: (id) => this.get(`/admin/salles/${id}`),
    create: (data) => this.post('/admin/salles', data),
    update: (id, data) => this.patch(`/admin/salles/${id}`, data),
    delete: (id) => this.delete(`/admin/salles/${id}`),
  };

  // ============================================
  // ENDPOINTS PLANNING
  // ============================================

  planning = {
    generate: (data) => this.post('/planning/generate', data),
    getConflicts: (params) => this.get('/planning/conflicts', params),
    resolveConflict: (id, data) => this.patch(`/planning/conflicts/${id}`, data),
  };

  // ============================================
  // ENDPOINTS ROTATIONS WEEKEND
  // ============================================

  rotationsWeekend = {
    getAll: (params) => this.get('/rotations-weekend', params),
    getById: (id) => this.get(`/rotations-weekend/${id}`),
    generate: (data) => this.post('/rotations-weekend/generate', data),
    declareAbsence: (id, data) => this.post(`/rotations-weekend/${id}/absence`, data),
    terminer: (id, data) => this.post(`/rotations-weekend/${id}/terminer`, data),
  };

  // ============================================
  // ENDPOINTS EVALUATIONS
  // ============================================

  evaluations = {
    getAll: (params) => this.get('/evaluations-enseignements', params),
    getById: (id) => this.get(`/evaluations-enseignements/${id}`),
    create: (data) => this.post('/evaluations-enseignements', data),
    update: (id, data) => this.patch(`/evaluations-enseignements/${id}`, data),
    delete: (id) => this.delete(`/evaluations-enseignements/${id}`),
    getByToken: (token) => this.get(`/evaluations-enseignements/submit/${token}`),
    submitByToken: (token, data) => this.post(`/evaluations-enseignements/submit/${token}`, data),
  };

  // ============================================
  // ENDPOINTS NOTIFICATIONS
  // ============================================

    notifications = {
      getAll: (params) => this.get('/notifications', params),

      markAsRead: (ids) =>
        this.post('/notifications/mark-read', { ids }),

      markAllAsRead: () =>
        this.post('/notifications/mark-all-read'),
    };


  // ============================================
  // ENDPOINTS COORDINATEUR
  // ============================================

  coordinateur = {
    getDashboard: () => this.get('/coordinateur/dashboard'),
    getProgrammes: (params) => this.get('/coordinateur/programmes', params),
    getModules: (params) => this.get('/coordinateur/modules', params),
    getEvaluations: (params) => this.get('/evaluations-enseignements', params),
    getAlerts: () => this.get('/coordinateur/alerts/check'),
    getWeeklyReport: () => this.get('/coordinateur/alerts/weekly-report'),
  };

  // ============================================
  // ENDPOINTS ADMIN
  // ============================================

  admin = {
    // Users
    getUsers: (params) => this.get('/users', params),
    getUserById: (id) => this.get(`/users/${id}`),
    createUser: (data) => this.post('/users', data),
    updateUser: (id, data) => this.patch(`/users/${id}`, data),
    deleteUser: (id, force = false) => this.delete(`/users/${id}${force ? '?force=true' : ''}`),

    // Périodes académiques
    getPeriodes: (params) => this.get('/periodes-academiques', params),
    getPeriodeById: (id) => this.get(`/periodes-academiques/${id}`),
    createPeriode: (data) => this.post('/periodes-academiques', data),
    updatePeriode: (id, data) => this.patch(`/periodes-academiques/${id}`, data),
    deletePeriode: (id) => this.delete(`/periodes-academiques/${id}`),
    // Salles
    getSalles: (params) => this.get('/admin/salles', params),
    getSalleById: (id) => this.get(`/admin/salles/${id}`),
    createSalle: (data) => this.post('/admin/salles', data),
    updateSalle: (id, data) => this.patch(`/admin/salles/${id}`, data),
    deleteSalle: (id) => this.delete(`/admin/salles/${id}`),

    // Logs et statistiques
    getLogs: (params) => this.get('/admin/logs', params),
    getStats: () => this.get('/admin/stats/dashboard'),
    getSallesStats: (params) => this.get('/admin/stats/salles', params),
    getIntervenantsStats: (params) => this.get('/admin/stats/intervenants', params),
    exportExcel: (params) => this.get('/admin/export/excel', params),
  };

  // ============================================
  // ENDPOINTS STATISTIQUES
  // ============================================

  statistics = {
    getAll: (params) => this.get('/statistics', params),
    getPlanningStats: (params) => this.get('/statistics/performances', params),
  };

  // ============================================
  // ENDPOINTS CALENDRIER
  // ============================================

  calendar = {
    getEvents: (params) => this.get('/calendar', params),
  };

  // ============================================
  // ENDPOINTS TABLEAUX DE BORD ACADÉMIQUES
  // ============================================

  activitesAcademiques = {
    getAll: (params) => this.get('/activites-academiques', params),
    getById: (id) => this.get(`/activites-academiques/${id}`),
    create: (data) => this.post('/activites-academiques', data),
    update: (id, data) => this.patch(`/activites-academiques/${id}`, data),
    delete: (id) => this.delete(`/activites-academiques/${id}`),
  };

  indicateursAcademiques = {
    getAll: (params) => this.get('/indicateurs-academiques', params),
    getById: (id) => this.get(`/indicateurs-academiques/${id}`),
    create: (data) => this.post('/indicateurs-academiques', data),
    update: (id, data) => this.patch(`/indicateurs-academiques/${id}`, data),
    delete: (id) => this.delete(`/indicateurs-academiques/${id}`),
  };

  resultatsEtudiants = {
    getAll: (params) => this.get('/resultats-etudiants', params),
    getById: (id) => this.get(`/resultats-etudiants/${id}`),
    create: (data) => this.post('/resultats-etudiants', data),
    update: (id, data) => this.patch(`/resultats-etudiants/${id}`, data),
    delete: (id) => this.delete(`/resultats-etudiants/${id}`),
    import: (formData) => this.upload('/resultats-etudiants/import', formData),
  };

  evaluationsEnseignements = {
    getAll: (params) => this.get('/evaluations-enseignements', params),
    getById: (id) => this.get(`/evaluations-enseignements/${id}`),
    create: (data) => this.post('/evaluations-enseignements', data),
    update: (id, data) => this.patch(`/evaluations-enseignements/${id}`, data),
    delete: (id) => this.delete(`/evaluations-enseignements/${id}`),
  };

  // ============================================
  // ENDPOINTS ÉVALUATION (public par token)
  // ============================================

  evaluation = {
    getByToken: (token) => this.get(`/evaluation/${token}`),
    submitByToken: (token, data) => this.post(`/evaluation/${token}`, data),
  };
}

// Instance singleton
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient };

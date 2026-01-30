// pages/settings/index.js - Version complète avec statistiques et i18n
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout';
import UserStats from '../../components/settings/UserStats';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  User,
  Settings as SettingsIcon,
  Shield,
  Palette,
  Bell,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Globe,
  Database,
  LogOut,
  Key
} from 'lucide-react';
import apiClient from '../../lib/api-client';

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t, language, setLanguage: setAppLanguage, availableLanguages } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // États pour le profil
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // États pour les préférences (language synced with context)
  const [preferences, setPreferences] = useState({
    language: language || 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'dd/MM/yyyy',
    notifications: {
      email: true,
      desktop: false,
      newProgramme: true,
      seanceReminder: true,
      conflictAlert: true
    },
    theme: 'light',
    defaultView: 'month'
  });

  // Sync preferences language with context language
  useEffect(() => {
    setPreferences(prev => ({ ...prev, language }));
  }, [language]);

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated' && session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || ''
      }));
      loadPreferences();
    }
  }, [status, session, router]);

  const loadPreferences = async () => {
    try {
      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }
      const data = await apiClient.user.getPreferences();
      setPreferences(prev => ({ ...prev, ...data.preferences }));
    } catch (error) {
      console.error('Erreur chargement préférences:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = { name: profileData.name };
      
      // Ajout du changement de mot de passe si fourni
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          showMessage('error', 'Les nouveaux mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }
        
        if (profileData.newPassword.length < 6) {
          showMessage('error', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
          setLoading(false);
          return;
        }

        updateData.currentPassword = profileData.currentPassword;
        updateData.newPassword = profileData.newPassword;
      }

      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }

      await apiClient.user.updateProfile(updateData);
      await update({ name: profileData.name });
      showMessage('success', 'Profil mis à jour avec succès');

      // Reset password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      showMessage('error', 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);

    try {
      // Mettre à jour la langue de l'application
      if (preferences.language !== language) {
        setAppLanguage(preferences.language);
      }

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        showMessage('success', t('settings.preferences.saveSuccess'));
      } else {
        const data = await response.json();
        showMessage('error', data.error || t('errors.serverError'));
      }
    } catch (error) {
      showMessage('error', t('errors.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/user/export-data');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planning-fc-export-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showMessage('success', 'Données exportées avec succès');
      }
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'export');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données.')) {
      return;
    }

    if (!confirm('Cette action supprimera définitivement tous vos programmes, modules et séances. Confirmer la suppression ?')) {
      return;
    }

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      });

      if (response.ok) {
        await signOut({ callbackUrl: '/auth/signin' });
      } else {
        const data = await response.json();
        showMessage('error', data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      showMessage('error', 'Erreur de connexion');
    }
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'profile', label: t('settings.tabs.profile'), icon: User },
    { id: 'preferences', label: t('settings.tabs.preferences'), icon: SettingsIcon },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security', label: t('settings.tabs.security'), icon: Shield },
    { id: 'data', label: t('settings.tabs.data'), icon: Database }
  ];

  return (
    <Layout>
      <Head>
        <title>{t('settings.title')} - Planning FC</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Message de notification */}
        {message.text && (
          <div className={`p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`text-sm ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </span>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200">
          {/* Onglets */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Onglet Profil */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.profile.title')}</h3>
                  
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.profile.fullName')}
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('settings.profile.email')}
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('settings.profile.emailNotEditable')}</p>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">{t('settings.profile.changePassword')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('settings.profile.currentPassword')}
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={profileData.currentPassword}
                              onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('settings.profile.newPassword')}
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={profileData.newPassword}
                              onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              minLength="6"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('settings.profile.confirmPassword')}
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={profileData.confirmPassword}
                              onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>Sauvegarder</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Onglet Préférences */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.preferences.title')}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.preferences.language')}
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                          value={preferences.language}
                          onChange={(e) => {
                            setPreferences(prev => ({ ...prev, language: e.target.value }));
                            // Changement immédiat de la langue
                            setAppLanguage(e.target.value);
                          }}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                          {availableLanguages.map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.preferences.timezone')}
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (UTC-5)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.preferences.dateFormat')}
                      </label>
                      <select
                        value={preferences.dateFormat}
                        onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                        <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                        <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.preferences.defaultView')}
                      </label>
                      <select
                        value={preferences.defaultView}
                        onChange={(e) => setPreferences(prev => ({ ...prev, defaultView: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="month">{t('settings.preferences.viewMonth')}</option>
                        <option value="week">{t('settings.preferences.viewWeek')}</option>
                        <option value="day">{t('settings.preferences.viewDay')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t('settings.preferences.theme')}
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="light"
                          checked={preferences.theme === 'light'}
                          onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                          className="mr-2"
                        />
                        <span className="text-sm">{t('settings.preferences.themeLight')}</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="dark"
                          checked={preferences.theme === 'dark'}
                          onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                          className="mr-2"
                        />
                        <span className="text-sm">{t('settings.preferences.themeDark')}</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="auto"
                          checked={preferences.theme === 'auto'}
                          onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                          className="mr-2"
                        />
                        <span className="text-sm">{t('settings.preferences.themeAuto')}</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      onClick={handlePreferencesUpdate}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{t('common.save')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Préférences de notification</h3>
                  
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Canaux de notification</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Notifications par email</span>
                          <input
                            type="checkbox"
                            checked={preferences.notifications.email}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, email: e.target.checked }
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Notifications de bureau</span>
                          <input
                            type="checkbox"
                            checked={preferences.notifications.desktop}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, desktop: e.target.checked }
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Types de notification</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Nouveau programme créé</span>
                          <input
                            type="checkbox"
                            checked={preferences.notifications.newProgramme}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, newProgramme: e.target.checked }
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Rappel de séance (24h avant)</span>
                          <input
                            type="checkbox"
                            checked={preferences.notifications.seanceReminder}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, seanceReminder: e.target.checked }
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Alerte de conflit d'horaires</span>
                          <input
                            type="checkbox"
                            checked={preferences.notifications.conflictAlert}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, conflictAlert: e.target.checked }
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      onClick={handlePreferencesUpdate}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>Sauvegarder</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Sécurité */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sécurité du compte</h3>
                  
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">Sessions actives</h4>
                          <p className="text-sm text-gray-600">Gérez vos sessions de connexion</p>
                        </div>
                        <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          Voir les sessions
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">Authentification à deux facteurs</h4>
                          <p className="text-sm text-gray-600">Ajoutez une couche de sécurité supplémentaire</p>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Configurer
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">Déconnexion de toutes les sessions</h4>
                          <p className="text-sm text-gray-600">Déconnectez-vous de tous les appareils</p>
                        </div>
                        <button 
                          onClick={() => signOut()}
                          className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Données */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestion des données</h3>
                  
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">Exporter mes données</h4>
                          <p className="text-sm text-gray-600">
                            Téléchargez une copie de vos programmes, modules et séances
                          </p>
                        </div>
                        <button
                          onClick={handleExportData}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>Exporter</span>
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">Statistiques d'utilisation</h4>
                          <p className="text-sm text-gray-600">Consultez vos statistiques de plateforme</p>
                        </div>
                        <button 
                          onClick={() => setShowStatsModal(true)}
                          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Voir les stats
                        </button>
                      </div>
                    </div>

                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-red-900">Supprimer mon compte</h4>
                          <p className="text-sm text-red-700">
                            Cette action est irréversible et supprimera toutes vos données
                          </p>
                        </div>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal des statistiques */}
      <UserStats 
        isOpen={showStatsModal} 
        onClose={() => setShowStatsModal(false)} 
      />
    </Layout>
  );
}
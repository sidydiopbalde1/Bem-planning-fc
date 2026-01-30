// pages/coordinateur/notifications.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/layout';
import apiClient from '../../lib/api-client';
import {
  Bell, CheckCircle, Trash2, Calendar, AlertTriangle,
  MessageSquare, FileText, Users, Clock, ExternalLink
} from 'lucide-react';
import Pagination from '../../components/ui/Pagination';

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status, filter, page]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (filter === 'non_lues') params.lu = 'false';
      if (filter === 'lues') params.lu = 'true';

      const data = await apiClient.notifications.getAll(params);
      setNotifications(data.notifications);
      setStats(data.stats);
      // Normaliser la pagination
      if (data.pagination) {
        setPagination({
          ...data.pagination,
          pages: data.pagination.pages || data.pagination.pages
        });
      }
    } catch (error) {
      setError(error.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSelectedIds([]); // Reset selection when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'MODIFICATION_PLANNING': return <Calendar className="w-5 h-5" />;
      case 'CONFLIT_DETECTE': return <AlertTriangle className="w-5 h-5" />;
      case 'MODULE_SANS_INTERVENANT': return <Users className="w-5 h-5" />;
      case 'PROGRAMME_EN_RETARD': return <Clock className="w-5 h-5" />;
      case 'MODULE_PROCHAIN': return <Calendar className="w-5 h-5" />;
      case 'EVALUATION_DISPONIBLE': return <FileText className="w-5 h-5" />;
      case 'SYSTEME': return <Bell className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'MODIFICATION_PLANNING': return 'text-blue-600 bg-blue-50';
      case 'CONFLIT_DETECTE': return 'text-red-600 bg-red-50';
      case 'MODULE_SANS_INTERVENANT': return 'text-orange-600 bg-orange-50';
      case 'PROGRAMME_EN_RETARD': return 'text-red-600 bg-red-50';
      case 'MODULE_PROCHAIN': return 'text-green-600 bg-green-50';
      case 'EVALUATION_DISPONIBLE': return 'text-purple-600 bg-purple-50';
      case 'SYSTEME': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPrioriteColor = (priorite) => {
    switch (priorite) {
      case 'URGENTE': return 'border-red-500';
      case 'HAUTE': return 'border-orange-500';
      case 'NORMALE': return 'border-blue-500';
      case 'BASSE': return 'border-gray-300';
      default: return 'border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleMarquerLues = async () => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(selectedIds.map(id => apiClient.notifications.markAsRead(id)));
      setSelectedIds([]);
      fetchNotifications();
    } catch (error) {
      alert(error.message || 'Erreur lors de la mise à jour des notifications');
    }
  };

  const handleSupprimer = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Supprimer ${selectedIds.length} notification(s) ?`)) return;

    try {
      await Promise.all(selectedIds.map(id => apiClient.delete(`/notifications/${id}`)));
      setSelectedIds([]);
      fetchNotifications();
    } catch (error) {
      alert(error.message || 'Erreur lors de la suppression des notifications');
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev =>
      prev.length === notifications.length ? [] : notifications.map(n => n.id)
    );
  };

  if (status === 'loading' || loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {stats?.nonLues > 0 ? `${stats.nonLues} notification(s) non lue(s)` : 'Toutes vos notifications sont lues'}
            </p>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMarquerLues}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marquer comme lue
              </button>
              <button
                onClick={handleSupprimer}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Toutes ({stats?.total || 0})
            </button>
            <button
              onClick={() => setFilter('non_lues')}
              className={`px-4 py-2 rounded-lg ${filter === 'non_lues' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Non lues ({stats?.unread || 0})
            </button>
            <button
              onClick={() => setFilter('lues')}
              className={`px-4 py-2 rounded-lg ${filter === 'lues' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Lues
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucune notification</p>
            </div>
          ) : (
            <div>
              {/* Select All */}
              <div className="p-4 border-b border-gray-200 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length === notifications.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="ml-3 text-sm text-gray-600">
                  {selectedIds.length > 0 ? `${selectedIds.length} sélectionnée(s)` : 'Tout sélectionner'}
                </span>
              </div>

              {/* Notifications */}
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.lu ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => toggleSelection(notification.id)}
                        className="mt-1 w-4 h-4 text-green-600 rounded"
                      />

                      <div className={`p-3 rounded-lg ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`font-medium ${!notification.lu ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.titre}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                              {notification.lienAction && (
                                <a
                                  href={notification.lienAction}
                                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                                >
                                  Voir <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              )}
                            </div>
                          </div>

                          {!notification.lu && (
                            <div className="ml-4">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <Pagination
            pagination={pagination}
            currentPage={page}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </Layout>
  );
}

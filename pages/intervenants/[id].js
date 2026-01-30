// pages/intervenants/[id].js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  BookOpen,
  Calendar,
  Clock,
  ArrowLeft,
  Edit as EditIcon,
  CheckCircle,
  XCircle
} from 'lucide-react';
import apiClient from '../../lib/api-client';

export default function IntervenantDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [intervenant, setIntervenant] = useState(null);
  const [modules, setModules] = useState([]);
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        fetchIntervenantDetails();
      }
    }
  }, [status, session, id]);

  const fetchIntervenantDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (session?.accessToken) {
        apiClient.setToken(session.accessToken);
      }

      const data = await apiClient.intervenants.getById(id);
      setIntervenant(data.intervenant || data);
      setModules(data.intervenant?.modules || data.modules || []);
      setSeances(data.intervenant?.seances || data.seances || []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Détails Intervenant">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Erreur">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!intervenant) {
    return (
      <Layout title="Intervenant introuvable">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Intervenant introuvable</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${intervenant.prenom} ${intervenant.nom}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          <button
            onClick={() => router.push(`/intervenants/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <EditIcon className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {intervenant.civilite} {intervenant.prenom} {intervenant.nom}
              </h1>
              {intervenant.grade && (
                <p className="text-gray-600 mt-1">{intervenant.grade}</p>
              )}
            </div>
            <div>
              {intervenant.disponible ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Disponible
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  <XCircle className="w-4 h-4" />
                  Indisponible
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{intervenant.email}</p>
              </div>
            </div>

            {intervenant.telephone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium">{intervenant.telephone}</p>
                </div>
              </div>
            )}

            {intervenant.specialite && (
              <div className="flex items-center gap-3 text-gray-700">
                <Award className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Spécialité</p>
                  <p className="font-medium">{intervenant.specialite}</p>
                </div>
              </div>
            )}

            {intervenant.etablissement && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Établissement</p>
                  <p className="font-medium">{intervenant.etablissement}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modules assignés */}
        {modules.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Modules assignés ({modules.length})
            </h2>
            <div className="space-y-3">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {module.code} - {module.name}
                      </h3>
                      {module.programme && (
                        <p className="text-sm text-gray-600 mt-1">
                          Programme: {module.programme.code} - {module.programme.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Volume horaire</p>
                      <p className="text-lg font-bold text-blue-600">{module.vht}h</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                    <span>CM: {module.cm}h</span>
                    <span>TD: {module.td}h</span>
                    <span>TP: {module.tp}h</span>
                    <span>TPE: {module.tpe}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Séances récentes */}
        {seances.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Séances ({seances.length})
            </h2>
            <div className="space-y-3">
              {seances.slice(0, 10).map((seance) => (
                <div
                  key={seance.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {seance.module?.code} - {seance.typeSeance}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(seance.dateSeance).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {seance.heureDebut} - {seance.heureFin}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        seance.status === 'TERMINE'
                          ? 'bg-green-100 text-green-800'
                          : seance.status === 'EN_COURS'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {seance.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

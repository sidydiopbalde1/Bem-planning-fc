// pages/rotations-weekend/[id].js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';
import ConfirmModal from '../../components/modals/ConfirmModal';
import apiClient from '../../lib/api-client';
import {
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Save,
  UserX
} from 'lucide-react';

export default function RotationDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [rotation, setRotation] = useState(null);
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRapportModal, setShowRapportModal] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);

  const [rapportForm, setRapportForm] = useState({
    heureArrivee: '',
    heureDepart: '',
    nbSeancesVisitees: 0,
    incidents: '',
    observations: '',
    recommandations: '',
    satisfaction: 3
  });

  const [absenceForm, setAbsenceForm] = useState({
    raison: ''
  });
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      // Seuls ADMIN et COORDINATOR peuvent accéder
      if (!['ADMIN', 'COORDINATOR'].includes(session?.user?.role)) {
        router.push('/dashboard');
        return;
      }
      if (id) {
        fetchRotation();
      }
    }
  }, [status, session, router, id]);

  const fetchRotation = async () => {
    try {
      setLoading(true);
      const data = await apiClient.rotationsWeekend.getById(id);
      // Le backend peut retourner directement la rotation ou { rotation, seances }
      const rotationData = data.rotation || data;
      setRotation(rotationData);
      setSeances(data.seances || []);
      setRapportForm(prev => ({
        ...prev,
        nbSeancesVisitees: (data.seances || []).length
      }));
    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRapport = async () => {
    try {
      await apiClient.rotationsWeekend.terminer(id, rapportForm);
      setShowRapportModal(false);
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Rapport enregistré',
        message: 'Le rapport de supervision a été enregistré avec succès !'
      });
      fetchRotation();
    } catch (error) {
      console.error('Erreur:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Erreur lors de l\'enregistrement'
      });
    }
  };

  const handleDeclareAbsence = async () => {
    if (!absenceForm.raison.trim()) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'Champ requis',
        message: 'Veuillez indiquer une raison pour votre absence.'
      });
      return;
    }

    try {
      const data = await apiClient.rotationsWeekend.declareAbsence(id, { raison: absenceForm.raison });
      const remplacant = data.responsable?.name || 'un remplaçant';
      setShowAbsenceModal(false);
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'Absence déclarée',
        message: `Votre absence a été déclarée. Remplaçant : ${remplacant}`,
        onConfirm: () => router.push('/rotations-weekend')
      });
    } catch (error) {
      console.error('Erreur:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: error.message || 'Erreur lors de la déclaration'
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  if (!rotation) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900">Rotation introuvable</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Rotation ${new Date(rotation.dateDebut).toLocaleDateString()}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Rotation du {new Date(rotation.dateDebut).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h1>
              <p className="text-gray-600">Semaine {rotation.semaineNumero}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {rotation.status === 'PLANIFIE' && (
              <button
                onClick={() => setShowAbsenceModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                <UserX className="w-4 h-4" />
                Déclarer Absence
              </button>
            )}
            {(rotation.status === 'EN_COURS' || rotation.status === 'CONFIRME') && (
              <button
                onClick={() => setShowRapportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <FileText className="w-4 h-4" />
                Clôturer avec Rapport
              </button>
            )}
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Responsable</p>
                <p className="text-lg font-semibold text-gray-900">{rotation.responsable.name}</p>
                <p className="text-sm text-gray-500">{rotation.responsable.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <p className={`text-lg font-semibold ${
                  rotation.status === 'TERMINE' ? 'text-green-600' :
                  rotation.status === 'ABSENT' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {rotation.status}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Séances</p>
                <p className="text-lg font-semibold text-gray-900">
                  {rotation.nbSeancesRealisees} / {rotation.nbSeancesTotal}
                </p>
                <p className="text-sm text-gray-500">supervisées</p>
              </div>
            </div>
          </div>
        </div>

        {/* Substitut si absence */}
        {rotation.substitut && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Remplacement</p>
                <p className="text-sm text-yellow-800">
                  Remplacé par <strong>{rotation.substitut.name}</strong>
                </p>
                {rotation.commentaire && (
                  <p className="text-sm text-yellow-700 mt-1">Raison: {rotation.commentaire}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Liste des séances */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Séances du Weekend ({seances.length})
            </h2>
          </div>
          <div className="p-6">
            {seances.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune séance prévue ce weekend</p>
            ) : (
              <div className="space-y-4">
                {seances.map((seance) => (
                  <div
                    key={seance.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-4">
                      <Clock className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {seance.module.code} - {seance.module.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(seance.dateSeance).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {seance.heureDebut} - {seance.heureFin} • {seance.salle || 'Salle non définie'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Intervenant: {seance.intervenant.prenom} {seance.intervenant.nom}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      seance.status === 'TERMINE' ? 'bg-green-100 text-green-800' :
                      seance.status === 'EN_COURS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {seance.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rapport de supervision si existe */}
        {rotation.rapportSupervision && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Rapport de Supervision
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Heures de présence</p>
                <p className="text-gray-900">
                  {rotation.rapportSupervision.heureArrivee} - {rotation.rapportSupervision.heureDepart}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Séances visitées</p>
                <p className="text-gray-900">{rotation.rapportSupervision.nbSeancesVisitees}</p>
              </div>
              {rotation.rapportSupervision.incidents && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Incidents</p>
                  <p className="text-gray-900">{rotation.rapportSupervision.incidents}</p>
                </div>
              )}
              {rotation.rapportSupervision.observations && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Observations</p>
                  <p className="text-gray-900">{rotation.rapportSupervision.observations}</p>
                </div>
              )}
              {rotation.rapportSupervision.satisfaction && (
                <div>
                  <p className="text-sm text-gray-600">Satisfaction</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {rotation.rapportSupervision.satisfaction}/5
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Rapport */}
      {showRapportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Rapport de Supervision
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure d'arrivée
                  </label>
                  <input
                    type="time"
                    value={rapportForm.heureArrivee}
                    onChange={(e) => setRapportForm({ ...rapportForm, heureArrivee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de départ
                  </label>
                  <input
                    type="time"
                    value={rapportForm.heureDepart}
                    onChange={(e) => setRapportForm({ ...rapportForm, heureDepart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de séances visitées
                </label>
                <input
                  type="number"
                  value={rapportForm.nbSeancesVisitees}
                  onChange={(e) => setRapportForm({ ...rapportForm, nbSeancesVisitees: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  min="0"
                  max={seances.length}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incidents
                </label>
                <textarea
                  value={rapportForm.incidents}
                  onChange={(e) => setRapportForm({ ...rapportForm, incidents: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  rows="3"
                  placeholder="Décrire les incidents éventuels..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observations
                </label>
                <textarea
                  value={rapportForm.observations}
                  onChange={(e) => setRapportForm({ ...rapportForm, observations: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  rows="3"
                  placeholder="Observations générales..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satisfaction (1-5)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={rapportForm.satisfaction}
                  onChange={(e) => setRapportForm({ ...rapportForm, satisfaction: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>1</span>
                  <span className="text-lg font-bold text-gray-900">{rapportForm.satisfaction}</span>
                  <span>5</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRapportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRapport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Absence */}
      {showAbsenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Déclarer une Absence
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Un remplaçant sera automatiquement assigné pour ce weekend.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raison de l'absence *
              </label>
              <textarea
                value={absenceForm.raison}
                onChange={(e) => setAbsenceForm({ ...absenceForm, raison: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                rows="3"
                placeholder="Maladie, urgence familiale, etc."
                required
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAbsenceModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeclareAbsence}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <UserX className="w-4 h-4" />
                Confirmer l'Absence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'alerte/notification */}
      <ConfirmModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={alertModal.onConfirm}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="OK"
        showCancel={false}
      />
    </Layout>
  );
}

// pages/evaluation/[token].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Star, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function EvaluationPage() {
  const router = useRouter();
  const { token } = router.query;

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [noteQualiteCours, setNoteQualiteCours] = useState(0);
  const [noteQualitePedagogie, setNoteQualitePedagogie] = useState(0);
  const [noteDisponibilite, setNoteDisponibilite] = useState(0);
  const [commentaires, setCommentaires] = useState('');

  // Hover states for star ratings
  const [hoverCours, setHoverCours] = useState(0);
  const [hoverPedagogie, setHoverPedagogie] = useState(0);
  const [hoverDisponibilite, setHoverDisponibilite] = useState(0);

  useEffect(() => {
    if (token) {
      fetchEvaluation();
    }
  }, [token]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/evaluation/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement de l\'évaluation');
      }

      setEvaluation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate at least one rating is provided
    if (noteQualiteCours === 0 && noteQualitePedagogie === 0 && noteDisponibilite === 0) {
      setError('Veuillez donner au moins une note');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/evaluation/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          noteQualiteCours: noteQualiteCours || null,
          noteQualitePedagogie: noteQualitePedagogie || null,
          noteDisponibilite: noteDisponibilite || null,
          commentaires
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, hover, onHover, label }) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => onHover(star)}
              onMouseLeave={() => onHover(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= (hover || value)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                } transition-colors`}
              />
            </button>
          ))}
          {value > 0 && (
            <span className="ml-2 text-sm text-gray-600 self-center">
              {value}/5
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de l'évaluation...</p>
        </div>
      </div>
    );
  }

  if (error && !evaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Évaluation non disponible
          </h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <p className="text-sm text-gray-500 text-center">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre coordinateur.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Merci pour votre évaluation !
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Votre évaluation a été enregistrée avec succès. Vos commentaires nous aident à améliorer
            la qualité de nos enseignements.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 text-center">
              Vous pouvez maintenant fermer cette page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Évaluation d'enseignement - BEM Planning FC</title>
        <meta name="description" content="Évaluez la qualité de l'enseignement" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-t-lg shadow-xl p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Évaluation d'enseignement
            </h1>
            <div className="space-y-1 text-gray-600">
              <p>
                <span className="font-semibold">Programme:</span>{' '}
                {evaluation?.module?.programme?.name} ({evaluation?.module?.programme?.code})
              </p>
              <p>
                <span className="font-semibold">Module:</span>{' '}
                {evaluation?.module?.name} ({evaluation?.module?.code})
              </p>
              <p>
                <span className="font-semibold">Intervenant:</span>{' '}
                {evaluation?.intervenant?.civilite} {evaluation?.intervenant?.prenom}{' '}
                {evaluation?.intervenant?.nom}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-b-lg shadow-xl p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Introduction */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Vos réponses sont anonymes et confidentielles. Elles seront utilisées uniquement
                  pour améliorer la qualité de nos enseignements. Veuillez évaluer les aspects
                  suivants sur une échelle de 1 à 5 étoiles.
                </p>
              </div>

              {/* Quality of Course */}
              <StarRating
                label="Qualité du cours (contenu, organisation, clarté)"
                value={noteQualiteCours}
                onChange={setNoteQualiteCours}
                hover={hoverCours}
                onHover={setHoverCours}
              />

              {/* Teaching Quality */}
              <StarRating
                label="Qualité pédagogique (méthodes d'enseignement, supports, exemples)"
                value={noteQualitePedagogie}
                onChange={setNoteQualitePedagogie}
                hover={hoverPedagogie}
                onHover={setHoverPedagogie}
              />

              {/* Availability */}
              <StarRating
                label="Disponibilité de l'intervenant (réponses aux questions, accompagnement)"
                value={noteDisponibilite}
                onChange={setNoteDisponibilite}
                hover={hoverDisponibilite}
                onHover={setHoverDisponibilite}
              />

              {/* Comments */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Commentaires additionnels (optionnel)
                </label>
                <textarea
                  value={commentaires}
                  onChange={(e) => setCommentaires(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Partagez vos suggestions ou commentaires pour améliorer ce cours..."
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Soumettre l\'évaluation'
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              BEM Planning FC - Système de gestion de planning et d'évaluation
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

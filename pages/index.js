import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  Shield,
  Clock,
  BarChart3,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
          <p className="mt-4 text-red-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Head>
        <title>BEM Planning FC - Gestion Intelligente de Formation Continue</title>
        <meta name="description" content="Plateforme de gestion et d'optimisation des plannings de formation continue" />
      </Head>

      {/* Hero Section avec image de fond */}
      <div className="relative min-h-screen">
        {/* Image de fond avec overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(185, 28, 28, 0.85) 50%, rgba(127, 29, 29, 0.90) 100%), url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`,
            backgroundSize: 'cover, 60px 60px',
            backgroundPosition: 'center, center',
          }}
        />

        {/* Navbar */}
        <nav className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-xl shadow-lg">
                <BookOpen className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">BEM Planning FC</h1>
                <p className="text-xs text-red-100">Formation Continue</p>
              </div>
            </div>
            <Link
              href="/auth/signin"
              className="hidden sm:flex items-center space-x-2 px-6 py-2.5 bg-white text-red-600 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <span>Se Connecter</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] text-center">

            {/* Badge */}
            <div className="mb-6 inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Shield className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">Plateforme Sécurisée</span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              Gestion Intelligente
              <span className="block mt-2 text-red-100">de Formation Continue</span>
            </h1>

            {/* Description */}
            <p className="text-xl sm:text-2xl text-red-50 max-w-3xl mb-8 leading-relaxed">
              Optimisez vos plannings, détectez les conflits automatiquement et gérez vos ressources pédagogiques en toute simplicité.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-10 max-w-2xl w-full">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-red-100 text-sm">Automatisé</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">0</div>
                <div className="text-red-100 text-sm">Conflit</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-red-100 text-sm">Accessible</div>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/auth/signin"
              className="group inline-flex items-center space-x-3 px-8 py-4 bg-white text-red-600 font-bold rounded-xl shadow-2xl hover:shadow-red-900/50 hover:scale-105 transition-all duration-300 text-lg"
            >
              <span>Accéder à la Plateforme</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Features Pills */}
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <CheckCircle className="h-4 w-4 text-white" />
                <span className="text-white text-sm">Détection de conflits</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <CheckCircle className="h-4 w-4 text-white" />
                <span className="text-white text-sm">Suggestion intelligente</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <CheckCircle className="h-4 w-4 text-white" />
                <span className="text-white text-sm">Statistiques temps réel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-red-100 px-4 py-2 rounded-full mb-4">
              <span className="text-red-600 font-semibold text-sm uppercase tracking-wide">Fonctionnalités</span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une solution complète pour gérer efficacement vos programmes de formation continue
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Feature 1 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-red-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Gestion des Programmes
              </h3>
              <p className="text-gray-600">
                Créez et gérez vos maquettes pédagogiques avec modules, volumes horaires et crédits ECTS.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-red-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Planning Automatique
              </h3>
              <p className="text-gray-600">
                Génération intelligente de planning avec détection automatique des conflits horaires.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-red-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Gestion Intervenants
              </h3>
              <p className="text-gray-600">
                Gérez les disponibilités, contraintes horaires et assignations de vos enseignants.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-red-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Statistiques Avancées
              </h3>
              <p className="text-gray-600">
                Tableaux de bord complets avec KPIs, analyses et rapports détaillés en temps réel.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-red-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Suivi en Temps Réel
              </h3>
              <p className="text-gray-600">
                Suivez la progression de vos formations avec des alertes et notifications automatiques.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-red-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Suggestion de Créneaux
              </h3>
              <p className="text-gray-600">
                Algorithme intelligent qui propose les meilleurs créneaux selon vos contraintes.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-red-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Sécurité Renforcée
              </h3>
              <p className="text-gray-600">
                Authentification sécurisée, gestion des rôles et audit log complet de toutes les actions.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="bg-red-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Détection Conflits
              </h3>
              <p className="text-gray-600">
                Détection automatique et résolution assistée des conflits d'intervenants et de salles.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(220, 38, 38, 0.97) 0%, rgba(127, 29, 29, 0.95) 100%)`,
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            Prêt à Optimiser Vos Plannings ?
          </h2>
          <p className="text-xl text-red-100 mb-10 max-w-2xl mx-auto">
            Rejoignez la plateforme BEM Planning FC et simplifiez la gestion de vos formations continues.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center space-x-3 px-10 py-5 bg-white text-red-600 font-bold rounded-xl shadow-2xl hover:scale-105 transition-all duration-300 text-lg"
          >
            <span>Se Connecter Maintenant</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">

            {/* Colonne 1 */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-red-600 p-2 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-white font-bold text-lg">BEM Planning FC</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Plateforme de gestion et d'optimisation des plannings de formation continue.
              </p>
            </div>

            {/* Colonne 2 */}
            <div>
              <h3 className="text-white font-semibold mb-4">Fonctionnalités</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Gestion des programmes</li>
                <li>Planning automatique</li>
                <li>Statistiques avancées</li>
                <li>Détection de conflits</li>
              </ul>
            </div>

            {/* Colonne 3 */}
            <div>
              <h3 className="text-white font-semibold mb-4">À Propos</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Mémoire Licence 3 Informatique</li>
                <li>Année Académique 2024-2025</li>
                <li>Architecture Next.js + Prisma</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-gray-500 text-sm">
              © 2024-2025 BEM Planning FC. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

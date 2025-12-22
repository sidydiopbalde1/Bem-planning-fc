import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import {
  Calendar,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  ChevronDown,
  BarChart3,
  ClipboardCheck,
  GraduationCap,
  Award,
  FileText,
  ShieldCheck,
  Layers,
  Bell,
  Star
} from 'lucide-react';

export default function Layout({ children, title = "Planning FC" }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [coordinationOpen, setCoordinationOpen] = useState(true);
  const [outilsOpen, setOutilsOpen] = useState(true);
  const [tableauxBordOpen, setTableauxBordOpen] = useState(true);
  const [administrationOpen, setAdministrationOpen] = useState(true);
  const [parametresOpen, setParametresOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  // Fetch notifications count
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotificationsCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotificationsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchNotificationsCount = async () => {
    try {
      const response = await fetch('/api/coordinateur/notifications?lu=false&limit=1');
      if (response.ok) {
        const data = await response.json();
        setNotificationsCount(data.stats.nonLues || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications count:', error);
    }
  };

  // Menu coordinateur (visible pour coordinateurs et admins) - AFFICHÉ EN PREMIER
  const coordinateurNavigation = ['COORDINATOR', 'ADMIN'].includes(session?.user?.role) ? [
    { name: 'Tableau de Bord', href: '/coordinateur/dashboard', icon: Home },
    { name: 'Mes Programmes', href: '/coordinateur/programmes', icon: BookOpen },
    { name: 'Gestion des Modules', href: '/coordinateur/modules', icon: Layers },
    { name: 'Rotations Weekend', href: '/rotations-weekend', icon: Calendar },
    { name: 'Campagnes d\'Évaluation', href: '/coordinateur/evaluations', icon: Star },
    { name: 'Notifications', href: '/coordinateur/notifications', icon: Bell, badge: notificationsCount },
  ] : [];

  // Navigation principale (outils communs)
  const navigationAll = [
    { name: 'Calendrier', href: '/calendar', icon: Calendar },
    { name: 'Programmes', href: '/programmes', icon: BookOpen },
    { name: 'Intervenants', href: '/intervenants', icon: Users, roles: ['ADMIN', 'COORDINATOR'] }, // Masqué pour TEACHER
    { name: 'Statistiques', href: '/statistics', icon: BarChart3 },
  ];

  // Filtrer la navigation selon le rôle de l'utilisateur
  const navigation = navigationAll.filter(item => {
    if (!item.roles) return true; // Pas de restriction de rôle
    return item.roles.includes(session?.user?.role);
  });

  // Paramètres (affiché en dernier)
  const settingsNavigation = [
    { name: 'Paramètres', href: '/settings', icon: Settings }
  ];

  // Menu administrateur (visible uniquement pour les admins) - FUSIONNÉ
  const adminNavigation = session?.user?.role === 'ADMIN' ? [
    { name: 'Utilisateurs', href: '/admin/users', icon: ShieldCheck },
    { name: 'Salles & Espaces', href: '/admin/salles', icon: Layers },
    { name: 'Périodes Académiques', href: '/admin/periodes', icon: Calendar },
    { name: 'Journal d\'Activités', href: '/admin/logs', icon: FileText },
    { name: 'Rapports', href: '/admin/rapports', icon: BarChart3 },
  ] : [];

  const tableauxBordNav = [
    {
      name: 'Échéances Académiques',
      href: '/tableaux-bord/echeances-academiques',
      icon: ClipboardCheck,
      description: 'Suivi des activités et indicateurs'
    },
    {
      name: 'Maquette Pédagogique',
      href: '/tableaux-bord/maquette-pedagogique',
      icon: GraduationCap,
      description: 'Modules et résultats étudiants'
    },
    {
      name: 'Résultats Étudiants',
      href: '/resultats-etudiants',
      icon: FileText,
      description: 'Consultation des résultats académiques'
    },
    {
      name: 'Tableau de Bord Qualité',
      href: '/tableaux-bord/qualite',
      icon: Award,
      description: 'Indicateurs de qualité'
    }
  ];

  const isActive = (href) => {
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-50" 
            onClick={() => setSidebarOpen(false)} 
          />
        </div>
      )}

      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Logo/Header */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-red-400 to-red-700 flex-shrink-0">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-black" />
              </div>
              <span className="text-black text-xl font-bold">BEM Planning FC</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-blue-200 transition-colors p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation*/}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {/* Section Coordinateur (visible pour coordinateurs et admins) - PRIORITÉ 1 */}
            {coordinateurNavigation.length > 0 && (
              <>
                <button
                  onClick={() => setCoordinationOpen(!coordinationOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                >
                  <span>Coordination</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${
                    coordinationOpen ? 'rotate-180' : ''
                  }`} />
                </button>
                {coordinationOpen && (
                  <div className="space-y-1 mt-2">
                    {coordinateurNavigation.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                            active
                              ? 'bg-green-50 text-green-700 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className={`mr-3 h-5 w-5 transition-colors ${
                            active ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
                          }`} />
                          <span className="flex-1">{item.name}</span>
                          {item.badge > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                          {active && !item.badge && (
                            <div className="ml-auto w-2 h-2 bg-green-600 rounded-full"></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Navigation principale (outils communs) - PRIORITÉ 2 */}
            <div className={coordinateurNavigation.length > 0 ? "mt-6 pt-6 border-t border-gray-200" : ""}>
              <button
                onClick={() => setOutilsOpen(!outilsOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                <span>Outils</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  outilsOpen ? 'rotate-180' : ''
                }`} />
              </button>
              {outilsOpen && (
                <div className="space-y-1 mt-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className={`mr-3 h-5 w-5 transition-colors ${
                          active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`} />
                        {item.name}
                        {active && (
                          <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section Administration (visible uniquement pour les admins) - PRIORITÉ 4 */}
            {adminNavigation.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setAdministrationOpen(!administrationOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                >
                  <span>Administration</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${
                    administrationOpen ? 'rotate-180' : ''
                  }`} />
                </button>
                {administrationOpen && (
                  <div className="space-y-1 mt-2">
                    {adminNavigation.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                            active
                              ? 'bg-purple-50 text-purple-700 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className={`mr-3 h-5 w-5 transition-colors ${
                            active ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'
                          }`} />
                          {item.name}
                          {active && (
                            <div className="ml-auto w-2 h-2 bg-purple-600 rounded-full"></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tableaux de Bord Section - PRIORITÉ 3 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setTableauxBordOpen(!tableauxBordOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                <span>Tableaux de Bord</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  tableauxBordOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {tableauxBordOpen && (
                <div className="mt-2 space-y-1">
                  {tableauxBordNav.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-start px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                          active ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="truncate">{item.name}</span>
                            {active && (
                              <div className="ml-2 w-2 h-2 bg-red-600 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section Paramètres - PRIORITÉ 5 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setParametresOpen(!parametresOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                <span>Paramètres</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  parametresOpen ? 'rotate-180' : ''
                }`} />
              </button>
              {parametresOpen && (
                <div className="space-y-1 mt-2">
                  {settingsNavigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-gray-100 text-gray-900 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className={`mr-3 h-5 w-5 transition-colors ${
                          active ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'
                        }`} />
                        {item.name}
                        {active && (
                          <div className="ml-auto w-2 h-2 bg-gray-900 rounded-full"></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* User Section - fixed at bottom */}
          {session && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
              <div className="p-4">
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-semibold">
                          {session.user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setSidebarOpen(false);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        Mon Profil
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setSidebarOpen(false);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2 text-gray-400" />
                        Paramètres
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleSignOut();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          {/* Top header */}
          <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-600 hover:text-gray-900 mr-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
                
                {/* Breadcrumb */}
                <nav className="hidden sm:flex space-x-2 text-sm">
                  <span className="text-gray-500">BEM Planning</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-900 font-medium">
                    {[...coordinateurNavigation, ...navigation, ...adminNavigation, ...tableauxBordNav, ...settingsNavigation]
                      .find(item => isActive(item.href))?.name || 'Tableau de Bord'}
                  </span>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Notification bell for mobile/desktop */}
                {['COORDINATOR', 'ADMIN'].includes(session?.user?.role) && (
                  <Link href="/coordinateur/notifications">
                    <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <Bell className="h-5 w-5" />
                      {notificationsCount > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full transform translate-x-1/4 -translate-y-1/4">
                          {notificationsCount > 99 ? '99+' : notificationsCount}
                        </span>
                      )}
                    </button>
                  </Link>
                )}
                <div className="hidden sm:block text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                  {new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </div>
              </div>
            </div>
          </header>

          {/* Page content - scrollable */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
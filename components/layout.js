import { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';

export default function Layout({ children, title = "Planning FC" }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Tableau de Bord', href: '/dashboard/dashboard', icon: Home },
    { name: 'Programmes', href: '/programmes', icon: BookOpen },
    { name: 'Calendrier', href: '/calendar', icon: Calendar },
    { name: 'Intervenants', href: '/intervenants', icon: Users },
    { name: 'Paramètres', href: '/settings', icon: Settings },
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
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
            <Link href="/dashboard/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-white text-xl font-bold">Planning FC</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-blue-200 transition-colors p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation - takes up available space */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
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
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
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
                  <span className="text-gray-500">Planning FC</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-900 font-medium">
                    {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                  </span>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
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
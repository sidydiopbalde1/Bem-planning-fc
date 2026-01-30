import { useState, useEffect, useRef, Children, cloneElement } from 'react';
import AnimatedPagination, { PaginationInfo } from './AnimatedPagination';

/**
 * AnimatedTable - Wrapper pour tableaux avec animations lors de la pagination
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu du tableau (thead, tbody)
 * @param {Array} props.data - Donnees a afficher
 * @param {Object} props.pagination - Objet pagination du backend
 * @param {number} props.currentPage - Page actuelle
 * @param {Function} props.onPageChange - Callback changement de page
 * @param {boolean} props.loading - Etat de chargement
 * @param {string} props.emptyMessage - Message si pas de donnees
 * @param {React.ReactNode} props.emptyIcon - Icone si pas de donnees
 */
export default function AnimatedTable({
  children,
  data = [],
  pagination,
  currentPage,
  onPageChange,
  loading = false,
  emptyMessage = 'Aucune donnee trouvee',
  emptyIcon,
  className = ''
}) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState('next');
  const [displayData, setDisplayData] = useState(data);
  const prevPageRef = useRef(currentPage);
  const tableRef = useRef(null);

  // Gerer la transition lors du changement de page
  useEffect(() => {
    if (prevPageRef.current !== currentPage && data.length > 0) {
      setDirection(currentPage > prevPageRef.current ? 'next' : 'prev');
      setIsTransitioning(true);

      // Attendre la fin de l'animation de sortie
      const exitTimer = setTimeout(() => {
        setDisplayData(data);
        setIsTransitioning(false);
      }, 200);

      prevPageRef.current = currentPage;
      return () => clearTimeout(exitTimer);
    } else {
      setDisplayData(data);
    }
  }, [currentPage, data]);

  // Scroll vers le haut lors du changement de page
  const handlePageChange = (newPage) => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onPageChange(newPage);
  };

  return (
    <div ref={tableRef} className={`relative ${className}`}>
      {/* Overlay de chargement */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-ping border-t-blue-400 opacity-30" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Chargement...</span>
          </div>
        </div>
      )}

      {/* Container du tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {displayData.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            {emptyIcon && (
              <div className="text-gray-300 dark:text-gray-600 mb-4 animate-bounce-slow">
                {emptyIcon}
              </div>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-center">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {children}
              <AnimatedTableBody
                data={displayData}
                isTransitioning={isTransitioning}
                direction={direction}
              />
            </table>
          </div>
        )}

        {/* Pagination */}
        <AnimatedPagination
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          className="border-t border-gray-200 dark:border-gray-700"
        />
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * AnimatedTableBody - Corps du tableau avec animations par ligne
 */
function AnimatedTableBody({ data, isTransitioning, direction, renderRow }) {
  return null; // Le tbody est gere par les enfants
}

/**
 * AnimatedTableRow - Ligne de tableau animee
 */
export function AnimatedTableRow({
  children,
  index = 0,
  isNew = false,
  onClick,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 30);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <tr
      onClick={onClick}
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 -translate-x-4'
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${isNew ? 'bg-green-50 dark:bg-green-900/20' : ''}
        hover:bg-gray-50 dark:hover:bg-gray-700/50
        ${className}
      `}
      style={{
        transitionDelay: `${index * 30}ms`
      }}
    >
      {children}
    </tr>
  );
}

/**
 * TableTransition - Wrapper pour animer le contenu du tableau
 */
export function TableTransition({
  children,
  isChanging,
  direction = 'next'
}) {
  const getAnimationClass = () => {
    if (!isChanging) return 'opacity-100 translate-x-0';

    return direction === 'next'
      ? 'opacity-0 -translate-x-8'
      : 'opacity-0 translate-x-8';
  };

  return (
    <div className={`transform transition-all duration-200 ease-out ${getAnimationClass()}`}>
      {children}
    </div>
  );
}

/**
 * PaginatedTableWrapper - Wrapper complet avec header, table et pagination
 */
export function PaginatedTableWrapper({
  title,
  subtitle,
  actions,
  children,
  pagination,
  currentPage,
  onPageChange,
  loading,
  className = ''
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-3">
              {pagination && <PaginationInfo pagination={pagination} currentPage={currentPage} />}
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-3 border-blue-200 rounded-full animate-spin border-t-blue-600" />
              <span className="text-gray-600 dark:text-gray-400">Chargement...</span>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {children}

          {/* Pagination */}
          <AnimatedPagination
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * useTableAnimation - Hook pour gerer les animations de tableau
 */
export function useTableAnimation(data, currentPage) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('next');
  const prevPageRef = useRef(currentPage);

  // Detecter le changement de page pour l'animation
  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      setAnimationDirection(currentPage > prevPageRef.current ? 'next' : 'prev');
      setIsAnimating(true);

      // Desactiver l'animation apres un court delai
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);

      prevPageRef.current = currentPage;
      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  return {
    // Toujours utiliser les donnees fraiches directement
    animatedData: data,
    isAnimating,
    animationDirection,
    getRowAnimation: (index) => ({
      style: {
        transitionDelay: `${index * 40}ms`,
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating
          ? `translateX(${animationDirection === 'next' ? '-20px' : '20px'})`
          : 'translateX(0)',
      },
      className: 'transition-all duration-300 ease-out'
    })
  };
}

import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * AnimatedPagination - Composant de pagination simple et propre
 *
 * Structure des donnees backend attendue:
 * {
 *   page: number,      // Page actuelle
 *   limit: number,     // Nombre d'elements par page
 *   total: number,     // Nombre total d'elements
 *   pages: number      // Nombre total de pages (ou totalPages)
 * }
 *
 * @param {Object} props
 * @param {Object} props.pagination - Objet pagination du backend
 * @param {number} props.currentPage - Page actuelle
 * @param {Function} props.onPageChange - Callback lors du changement de page
 * @param {string} props.className - Classes CSS additionnelles
 */
export default function AnimatedPagination({
  pagination,
  currentPage,
  onPageChange,
  className = ''
}) {
  if (!pagination) {
    return null;
  }

  const limit = pagination.limit || 10;
  const total = pagination.total || 0;
  const totalPages = pagination.pages || pagination.totalPages || 1;
  const page = currentPage || pagination.page || 1;

  // Ne pas afficher si pas de donnees ou une seule page
  if (total <= 0) {
    return null;
  }

  const startItem = ((page - 1) * limit) + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Vue Mobile */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Precedent
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Suivant
        </button>
      </div>

      {/* Vue Desktop */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Affichage <span className="font-medium">{startItem}</span> a{' '}
            <span className="font-medium">{endItem}</span> sur{' '}
            <span className="font-medium">{total}</span> resultats
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {page} sur {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

/**
 * PaginationInfo - Composant d'info standalone
 */
export function PaginationInfo({ pagination, currentPage }) {
  if (!pagination) return null;

  const { limit = 10, total, pages: totalPages } = pagination;
  const page = currentPage || pagination.page || 1;
  const startItem = ((page - 1) * limit) + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      Affichage <span className="font-medium">{startItem}</span> a{' '}
      <span className="font-medium">{endItem}</span> sur{' '}
      <span className="font-medium">{total}</span> resultats
      {' - '}
      <span className="font-medium">Page {page}/{totalPages}</span>
    </div>
  );
}

/**
 * MiniPagination - Version compacte pour espaces restreints
 */
export function MiniPagination({ pagination, currentPage, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;

  const { pages: totalPages } = pagination;
  const page = currentPage || pagination.page || 1;

  return (
    <div className="inline-flex rounded-md shadow-sm -space-x-px">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="relative inline-flex items-center px-2 py-1 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="relative inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="relative inline-flex items-center px-2 py-1 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

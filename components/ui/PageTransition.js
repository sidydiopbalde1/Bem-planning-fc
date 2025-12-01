import { useEffect, useState } from 'react';

/**
 * PageTransition - Composant pour des transitions de page fluides et intuitives
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu de la page
 * @param {string} props.variant - Type d'animation ('fade', 'slide-up', 'slide-right', 'scale')
 * @param {number} props.delay - Délai avant l'animation (ms)
 * @param {number} props.duration - Durée de l'animation (ms)
 */
export default function PageTransition({
  children,
  variant = 'fade-slide-up',
  delay = 0,
  duration = 500,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const variants = {
    'fade': {
      initial: 'opacity-0',
      animate: 'opacity-100',
    },
    'fade-slide-up': {
      initial: 'opacity-0 translate-y-8',
      animate: 'opacity-100 translate-y-0',
    },
    'fade-slide-down': {
      initial: 'opacity-0 -translate-y-8',
      animate: 'opacity-100 translate-y-0',
    },
    'fade-slide-right': {
      initial: 'opacity-0 -translate-x-8',
      animate: 'opacity-100 translate-x-0',
    },
    'fade-slide-left': {
      initial: 'opacity-0 translate-x-8',
      animate: 'opacity-100 translate-x-0',
    },
    'scale': {
      initial: 'opacity-0 scale-95',
      animate: 'opacity-100 scale-100',
    },
    'scale-up': {
      initial: 'opacity-0 scale-90',
      animate: 'opacity-100 scale-100',
    },
  };

  const { initial, animate } = variants[variant] || variants['fade-slide-up'];
  const durationClass = `duration-${duration}`;

  return (
    <div
      className={`transform transition-all ${durationClass} ease-out ${
        isVisible ? animate : initial
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * StaggerChildren - Anime les enfants avec un délai échelonné
 */
export function StaggerChildren({ children, staggerDelay = 100, className = '' }) {
  return (
    <div className={className}>
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <PageTransition key={index} delay={index * staggerDelay} variant="fade-slide-up">
            {child}
          </PageTransition>
        ))
      ) : (
        <PageTransition variant="fade-slide-up">
          {children}
        </PageTransition>
      )}
    </div>
  );
}

/**
 * AnimatedCard - Carte avec animations au hover et à l'apparition
 */
export function AnimatedCard({ children, className = '', onClick, hoverable = true }) {
  return (
    <PageTransition variant="fade-slide-up">
      <div
        className={`
          transform transition-all duration-300 ease-out
          ${hoverable ? 'hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        {children}
      </div>
    </PageTransition>
  );
}

/**
 * AnimatedButton - Bouton avec animations intuitives
 */
export function AnimatedButton({
  children,
  className = '',
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  loading = false,
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-50',
    outline: 'bg-transparent text-gray-700 border-2 border-gray-300 hover:border-red-600 hover:text-red-600',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
    success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        px-6 py-3 rounded-xl font-semibold
        transform transition-all duration-200 ease-out
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-4 focus:ring-red-500/50
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
        flex items-center justify-center space-x-2
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Chargement...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * AnimatedModal - Modal avec animations d'ouverture/fermeture
 */
export function AnimatedModal({ isOpen, onClose, children, title }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/50 backdrop-blur-sm
        transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onClose}
    >
      <PageTransition variant="scale-up" duration={300}>
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="p-6">
            {children}
          </div>
        </div>
      </PageTransition>
    </div>
  );
}

/**
 * AnimatedList - Liste avec items animés en cascade
 */
export function AnimatedList({ items, renderItem, className = '' }) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <PageTransition
          key={item.id || index}
          delay={index * 50}
          variant="fade-slide-right"
          duration={400}
        >
          {renderItem(item, index)}
        </PageTransition>
      ))}
    </div>
  );
}

/**
 * AnimatedStats - Stats cards avec animations
 */
export function AnimatedStats({ stats, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <PageTransition key={index} delay={index * 100} variant="scale">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              {stat.icon && (
                <div className={`p-3 rounded-lg ${stat.color || 'bg-red-100 text-red-600'}`}>
                  {stat.icon}
                </div>
              )}
              {stat.trend && (
                <div className={`text-sm font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trendValue}
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        </PageTransition>
      ))}
    </div>
  );
}

/**
 * FadeIn - Simple fade in animation
 */
export function FadeIn({ children, delay = 0, className = '' }) {
  return (
    <PageTransition variant="fade" delay={delay} className={className}>
      {children}
    </PageTransition>
  );
}

/**
 * SlideIn - Slide in from direction
 */
export function SlideIn({ children, direction = 'up', delay = 0, className = '' }) {
  const variants = {
    up: 'fade-slide-up',
    down: 'fade-slide-down',
    left: 'fade-slide-left',
    right: 'fade-slide-right',
  };

  return (
    <PageTransition variant={variants[direction]} delay={delay} className={className}>
      {children}
    </PageTransition>
  );
}

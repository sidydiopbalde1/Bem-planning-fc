// components/ui/StatCard.js
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color = "text-gray-900",
  trend = null, // 'up', 'down', 'neutral'
  trendValue = null,
  backgroundColor = "bg-white",
  onClick = null
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'neutral':
        return <Minus className="h-3 w-3 text-gray-400" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  const CardContent = () => (
    <div className={`${backgroundColor} rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 ${
      onClick ? 'cursor-pointer hover:border-blue-300' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-1">
            {Icon && (
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <div className="flex items-baseline space-x-2">
                <p className={`text-2xl font-bold ${color}`}>
                  {value}
                </p>
                {trendValue && (
                  <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span className="text-xs font-medium">{trendValue}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return onClick ? (
    <div onClick={onClick}>
      <CardContent />
    </div>
  ) : (
    <CardContent />
  );
};

export default StatCard;
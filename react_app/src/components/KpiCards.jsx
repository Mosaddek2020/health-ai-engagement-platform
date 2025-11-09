import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';

export default function KpiCards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['kpi-stats'],
    queryFn: dashboardAPI.getKpiStats,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading KPI stats</div>;
  }

  const cards = [
    {
      title: 'Total Appointments',
      value: data?.total || 0,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      icon: '📅'
    },
    {
      title: 'Confirmed',
      value: data?.confirmed || 0,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      icon: '✓'
    },
    {
      title: 'Pending',
      value: data?.pending || 0,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      icon: '⏳'
    },
    {
      title: 'High Risk',
      value: data?.high_risk || 0,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      icon: '⚠️'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <p className={`text-3xl font-bold ${card.textColor}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

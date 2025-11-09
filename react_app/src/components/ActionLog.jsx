import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';

export default function ActionLog() {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['action-log'],
    queryFn: dashboardAPI.getActionLog,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Activity Log</h2>
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading activity log</div>;
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp;
    }
  };

  const getRiskColor = (risk) => {
    if (!risk) return 'text-gray-600';
    const riskNum = parseFloat(risk);
    if (riskNum > 0.7) return 'text-red-600 font-bold';
    if (riskNum > 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold">Activity Log</h2>
        <p className="text-sm text-gray-500 mt-1">
          Recent AI processing activities
        </p>
      </div>
      <div className="p-6 max-h-96 overflow-y-auto">
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No activities yet</p>
            <p className="text-sm mt-2">Run the appointment processing command to see logs</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice().reverse().map((log, index) => (
              <div
                key={index}
                className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-md hover:bg-gray-100 transition-colors duration-150"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    Processed: {log.patient_name || 'Unknown Patient'}
                  </p>
                  <span className={`text-xs font-semibold ${getRiskColor(log.risk_score)}`}>
                    {log.risk_score ? `${(parseFloat(log.risk_score) * 100).toFixed(0)}% risk` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Appointment #{log.appointment_id}</span>
                  <span>{formatTimestamp(log.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

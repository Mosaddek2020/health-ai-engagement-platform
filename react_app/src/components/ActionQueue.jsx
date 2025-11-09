import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';

export default function ActionQueue() {
  const { data: actionQueue, isLoading, error } = useQuery({
    queryKey: ['action-queue'],
    queryFn: dashboardAPI.getActionQueue,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Action Queue - High Risk</h2>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading action queue</div>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200 bg-red-50">
        <h2 className="text-xl font-bold text-red-900">⚠️ Action Queue - High Risk</h2>
        <p className="text-sm text-red-700 mt-1">
          {actionQueue?.length || 0} appointments need immediate attention
        </p>
      </div>
      <div className="p-6">
        {!actionQueue || actionQueue.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">✓ No high-risk appointments</p>
            <p className="text-sm mt-2">All patients are under control!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {actionQueue.map((appointment) => (
              <div
                key={appointment.id}
                className="border border-red-200 rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors duration-150"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {appointment.patient_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {appointment.patient_phone}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full">
                    {(appointment.no_show_risk * 100).toFixed(0)}% Risk
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mt-3">
                  <div>
                    <span className="font-medium">Time:</span> {formatDate(appointment.appointment_time)}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {appointment.appointment_type}
                  </div>
                  <div>
                    <span className="font-medium">Provider:</span> {appointment.provider_name}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {appointment.status}
                  </div>
                </div>
                <button className="mt-3 w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-150 font-medium">
                  📞 Call Patient Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

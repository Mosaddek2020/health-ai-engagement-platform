import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dashboardAPI, echo } from './services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Dashboard() {
  const [processing, setProcessing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [processMessage, setProcessMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const queryClientInstance = useQueryClient();

  // Play notification sound
  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // WebSocket connection - Remove polling intervals
  const { data: kpiStats, refetch: refetchKpi } = useQuery({
    queryKey: ['kpi-stats'],
    queryFn: dashboardAPI.getKpiStats,
  });

  const { data: appointments, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: dashboardAPI.getAppointments,
  });

  const { data: actionQueue, refetch: refetchActionQueue } = useQuery({
    queryKey: ['action-queue'],
    queryFn: dashboardAPI.getActionQueue,
  });

  // Scroll to action queue when high-risk appointments appear
  useEffect(() => {
    if (actionQueue && actionQueue.length > 0) {
      setTimeout(() => {
        const actionQueueElement = document.getElementById('action-queue-section');
        if (actionQueueElement) {
          actionQueueElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [actionQueue?.length]);

  // Listen for WebSocket updates
  useEffect(() => {
    const channel = echo.channel('appointments');
    
    channel.listen('.appointments.updated', (event) => {
      console.log('WebSocket update received:', event);
      
      // Refetch all queries to get fresh data
      Promise.all([
        refetchKpi(),
        refetchAppointments(),
        refetchActionQueue()
      ]);
      
      // Show notification with sound
      if (event.message) {
        playNotificationSound();
        setProcessMessage(`🔔 ${event.message}`);
        setTimeout(() => setProcessMessage(''), 4000);
      }
    });

    return () => {
      echo.leaveChannel('appointments');
    };
  }, [refetchKpi, refetchAppointments, refetchActionQueue]);

  const handleProcessAppointments = async () => {
    console.log('Process button clicked!');
    setProcessing(true);
    setProcessMessage('Processing appointments with AI...');
    
    try {
      console.log('Calling API...');
      const result = await dashboardAPI.processAppointments();
      console.log('API result:', result);
      
      // Immediately refetch all data
      console.log('Refetching data...');
      await Promise.all([
        refetchKpi(),
        refetchAppointments(),
        refetchActionQueue()
      ]);
      console.log('Data refetched!');
      
      playNotificationSound();
      setProcessMessage('✓ Successfully processed all appointments!');
      setTimeout(() => setProcessMessage(''), 4000);
    } catch (error) {
      console.error('Error processing appointments:', error);
      setProcessMessage('✗ Error processing appointments: ' + error.message);
      setTimeout(() => setProcessMessage(''), 5000);
    } finally {
      setProcessing(false);
      console.log('Processing complete');
    }
  };

  const handleResetAppointments = async () => {
    setResetting(true);
    setProcessMessage('Resetting all appointments...');
    
    try {
      const result = await dashboardAPI.resetAppointments();
      
      // Immediately refetch all data
      await Promise.all([
        refetchKpi(),
        refetchAppointments(),
        refetchActionQueue()
      ]);
      
      playNotificationSound();
      setProcessMessage('✓ Successfully reset all appointments!');
      setTimeout(() => setProcessMessage(''), 4000);
    } catch (error) {
      setProcessMessage('✗ Error resetting appointments: ' + error.message);
      setTimeout(() => setProcessMessage(''), 5000);
    } finally {
      setResetting(false);
    }
  };

  const handleConfirmAppointment = async (id, patientName) => {
    try {
      await dashboardAPI.confirmAppointment(id);
      
      // Immediately refetch all data
      await Promise.all([
        refetchKpi(),
        refetchAppointments(),
        refetchActionQueue()
      ]);
      
      playNotificationSound();
      setProcessMessage(`✓ Confirmed appointment for ${patientName}`);
      setTimeout(() => setProcessMessage(''), 4000);
    } catch (error) {
      setProcessMessage('✗ Error confirming appointment: ' + error.message);
      setTimeout(() => setProcessMessage(''), 5000);
    }
  };

  const handleSkipAppointment = async (id, patientName) => {
    try {
      await dashboardAPI.skipAppointment(id);
      
      // Immediately refetch all data
      await Promise.all([
        refetchKpi(),
        refetchAppointments(),
        refetchActionQueue()
      ]);
      
      playNotificationSound();
      setProcessMessage(`⏭️ Skipped appointment for ${patientName}`);
      setTimeout(() => setProcessMessage(''), 4000);
    } catch (error) {
      setProcessMessage('✗ Error skipping appointment: ' + error.message);
      setTimeout(() => setProcessMessage(''), 5000);
    }
  };

  const getRiskColor = (risk) => {
    if (!risk) return '#9ca3af';
    if (risk > 0.7) return '#dc2626';
    if (risk > 0.4) return '#f59e0b';
    return '#10b981';
  };

  const getStatusStyle = (status) => {
    const base = { padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' };
    switch (status) {
      case 'Confirmed':
        return { ...base, backgroundColor: '#d1fae5', color: '#065f46' };
      case 'Confirmation Sent':
        return { ...base, backgroundColor: '#dbeafe', color: '#1e40af' };
      default:
        return { ...base, backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Fixed Notification Toast */}
      {processMessage && (
        <div 
          style={{ 
            position: 'fixed', 
            top: '20px', 
            right: '20px', 
            zIndex: 1000,
            backgroundColor: processMessage.includes('✓') ? '#10b981' : 
                           processMessage.includes('✗') ? '#ef4444' : 
                           processMessage.includes('🔔') ? '#3b82f6' : '#6366f1',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            animation: 'slideInRight 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '15px',
            fontWeight: '600',
            border: '2px solid rgba(255,255,255,0.3)'
          }}
        >
          <span style={{ fontSize: '24px' }}>
            {processMessage.includes('✓') ? '✓' : 
             processMessage.includes('✗') ? '✗' : 
             processMessage.includes('🔔') ? '🔔' :
             processMessage.includes('⏭️') ? '⏭️' : '📢'}
          </span>
          <span>{processMessage.replace(/[✓✗🔔⏭️]/g, '').trim()}</span>
        </div>
      )}
      
      {/* Inline styles for animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.95;
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 8px 24px rgba(220, 38, 38, 0.2);
          }
          50% {
            box-shadow: 0 8px 32px rgba(220, 38, 38, 0.4);
          }
        }
      `}</style>

      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              🏥 Health AI Engagement Platform
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              AI-powered patient no-show prediction • Real-time WebSocket Updates
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div>
              <button
                onClick={handleProcessAppointments}
                disabled={processing || resetting}
                style={{
                  backgroundColor: (processing || resetting) ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: (processing || resetting) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!processing && !resetting) {
                    e.target.style.backgroundColor = '#1e40af';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!processing && !resetting) {
                    e.target.style.backgroundColor = '#2563eb';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
              >
                {processing ? '⏳ Processing...' : '🤖 Run AI Processing'}
              </button>
              <button
                onClick={handleResetAppointments}
                disabled={processing || resetting}
                style={{
                  backgroundColor: (processing || resetting) ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: (processing || resetting) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  marginLeft: '12px',
                }}
                onMouseOver={(e) => {
                  if (!processing && !resetting) {
                    e.target.style.backgroundColor = '#b91c1c';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!processing && !resetting) {
                    e.target.style.backgroundColor = '#dc2626';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
              >
                {resetting ? '⏳ Resetting...' : '🔄 Reset Demo'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Appointments</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }}>{kpiStats?.total || 0}</div>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Confirmed</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a' }}>{kpiStats?.confirmed || 0}</div>
          </div>
          <div style={{ backgroundColor: '#fef9c3', padding: '20px', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Pending</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ca8a04' }}>{kpiStats?.pending || 0}</div>
          </div>
          <div style={{ backgroundColor: '#fee2e2', padding: '20px', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>⚠️ High Risk</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>{kpiStats?.high_risk || 0}</div>
          </div>
        </div>

        {/* Appointments Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Appointments Schedule</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Total: {appointments?.length || 0}</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Patient</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Phone</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Time</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Provider</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>No-Show Risk</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments?.map((apt) => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 20px', fontSize: '14px' }}>{apt.patient_name}</td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: '#6b7280' }}>{apt.patient_phone}</td>
                    <td style={{ padding: '16px 20px', fontSize: '14px' }}>
                      {new Date(apt.appointment_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: '#6b7280' }}>{apt.appointment_type}</td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: '#6b7280' }}>{apt.provider_name}</td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 'bold', color: getRiskColor(apt.no_show_risk) }}>
                      {apt.no_show_risk ? `${(apt.no_show_risk * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={getStatusStyle(apt.status)}>{apt.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Queue */}
        <div 
          id="action-queue-section"
          style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            border: actionQueue && actionQueue.length > 0 ? '3px solid #fca5a5' : '1px solid #e5e7eb',
            boxShadow: actionQueue && actionQueue.length > 0 ? '0 8px 24px rgba(220, 38, 38, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
            animation: actionQueue && actionQueue.length > 0 ? 'pulse 2s ease-in-out infinite' : 'none',
            scrollMarginTop: '100px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
              ⚠️ Action Queue - High Risk
            </h2>
            {actionQueue && actionQueue.length > 0 && (
              <div style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 'bold',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                {actionQueue.length} Patient{actionQueue.length !== 1 ? 's' : ''} Need Attention
              </div>
            )}
          </div>
          {actionQueue && actionQueue.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {actionQueue.map((apt, index) => (
                <div 
                  key={apt.id} 
                  style={{ 
                    border: '2px solid #fecaca', 
                    borderRadius: '8px', 
                    padding: '16px', 
                    backgroundColor: '#fef2f2',
                    animation: 'slideInRight 0.3s ease-out',
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'both'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{apt.patient_name}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>{apt.patient_phone}</div>
                    </div>
                    <div style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '9999px', fontWeight: 'bold' }}>
                      {(apt.no_show_risk * 100).toFixed(0)}% Risk
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
                    <div><strong>Time:</strong> {new Date(apt.appointment_time).toLocaleString()}</div>
                    <div><strong>Type:</strong> {apt.appointment_type}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleConfirmAppointment(apt.id, apt.patient_name)}
                      style={{ 
                        flex: 1,
                        padding: '10px 16px', 
                        backgroundColor: '#10b981', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#059669';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#10b981';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }}
                    >
                      ✓ Mark as Confirmed
                    </button>
                    <button 
                      onClick={() => handleSkipAppointment(apt.id, apt.patient_name)}
                      style={{ 
                        flex: 1,
                        padding: '10px 16px', 
                        backgroundColor: '#6b7280', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#4b5563';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(107, 114, 128, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#6b7280';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }}
                    >
                      ⏭️ Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
              <div style={{ fontSize: '18px' }}>✓ No high-risk appointments</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}

export default App;



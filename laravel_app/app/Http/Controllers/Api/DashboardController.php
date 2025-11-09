<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Events\AppointmentsUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class DashboardController extends Controller
{
    /**
     * Get KPI statistics for dashboard cards
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function kpiStats()
    {
        $total = Appointment::count();
        $confirmed = Appointment::where('status', 'Confirmed')->count();
        $pending = Appointment::whereIn('status', ['Scheduled', 'Confirmation Sent'])->count();
        $highRisk = Appointment::where('no_show_risk', '>', 0.7)->count();
        
        return response()->json([
            'total' => $total,
            'confirmed' => $confirmed,
            'pending' => $pending,
            'high_risk' => $highRisk,
        ]);
    }
    
    /**
     * Get all appointments for the dashboard list
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function appointments()
    {
        $appointments = Appointment::orderBy('appointment_time', 'asc')->get();
        
        return response()->json($appointments);
    }
    
    /**
     * Get action queue - high-risk appointments needing attention
     * Excludes appointments that have been Confirmed or Skipped
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function actionQueue()
    {
        $actionQueue = Appointment::where('no_show_risk', '>', 0.7)
            ->whereNotIn('status', ['Confirmed', 'Skipped'])
            ->orderBy('no_show_risk', 'desc')
            ->orderBy('appointment_time', 'asc')
            ->get();
        
        return response()->json($actionQueue);
    }
    
    /**
     * Get action log - recent processing activities
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function actionLog()
    {
        $logPath = storage_path('logs/laravel.log');
        
        if (!File::exists($logPath)) {
            return response()->json([
                'logs' => [],
                'message' => 'No log file found'
            ]);
        }
        
        $logContent = File::get($logPath);
        $lines = explode("\n", $logContent);
        
        // Filter lines that contain "Processed appointment"
        $processedLines = array_filter($lines, function($line) {
            return str_contains($line, 'Processed appointment');
        });
        
        // Get last 20 lines
        $recentLogs = array_slice($processedLines, -20);
        
        // Parse log lines into structured data
        $logs = array_map(function($line) {
            // Extract timestamp
            preg_match('/\[(.*?)\]/', $line, $timestampMatch);
            $timestamp = $timestampMatch[1] ?? null;
            
            // Extract appointment ID
            preg_match('/appointment (\d+)/', $line, $idMatch);
            $appointmentId = $idMatch[1] ?? null;
            
            // Extract risk score
            preg_match('/risk_score[":]+([0-9.]+)/', $line, $riskMatch);
            $riskScore = $riskMatch[1] ?? null;
            
            // Extract patient name
            preg_match('/patient_name[":]+([^"]+)"/', $line, $nameMatch);
            $patientName = $nameMatch[1] ?? null;
            
            return [
                'timestamp' => $timestamp,
                'appointment_id' => $appointmentId,
                'patient_name' => $patientName,
                'risk_score' => $riskScore,
                'raw' => $line
            ];
        }, $recentLogs);
        
        return response()->json(array_values($logs));
    }
    
    /**
     * Process appointments - Call AI agent and update risk scores
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function processAppointments()
    {
        try {
            // Call the artisan command
            \Illuminate\Support\Facades\Artisan::call('appointments:process');
            
            $output = \Illuminate\Support\Facades\Artisan::output();
            
            // Broadcast the update
            broadcast(new AppointmentsUpdated('Appointments processed with AI', 'process'));
            
            return response()->json([
                'success' => true,
                'message' => 'Appointments processed successfully',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error processing appointments',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Reset appointments - Set risk scores to null and status to Scheduled
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetAppointments()
    {
        try {
            $updated = Appointment::query()->update([
                'status' => 'Scheduled',
                'no_show_risk' => null,
                'risk_reasons' => null
            ]);
            
            // Broadcast the update
            broadcast(new AppointmentsUpdated('Appointments reset to initial state', 'reset'));
            
            return response()->json([
                'success' => true,
                'message' => 'Appointments reset successfully',
                'count' => $updated
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error resetting appointments',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Manually confirm an appointment
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function confirmAppointment($id)
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->status = 'Confirmed';
            $appointment->save();
            
            // Broadcast the update
            broadcast(new AppointmentsUpdated("Appointment #{$id} confirmed manually", 'confirm'));
            
            return response()->json([
                'success' => true,
                'message' => 'Appointment confirmed successfully',
                'appointment' => $appointment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error confirming appointment',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Skip an appointment (remove from action queue)
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function skipAppointment($id)
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->status = 'Skipped';
            $appointment->save();
            
            // Broadcast the update
            broadcast(new AppointmentsUpdated("Appointment #{$id} skipped", 'skip'));
            
            return response()->json([
                'success' => true,
                'message' => 'Appointment skipped successfully',
                'appointment' => $appointment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error skipping appointment',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

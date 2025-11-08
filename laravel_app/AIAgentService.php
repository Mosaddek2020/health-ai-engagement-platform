<?php

/**
 * Example Laravel service class for calling the AI Agent
 * 
 * This demonstrates how to integrate the AI Agent microservice
 * into your Laravel application
 */

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIAgentService
{
    private string $aiAgentUrl;
    
    public function __construct()
    {
        // Get AI Agent URL from environment variable
        $this->aiAgentUrl = env('AI_AGENT_URL', 'http://ai-agent:8000');
    }
    
    /**
     * Predict patient no-show risk
     * 
     * @param array $patientData Patient information
     * @return array Risk prediction response
     * @throws \Exception
     */
    public function predictNoShowRisk(array $patientData): array
    {
        try {
            $response = Http::timeout(10)
                ->post($this->aiAgentUrl . '/predict', [
                    'age' => $patientData['age'],
                    'previous_no_shows' => $patientData['previous_no_shows'] ?? 0,
                    'days_until_appointment' => $patientData['days_until_appointment'],
                    'appointment_hour' => $patientData['appointment_hour'],
                    'patient_id' => $patientData['patient_id'] ?? null,
                ]);
            
            if ($response->failed()) {
                Log::error('AI Agent request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('AI Agent request failed');
            }
            
            $data = $response->json();
            
            Log::info('AI Agent prediction', [
                'risk_score' => $data['risk_score'],
                'risk_level' => $data['risk_level']
            ]);
            
            return $data;
            
        } catch (\Exception $e) {
            Log::error('AI Agent service error', [
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }
    
    /**
     * Check if AI Agent service is healthy
     * 
     * @return bool
     */
    public function isHealthy(): bool
    {
        try {
            $response = Http::timeout(5)->get($this->aiAgentUrl . '/health');
            return $response->successful() && $response->json()['status'] === 'healthy';
        } catch (\Exception $e) {
            Log::warning('AI Agent health check failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
    
    /**
     * Get AI model information
     * 
     * @return array|null
     */
    public function getModelInfo(): ?array
    {
        try {
            $response = Http::timeout(5)->get($this->aiAgentUrl . '/model/info');
            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::warning('Failed to get model info', ['error' => $e->getMessage()]);
            return null;
        }
    }
}

/**
 * Example Usage in a Laravel Controller:
 * 
 * use App\Services\AIAgentService;
 * 
 * class AppointmentController extends Controller
 * {
 *     public function checkNoShowRisk(Request $request, AIAgentService $aiAgent)
 *     {
 *         $validated = $request->validate([
 *             'age' => 'required|integer|min:0|max:120',
 *             'previous_no_shows' => 'integer|min:0',
 *             'days_until_appointment' => 'required|integer|min:0',
 *             'appointment_hour' => 'required|integer|min:0|max:23',
 *             'patient_id' => 'string',
 *         ]);
 *         
 *         try {
 *             $prediction = $aiAgent->predictNoShowRisk($validated);
 *             
 *             return response()->json([
 *                 'success' => true,
 *                 'data' => $prediction
 *             ]);
 *             
 *         } catch (\Exception $e) {
 *             return response()->json([
 *                 'success' => false,
 *                 'error' => 'Failed to get risk prediction'
 *             ], 500);
 *         }
 *     }
 * }
 */

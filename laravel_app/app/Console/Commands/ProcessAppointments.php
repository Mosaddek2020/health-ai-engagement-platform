<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProcessAppointments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'appointments:process';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process scheduled appointments and get no-show risk predictions from AI agent';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting appointment processing...');
        
        // Get all scheduled appointments
        $appointments = Appointment::where('status', 'Scheduled')->get();
        
        if ($appointments->isEmpty()) {
            $this->warn('No scheduled appointments found.');
            return 0;
        }
        
        $this->info("Found {$appointments->count()} scheduled appointments.");
        
        $processedCount = 0;
        $errorCount = 0;
        
        // Loop through each appointment
        foreach ($appointments as $appointment) {
            try {
                // Call the AI Agent
                $response = Http::timeout(10)->post('http://ai-agent:8000/predict/no-show');
                
                if ($response->successful()) {
                    $riskScore = $response->json('no_show_risk');
                    $riskReasons = $response->json('risk_reasons', []);
                    
                    // Update the appointment
                    $appointment->no_show_risk = $riskScore;
                    $appointment->risk_reasons = $riskReasons;
                    $appointment->status = 'Confirmation Sent';
                    $appointment->save();
                    
                    // Log the action
                    Log::info("Processed appointment {$appointment->id}", [
                        'patient_name' => $appointment->patient_name,
                        'risk_score' => $riskScore,
                        'reasons_count' => count($riskReasons),
                        'appointment_time' => $appointment->appointment_time
                    ]);
                    
                    $this->line("✓ Processed appointment #{$appointment->id} - Risk: {$riskScore} (" . count($riskReasons) . " reasons)");
                    $processedCount++;
                } else {
                    throw new \Exception("AI Agent returned status: {$response->status()}");
                }
                
            } catch (\Exception $e) {
                $errorCount++;
                $this->error("✗ Failed to process appointment #{$appointment->id}: {$e->getMessage()}");
                Log::error("Failed to process appointment {$appointment->id}", [
                    'error' => $e->getMessage(),
                    'patient_name' => $appointment->patient_name
                ]);
            }
        }
        
        // Summary
        $this->newLine();
        $this->info("Processing complete!");
        $this->table(
            ['Status', 'Count'],
            [
                ['Processed', $processedCount],
                ['Errors', $errorCount],
                ['Total', $appointments->count()]
            ]
        );
        
        return 0;
    }
}


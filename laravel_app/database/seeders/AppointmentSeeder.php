<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Appointment;
use Carbon\Carbon;

class AppointmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $appointmentTypes = ['New Patient', 'Follow-up', 'Consultation', 'Check-up', 'Specialist Visit'];
        $providerNames = [
            'Dr. Sarah Johnson',
            'Dr. Michael Chen',
            'Dr. Emily Rodriguez',
            'Dr. James Wilson',
            'Dr. Lisa Anderson'
        ];

        // Create 30 appointments
        for ($i = 0; $i < 30; $i++) {
            // Make some appointments today and tomorrow
            if ($i < 10) {
                // 10 appointments today
                $appointmentTime = Carbon::today()->addHours(rand(8, 17))->addMinutes(rand(0, 59));
            } elseif ($i < 20) {
                // 10 appointments tomorrow
                $appointmentTime = Carbon::tomorrow()->addHours(rand(8, 17))->addMinutes(rand(0, 59));
            } else {
                // 10 appointments in the next 7 days
                $appointmentTime = Carbon::now()->addDays(rand(2, 7))->addHours(rand(8, 17))->addMinutes(rand(0, 59));
            }

            Appointment::create([
                'patient_name' => fake()->name(),
                'patient_phone' => fake()->phoneNumber(),
                'appointment_time' => $appointmentTime,
                'appointment_type' => $appointmentTypes[array_rand($appointmentTypes)],
                'provider_name' => $providerNames[array_rand($providerNames)],
                'status' => 'Scheduled',
                'no_show_risk' => null,
            ]);
        }
    }
}


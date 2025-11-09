<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('patient_name');
            $table->string('patient_phone');
            $table->dateTime('appointment_time');
            $table->string('appointment_type'); // e.g., 'New Patient', 'Follow-up'
            $table->string('provider_name');
            $table->string('status')->default('Scheduled'); // 'Scheduled', 'Confirmation Sent', 'Confirmed', 'Rescheduled', 'No-Show'
            $table->decimal('no_show_risk', 3, 2)->nullable(); // 0-1.0
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};

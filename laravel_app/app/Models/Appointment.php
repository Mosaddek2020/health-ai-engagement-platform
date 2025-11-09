<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'patient_name',
        'patient_phone',
        'appointment_time',
        'appointment_type',
        'provider_name',
        'status',
        'no_show_risk',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'appointment_time' => 'datetime',
        'no_show_risk' => 'decimal:2',
    ];
}


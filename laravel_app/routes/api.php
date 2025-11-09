<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;

Route::get('/kpi-stats', [DashboardController::class, 'kpiStats']);
Route::get('/appointments', [DashboardController::class, 'appointments']);
Route::get('/action-queue', [DashboardController::class, 'actionQueue']);
Route::get('/action-log', [DashboardController::class, 'actionLog']);
Route::post('/process-appointments', [DashboardController::class, 'processAppointments']);
Route::post('/reset-appointments', [DashboardController::class, 'resetAppointments']);
Route::post('/appointments/{id}/confirm', [DashboardController::class, 'confirmAppointment']);
Route::post('/appointments/{id}/skip', [DashboardController::class, 'skipAppointment']);

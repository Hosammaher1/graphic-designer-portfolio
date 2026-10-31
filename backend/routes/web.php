<?php

use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Dynamic SEO Endpoints
Route::get('/robots.txt', [RobotsController::class, 'index'])->name('robots.index');
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap.index');


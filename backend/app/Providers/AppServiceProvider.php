<?php

namespace App\Providers;

use App\Services\Media\CloudinaryMediaStorage;
use App\Services\Media\FakeMediaStorage;
use App\Services\Media\MediaStorageInterface;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(MediaStorageInterface::class, function ($app) {
            $cloudName = config('services.cloudinary.cloud_name');
            $apiKey = config('services.cloudinary.api_key');
            $apiSecret = config('services.cloudinary.api_secret');

            if ($cloudName && $apiKey && $apiSecret) {
                return new CloudinaryMediaStorage($cloudName, $apiKey, $apiSecret);
            }

            return new FakeMediaStorage();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('contact', function (Request $request) {
            $ip = $request->ip() ?: '127.0.0.1';

            return [
                Limit::perMinute(3)->by($ip)->response(function () {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Too many inquiries submitted from this IP. Please wait a minute before retrying. / تم تجاوز الحد المسموح به، يرجى الانتظار دقيقة قبل إعادة المحاولة.',
                    ], 429, [
                        'Retry-After' => 60,
                    ]);
                }),
                Limit::perDay(10)->by($ip)->response(function () {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Daily inquiry limit reached for this IP. Please try again tomorrow. / تم الوصول إلى الحد الأقصى اليومي للاستفسارات.',
                    ], 429, [
                        'Retry-After' => 86400,
                    ]);
                }),
            ];
        });
    }
}

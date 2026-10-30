<?php

namespace App\Providers;

use App\Services\Media\CloudinaryMediaStorage;
use App\Services\Media\FakeMediaStorage;
use App\Services\Media\MediaStorageInterface;
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
        //
    }
}

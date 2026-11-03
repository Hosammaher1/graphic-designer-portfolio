<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SiteSettingController extends Controller
{
    /**
     * Public endpoint: Serves site content and presentation settings.
     */
    public function publicSettings(Request $request): JsonResponse
    {
        $locale = $request->input('locale', 'ar');

        $settings = Cache::remember(SiteSetting::CACHE_KEY . '_' . $locale, 3600, function () use ($locale) {
            $raw = SiteSetting::getSetting('portfolio_settings', SiteSetting::defaultSettings());

            // Add localized view helpers
            $raw['is_ar'] = $locale === 'ar';
            $raw['active_locale'] = $locale;

            return $raw;
        });

        return response()->json([
            'status' => 'success',
            'data'   => ['settings' => $settings],
        ]);
    }

    /**
     * Admin endpoint: Fetch editable studio settings.
     */
    public function adminShow(Request $request): JsonResponse
    {
        $settings = SiteSetting::getSetting('portfolio_settings', SiteSetting::defaultSettings());

        return response()->json([
            'status' => 'success',
            'data'   => ['settings' => $settings],
        ]);
    }

    /**
     * Admin endpoint: Update studio settings.
     */
    public function adminUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'profile'     => 'nullable|array',
            'branding'    => 'nullable|array',
            'hero'        => 'nullable|array',
            'about'       => 'nullable|array',
            'skills'      => 'nullable|array',
            'contact'     => 'nullable|array',
            'preferences' => 'nullable|array',
        ]);

        $current = SiteSetting::getSetting('portfolio_settings', SiteSetting::defaultSettings());

        $updated = array_replace_recursive($current, $validated);

        SiteSetting::setSetting('portfolio_settings', $updated);

        // Clear localized caches
        Cache::forget(SiteSetting::CACHE_KEY . '_ar');
        Cache::forget(SiteSetting::CACHE_KEY . '_en');

        AuditLogger::log('admin.settings.updated', [
            'sections' => array_keys($validated),
        ], $request->user(), $request);

        return response()->json([
            'status'  => 'success',
            'message' => 'Studio settings updated successfully.',
            'data'    => ['settings' => $updated],
        ]);
    }
}

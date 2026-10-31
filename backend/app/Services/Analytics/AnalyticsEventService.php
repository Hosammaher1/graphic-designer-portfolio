<?php

namespace App\Services\Analytics;

use App\Models\AnalyticsEvent;
use App\Models\ConsentRecord;
use App\Models\Project;
use Illuminate\Http\Request;

class AnalyticsEventService
{
    /**
     * Common bot, spider, scraper, and automated crawler signatures.
     */
    protected const BOT_REGEX = '/bot|crawl|spider|slurp|bingbot|googlebot|yandex|duckduckbot|baiduspider|headless|phantom|selenium|puppeteer|lighthouse|curl|wget|postman/i';

    /**
     * Known search engine domain patterns.
     */
    protected const SEARCH_REGEX = '/google\.|bing\.|yahoo\.|duckduckgo\.|baidu\.|ecosia\.|yandex\./i';

    /**
     * Known social network domain patterns.
     */
    protected const SOCIAL_REGEX = '/behance\.net|dribbble\.com|linkedin\.com|instagram\.com|twitter\.com|x\.com|facebook\.com|pinterest\.com|threads\.net/i';

    /**
     * Detect if a user agent string belongs to an automated crawler or bot.
     */
    public function isBot(?string $userAgent): bool
    {
        if (empty($userAgent)) {
            return true;
        }

        return (bool) preg_match(self::BOT_REGEX, $userAgent);
    }

    /**
     * Categorize device type based on User-Agent.
     */
    public function parseDeviceType(?string $userAgent): string
    {
        if (empty($userAgent)) {
            return 'unknown';
        }

        if (preg_match('/ipad|tablet/i', $userAgent)) {
            return 'tablet';
        }

        if (preg_match('/mobi|android|iphone/i', $userAgent)) {
            return 'mobile';
        }

        return 'desktop';
    }

    /**
     * Categorize referrer domain into direct, search, social, or external.
     *
     * @return array{url: ?string, domain: ?string, category: string}
     */
    public function categorizeReferrer(?string $referrerUrl): array
    {
        if (empty($referrerUrl)) {
            return [
                'url' => null,
                'domain' => null,
                'category' => 'direct',
            ];
        }

        $host = parse_url($referrerUrl, PHP_URL_HOST);

        if (empty($host) || in_array(strtolower($host), ['localhost', '127.0.0.1'], true)) {
            return [
                'url' => $referrerUrl,
                'domain' => $host,
                'category' => 'direct',
            ];
        }

        if (preg_match(self::SEARCH_REGEX, $host)) {
            return [
                'url' => $referrerUrl,
                'domain' => $host,
                'category' => 'search',
            ];
        }

        if (preg_match(self::SOCIAL_REGEX, $host)) {
            return [
                'url' => $referrerUrl,
                'domain' => $host,
                'category' => 'social',
            ];
        }

        return [
            'url' => $referrerUrl,
            'domain' => $host,
            'category' => 'external',
        ];
    }

    /**
     * Generate daily rotating salted hash for unique visitor estimation.
     * Guarantees that raw IP address is NEVER stored, and prevents cross-day tracking.
     */
    public function generateVisitorHash(string $ip, string $userAgent): string
    {
        $dailySalt = (string) config('app.key', 'portfolio_salt') . ':' . now()->toDateString();
        return hash_hmac('sha256', $ip . '|' . $userAgent, $dailySalt);
    }

    /**
     * Process and record a privacy-compliant analytics event.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function recordEvent(array $data, Request $request): array
    {
        $consentToken = $data['consent_token'] ?? $request->header('X-Consent-Token');

        // 1. Consent Verification: Refusal, withdrawal, or absence of consent strictly blocks tracking
        if (!$consentToken) {
            return [
                'success' => false,
                'status' => 'blocked',
                'message' => 'Analytics tracking blocked: no consent provided.',
            ];
        }

        $consent = ConsentRecord::where('consent_token', $consentToken)->first();

        if (!$consent
            || !(bool) $consent->analytics_allowed
            || $consent->withdrawn_at !== null
            || ($consent->expires_at && $consent->expires_at->isPast())
        ) {
            return [
                'success' => false,
                'status' => 'blocked',
                'message' => 'Analytics tracking blocked by consent preference.',
            ];
        }

        // 2. Bot filtering heuristics
        $userAgent = $request->userAgent() ?? '';
        if ($this->isBot($userAgent)) {
            return [
                'success' => false,
                'status' => 'ignored_bot',
                'message' => 'Automated crawler or bot request ignored.',
            ];
        }

        // 3. Idempotency handling
        $idempotencyKey = $data['idempotency_key'] ?? null;
        if ($idempotencyKey && AnalyticsEvent::where('idempotency_key', $idempotencyKey)->exists()) {
            return [
                'success' => true,
                'status' => 'deduplicated',
                'message' => 'Event already recorded within deduplication window.',
            ];
        }

        // 4. Extract pseudonymous metrics
        $ip = $request->ip() ?? '127.0.0.1';
        $visitorHash = $this->generateVisitorHash($ip, $userAgent);
        $referrerInfo = $this->categorizeReferrer($data['referrer'] ?? $request->header('referer'));
        $deviceType = $this->parseDeviceType($userAgent);
        $rawLocale = $data['locale'] ?? 'ar';
        $locale = in_array($rawLocale, ['ar', 'en'], true) ? $rawLocale : 'ar';

        $rawType = $data['event_type'] ?? 'page_view';
        $eventType = in_array($rawType, ['page_view', 'project_view', 'custom'], true) ? $rawType : 'page_view';

        $projectId = !empty($data['project_id']) ? (int) $data['project_id'] : null;

        // 5. Persist immutable event
        $event = AnalyticsEvent::create([
            'event_type' => $eventType,
            'path' => substr($data['path'] ?? '/', 0, 255),
            'project_id' => $projectId,
            'visitor_hash' => $visitorHash,
            'referrer_url' => $referrerInfo['url'] ? substr($referrerInfo['url'], 0, 500) : null,
            'referrer_domain' => $referrerInfo['domain'] ? substr($referrerInfo['domain'], 0, 100) : null,
            'referrer_category' => $referrerInfo['category'],
            'device_type' => $deviceType,
            'locale' => $locale,
            'idempotency_key' => $idempotencyKey,
            'is_bot' => false,
            'created_at' => now(),
        ]);

        // 6. If project_view, atomically increment public view count
        if ($eventType === 'project_view' && $projectId) {
            Project::where('id', $projectId)->increment('view_count');
        }

        return [
            'success' => true,
            'status' => 'recorded',
            'data' => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'referrer_category' => $event->referrer_category,
            ],
        ];
    }
}

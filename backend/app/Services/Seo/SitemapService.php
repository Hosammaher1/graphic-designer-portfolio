<?php

namespace App\Services\Seo;

use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class SitemapService
{
    public const CACHE_KEY = 'sitemap_xml';
    public const CACHE_TTL = 3600; // 1 hour

    /**
     * Return sitemap XML string, cached or freshly generated.
     */
    public function getXml(bool $forceFresh = false): string
    {
        if ($forceFresh) {
            $this->clearCache();
        }

        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return $this->buildXml();
        });
    }

    /**
     * Clear cached sitemap XML.
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Construct dynamic XML sitemap with reciprocal hreflang links.
     */
    public function buildXml(): string
    {
        $baseUrl = $this->getBaseUrl();

        $staticPages = [
            [
                'ar_path' => '/ar/',
                'en_path' => '/en/',
                'changefreq' => 'daily',
                'priority' => '1.0',
            ],
            [
                'ar_path' => '/ar/work',
                'en_path' => '/en/work',
                'changefreq' => 'daily',
                'priority' => '0.9',
            ],
            [
                'ar_path' => '/ar/about',
                'en_path' => '/en/about',
                'changefreq' => 'monthly',
                'priority' => '0.7',
            ],
            [
                'ar_path' => '/ar/contact',
                'en_path' => '/en/contact',
                'changefreq' => 'monthly',
                'priority' => '0.8',
            ],
        ];

        // Only published, non-trashed projects with a valid slug
        $projects = Project::published()
            ->whereNotNull('slug')
            ->orderBy('published_at', 'desc')
            ->get();

        $xml = [];
        $xml[] = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

        // 1. Static Pages with reciprocal hreflang
        foreach ($staticPages as $page) {
            $arUrl = htmlspecialchars($baseUrl . $page['ar_path'], ENT_XML1, 'UTF-8');
            $enUrl = htmlspecialchars($baseUrl . $page['en_path'], ENT_XML1, 'UTF-8');
            $xDefault = $arUrl;

            // Arabic entry
            $xml[] = '  <url>';
            $xml[] = "    <loc>{$arUrl}</loc>";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"ar\" href=\"{$arUrl}\" />";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"{$enUrl}\" />";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"{$xDefault}\" />";
            $xml[] = "    <changefreq>{$page['changefreq']}</changefreq>";
            $xml[] = "    <priority>{$page['priority']}</priority>";
            $xml[] = '  </url>';

            // English entry
            $xml[] = '  <url>';
            $xml[] = "    <loc>{$enUrl}</loc>";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"ar\" href=\"{$arUrl}\" />";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"{$enUrl}\" />";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"{$xDefault}\" />";
            $xml[] = "    <changefreq>{$page['changefreq']}</changefreq>";
            $xml[] = "    <priority>{$page['priority']}</priority>";
            $xml[] = '  </url>';
        }

        // 2. Published Projects with reciprocal hreflang
        foreach ($projects as $project) {
            $slug = $project->slug;
            $arUrl = htmlspecialchars("{$baseUrl}/ar/projects/{$slug}", ENT_XML1, 'UTF-8');
            $enUrl = htmlspecialchars("{$baseUrl}/en/projects/{$slug}", ENT_XML1, 'UTF-8');
            $xDefault = $arUrl;
            $lastmod = ($project->updated_at ?? $project->published_at ?? Carbon::now())->toIso8601String();

            // Arabic project entry
            $xml[] = '  <url>';
            $xml[] = "    <loc>{$arUrl}</loc>";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"ar\" href=\"{$arUrl}\" />";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"{$enUrl}\" />";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"{$xDefault}\" />";
            $xml[] = "    <lastmod>{$lastmod}</lastmod>";
            $xml[] = '    <changefreq>weekly</changefreq>';
            $xml[] = '    <priority>0.8</priority>';
            $xml[] = '  </url>';

            // English project entry
            $xml[] = '  <url>';
            $xml[] = "    <loc>{$enUrl}</loc>";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"ar\" href=\"{$arUrl}\" />";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"{$enUrl}\" />";
            $xml[] = "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"{$xDefault}\" />";
            $xml[] = "    <lastmod>{$lastmod}</lastmod>";
            $xml[] = '    <changefreq>weekly</changefreq>';
            $xml[] = '    <priority>0.8</priority>';
            $xml[] = '  </url>';
        }

        $xml[] = '</urlset>';

        return implode("\n", $xml);
    }

    /**
     * Resolve the base site URL for generating absolute links.
     */
    public function getBaseUrl(): string
    {
        $frontendUrl = config('app.frontend_url') ?? env('FRONTEND_URL');
        if (!empty($frontendUrl)) {
            return rtrim($frontendUrl, '/');
        }

        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return rtrim(config('app.url', 'https://mohammed-portfolio.com'), '/');
        }

        return rtrim(url('/'), '/');
    }
}

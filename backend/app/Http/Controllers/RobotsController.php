<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class RobotsController extends Controller
{
    /**
     * Return dynamic robots.txt directives for web crawlers.
     */
    public function index(): Response
    {
        $baseUrl = rtrim(config('app.url') ?: config('app.frontend_url', 'https://mohammed-portfolio.com'), '/');

        $lines = [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /admin/',
            'Disallow: /api',
            'Disallow: /api/',
            '',
            "Sitemap: {$baseUrl}/sitemap.xml",
            '',
        ];

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}

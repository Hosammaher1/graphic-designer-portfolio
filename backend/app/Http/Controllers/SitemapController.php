<?php

namespace App\Http\Controllers;

use App\Services\Seo\SitemapService;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Render the cached or generated XML sitemap.
     */
    public function index(SitemapService $sitemapService): Response
    {
        $xml = $sitemapService->getXml();

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}

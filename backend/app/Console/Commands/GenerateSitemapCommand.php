<?php

namespace App\Console\Commands;

use App\Services\Seo\SitemapService;
use Illuminate\Console\Command;

class GenerateSitemapCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sitemap:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate and cache the XML sitemap for search engines';

    /**
     * Execute the console command.
     */
    public function handle(SitemapService $sitemapService): int
    {
        $this->info('Generating XML sitemap...');

        $xml = $sitemapService->getXml(true);

        $publicPath = public_path('sitemap.xml');
        @file_put_contents($publicPath, $xml);

        $this->info('XML sitemap successfully generated and cached at ' . $publicPath);
        return self::SUCCESS;
    }
}

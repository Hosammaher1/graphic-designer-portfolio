<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\Tool;
use App\Services\Publishing\ProjectPublishingService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DevPortfolioSeeder extends Seeder
{
    /**
     * Run the development seeder to create realistic sample projects.
     */
    public function run(): void
    {
        // 1. Categories
        $brandingCat = Category::updateOrCreate(
            ['slug' => 'brand-identity'],
            ['sort_order' => 1, 'is_active' => true]
        );
        $brandingCat->translations()->updateOrCreate(
            ['locale' => 'en'],
            ['name' => 'Brand Identity', 'description' => 'Comprehensive branding, visual systems, and identity suites.']
        );
        $brandingCat->translations()->updateOrCreate(
            ['locale' => 'ar'],
            ['name' => 'الهوية البصرية', 'description' => 'هويات تجارية ونظم تصميمية متكاملة وسرد بصري مؤثر.']
        );

        $packagingCat = Category::updateOrCreate(
            ['slug' => 'packaging-design'],
            ['sort_order' => 2, 'is_active' => true]
        );
        $packagingCat->translations()->updateOrCreate(
            ['locale' => 'en'],
            ['name' => 'Packaging Design', 'description' => 'Tactile luxury packaging and structural unboxing design.']
        );
        $packagingCat->translations()->updateOrCreate(
            ['locale' => 'ar'],
            ['name' => 'تصميم التغليف', 'description' => 'تغليف فاخر للمنتجات وتجربة فتح عبوة حسية ومستدامة.']
        );

        $editorialCat = Category::updateOrCreate(
            ['slug' => 'editorial-print'],
            ['sort_order' => 3, 'is_active' => true]
        );
        $editorialCat->translations()->updateOrCreate(
            ['locale' => 'en'],
            ['name' => 'Editorial & Print', 'description' => 'Art books, bespoke typography, and editorial layouts.']
        );
        $editorialCat->translations()->updateOrCreate(
            ['locale' => 'ar'],
            ['name' => 'المطبوعات والتحرير', 'description' => 'كتب فنية، ومطبوعات فاخرة، وتصميم طباعي متقدم.']
        );

        // 2. Tools
        $illustrator = Tool::updateOrCreate(['slug' => 'adobe-illustrator'], ['name' => 'Adobe Illustrator']);
        $photoshop = Tool::updateOrCreate(['slug' => 'adobe-photoshop'], ['name' => 'Adobe Photoshop']);
        $figma = Tool::updateOrCreate(['slug' => 'figma'], ['name' => 'Figma']);

        // 3. Media Assets
        $media1 = MediaAsset::firstOrCreate(
            ['filename' => 'noya-cover.jpg'],
            [
                'original_filename' => 'noya-cover.jpg',
                'url' => '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png',
                'mime_type' => 'image/png',
                'file_size_bytes' => 1024000,
                'width' => 2560,
                'height' => 1440,
                'alt_en' => 'Noya Skincare Identity and Packaging',
                'alt_ar' => 'هوية وتغليف منتجات نويا للعناية',
            ]
        );

        $media2 = MediaAsset::firstOrCreate(
            ['filename' => 'kinetic-cover.jpg'],
            [
                'original_filename' => 'kinetic-cover.jpg',
                'url' => '/assets/aistudio/Kinetic_Atelier_04_351f0c2a.png',
                'mime_type' => 'image/png',
                'file_size_bytes' => 1024000,
                'width' => 2560,
                'height' => 1440,
                'alt_en' => 'Kinetic Atelier Motion & Identity',
                'alt_ar' => 'هوية كينيتيك أتيليه الفنية',
            ]
        );

        $media3 = MediaAsset::firstOrCreate(
            ['filename' => 'kanso-cover.jpg'],
            [
                'original_filename' => 'kanso-cover.jpg',
                'url' => '/assets/aistudio/Kanso_Tea_Co_02_e10ce094.png',
                'mime_type' => 'image/png',
                'file_size_bytes' => 1024000,
                'width' => 2560,
                'height' => 1440,
                'alt_en' => 'Kanso Tea Packaging Identity',
                'alt_ar' => 'هوية وتغليف شاي كانسو',
            ]
        );

        $publishingService = app(ProjectPublishingService::class);

        // Project 1: Noya
        $proj1 = Project::updateOrCreate(
            ['slug' => 'noya-skincare'],
            [
                'status' => 'draft',
                'is_featured' => true,
                'year' => 2025,
                'client' => 'Noya Skincare Labs',
                'cover_media_id' => $media1->id,
            ]
        );
        $proj1->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Noya Skincare',
                'summary' => 'Botanical luxury skincare brand identity, packaging suite, and visual storytelling.',
                'description' => 'A comprehensive branding and packaging identity created for Noya, an organic skincare line celebrating natural botanical purity. Features delicate botanical leaf motifs, warm pastel blush and travertine tones, and clean typography communicating understated luxury.',
                'seo_title' => 'Noya Skincare — Brand & Packaging Design',
                'seo_description' => 'Comprehensive branding and packaging identity suite for Noya Skincare.',
            ]
        );
        $proj1->translations()->updateOrCreate(
            ['locale' => 'ar'],
            [
                'title' => 'نويا لمستحضرات العناية',
                'summary' => 'هوية متكاملة وتصميم تغليف فاخر لمستحضرات العناية الطبيعية بالبشرة.',
                'description' => 'هوية متكاملة وتصميم تغليف صُمم لعلامة نويا للعناية الطبيعية بالبشرة. يتميز التصميم برسمة أوراق نباتية رقيقة، وتدرجات الوردي والبيج الحجري الدافئ، وطباعة نقية تعكس الفخامة الهادئة والعناية الفائقة.',
                'seo_title' => 'نويا لمستحضرات العناية — تصميم الهوية والتغليف',
                'seo_description' => 'هوية متكاملة وتصميم تغليف فاخر صُمم لعلامة نويا لمستحضرات العناية.',
            ]
        );
        $proj1->categories()->sync([$brandingCat->id, $packagingCat->id]);
        $proj1->tools()->sync([$illustrator->id, $photoshop->id]);
        $publishingService->publish($proj1);

        // Project 2: Kinetic
        $proj2 = Project::updateOrCreate(
            ['slug' => 'kinetic-atelier'],
            [
                'status' => 'draft',
                'is_featured' => true,
                'year' => 2024,
                'client' => 'Kinetic Motion Studio',
                'cover_media_id' => $media2->id,
            ]
        );
        $proj2->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Kinetic Atelier',
                'summary' => 'Dynamic visual identity, fluid typography, and digital motion system for a creative studio.',
                'description' => 'A cutting-edge visual identity crafted for a premier digital animation and motion atelier. The system explores dynamic variable typography, responsive layout structures, and high-contrast dark aesthetic.',
                'seo_title' => 'Kinetic Atelier — Identity & Motion Design',
                'seo_description' => 'Dynamic visual identity and digital motion system for Kinetic Atelier.',
            ]
        );
        $proj2->translations()->updateOrCreate(
            ['locale' => 'ar'],
            [
                'title' => 'كينيتيك أتيليه',
                'summary' => 'هوية بصرية تفاعلية، وطباعة متغيرة، ونظام حركة رقمي متقدم لاستوديو إبداعي.',
                'description' => 'هوية بصرية معاصرة صُممت لأستوديو رسوم متحركة وإنتاج رقمي رائد. يرتكز النظام على خطوط ديناميكية متغيرة، وتخطيطات مرنة، وتباين لوني فاخر.',
                'seo_title' => 'كينيتيك أتيليه — الهوية البصرية والموشن',
                'seo_description' => 'هوية بصرية متطورة ونظام حركة رقمي مصمم لاستوديو كينيتيك أتيليه.',
            ]
        );
        $proj2->categories()->sync([$brandingCat->id]);
        $proj2->tools()->sync([$illustrator->id, $figma->id]);
        $publishingService->publish($proj2);

        // Project 3: Kanso
        $proj3 = Project::updateOrCreate(
            ['slug' => 'kanso-tea'],
            [
                'status' => 'draft',
                'is_featured' => true,
                'year' => 2024,
                'client' => 'Kanso Artisanal Teas',
                'cover_media_id' => $media3->id,
            ]
        );
        $proj3->translations()->updateOrCreate(
            ['locale' => 'en'],
            [
                'title' => 'Kanso Tea Co.',
                'summary' => 'Minimalist artisanal tea packaging, custom kanji calligraphy, and sustainable matte paper tubes.',
                'description' => 'Inspired by the Japanese Zen aesthetic of simplicity and naturalness, Kanso balances quiet minimalism with exquisite physical craft.',
                'seo_title' => 'Kanso Tea Co. — Packaging & Identity',
                'seo_description' => 'Minimalist packaging design and branding for Kanso Artisanal Teas.',
            ]
        );
        $proj3->translations()->updateOrCreate(
            ['locale' => 'ar'],
            [
                'title' => 'شاي كانسو الحرفي',
                'summary' => 'تصميم تغليف شاي بسيط ومستدام مستوحى من فلسفة الهدوء والطبيعة اليابانية.',
                'description' => 'مستوحى من فلسفة البساطة والطبيعة الهادئة، يجمع كانسو بين التصميم الهادئ والحرفية العالية في استخدام الأوراق القطنية والطباعة البارزة.',
                'seo_title' => 'شاي كانسو — تصميم التغليف والهوية',
                'seo_description' => 'تصميم تغليف مبتكر وهوية بصرية مستوحاة من فلسفة الشاي اليابانية التقليدية.',
            ]
        );
        $proj3->categories()->sync([$packagingCat->id, $editorialCat->id]);
        $proj3->tools()->sync([$illustrator->id, $photoshop->id]);
        $publishingService->publish($proj3);
    }
}

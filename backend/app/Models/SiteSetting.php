<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SiteSetting extends Model
{
    use HasFactory;

    protected $table = 'site_settings';

    protected $fillable = [
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    public const CACHE_KEY = 'site_settings_public';

    /**
     * Get a setting by key with fallback.
     */
    public static function getSetting(string $key, mixed $default = null): mixed
    {
        $record = static::where('key', $key)->first();
        return $record ? $record->value : $default;
    }

    /**
     * Store or update a setting by key.
     */
    public static function setSetting(string $key, mixed $value): self
    {
        $record = static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );

        Cache::forget(self::CACHE_KEY);

        return $record;
    }

    /**
     * Return default fallback settings array.
     */
    public static function defaultSettings(): array
    {
        return [
            'profile' => [
                'name' => 'Hosam Maher',
                'nameAr' => 'حسام ماهر',
                'taglineEn' => 'Cinematic Graphic Designer & Visual Identity Specialist',
                'taglineAr' => 'مصمم جرافيك وهويات بصرية ذات طابع سينمائي',
                'bioEn' => 'Turning ideas into meaningful visual experiences through design, branding, and detail.',
                'bioAr' => 'تحويل الأفكار إلى تجارب بصرية ذات معنى عبر التصميم، وبناء العلامة، والاهتمام بأدق التفاصيل.',
                'email' => 'hosam.maher48@gmail.com',
                'behanceUrl' => 'https://behance.net',
                'dribbbleUrl' => 'https://dribbble.com',
                'instagramUrl' => 'https://instagram.com',
                'linkedinUrl' => 'https://linkedin.com',
            ],
            'branding' => [
                'monogram' => 'GD',
                'studioName' => 'Hosam Maher Studio',
                'accentColor' => '#f4a496',
            ],
            'hero' => [
                'kickerEn' => "Hello, I'm a",
                'kickerAr' => 'مرحباً، أنا',
                'titleStartEn' => 'Graphic',
                'titleStartAr' => 'مصمم',
                'titleAccentEn' => 'Designer',
                'titleAccentAr' => 'جرافيك',
                'descEn' => 'Turning ideas into meaningful visual experiences through design, branding, and detail.',
                'descAr' => 'تحويل الأفكار إلى تجارب بصرية ذات معنى عبر التصميم، وبناء العلامة، والاهتمام بأدق التفاصيل.',
                'viewWorkEn' => 'View My Work',
                'viewWorkAr' => 'استكشف أعمالي',
                'aboutMeEn' => 'About Me',
                'aboutMeAr' => 'نبذة عني',
            ],
            'about' => [
                'kickerEn' => '03 / About Me ——',
                'kickerAr' => '03 / نبذة عني ——',
                'titleStartEn' => 'About',
                'titleStartAr' => 'نبذة',
                'titleAccentEn' => 'Me',
                'titleAccentAr' => 'عني',
                'descEn' => 'A senior multi-disciplinary graphic designer specialized in crafting bespoke brand identities, tactile packaging suites, and high-impact visual narratives.',
                'descAr' => 'مصمم جرافيك متعدد التخصصات متخصص في ابتكار الهويات البصرية المتكاملة، وتصميم التغليف الفاخر، والسرد البصري ذو الأثر العميق.',
                'statProjects' => '50+',
                'statClients' => '20+',
                'statYears' => '5+',
                'badgeTitleEn' => 'Graphic Designer',
                'badgeTitleAr' => 'مصمم جرافيك',
                'badgeSubtitleEn' => 'Visual Systems & Packaging',
                'badgeSubtitleAr' => 'نظم بصرية وتغليف',
            ],
            'skills' => [
                'kickerEn' => '04 / Skills & Expertise ——',
                'kickerAr' => '04 / المهارات والخبرات ——',
                'titleStartEn' => 'Skills &',
                'titleStartAr' => 'المهارات',
                'titleAccentEn' => 'Expertise',
                'titleAccentAr' => 'والخبرات',
                'descEn' => 'A rigorous fusion of design strategy, meticulous typography, and modern digital workflows.',
                'descAr' => 'مزيج دقيق من استراتيجية التصميم، والطباعة الراقية، وسير العمل الرقمي الحديث.',
                'items' => [
                    ['id' => 'branding', 'titleEn' => 'Brand Identity & Systems', 'titleAr' => 'الهوية البصرية والنظم التصميمية'],
                    ['id' => 'packaging', 'titleEn' => 'Luxury Packaging Design', 'titleAr' => 'تصميم التغليف الفاخر'],
                    ['id' => 'typography', 'titleEn' => 'Bilingual Typography', 'titleAr' => 'الطباعة ثنائية اللغة والتنضيد'],
                    ['id' => 'art-direction', 'titleEn' => 'Creative & Art Direction', 'titleAr' => 'الإدارة الإبداعية والفنية'],
                    ['id' => 'editorial', 'titleEn' => 'Editorial & Print Layout', 'titleAr' => 'التصميم التحريري والمطبوعات'],
                    ['id' => 'motion', 'titleEn' => 'Motion & Digital Collateral', 'titleAr' => 'الموشن جرافيك والمحتوى الرقمي'],
                ],
            ],
            'contact' => [
                'directEmail' => 'hosam.maher48@gmail.com',
                'availabilityEn' => 'Available for freelance & select projects',
                'availabilityAr' => 'متاح للمشاريع الإبداعية والاستشارات المختارة',
            ],
            'preferences' => [
                'defaultLanguage' => 'en',
                'featuredMode' => 'manual',
                'enableCarouselAutoplay' => false,
                'showContactForm' => true,
            ],
        ];
    }
}

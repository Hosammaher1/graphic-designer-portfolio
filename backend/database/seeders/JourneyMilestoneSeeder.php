<?php

namespace Database\Seeders;

use App\Models\JourneyMilestone;
use Illuminate\Database\Seeder;

class JourneyMilestoneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $milestones = [
            [
                'year' => '2022',
                'role_en' => 'Education',
                'role_ar' => 'المرحلة التعليمية',
                'company_en' => 'Multimedia & Web Design',
                'company_ar' => 'تخصص الوسائط وتصميم الويب',
                'location_en' => 'Cairo, Egypt',
                'location_ar' => 'القاهرة، مصر',
                'description_en' => 'Began academic studies in Multimedia & Web Development, building a strong foundation in visual fundamentals, color theory, and digital craftsmanship.',
                'description_ar' => 'بدأت دراستي الأكاديمية في الوسائط المتعددة وتطوير الويب، مع التركيز على أسس التصميم البصري ونظريات الألوان.',
                'icon_name' => 'GraduationCap',
                'image_url' => null,
                'tags' => ['Fundamentals', 'Color Theory', 'Typography'],
                'achievements' => [
                    ['en' => 'Mastered typography and grid foundations', 'ar' => 'إتقان قواعد التايبوغرافي والنظم الشبكية'],
                    ['en' => 'Completed advanced vector illustration workshops', 'ar' => 'إتمام ورش متقدمة في الرسم المتجهي'],
                ],
                'sort_order' => 1,
                'is_visible' => true,
                'is_published' => true,
            ],
            [
                'year' => '2023',
                'role_en' => 'First Projects',
                'role_ar' => 'أولى المشاريع العملية',
                'company_en' => 'Independent Practice',
                'company_ar' => 'الممارسة والتطبيق العملي',
                'location_en' => 'Remote',
                'location_ar' => 'عن بُعد',
                'description_en' => 'Started creating real-world design work, exploring brand identities, package designs, and establishing my portfolio aesthetic.',
                'description_ar' => 'الانطلاق في تنفيذ مشاريع حقيقية واستكشاف الهويات البصرية وتصميم العلب وتأسيس هوية المعرض الخاص بي.',
                'icon_name' => 'Laptop',
                'image_url' => null,
                'tags' => ['Brand Identity', 'Packaging', 'Portfolio'],
                'achievements' => [
                    ['en' => 'Designed complete visual identities for 10+ local brands', 'ar' => 'تصميم هويات متكاملة لأكثر من 10 علامات تجارية'],
                    ['en' => 'Built an international network of design collaborators', 'ar' => 'بناء شبكة تواصل مع مصممين من مختلف الدول'],
                ],
                'sort_order' => 2,
                'is_visible' => true,
                'is_published' => true,
            ],
            [
                'year' => '2024',
                'role_en' => 'Freelance Experience',
                'role_ar' => 'العمل الحر الاحترافي',
                'company_en' => 'Studio & Private Clients',
                'company_ar' => 'الاستوديو والعملاء المباشرون',
                'location_en' => 'Global & Regional',
                'location_ar' => 'محلياً ودولياً',
                'description_en' => 'Collaborated with diverse local and international clients across Europe and the Middle East, delivering bespoke design solutions.',
                'description_ar' => 'التعاون مع عملاء محليين ودوليين في أوروبا والشرق الأوسط لتقديم حلول تصميم راقية ومؤثرة.',
                'icon_name' => 'Briefcase',
                'image_url' => null,
                'tags' => ['Client Work', 'Creative Direction', 'Global'],
                'achievements' => [
                    ['en' => 'Delivered high-profile packaging for premium skincare brands', 'ar' => 'تنفيذ تصاميم تغليف رفيعة المستوى لعلامات العناية'],
                    ['en' => 'Created dynamic social campaigns with over 1M combined reach', 'ar' => 'ابتكار حملات تواصل حققت أكثر من مليون وصول'],
                ],
                'sort_order' => 3,
                'is_visible' => true,
                'is_published' => true,
            ],
            [
                'year' => '2025',
                'role_en' => 'Skill Expansion',
                'role_ar' => 'توسيع المهارات المتقدمة',
                'company_en' => 'Senior Designer Practice',
                'company_ar' => 'ممارسة التصميم المتقدم',
                'location_en' => 'Studio & Remote',
                'location_ar' => 'الاستوديو وعن بُعد',
                'description_en' => 'Elevated practice to full 3D spatial renders, motion design, and high-fashion editorial direction.',
                'description_ar' => 'تطوير المهارات لتشمل الرندر ثلاثي الأبعاد، والتصميم الحركي، والإدارة الفنية للمنشورات التحريرية.',
                'icon_name' => 'Award',
                'image_url' => null,
                'tags' => ['Motion Design', '3D Blender', 'Art Direction'],
                'achievements' => [
                    ['en' => 'Launched Noya Skincare packaging to global design acclaim', 'ar' => 'إطلاق هوية نويا التي نالت استحساناً عالمياً'],
                    ['en' => 'Integrated Blender 3D for spatial product unboxing simulations', 'ar' => 'دمج تقنيات بلندر ثلاثية الأبعاد لمحاكاة فتح العبوات'],
                ],
                'sort_order' => 4,
                'is_visible' => true,
                'is_published' => true,
            ],
            [
                'year' => '2026+',
                'role_en' => 'What’s Next?',
                'role_ar' => 'ما هو القادم؟',
                'company_en' => 'Future Horizons',
                'company_ar' => 'آفاق المستقبل',
                'location_en' => 'Worldwide',
                'location_ar' => 'عالمياً',
                'description_en' => 'Continuing to push visual boundaries, exploring generative spatial design, and taking on international brand direction challenges.',
                'description_ar' => 'مواصلة الابتكار واستكشاف التصاميم المكانية وتولي مشاريع كبرى للعلامات التجارية العالمية.',
                'icon_name' => 'Rocket',
                'image_url' => null,
                'tags' => ['Innovation', 'Leadership', 'Next Chapter'],
                'achievements' => [
                    ['en' => 'Exploring AI-augmented creative pipelines', 'ar' => 'استكشاف مسارات العمل الإبداعية المعززة بالذكاء الاصطناعي'],
                    ['en' => 'Preparing international solo design exhibition', 'ar' => 'الإعداد لمعرض فني تصميمي فردي دولي'],
                ],
                'sort_order' => 5,
                'is_visible' => true,
                'is_published' => true,
            ],
        ];

        foreach ($milestones as $item) {
            JourneyMilestone::updateOrCreate(
                ['year' => $item['year'], 'role_en' => $item['role_en']],
                $item
            );
        }
    }
}

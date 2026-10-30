import React from 'react';
import { Layout, Palette, Type, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Select } from '../components/ui';

export function LayoutControls({
  settings = {},
  onChange,
  locale = 'ar',
}) {
  const isAr = locale === 'ar';

  const layout = settings.layout || {};
  const background = settings.background || {};
  const typography = settings.typography || {};
  const media = settings.media || {};
  const animation = settings.animation || {};

  const handleUpdate = (section, field, value) => {
    if (typeof onChange !== 'function') return;

    onChange({
      ...settings,
      [section]: {
        ...(settings[section] || {}),
        [field]: value,
      },
    });
  };

  return (
    <Card className="builder-layout-controls-card">
      <CardHeader>
        <CardTitle as="h3" className="text-base flex items-center gap-2">
          <Layout size={18} aria-hidden="true" />
          <span>{isAr ? 'إعدادات التخطيط والتنسيق' : 'Layout & Design Controls'}</span>
        </CardTitle>
        <CardDescription>
          {isAr
            ? 'تخصيص الأعمدة، الفواصل، الألوان، والمؤثرات الحركية لقالب الكتلة.'
            : 'Configure columns, gaps, palette tokens, and motion presets.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 1. Columns & Gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="control-columns"
            label={isAr ? 'عدد الأعمدة' : 'Columns'}
            value={String(layout.columns || 1)}
            onChange={(e) => handleUpdate('layout', 'columns', parseInt(e.target.value, 10))}
          >
            <option value="1">1 {isAr ? 'عمود' : 'Column'}</option>
            <option value="2">2 {isAr ? 'عمودين' : 'Columns'}</option>
            <option value="3">3 {isAr ? 'أعمدة' : 'Columns'}</option>
            <option value="4">4 {isAr ? 'أعمدة' : 'Columns'}</option>
          </Select>

          <Select
            id="control-gap"
            label={isAr ? 'المسافة البينية (Gap)' : 'Gap Spacing'}
            value={layout.gap || 'md'}
            onChange={(e) => handleUpdate('layout', 'gap', e.target.value)}
          >
            <option value="none">{isAr ? 'بدون مسافة (None)' : 'None (0)'}</option>
            <option value="xs">XS (0.25rem)</option>
            <option value="sm">SM (0.5rem)</option>
            <option value="md">MD (1rem)</option>
            <option value="lg">LG (1.5rem)</option>
            <option value="xl">XL (2rem)</option>
          </Select>
        </div>

        {/* 2. Alignment & Mobile Stacking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <Select
            id="control-align"
            label={isAr ? 'المحاذاة الأفقية' : 'Alignment'}
            value={layout.align || 'left'}
            onChange={(e) => handleUpdate('layout', 'align', e.target.value)}
          >
            <option value="left">{isAr ? 'يسار' : 'Left'}</option>
            <option value="center">{isAr ? 'وسط' : 'Center'}</option>
            <option value="right">{isAr ? 'يمين' : 'Right'}</option>
            <option value="justify">{isAr ? 'محاذاة كاملة (Justify)' : 'Justify'}</option>
          </Select>

          <div className="pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                id="control-stack-mobile"
                checked={layout.stack_on_mobile !== false}
                onChange={(e) => handleUpdate('layout', 'stack_on_mobile', e.target.checked)}
                className="checkbox-input rounded border-border"
              />
              <span>
                {isAr
                  ? 'التكديس العمودي على الشاشات الصغيرة'
                  : 'Stack vertically on mobile viewports'}
              </span>
            </label>
          </div>
        </div>

        {/* 3. Background Semantic Token */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="control-bg-theme"
            label={isAr ? 'خلفية الكتلة' : 'Background Theme'}
            value={background.theme || 'base'}
            onChange={(e) => handleUpdate('background', 'theme', e.target.value)}
          >
            <option value="base">{isAr ? 'الأساسية (Base)' : 'Base'}</option>
            <option value="surface">{isAr ? 'سطح البطاقة (Surface)' : 'Surface'}</option>
            <option value="elevated">{isAr ? 'مرتفعة (Elevated)' : 'Elevated'}</option>
            <option value="muted">{isAr ? 'خافتة (Muted)' : 'Muted'}</option>
            <option value="primary">{isAr ? 'اللون الرئيسي (Primary)' : 'Primary Accent'}</option>
          </Select>

          {/* 4. Typography Scale */}
          <Select
            id="control-type-scale"
            label={isAr ? 'المقياس الطباعي' : 'Typography Scale'}
            value={typography.scale || 'base'}
            onChange={(e) => handleUpdate('typography', 'scale', e.target.value)}
          >
            <option value="sm">SM (0.875rem)</option>
            <option value="base">Base (1rem)</option>
            <option value="lg">LG (1.125rem)</option>
            <option value="xl">XL (1.25rem)</option>
            <option value="2xl">2XL (1.5rem)</option>
            <option value="3xl">3XL (1.875rem)</option>
            <option value="4xl">4XL (2.25rem)</option>
            <option value="display">Display (3rem)</option>
          </Select>
        </div>

        {/* 5. Image Aspect Ratio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="control-aspect-ratio"
            label={isAr ? 'تناسب أبعاد الصورة' : 'Image Aspect Ratio'}
            value={media.aspect_ratio || '16:9'}
            onChange={(e) => handleUpdate('media', 'aspect_ratio', e.target.value)}
          >
            <option value="16:9">16:9 ({isAr ? 'عرضي عريض' : 'Widescreen'})</option>
            <option value="4:3">4:3 ({isAr ? 'كلاسيكي' : 'Classic'})</option>
            <option value="1:1">1:1 ({isAr ? 'مربع' : 'Square'})</option>
            <option value="3:2">3:2 ({isAr ? 'فوتوغرافي' : 'Photo'})</option>
            <option value="auto">{isAr ? 'تلقائي' : 'Auto'}</option>
          </Select>

          {/* 6. Motion Presets */}
          <Select
            id="control-motion"
            label={isAr ? 'حركة الظهور' : 'Motion Preset'}
            value={animation.preset || 'none'}
            onChange={(e) => handleUpdate('animation', 'preset', e.target.value)}
          >
            <option value="none">{isAr ? 'بدون حركة' : 'None'}</option>
            <option value="fade-in">{isAr ? 'تلاشي تدريجي (Fade In)' : 'Fade In'}</option>
            <option value="slide-up">{isAr ? 'انزلاق للأعلى (Slide Up)' : 'Slide Up'}</option>
            <option value="scale-in">{isAr ? 'تكبير هادئ (Scale In)' : 'Scale In'}</option>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

export default LayoutControls;

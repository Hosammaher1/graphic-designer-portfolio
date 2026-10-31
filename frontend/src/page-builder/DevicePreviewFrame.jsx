import React, { useState } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button, Badge } from '../components/ui';

export const DEVICE_VIEWPORTS = {
  desktop: {
    id: 'desktop',
    maxWidth: '100%',
    label: { ar: 'سطح المكتب (1440px)', en: 'Desktop (1440px)' },
    shortLabel: { ar: 'سطح المكتب', en: 'Desktop' },
    className: 'viewport-desktop',
    icon: Monitor,
  },
  tablet: {
    id: 'tablet',
    maxWidth: '768px',
    label: { ar: 'جهاز لوحي (768px)', en: 'Tablet (768px)' },
    shortLabel: { ar: 'جهاز لوحي', en: 'Tablet' },
    className: 'viewport-tablet',
    icon: Tablet,
  },
  mobile: {
    id: 'mobile',
    maxWidth: '390px',
    label: { ar: 'هاتف ذكي (390px)', en: 'Mobile (390px)' },
    shortLabel: { ar: 'هاتف ذكي', en: 'Mobile' },
    className: 'viewport-mobile',
    icon: Smartphone,
  },
};

export function DevicePreviewFrame({
  children,
  locale = 'ar',
  initialViewport = 'desktop',
  currentViewport: controlledViewport,
  onViewportChange,
  showToolbar = true,
}) {
  const isAr = locale === 'ar';
  const [internalViewport, setInternalViewport] = useState(initialViewport);

  const activeViewport = controlledViewport !== undefined ? controlledViewport : internalViewport;

  const handleSelectViewport = (deviceKey) => {
    if (controlledViewport === undefined) {
      setInternalViewport(deviceKey);
    }
    if (typeof onViewportChange === 'function') {
      onViewportChange(deviceKey);
    }
  };

  const currentDevice = DEVICE_VIEWPORTS[activeViewport] || DEVICE_VIEWPORTS.desktop;

  return (
    <div className="device-preview-wrapper w-full">
      {/* 1. Viewport Toolbar */}
      {showToolbar && (
        <div
          role="toolbar"
          aria-label={isAr ? 'عناصر التحكم في أبعاد شاشات المعاينة' : 'Device Viewport Controls'}
          className="device-preview-toolbar flex flex-wrap items-center justify-between gap-3 p-2.5 bg-muted/40 border border-border rounded-lg mb-4"
        >
          {/* Active Viewport Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {currentDevice.label[locale] || currentDevice.label.en}
            </Badge>
            <span className="text-xs text-muted hidden sm:inline">
              {activeViewport === 'desktop'
                ? isAr
                  ? 'عرض مرن كامل (Full Width)'
                  : 'Full Responsive Width'
                : activeViewport === 'tablet'
                ? '768 × 1024 px'
                : '390 × 844 px'}
            </span>
          </div>

          {/* Switcher Buttons */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-md border border-border shadow-xs">
            {Object.values(DEVICE_VIEWPORTS).map((device) => {
              const Icon = device.icon;
              const isSelected = activeViewport === device.id;
              return (
                <button
                  key={device.id}
                  type="button"
                  data-testid={`viewport-btn-${device.id}`}
                  role="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectViewport(device.id)}
                  aria-label={device.label[locale] || device.label.en}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-fg shadow-xs'
                      : 'text-muted hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span>{device.shortLabel[locale] || device.shortLabel.en}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Scaled / Contained Viewport Area */}
      <div className="preview-canvas-outer w-full overflow-x-auto py-2 flex justify-center">
        <div
          data-testid="device-preview-viewport"
          className={`device-preview-viewport transition-all duration-300 ease-in-out ${
            currentDevice.className
          } ${
            activeViewport !== 'desktop'
              ? 'border-2 border-border/80 shadow-lg rounded-2xl bg-base p-4 min-h-[400px]'
              : 'w-full'
          }`}
          style={{
            width: '100%',
            maxWidth: currentDevice.maxWidth,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default DevicePreviewFrame;

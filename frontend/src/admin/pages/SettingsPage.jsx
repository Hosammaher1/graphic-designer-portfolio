import React, { useState } from 'react';
import {
  User,
  Palette,
  Sliders,
  Shield,
  Save,
  Sparkles,
  Mail,
  Lock,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';

export function SettingsPage() {
  const { lang, t, settings, updateStudioSettings, addToast } = useAdmin();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'branding' | 'preferences' | 'security'

  // Profile form state
  const [name, setName] = useState(settings.profile?.name || 'Hosam Maher');
  const [taglineEn, setTaglineEn] = useState(settings.profile?.taglineEn || '');
  const [taglineAr, setTaglineAr] = useState(settings.profile?.taglineAr || '');
  const [bioEn, setBioEn] = useState(settings.profile?.bioEn || '');
  const [bioAr, setBioAr] = useState(settings.profile?.bioAr || '');
  const [email, setEmail] = useState(settings.profile?.email || 'hosam.maher48@gmail.com');
  const [behance, setBehance] = useState(settings.profile?.behanceUrl || '');
  const [dribbble, setDribbble] = useState(settings.profile?.dribbbleUrl || '');
  const [instagram, setInstagram] = useState(settings.profile?.instagramUrl || '');
  const [linkedin, setLinkedin] = useState(settings.profile?.linkedinUrl || '');

  // Branding form state
  const [monogram, setMonogram] = useState(settings.branding?.monogram || 'GD');
  const [studioName, setStudioName] = useState(settings.branding?.studioName || 'Hosam Maher Studio');
  const [accentColor, setAccentColor] = useState(settings.branding?.accentColor || '#f4a496');

  // Preferences form state
  const [defaultLang, setDefaultLang] = useState(settings.preferences?.defaultLanguage || 'en');
  const [featuredMode, setFeaturedMode] = useState(settings.preferences?.featuredMode || 'manual');
  const [carouselAutoplay, setCarouselAutoplay] = useState(!!settings.preferences?.enableCarouselAutoplay);
  const [showContactForm, setShowContactForm] = useState(settings.preferences?.showContactForm !== false);

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      updateStudioSettings({
        profile: {
          name,
          taglineEn,
          taglineAr,
          bioEn,
          bioAr,
          email,
          behanceUrl: behance,
          dribbbleUrl: dribbble,
          instagramUrl: instagram,
          linkedinUrl: linkedin,
        },
        branding: {
          monogram,
          studioName,
          accentColor,
        },
        preferences: {
          defaultLanguage: defaultLang,
          featuredMode,
          enableCarouselAutoplay: carouselAutoplay,
          showContactForm,
        },
      });
      addToast(t.settings.savedNotice, 'success');
    }, 400);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      addToast(lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'error');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast(lang === 'ar' ? 'تم تحديث كلمة المرور في النموذج التجريبي' : 'Password updated in prototype state', 'success');
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'تفضيلات الاستوديو والهوية' : 'Studio Identity & Preferences'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{t.settings.title} </span>
            <span className="text-[#f4a496] italic font-serif">Configuration</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            {t.settings.subtitle}
          </p>
        </div>

        {activeTab !== 'security' && (
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 transition-all shadow-lg shadow-black/50 cursor-pointer self-start sm:self-auto active:scale-95"
          >
            <Save className="w-4 h-4 text-[#f4a496]" />
            <span>{isSaving ? t.common.loading : t.settings.saveBtn}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto modal-scrollbar">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'glass-panel-active text-[#fcdcd4] border border-[#f4a496]/35 shadow-sm'
              : 'text-neutral-400 hover:text-white glass-panel-subtle'
          }`}
        >
          <User className="w-4 h-4 text-[#f4a496]" />
          <span>{t.settings.tabs.profile}</span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'branding'
              ? 'glass-panel-active text-[#fcdcd4] border border-[#f4a496]/35 shadow-sm'
              : 'text-neutral-400 hover:text-white glass-panel-subtle'
          }`}
        >
          <Palette className="w-4 h-4 text-[#f4a496]" />
          <span>{t.settings.tabs.branding}</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'glass-panel-active text-[#fcdcd4] border border-[#f4a496]/35 shadow-sm'
              : 'text-neutral-400 hover:text-white glass-panel-subtle'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#f4a496]" />
          <span>{t.settings.tabs.preferences}</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'glass-panel-active text-[#fcdcd4] border border-[#f4a496]/35 shadow-sm'
              : 'text-neutral-400 hover:text-white glass-panel-subtle'
          }`}
        >
          <Shield className="w-4 h-4 text-[#f4a496]" />
          <span>{t.settings.tabs.security}</span>
        </button>
      </div>

      {/* TAB 1: DESIGNER PROFILE */}
      {activeTab === 'profile' && (
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-2xl space-y-5 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.settings.designerName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.settings.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
              {t.settings.tagline} (English)
            </label>
            <input
              type="text"
              value={taglineEn}
              onChange={(e) => setTaglineEn(e.target.value)}
              className="w-full px-4 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs focus:outline-none focus:border-[#f4a496]/60 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
              {t.settings.tagline} (Arabic / العربية)
            </label>
            <input
              type="text"
              dir="rtl"
              value={taglineAr}
              onChange={(e) => setTaglineAr(e.target.value)}
              className="w-full px-4 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-arabic focus:outline-none focus:border-[#f4a496]/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.settings.bioEn}
              </label>
              <textarea
                rows={4}
                value={bioEn}
                onChange={(e) => setBioEn(e.target.value)}
                className="w-full px-4 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-[#f4a496]/60 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.settings.bioAr}
              </label>
              <textarea
                rows={4}
                dir="rtl"
                value={bioAr}
                onChange={(e) => setBioAr(e.target.value)}
                className="w-full px-4 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs leading-relaxed font-arabic focus:outline-none focus:border-[#f4a496]/60"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80">
              Social Links & Creative Portfolios
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-neutral-400 font-light">Behance</span>
                <input
                  type="text"
                  value={behance}
                  onChange={(e) => setBehance(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 font-light">Dribbble</span>
                <input
                  type="text"
                  value={dribbble}
                  onChange={(e) => setDribbble(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 font-light">Instagram</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 font-light">LinkedIn</span>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRANDING */}
      {activeTab === 'branding' && (
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-2xl space-y-5 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.settings.logoText}
              </label>
              <input
                type="text"
                value={monogram}
                onChange={(e) => setMonogram(e.target.value)}
                maxLength={4}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-sm font-serif font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                Studio Brand Name
              </label>
              <input
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-sm font-serif"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2 font-light">
              {t.settings.accentColor}
            </label>
            <div className="flex items-center gap-3">
              {[
                { name: 'Peach Rose-Gold', color: '#f4a496' },
                { name: 'Burgundy Crimson', color: '#842b45' },
                { name: 'Warm Amber', color: '#f59e0b' },
                { name: 'Velvet Plum', color: '#9d4edd' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setAccentColor(c.color)}
                  className={`w-10 h-10 rounded-2xl transition-all cursor-pointer flex items-center justify-center border ${
                    accentColor === c.color ? 'ring-2 ring-white scale-105 shadow-lg border-white/40' : 'opacity-70 hover:opacity-100 border-white/10'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                >
                  {accentColor === c.color && <CheckCircle className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-2xl space-y-5 max-w-2xl">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
              {t.settings.defaultLang}
            </label>
            <select
              value={defaultLang}
              onChange={(e) => setDefaultLang(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs cursor-pointer focus:outline-none focus:border-[#f4a496]/50"
            >
              <option value="en" className="bg-[#120a17]">English (LTR)</option>
              <option value="ar" className="bg-[#120a17]">العربية (RTL)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80">
              Selected Work Showcase Modes
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer font-light">
                <input
                  type="radio"
                  name="featuredMode"
                  value="manual"
                  checked={featuredMode === 'manual'}
                  onChange={() => setFeaturedMode('manual')}
                  className="text-[#842b45] focus:ring-0"
                />
                <span>Manually Featured Projects (Pin top curated projects)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer font-light">
                <input
                  type="radio"
                  name="featuredMode"
                  value="latest"
                  checked={featuredMode === 'latest'}
                  onChange={() => setFeaturedMode('latest')}
                  className="text-[#842b45] focus:ring-0"
                />
                <span>Latest Projects (Automatically show the most recent)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer font-light">
              <span>Enable Carousel Autoplay</span>
              <input
                type="checkbox"
                checked={carouselAutoplay}
                onChange={(e) => setCarouselAutoplay(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-[#842b45] focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer font-light">
              <span>Display Public Direct Contact Form</span>
              <input
                type="checkbox"
                checked={showContactForm}
                onChange={(e) => setShowContactForm(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-[#842b45] focus:ring-0"
              />
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & CREDENTIALS */}
      {activeTab === 'security' && (
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-2xl space-y-5 max-w-md">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.settings.currentPassword}
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs focus:outline-none focus:border-[#f4a496]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.settings.newPassword}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs focus:outline-none focus:border-[#f4a496]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.settings.confirmPassword}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs focus:outline-none focus:border-[#f4a496]/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] text-[#fcdcd4] font-semibold text-xs border border-[#f4a496]/40 transition-all shadow-md shadow-black/50 cursor-pointer"
            >
              {isSaving ? t.common.loading : t.settings.updatePasswordBtn}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

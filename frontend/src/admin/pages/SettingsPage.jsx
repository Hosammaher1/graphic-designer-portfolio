import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { MediaPickerModal } from '../components/MediaPickerModal.jsx';

export function SettingsPage() {
  const { lang, t, settings, updateStudioSettings, addToast } = useAdmin();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'branding' | 'preferences' | 'security'

  // Profile form state
  const [name, setName] = useState(settings.profile?.fullNameEn || settings.profile?.name || 'Mohammed Maher Aldaya');
  const [nameAr, setNameAr] = useState(settings.profile?.fullNameAr || settings.profile?.nameAr || 'محمد ماهر الداية');
  const [titleEn, setTitleEn] = useState(settings.profile?.titleEn || 'Graphic Designer | Visual Identity & Creative Design');
  const [titleAr, setTitleAr] = useState(settings.profile?.titleAr || 'مصمم جرافيك | متخصص في الهوية البصرية والتصميم الإبداعي');
  const [profilePhoto, setProfilePhoto] = useState(settings.profile?.profilePhoto || '/profile/mohammed-maher-profile.png');
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [taglineEn, setTaglineEn] = useState(settings.profile?.taglineEn || '');
  const [taglineAr, setTaglineAr] = useState(settings.profile?.taglineAr || '');
  const [bioEn, setBioEn] = useState(settings.profile?.bioEn || '');
  const [bioAr, setBioAr] = useState(settings.profile?.bioAr || '');
  const [email, setEmail] = useState(settings.profile?.email || 'mohmmed.maher467@gmail.com');
  const [behance, setBehance] = useState(settings.profile?.behanceUrl || '');
  const [dribbble, setDribbble] = useState(settings.profile?.dribbbleUrl || '');
  const [instagram, setInstagram] = useState(settings.profile?.instagramUrl || 'https://www.instagram.com/mohmmed_ma48/');
  const [instagramHandle, setInstagramHandle] = useState(settings.profile?.instagramHandle || settings.contact?.instagramHandle || '@mohmmed_ma48');
  const [whatsappDisplay, setWhatsappDisplay] = useState(settings.profile?.whatsappDisplay || settings.contact?.whatsappDisplay || '+972 59-238-2189');
  const [whatsappUrl, setWhatsappUrl] = useState(settings.profile?.whatsappUrl || settings.contact?.whatsappUrl || 'https://wa.me/972592382189');
  const [linkedin, setLinkedin] = useState(settings.profile?.linkedinUrl || '');

  // Hero & About Content form state
  const [heroKickerEn, setHeroKickerEn] = useState(settings.hero?.kickerEn || "Hello, I'm a");
  const [heroKickerAr, setHeroKickerAr] = useState(settings.hero?.kickerAr || 'مرحباً، أنا');
  const [heroTitleEn, setHeroTitleEn] = useState(settings.hero?.titleStartEn || 'Graphic');
  const [heroTitleAr, setHeroTitleAr] = useState(settings.hero?.titleStartAr || 'مصمم');
  const [heroAccentEn, setHeroAccentEn] = useState(settings.hero?.titleAccentEn || 'Designer');
  const [heroAccentAr, setHeroAccentAr] = useState(settings.hero?.titleAccentAr || 'جرافيك');
  const [heroDescEn, setHeroDescEn] = useState(settings.hero?.descEn || '');
  const [heroDescAr, setHeroDescAr] = useState(settings.hero?.descAr || '');

  const [aboutDescEn, setAboutDescEn] = useState(settings.about?.descEn || '');
  const [aboutDescAr, setAboutDescAr] = useState(settings.about?.descAr || '');
  const [statProjects, setStatProjects] = useState(settings.about?.statProjects || '50+');
  const [statClients, setStatClients] = useState(settings.about?.statClients || '20+');
  const [statYears, setStatYears] = useState(settings.about?.statYears || '5+');

  const [contactEmail, setContactEmail] = useState(settings.contact?.directEmail || settings.profile?.email || 'mohmmed.maher467@gmail.com');
  const [contactAvailabilityEn, setContactAvailabilityEn] = useState(settings.contact?.availabilityEn || 'Available for freelance & select projects');
  const [contactAvailabilityAr, setContactAvailabilityAr] = useState(settings.contact?.availabilityAr || 'متاح للمشاريع الإبداعية والاستشارات المختارة');

  // Branding form state
  const [monogram, setMonogram] = useState(settings.branding?.monogram || 'MO');
  const [studioName, setStudioName] = useState(settings.branding?.studioName || 'Mohammed Studio');
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

  // Synchronize state when backend settings are loaded or updated
  useEffect(() => {
    if (!settings) return;
    if (settings.profile) {
      if (settings.profile.fullNameEn !== undefined) setName(settings.profile.fullNameEn);
      else if (settings.profile.name !== undefined) setName(settings.profile.name);
      if (settings.profile.fullNameAr !== undefined) setNameAr(settings.profile.fullNameAr);
      else if (settings.profile.nameAr !== undefined) setNameAr(settings.profile.nameAr);
      if (settings.profile.titleEn !== undefined) setTitleEn(settings.profile.titleEn);
      if (settings.profile.titleAr !== undefined) setTitleAr(settings.profile.titleAr);
      if (settings.profile.profilePhoto !== undefined) setProfilePhoto(settings.profile.profilePhoto || '/profile/mohammed-maher-profile.png');
      if (settings.profile.taglineEn !== undefined) setTaglineEn(settings.profile.taglineEn);
      if (settings.profile.taglineAr !== undefined) setTaglineAr(settings.profile.taglineAr);
      if (settings.profile.bioEn !== undefined) setBioEn(settings.profile.bioEn);
      if (settings.profile.bioAr !== undefined) setBioAr(settings.profile.bioAr);
      if (settings.profile.email !== undefined) setEmail(settings.profile.email);
      if (settings.profile.behanceUrl !== undefined) setBehance(settings.profile.behanceUrl);
      if (settings.profile.dribbbleUrl !== undefined) setDribbble(settings.profile.dribbbleUrl);
      if (settings.profile.instagramUrl !== undefined) setInstagram(settings.profile.instagramUrl);
      if (settings.profile.instagramHandle !== undefined) setInstagramHandle(settings.profile.instagramHandle);
      if (settings.profile.whatsappDisplay !== undefined) setWhatsappDisplay(settings.profile.whatsappDisplay);
      if (settings.profile.whatsappUrl !== undefined) setWhatsappUrl(settings.profile.whatsappUrl);
      if (settings.profile.linkedinUrl !== undefined) setLinkedin(settings.profile.linkedinUrl);
    }
    if (settings.hero) {
      if (settings.hero.kickerEn !== undefined) setHeroKickerEn(settings.hero.kickerEn);
      if (settings.hero.kickerAr !== undefined) setHeroKickerAr(settings.hero.kickerAr);
      if (settings.hero.titleStartEn !== undefined) setHeroTitleEn(settings.hero.titleStartEn);
      if (settings.hero.titleStartAr !== undefined) setHeroTitleAr(settings.hero.titleStartAr);
      if (settings.hero.titleAccentEn !== undefined) setHeroAccentEn(settings.hero.titleAccentEn);
      if (settings.hero.titleAccentAr !== undefined) setHeroAccentAr(settings.hero.titleAccentAr);
      if (settings.hero.descEn !== undefined) setHeroDescEn(settings.hero.descEn);
      if (settings.hero.descAr !== undefined) setHeroDescAr(settings.hero.descAr);
    }
    if (settings.about) {
      if (settings.about.descEn !== undefined) setAboutDescEn(settings.about.descEn);
      if (settings.about.descAr !== undefined) setAboutDescAr(settings.about.descAr);
      if (settings.about.statProjects !== undefined) setStatProjects(settings.about.statProjects);
      if (settings.about.statClients !== undefined) setStatClients(settings.about.statClients);
      if (settings.about.statYears !== undefined) setStatYears(settings.about.statYears);
    }
    if (settings.contact) {
      if (settings.contact.directEmail !== undefined) setContactEmail(settings.contact.directEmail);
      if (settings.contact.instagramUrl !== undefined) setInstagram(settings.contact.instagramUrl);
      if (settings.contact.instagramHandle !== undefined) setInstagramHandle(settings.contact.instagramHandle);
      if (settings.contact.whatsappDisplay !== undefined) setWhatsappDisplay(settings.contact.whatsappDisplay);
      if (settings.contact.whatsappUrl !== undefined) setWhatsappUrl(settings.contact.whatsappUrl);
      if (settings.contact.availabilityEn !== undefined) setContactAvailabilityEn(settings.contact.availabilityEn);
      if (settings.contact.availabilityAr !== undefined) setContactAvailabilityAr(settings.contact.availabilityAr);
    }
    if (settings.branding) {
      if (settings.branding.monogram !== undefined) setMonogram(settings.branding.monogram);
      if (settings.branding.studioName !== undefined) setStudioName(settings.branding.studioName);
      if (settings.branding.accentColor !== undefined) setAccentColor(settings.branding.accentColor);
    }
    if (settings.preferences) {
      if (settings.preferences.defaultLanguage !== undefined) setDefaultLang(settings.preferences.defaultLanguage);
      if (settings.preferences.featuredMode !== undefined) setFeaturedMode(settings.preferences.featuredMode);
      if (settings.preferences.enableCarouselAutoplay !== undefined) setCarouselAutoplay(Boolean(settings.preferences.enableCarouselAutoplay));
      if (settings.preferences.showContactForm !== undefined) setShowContactForm(settings.preferences.showContactForm !== false);
    }
  }, [settings]);

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      await updateStudioSettings({
        profile: {
          name,
          nameAr,
          fullNameEn: name,
          fullNameAr: nameAr,
          titleEn,
          titleAr,
          profilePhoto,
          taglineEn,
          taglineAr,
          bioEn,
          bioAr,
          email,
          behanceUrl: behance,
          dribbbleUrl: dribbble,
          instagramUrl: instagram,
          instagramHandle,
          whatsappDisplay,
          whatsappUrl,
          linkedinUrl: linkedin,
        },
        branding: {
          monogram,
          studioName,
          accentColor,
        },
        hero: {
          kickerEn: heroKickerEn,
          kickerAr: heroKickerAr,
          titleStartEn: heroTitleEn,
          titleStartAr: heroTitleAr,
          titleAccentEn: heroAccentEn,
          titleAccentAr: heroAccentAr,
          descEn: heroDescEn,
          descAr: heroDescAr,
        },
        about: {
          descEn: aboutDescEn,
          descAr: aboutDescAr,
          statProjects,
          statClients,
          statYears,
        },
        contact: {
          directEmail: contactEmail,
          whatsappDisplay,
          whatsappUrl,
          instagramUrl: instagram,
          instagramHandle,
          availabilityEn: contactAvailabilityEn,
          availabilityAr: contactAvailabilityAr,
        },
        preferences: {
          defaultLanguage: defaultLang,
          featuredMode,
          enableCarouselAutoplay: carouselAutoplay,
          showContactForm,
        },
      });
    } finally {
      setIsSaving(false);
    }
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
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'content'
              ? 'glass-panel-active text-[#fcdcd4] border border-[#f4a496]/35 shadow-sm'
              : 'text-neutral-400 hover:text-white glass-panel-subtle'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#f4a496]" />
          <span>{lang === 'ar' ? 'محتوى الرئيسية' : 'Homepage Content'}</span>
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
          {/* Profile Photo / Official Portrait for About Me */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#f4a496]/90 font-medium">
                  {lang === 'ar' ? 'صورة الملف الشخصي والبورتريه الرسمي' : 'Official Profile Portrait (About Me)'}
                </h3>
                <p className="text-[11px] text-neutral-400 font-light mt-0.5">
                  {lang === 'ar'
                    ? 'تظهر هذه الصورة في قسم "نبذة عني" وفي بطاقات الهوية الرسمية'
                    : 'Displayed in the About Me section and official profile badges'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfilePhoto('/profile/mohammed-maher-profile.png')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-neutral-300 hover:text-white glass-panel-subtle hover:border-[#f4a496]/40 transition-colors cursor-pointer"
                title={lang === 'ar' ? 'استعادة الصورة الرسمية الافتراضية' : 'Reset to official default photo'}
              >
                <RotateCcw className="w-3 h-3 text-[#f4a496]" />
                <span>{lang === 'ar' ? 'استعادة الافتراضي' : 'Reset Default'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden glass-panel border border-[#f4a496]/30 bg-gradient-to-b from-[#1a121e] to-[#140b17] flex items-end justify-center relative shadow-lg shrink-0">
                <img
                  src={profilePhoto || '/profile/mohammed-maher-profile.png'}
                  alt="Profile Preview"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="flex-1 w-full space-y-2.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Image URL or Path
                  </label>
                  <input
                    type="text"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#f4a496]/60"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPhotoPickerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-colors shadow-sm cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'اختيار من مكتبة الوسائط / رفع' : 'Choose from Media / Upload'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.settings.designerName} (English)
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
                اسم المصمم (العربية)
              </label>
              <input
                type="text"
                dir="rtl"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all font-arabic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                Professional Title (English)
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                المسمى المهني (العربية)
              </label>
              <input
                type="text"
                dir="rtl"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs focus:outline-none focus:border-[#f4a496]/60 transition-all font-arabic"
              />
            </div>
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
                <span className="text-[11px] text-neutral-400 font-light">Instagram (URL)</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 font-light">Instagram (@Handle)</span>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 font-light">WhatsApp (Display Number)</span>
                <input
                  type="text"
                  value={whatsappDisplay}
                  onChange={(e) => setWhatsappDisplay(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 font-light">WhatsApp (Direct URL)</span>
                <input
                  type="text"
                  value={whatsappUrl}
                  onChange={(e) => setWhatsappUrl(e.target.value)}
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

      {/* TAB: HOMEPAGE CONTENT (HERO, ABOUT & METRICS) */}
      {activeTab === 'content' && (
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-2xl space-y-6 max-w-4xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-serif text-lg font-bold text-white mb-1">
              {lang === 'ar' ? 'قسم الواجهة الرئيسية (Hero Section)' : 'Hero Section Headlines & Kicker'}
            </h3>
            <p className="text-xs text-neutral-400 font-light">
              {lang === 'ar' ? 'تخصيص العناوين والوصف البصري في أعلى الصفحة الرئيسية' : 'Customize the prominent animated headlines, kicker, and introduction'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                Hero Kicker (English)
              </label>
              <input
                type="text"
                value={heroKickerEn}
                onChange={(e) => setHeroKickerEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#f4a496]/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                Hero Kicker (العربية)
              </label>
              <input
                type="text"
                dir="rtl"
                value={heroKickerAr}
                onChange={(e) => setHeroKickerAr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs font-arabic focus:outline-none focus:border-[#f4a496]/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                Headline Line 1 (English / Arabic)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Graphic"
                  value={heroTitleEn}
                  onChange={(e) => setHeroTitleEn(e.target.value)}
                  className="w-1/2 px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#f4a496]/60"
                />
                <input
                  type="text"
                  dir="rtl"
                  placeholder="مصمم"
                  value={heroTitleAr}
                  onChange={(e) => setHeroTitleAr(e.target.value)}
                  className="w-1/2 px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs font-arabic focus:outline-none focus:border-[#f4a496]/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                Headline Line 2 (Accent / Italic)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Designer"
                  value={heroAccentEn}
                  onChange={(e) => setHeroAccentEn(e.target.value)}
                  className="w-1/2 px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#f4a496]/60"
                />
                <input
                  type="text"
                  dir="rtl"
                  placeholder="جرافيك"
                  value={heroAccentAr}
                  onChange={(e) => setHeroAccentAr(e.target.value)}
                  className="w-1/2 px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs font-arabic focus:outline-none focus:border-[#f4a496]/60"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                Hero Description (English)
              </label>
              <textarea
                rows={3}
                value={heroDescEn}
                onChange={(e) => setHeroDescEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs leading-relaxed font-sans focus:outline-none focus:border-[#f4a496]/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                Hero Description (العربية)
              </label>
              <textarea
                rows={3}
                dir="rtl"
                value={heroDescAr}
                onChange={(e) => setHeroDescAr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs leading-relaxed font-arabic focus:outline-none focus:border-[#f4a496]/60"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="font-serif text-lg font-bold text-white mb-1">
              {lang === 'ar' ? 'قسم من أنا والإحصائيات (About & Metrics)' : 'About Section & Key Metrics'}
            </h3>
            <p className="text-xs text-neutral-400 font-light mb-4">
              {lang === 'ar' ? 'تعديل السرد التعريفي وأرقام الخبرة الموثقة' : 'Update the narrative biography and live showcase metrics'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  About Narrative (English)
                </label>
                <textarea
                  rows={3}
                  value={aboutDescEn}
                  onChange={(e) => setAboutDescEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs leading-relaxed font-sans focus:outline-none focus:border-[#f4a496]/60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  About Narrative (العربية)
                </label>
                <textarea
                  rows={3}
                  dir="rtl"
                  value={aboutDescAr}
                  onChange={(e) => setAboutDescAr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs leading-relaxed font-arabic focus:outline-none focus:border-[#f4a496]/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1">
                  Projects Count
                </label>
                <input
                  type="text"
                  value={statProjects}
                  onChange={(e) => setStatProjects(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#f4a496]/60"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1">
                  Clients Count
                </label>
                <input
                  type="text"
                  value={statClients}
                  onChange={(e) => setStatClients(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#f4a496]/60"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1">
                  Years Count
                </label>
                <input
                  type="text"
                  value={statYears}
                  onChange={(e) => setStatYears(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#f4a496]/60"
                />
              </div>
            </div>
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
      {/* Media Picker for Profile Photo */}
      <MediaPickerModal
        isOpen={isPhotoPickerOpen}
        onClose={() => setIsPhotoPickerOpen(false)}
        onSelect={(item) => setIsPhotoPickerOpen(false) || setProfilePhoto(item.url)}
        title={lang === 'ar' ? 'اختيار صورة البورتريه الشخصي' : 'Select Official Profile Portrait'}
      />
    </div>
  );
}

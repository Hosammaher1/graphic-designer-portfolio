import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowLeft, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';

export function AdminLoginPage() {
  const { lang, toggleLang, t, login, loginDemo, isDemoAuthEnabled } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide both email and password.');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await login(email, password);
    setIsLoading(false);
    if (!result?.success) {
      setError(result?.error || (lang === 'ar' ? 'بيانات الاعتماد غير صالحة' : 'Invalid credentials.'));
    }
  };

  const handleQuickDemoClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginDemo();
    }, 400);
  };

  return (
    <div
      className={`min-h-screen bg-[#09070c] text-neutral-100 flex items-center justify-center p-4 relative overflow-hidden font-sans ${
        lang === 'ar' ? 'font-arabic' : ''
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background ambient lighting matching public portfolio */}
      <div className="absolute top-1/4 -left-48 w-[550px] h-[550px] bg-[#842b45]/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-[600px] h-[600px] bg-[#421a28]/25 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute -top-32 right-1/4 w-[400px] h-[400px] bg-[#f4a496]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top bar controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <a
          href="/"
          className="flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-white transition-all glass-panel hover:border-[#f4a496]/40 px-4 py-2 rounded-full"
        >
          {lang === 'ar' ? <ArrowRight className="w-4 h-4 text-[#f4a496]" /> : <ArrowLeft className="w-4 h-4 text-[#f4a496]" />}
          <span>{t.login.backToPortfolio}</span>
        </a>

        <button
          onClick={toggleLang}
          className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-200 hover:text-white glass-panel hover:border-[#f4a496]/40 transition-colors cursor-pointer"
        >
          {lang === 'en' ? 'العربية (RTL)' : 'English (LTR)'}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl glass-panel-active border border-[#f4a496]/25 shadow-2xl shadow-black/90">
        {/* Monogram Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-[#f4a496]/40 p-2 shadow-xl shadow-black/50 flex items-center justify-center">
            <img
              src="/logo/logo.png"
              alt="MO"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'استوديو الإدارة' : 'Studio Administration'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{lang === 'ar' ? 'مرحباً ' : 'Welcome '}</span>
            <span className="text-[#f4a496] italic font-serif">{lang === 'ar' ? 'بك مجدداً' : 'Back'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 font-light leading-relaxed">
            {t.login.signInDesc}
          </p>
        </div>

        {/* Demo Fast Entry Banner (Isolated to Development Mode when explicitly enabled) */}
        {isDemoAuthEnabled && (
          <>
            <div className="mb-6 p-4 rounded-2xl bg-[#842b45]/15 border border-[#f4a496]/25 relative overflow-hidden">
              <div className="flex items-center gap-2 text-[#f4a496] font-semibold text-xs mb-1.5">
                <Sparkles className="w-4 h-4 text-[#f4a496]" />
                <span>{t.login.demoNotice}</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-light leading-normal mb-3.5">
                {t.login.demoDesc}
              </p>
              <button
                type="button"
                onClick={handleQuickDemoClick}
                disabled={isLoading}
                className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#842b45] via-[#6d2036] to-[#421a28] hover:from-[#9c3252] hover:to-[#591b2e] text-[#fcdcd4] font-semibold text-xs tracking-wide transition-all border border-[#f4a496]/40 shadow-xl shadow-black/50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4 text-[#f4a496]" />
                <span>{isLoading ? t.login.signingIn : t.login.quickDemoBtn}</span>
              </button>
            </div>

            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-white/10" />
              <span className="flex-shrink mx-3 text-neutral-400 text-[10px] font-mono uppercase tracking-widest">
                {lang === 'ar' ? 'أو الدخول اليدوي' : 'Or Manual Entry'}
              </span>
              <div className="flex-grow border-t border-white/10" />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={handleStandardSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-[#842b45]/30 border border-[#f4a496]/30 text-[#fcdcd4] text-xs font-light">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
              {t.login.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.login.emailPlaceholder}
                className="w-full pl-10 pr-3.5 rtl:pl-3.5 rtl:pr-10 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-[#f4a496]/60 focus:ring-1 focus:ring-[#f4a496]/30 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
              {t.login.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.login.passwordPlaceholder}
                className="w-full pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-[#f4a496]/60 focus:ring-1 focus:ring-[#f4a496]/30 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-200">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-[#842b45] focus:ring-[#f4a496] focus:ring-offset-0"
              />
              <span className="font-light">{t.login.rememberMe}</span>
            </label>

            <span className="text-neutral-400 hover:text-[#f4a496] transition-colors cursor-pointer font-light">
              {t.login.forgotPassword}
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-5 rounded-full glass-panel hover:border-[#f4a496]/50 text-white font-medium text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? t.login.signingIn : t.login.signInBtn}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from 'react';
import { Alert, AlertDescription } from './ui/alert.jsx';
import { Button } from './ui/button.jsx';
import { ChevronDown, Globe } from 'lucide-react';
import { login } from '../services/authService.js';
import { useTranslation, useLanguage, useRegion } from '../hooks/useTranslation.js';
import { useAppDispatch } from '../store/hooks.js';
import { setLanguage, setRegion } from '../store/slices/i18nSlice.js';
import koreaFlag from '../assets/images/flags/korea.jpg';
import chinaFlag from '../assets/images/flags/china.jpg';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', emoji: '🇺🇸' },
  { value: 'ko', label: '한국어', emoji: '🇰🇷' },
  { value: 'zh', label: '中文', emoji: '🇨🇳' },
];

const REGION_OPTIONS = [
  { value: 'global', title: 'Global', subtitle: 'Global Trends & Insights', icon: '🌍' },
  { value: 'korea', title: 'Korea', subtitle: 'South Korea Market', icon: koreaFlag, isImage: true },
  { value: 'china', title: 'China', subtitle: 'China Market', icon: chinaFlag, isImage: true },
];

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [languageOpen, setLanguageOpen] = useState(false);
  const dropdownRef = useRef(null);

  const t = useTranslation();
  const currentLanguage = useLanguage();
  const currentRegion = useRegion();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedLanguage = useMemo(
    () => LANGUAGE_OPTIONS.find((lang) => lang.value === currentLanguage) || LANGUAGE_OPTIONS[0],
    [currentLanguage]
  );

  const handleLanguageChange = (lang) => {
    dispatch(setLanguage(lang));
    setLanguageOpen(false);
  };

  const handleRegionSelect = (region) => {
    dispatch(setRegion(region));
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await login();
    } catch (err) {
      console.error('Microsoft 로그인 실패:', err);
      setError(t('login.loginError'));
      setIsLoading(false);
    }
  };

  const handleEnterRegion = async (region) => {
    handleRegionSelect(region);
    await handleMicrosoftLogin();
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #f6f1fb 0%, #f4f0f8 100%)',
        padding: '28px 28px 40px',
      }}
    >
      {/* Language selector */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setLanguageOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium"
            style={{
              minWidth: 156,
              background: '#ffffff',
              borderColor: '#d4d4d8',
              color: '#1f2937',
            }}
          >
            <Globe className="h-4 w-4" />
            <span>{selectedLanguage.emoji}</span>
            <span>{selectedLanguage.label}</span>
            <ChevronDown className="h-4 w-4 ml-auto" />
          </button>

          {languageOpen && (
            <div
              className="absolute right-0 mt-2 rounded-2xl border shadow-lg"
              style={{
                width: 220,
                background: '#ffffff',
                borderColor: '#d4d4d8',
                zIndex: 30,
                padding: 8,
              }}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => handleLanguageChange(lang.value)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base"
                  style={{
                    background: currentLanguage === lang.value ? '#f3f4f6' : 'transparent',
                    color: '#111827',
                    fontWeight: currentLanguage === lang.value ? 600 : 500,
                  }}
                >
                  <span>{lang.emoji}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1900, margin: '0 auto' }}>
        {/* Heading */}
        <div className="text-center" style={{ marginBottom: 36 }}>
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 46, lineHeight: 1 }}>🌸</span>
            <h1 style={{ fontSize: 'clamp(34px, 4.2vw, 60px)', lineHeight: 1.1, fontWeight: 800, color: '#111827' }}>
              F&CO Beauty Content Engine
            </h1>
          </div>
          <p style={{ fontSize: 17, color: '#6b7280', fontWeight: 500 }}>
            Select your regional command center
          </p>
        </div>

        {/* Region cards */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22, alignItems: 'stretch', marginBottom: 28 }}>
          {REGION_OPTIONS.map((region) => {
            const active = currentRegion === region.value;
            return (
              <div
                key={region.value}
                className="rounded-3xl border"
                style={{
                  width: 500,
                  maxWidth: '100%',
                  background: '#f9fafb',
                  borderColor: active ? '#8b5cf6' : '#d4d4d8',
                  boxShadow: active ? '0 12px 30px rgba(124, 58, 237, 0.16)' : '0 2px 6px rgba(15, 23, 42, 0.04)',
                  padding: '36px 34px 30px',
                }}
              >
                <div className="text-center" style={{ marginBottom: 28 }}>
                  {region.isImage ? (
                    <img
                      src={region.icon}
                      alt={region.title}
                      style={{ width: 82, height: 82, borderRadius: 999, objectFit: 'cover', margin: '0 auto 16px' }}
                    />
                  ) : (
                    <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 14 }}>{region.icon}</div>
                  )}
                  <h2 style={{ fontSize: 'clamp(30px, 3.2vw, 48px)', fontWeight: 700, color: '#111827', lineHeight: 1.12, marginBottom: 10 }}>
                    {region.title}
                  </h2>
                  <p style={{ fontSize: 'clamp(24px, 2.4vw, 36px)', fontWeight: 600, color: '#6b7280', lineHeight: 1.15 }}>
                    {region.subtitle}
                  </p>
                </div>

                <Button
                  onClick={() => handleEnterRegion(region.value)}
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl text-lg font-semibold"
                  style={{
                    border: '1px solid #d4d4d8',
                    background: active ? '#111827' : '#ffffff',
                    color: active ? '#ffffff' : '#111827',
                  }}
                >
                  {isLoading ? t('login.loginButtonLoading') : 'Enter Command Center'}
                </Button>
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ maxWidth: 980, margin: '0 auto 16px' }}>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="text-center text-sm" style={{ color: '#6b7280' }}>
          <p style={{ fontWeight: 600 }}>{t('login.contactTitle')}</p>
          <p>{t('login.contactAX')}</p>
          <p>{t('login.contactAI')}</p>
        </div>
      </div>
    </div>
  );
}


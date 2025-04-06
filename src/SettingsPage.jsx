import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useLanguage } from './contexts/LanguageContext';
import './SettingsPage.css';

function SettingsPage() {
  const { lang, switchLanguage, t } = useLanguage();
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const [email, setEmail] = useState('');
  const [emailConnected, setEmailConnected] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('mnemonic');
    if (!saved) {
      navigate('/');
      return;
    }
    setMnemonic(saved);

    const savedEmail = localStorage.getItem(`email_${saved}`);
    if (savedEmail) {
      try {
        const parsed = JSON.parse(savedEmail);
        setEmail(parsed.email);
        setEmailVerified(parsed.verified);
        setEmailConnected(true);
      } catch (e) {
        console.error('Ошибка чтения email из localStorage', e);
      }
    }
  }, [navigate]);

  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const showToast = (message, duration = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), duration);
  };

  const handleExport = () => setShowMnemonic(true);

  const handleImport = () => {
    try {
      const wallet = ethers.Wallet.fromPhrase(newPhrase.trim());
      localStorage.setItem('mnemonic', wallet.mnemonic.phrase);
      showToast(t('walletImported'));
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      showToast(t('invalidSeed'));
    }
  };

  const handleEmailSave = () => {
    if (!email.trim()) {
      return showToast(t('enterEmail'));
    }
    if (!isValidEmail(email)) {
      return showToast(t('invalidEmail'));
    }
    const data = {
      email: email.trim(),
      verified: true,
    };
    localStorage.setItem(`email_${mnemonic}`, JSON.stringify(data));
    setEmailConnected(true);
    setEmailVerified(true);
    showToast(t('emailConnected'));
  };

  const clearWallet = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h2 className="settings-title">{t('settingsTitle')}</h2>

        {notification && (
          <div className="notification">
            {notification}
          </div>
        )}

        {/* Языковой переключатель */}
        <div className="form-group">
          <label className="label">{t('languageLabel')}:</label>
          <select
            className="input-field"
            value={lang}
            onChange={(e) => switchLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
            <option value="pl">Polski</option>
            <option value="ru">Русский</option>
          </select>
        </div>

        <div className="divider" />

        {/* Подключённый email */}
        <div className="form-group">
          <label className="label">{t('connectedEmail')}</label>
          {emailConnected && emailVerified ? (
            <div className="email-info">
              <span className="email-text">{email}</span>
              <span className="verified">✅ {t('verified')}</span>
            </div>
          ) : (
            <>
              <input
                type="email"
                className="input-field"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="primary-button"
                onClick={handleEmailSave}
                disabled={!isValidEmail(email)}
                style={{
                  opacity: isValidEmail(email) ? 1 : 0.5,
                  cursor: isValidEmail(email) ? 'pointer' : 'not-allowed'
                }}
              >
                {t('connectEmail')}
              </button>
            </>
          )}
        </div>

        <div className="divider" />

        {/* Экспорт сид-фразы */}
        <div className="form-group">
          <label className="label">{t('exportSeed')}</label>
          <button className="primary-button" onClick={handleExport}>
            {t('showSeed')}
          </button>
          {showMnemonic && (
            <div className="mnemonic-box">
              {mnemonic}
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Импорт другого кошелька */}
        <div className="form-group">
          <label className="label">{t('importOther')}</label>
          <textarea
            className="input-field"
            placeholder={t('enterSeed')}
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            rows={3}
          />
          <button className="primary-button" onClick={handleImport}>
            {t('importBtn')}
          </button>
        </div>

        <div className="divider" />

        {/* Выход из кошелька */}
        <div className="form-group">
          <button className="danger-button" onClick={clearWallet}>
            {t('logoutBtn')}
          </button>
        </div>

        <div className="divider" />

        {/* Кнопка назад */}
        <div className="form-group" style={{ textAlign: 'center' }}>
          <button className="secondary-button" onClick={() => navigate('/wallet')}>
            {t('back')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;

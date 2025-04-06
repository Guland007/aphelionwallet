import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    settingsTitle: 'Wallet Settings',
    emailLabel: 'Enter email',
    exportSeed: 'Export seed phrase',
    showSeed: 'Show seed phrase',
    importOther: 'Import another wallet',
    importBtn: 'Import',
    logoutBtn: 'Clear seed & logout',
    walletHeader: 'Wallet',
    assetsTitle: 'Your Assets',
    totalBalanceLabel: 'Total Balance',
    sendBtn: 'Send',
    receiveBtn: 'Receive',
    cancelBtn: 'Cancel',
    sendTitle: 'Sending',
    receiveTitle: 'Receiving',
    recipientPlaceholder: 'Recipient Address',
    amountPlaceholder: 'Amount',
    commissionLabel: 'Commission',
    errorTxLoad: 'Error loading transactions',
    errorUserLoad: 'Error loading user',
    errorBalanceLoad: 'Error loading balances',
    errorPriceLoad: 'Error loading prices',
    errorInvalidAddress: 'Invalid address',
    errorZeroAmount: 'Amount must be greater than 0',
    errorInsufficientFunds: 'Insufficient funds',
    errorInsufficientAPH: 'Not enough APH for commission (requires {commission} APH)',
    errorSendTx: 'Error sending transaction',
    emailConfirmTitle: 'Email Confirmation',
    emailConfirmMessage: 'This transaction requires email confirmation.',
    confirmBtn: 'Confirm',
    sendingLabel: 'Sending...',
  },
  es: {
    settingsTitle: 'Configuración de la billetera',
    emailLabel: 'Ingrese correo electrónico',
    exportSeed: 'Exportar frase semilla',
    showSeed: 'Mostrar frase semilla',
    importOther: 'Importar otra billetera',
    importBtn: 'Importar',
    logoutBtn: 'Borrar semilla y salir',
    walletHeader: 'Billetera',
    assetsTitle: 'Tus Activos',
    totalBalanceLabel: 'Saldo Total',
    sendBtn: 'Enviar',
    receiveBtn: 'Recibir',
    cancelBtn: 'Cancelar',
    sendTitle: 'Enviando',
    receiveTitle: 'Recibiendo',
    recipientPlaceholder: 'Dirección del destinatario',
    amountPlaceholder: 'Cantidad',
    commissionLabel: 'Comisión',
    errorTxLoad: 'Error al cargar transacciones',
    errorUserLoad: 'Error al cargar usuario',
    errorBalanceLoad: 'Error al cargar saldos',
    errorPriceLoad: 'Error al cargar precios',
    errorInvalidAddress: 'Dirección inválida',
    errorZeroAmount: 'La cantidad debe ser mayor que 0',
    errorInsufficientFunds: 'Fondos insuficientes',
    errorInsufficientAPH: 'No hay suficiente APH para la comisión (se requieren {commission} APH)',
    errorSendTx: 'Error al enviar la transacción',
    emailConfirmTitle: 'Confirmación de Email',
    emailConfirmMessage: 'Esta transacción requiere confirmación por email.',
    confirmBtn: 'Confirmar',
    sendingLabel: 'Enviando...',
  },
  de: {
    settingsTitle: 'Wallet-Einstellungen',
    emailLabel: 'E-Mail eingeben',
    exportSeed: 'Seed-Phrase exportieren',
    showSeed: 'Seed-Phrase anzeigen',
    importOther: 'Anderes Wallet importieren',
    importBtn: 'Importieren',
    logoutBtn: 'Seed löschen & abmelden',
    walletHeader: 'Wallet',
    assetsTitle: 'Ihre Assets',
    totalBalanceLabel: 'Gesamtsaldo',
    sendBtn: 'Senden',
    receiveBtn: 'Empfangen',
    cancelBtn: 'Abbrechen',
    sendTitle: 'Senden',
    receiveTitle: 'Empfangen',
    recipientPlaceholder: 'Empfängeradresse',
    amountPlaceholder: 'Betrag',
    commissionLabel: 'Gebühr',
    errorTxLoad: 'Fehler beim Laden der Transaktionen',
    errorUserLoad: 'Fehler beim Laden des Benutzers',
    errorBalanceLoad: 'Fehler beim Laden der Salden',
    errorPriceLoad: 'Fehler beim Laden der Preise',
    errorInvalidAddress: 'Ungültige Adresse',
    errorZeroAmount: 'Betrag muss größer als 0 sein',
    errorInsufficientFunds: 'Unzureichende Mittel',
    errorInsufficientAPH: 'Nicht genug APH für die Gebühr (erfordert {commission} APH)',
    errorSendTx: 'Fehler beim Senden der Transaktion',
    emailConfirmTitle: 'E-Mail-Bestätigung',
    emailConfirmMessage: 'Diese Transaktion erfordert eine E-Mail-Bestätigung.',
    confirmBtn: 'Bestätigen',
    sendingLabel: 'Senden...',
  },
  pl: {
    settingsTitle: 'Ustawienia portfela',
    emailLabel: 'Wpisz email',
    exportSeed: 'Eksportuj frazę klucza',
    showSeed: 'Pokaż frazę klucza',
    importOther: 'Importuj inny portfel',
    importBtn: 'Importuj',
    logoutBtn: 'Wyczyść klucz & wyloguj',
    walletHeader: 'Portfel',
    assetsTitle: 'Twoje Aktywa',
    totalBalanceLabel: 'Całkowity Saldo',
    sendBtn: 'Wyślij',
    receiveBtn: 'Odbierz',
    cancelBtn: 'Anuluj',
    sendTitle: 'Wysyłanie',
    receiveTitle: 'Odbieranie',
    recipientPlaceholder: 'Adres odbiorcy',
    amountPlaceholder: 'Kwota',
    commissionLabel: 'Prowizja',
    errorTxLoad: 'Błąd ładowania transakcji',
    errorUserLoad: 'Błąd ładowania użytkownika',
    errorBalanceLoad: 'Błąd ładowania salda',
    errorPriceLoad: 'Błąd ładowania cen',
    errorInvalidAddress: 'Nieprawidłowy adres',
    errorZeroAmount: 'Kwota musi być większa niż 0',
    errorInsufficientFunds: 'Niewystarczające środki',
    errorInsufficientAPH: 'Za mało APH na prowizję (wymagane {commission} APH)',
    errorSendTx: 'Błąd wysyłania transakcji',
    emailConfirmTitle: 'Potwierdzenie Email',
    emailConfirmMessage: 'Ta transakcja wymaga potwierdzenia przez email.',
    confirmBtn: 'Potwierdź',
    sendingLabel: 'Wysyłanie...',
  },
  ru: {
    settingsTitle: 'Настройки кошелька',
    emailLabel: 'Введите email',
    exportSeed: 'Экспортировать сид-фразу',
    showSeed: 'Показать сид-фразу',
    importOther: 'Импортировать другой кошелек',
    importBtn: 'Импортировать',
    logoutBtn: 'Очистить сид и выйти',
    walletHeader: 'Личный кабинет',
    assetsTitle: 'Ваши активы',
    totalBalanceLabel: 'Общий баланс',
    sendBtn: 'Отправить',
    receiveBtn: 'Получить',
    cancelBtn: 'Отмена',
    sendTitle: 'Отправка',
    receiveTitle: 'Получение',
    recipientPlaceholder: 'Адрес получателя',
    amountPlaceholder: 'Сумма',
    commissionLabel: 'Комиссия',
    errorTxLoad: 'Ошибка загрузки транзакций',
    errorUserLoad: 'Ошибка загрузки пользователя',
    errorBalanceLoad: 'Ошибка загрузки балансов',
    errorPriceLoad: 'Ошибка загрузки курсов',
    errorInvalidAddress: 'Неверный адрес',
    errorZeroAmount: 'Сумма должна быть больше 0',
    errorInsufficientFunds: 'Недостаточно средств',
    errorInsufficientAPH: 'Недостаточно APH для комиссии (требуется {commission} APH)',
    errorSendTx: 'Ошибка отправки транзакции',
    emailConfirmTitle: 'Подтверждение Email',
    emailConfirmMessage: 'Для проведения данной транзакции требуется подтверждение по email.',
    confirmBtn: 'Подтвердить',
    sendingLabel: 'Отправка...',
  },
};

const LanguageContext = createContext({});

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const switchLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key, params) => {
    let text = translations[lang]?.[key] || key;
    // Простой replace-подстановщик для параметров, если переданы
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

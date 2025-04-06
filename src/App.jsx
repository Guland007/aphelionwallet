import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WalletPage from './WalletPage';
import SeedLogin from './SeedLogin';
import SettingsPage from './SettingsPage';
import SupportPage from './SupportPage';
import TokensPage from './TokensPage';
import StartPage from './StartPage';
import AnimatedBackground from "./components/AnimatedBackground";
import AdminPage from './components/AdminPage';
import { LanguageProvider } from './contexts/LanguageContext'; // Подключаем провайдер

function App() {
  return (
    <LanguageProvider>
      {/* Указываем базовый путь для роутера */}
      <Router >
        <AnimatedBackground />
        <Routes>
          {/* Путь "/" соответствует "http://<домен>/aphelion-wallet/" */}
          <Route path="/" element={<StartPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="tokens" element={<TokensPage />} />
          <Route path="start" element={<SeedLogin />} />
          <Route path="admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;

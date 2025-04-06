import './LandingPage.css';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="star-bg" />

      <header className="landing-header">
        <h1 className="logo">🚀 Aphelion Wallet</h1>
        <div className="header-buttons">
          <button onClick={() => navigate('/')} className="glow-btn">Войти</button>
          <button onClick={() => navigate('/')} className="glow-btn">Сгенерировать</button>
        </div>
      </header>

      <main className="landing-main">
        <img src="/wallet-illustration.png" alt="wallet" className="wallet-img" />
        <h2 className="headline">Космический уровень безопасности и удобства</h2>
        <ul className="features">
          <li>✅ Без регистрации — только сид-фраза</li>
          <li>✅ Прозрачные комиссии</li>
          <li>✅ Простой и интуитивный интерфейс</li>
          <li>✅ Защита личных данных</li>
        </ul>
      </main>
    </div>
  );
}

export default LandingPage;
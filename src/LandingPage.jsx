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
          <button onClick={() => navigate('/')} className="glow-btn">Log in</button>
          <button onClick={() => navigate('/')} className="glow-btn">Generate</button>
        </div>
      </header>

      <main className="landing-main">
        <img src="/wallet-illustration.png" alt="wallet" className="wallet-img" />
        <h2 className="headline">Cosmic-level security and convenience</h2>
        <ul className="features">
          <li>✅ No registration — only a seed phrase</li>
          <li>✅ Transparent fees</li>
          <li>✅ Simple and intuitive interface</li>
          <li>✅ Personal data protection</li>
        </ul>
      </main>
    </div>
  );
}

export default LandingPage;
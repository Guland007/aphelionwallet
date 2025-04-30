import { useNavigate } from 'react-router-dom';
import './StartPage.css';
import AnimatedBackground from './components/AnimatedBackground';

function StartPage() {
  const navigate = useNavigate();

  return (
    <>
      <AnimatedBackground />

      <div className="start-page">
        <div className="scanner-line"></div>
        <div className="code-flicker">
          {`> Initializing wallet...\n> Syncing APH chain...\n> Status: ✔ Ready\n> Watching balance...\n> Listening for tx...`}
        </div>
        <div className="pulse-wave"></div>
        <div className="content-box">
          <h1 className="logo-title">Aphelion Wallet</h1>
          <p className="tagline">The future of crypto asset management</p>

          <div className="button-row">
            <button 
              onClick={() => navigate('/start')}
              className="neon-button"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate('/start?generate=true')}
              className="neon-button"
            >
              Generate
            </button>
          </div>

          <ul className="features">
            <li> Instant transactions</li>
            <li> Seed phrase protection</li>
            <li> Support for multiple tokens</li>
            <li> Transparent transaction history</li>
          </ul>
        </div>
      </div>
      <div className="scan-line" />
    </>
  );
}

export default StartPage;

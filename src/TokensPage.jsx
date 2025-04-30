import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function TokensPage() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState({
    BTC: 65000,
    ETH: 3500,
    USDT: 1,
    SHIBA: 0.00002,
    APH: 0.23614,
  });

  const tokenInfo = {
    BTC: {
      name: 'Bitcoin',
      description: 'The first and most well-known cryptocurrency. Used as digital gold.',
    },
    ETH: {
      name: 'Ethereum',
      description:
        'A blockchain with support for smart contracts. The foundation for many decentralized applications.',
    },
    USDT: {
      name: 'Tether',
      description: 'A stablecoin pegged to the US dollar. Used for stable transfers.',
    },
    SHIBA: {
      name: 'Shiba Inu',
      description: 'A meme coin created as an alternative to Dogecoin.',
    },
    APH: {
      name: 'Aphelion Token',
      description: 'The Aphelion wallet’s native token. Used to pay for fees and privileges.',
    },
  };

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,shiba-inu&vs_currencies=usd'
        );
        setPrices({
          BTC: res.data.bitcoin.usd,
          ETH: res.data.ethereum.usd,
          USDT: res.data.tether.usd,
          SHIBA: res.data['shiba-inu'].usd,
          APH: 0.2,
        });
      } catch (err) {
        console.error('Error fetching prices:', err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'Segoe UI, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        color: 'white',
      }}
    >
      <h2 style={{ color: 'white', textShadow: '0 0 5px cyan' }}>Token Information</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginTop: '2rem',
        }}
      >
        {Object.entries(prices).map(([symbol, price]) => (
          <div
            key={symbol}
            style={{
              border: '1px solid rgba(0,255,255,0.2)',
              borderRadius: '10px',
              padding: '15px',
              background: 'rgba(0,0,0,0.5)',
              boxShadow: '0 0 10px rgba(0,255,255,0.1)',
              color: 'white',
            }}
          >
            <h3>{symbol}</h3>
            <p>
              <strong>{tokenInfo[symbol].name}</strong>
            </p>
            <p style={{ fontSize: '14px', color: '#ccc' }}>
              {tokenInfo[symbol].description}
            </p>
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
              Price: ${price.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={() => navigate('/wallet')}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            border: '1px solid cyan',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: '0.2s',
          }}
          onMouseOver={(e) => (e.target.style.background = 'rgba(0,255,255,0.1)')}
          onMouseOut={(e) => (e.target.style.background = 'rgba(255,255,255,0.05)')}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

export default TokensPage;

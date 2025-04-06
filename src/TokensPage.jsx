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
    APH: 0.2,
  });

  const tokenInfo = {
    BTC: {
      name: 'Bitcoin',
      description: 'Первая и самая известная криптовалюта. Используется как цифровое золото.'
    },
    ETH: {
      name: 'Ethereum',
      description: 'Блокчейн с поддержкой смарт-контрактов. Основа для многих децентрализованных приложений.'
    },
    USDT: {
      name: 'Tether',
      description: 'Стейблкоин, привязанный к доллару США. Используется для стабильных переводов.'
    },
    SHIBA: {
      name: 'Shiba Inu',
      description: 'Мем-коин, созданный как альтернатива Dogecoin.'
    },
    APH: {
      name: 'Aphelion Token',
      description: 'Собственный токен кошелька Aphelion. Используется для оплаты комиссии и привилегий.'
    }
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
          APH: 0.2
        });
      } catch (err) {
        console.error('Ошибка получения курсов:', err);
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
        color: 'white'
      }}
    >
      <h2 style={{ color: 'white', textShadow: '0 0 5px cyan' }}>Информация о токенах</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginTop: '2rem'
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
              color: 'white'
            }}
          >
            <h3>{symbol}</h3>
            <p><strong>{tokenInfo[symbol].name}</strong></p>
            <p style={{ fontSize: '14px', color: '#ccc' }}>{tokenInfo[symbol].description}</p>
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Цена: ${price.toLocaleString()}</p>
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
            transition: '0.2s'
          }}
          onMouseOver={(e) => (e.target.style.background = 'rgba(0,255,255,0.1)')}
          onMouseOut={(e) => (e.target.style.background = 'rgba(255,255,255,0.05)')}
        >
          ⬅ Назад
        </button>
      </div>
    </div>
  );
}

export default TokensPage;
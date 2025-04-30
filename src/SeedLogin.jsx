import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';

function SeedLogin() {
  const [words, setWords] = useState(Array(12).fill(''));
  const navigate = useNavigate();

  // Генерация новой сид-фразы
  const handleGenerate = () => {
    const wallet = ethers.Wallet.createRandom();
    const phrase = wallet.mnemonic.phrase;
    setWords(phrase.split(' '));
  };

  const handleChange = (index, value) => {
    const updated = [...words];
    updated[index] = value.trim();
    setWords(updated);
  };

  const handleClear = () => {
    setWords(Array(12).fill(''));
  };

  // Вход/регистрация: 
  // Сначала пытаемся зарегистрировать пользователя, затем запрашиваем его данные через /api/get-user.
  const handleLogin = async () => {
    const mnemonic = words.join(' ').trim();
    if (!mnemonic) return;

    try {
      // Регистрируем пользователя (если уже зарегистрирован, сервер может вернуть ошибку, которую можно проигнорировать)
      await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, { mnemonic });

      // Получаем пользователя
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/get-user`, { mnemonic });
      const user = res.data;

      // Сохраняем данные в localStorage
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('mnemonic', user.mnemonic);

      // Переход на страницу кошелька
      navigate('/wallet');
    } catch (err) {
      console.error('Login or registration error', err);
      alert('Failed to log in. Check your seed phrase.');
    }
  };

  const isComplete = words.every((w) => w.length > 0);

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '2rem',
        position: 'relative',
        zIndex: 1,
        fontFamily: "'Segoe UI', sans-serif",
        color: '#fff',
      }}
    >
      <h2
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '32px',
          color: '#0ff',
          textShadow: '0 0 6px #0ff, 0 0 12px #0ff, 0 0 24px #0ff',
          textAlign: 'center',
          marginBottom: '2rem',
          transform: 'skewX(-10deg)',
        }}
      >
        Aphelion Wallet
      </h2>

      <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Enter your seed phrase</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          marginBottom: '2rem',
        }}
      >
        {words.map((word, index) => (
          <div key={index}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>{index + 1}.</label>
            <input
              type="text"
              value={word}
              onChange={(e) => handleChange(index, e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                marginTop: '4px',
                border: '2px solid #444',
                borderRadius: '8px',
                backgroundColor: '#1e1e1e',
                color: '#0ff',
                textAlign: 'center',
                transition: 'box-shadow 0.3s ease',
              }}
              onFocus={(e) => (e.target.style.boxShadow = '0 0 8px #0ff')}
              onBlur={(e) => (e.target.style.boxShadow = 'none')}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '2rem',
        }}
      >
        <button
          onClick={handleLogin}
          disabled={!isComplete}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '8px',
            background: '#1f6feb',
            color: '#fff',
            fontWeight: '600',
            fontSize: '16px',
            cursor: isComplete ? 'pointer' : 'not-allowed',
            boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)',
            transition: 'background 0.2s ease',
          }}
        >
          Log in to your wallet
        </button>
        <button
          onClick={handleClear}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '8px',
            background: '#f44336',
            color: '#fff',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
            transition: 'background 0.2s ease',
          }}
        >
          Clear
        </button>
        <button
          onClick={handleGenerate}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '8px',
            background: '#6c63ff',
            color: '#fff',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)',
            transition: 'background 0.2s ease',
          }}
        >
          Generate
        </button>
      </div>
    </div>
  );
}

export default SeedLogin;

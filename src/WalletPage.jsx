import React, { useEffect, useState } from 'react';
import { ethers, isAddress } from 'ethers';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function WalletPage() {
  const [mnemonic, setMnemonic] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [receiveModal, setReceiveModal] = useState({ open: false, token: null });
  const [sendModal, setSendModal] = useState({ open: false, token: null });
  const [sendStep, setSendStep] = useState(0);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [lastSentAddress, setLastSentAddress] = useState('');
  const [sendCount, setSendCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tokenBalances, setTokenBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [selectedToken, setSelectedToken] = useState('ALL');
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [commission, setCommission] = useState(0);
  const [prices, setPrices] = useState({});
  const [loadingSend, setLoadingSend] = useState(false);
  const navigate = useNavigate();
  const [tokenAddresses, setTokenAddresses] = useState({
    ETH: "0xНовыйАдресДляETH",
    USDT: "0xНовыйАдресДляUSDT",
    BTC: "0xНовыйАдресДляBTC",
    SHIBA: "0xНовыйАдресДляSHIBA",
    APH: "0xНовыйАдресДляAPH"
  });
  

  // Токены с фиксированными размерами иконок (папка public/icons)
  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', icon: '/icons/eth.png' },
    { symbol: 'USDT', name: 'Tether USD', icon: '/icons/usdt.png' },
    { symbol: 'BTC', name: 'Bitcoin', icon: '/icons/btc.png' },
    { symbol: 'SHIBA', name: 'Shiba Inu', icon: '/icons/shiba.png' },
    { symbol: 'APH', name: 'Aphelion Token', icon: '/icons/aph.png' },
  ];

  // Функция получения транзакций
  const fetchTransactions = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/${userId}`);
      setTransactions(res.data);
    } catch (err) {
      console.error('Ошибка загрузки транзакций:', err);
    }
  };

  // Функция получения балансов
  const fetchBalances = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/balances/${userId}`);
      const balancesObj = {};
      res.data.forEach(({ token, amount }) => {
        balancesObj[token] = amount;
      });
      setTokenBalances(balancesObj);
    } catch (err) {
      console.error('Ошибка загрузки балансов:', err);
    }
  };

  // Функция получения курсов токенов
  const fetchTokenPrices = async () => {
    const tokenMap = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      USDT: 'tether',
      SHIBA: 'shiba-inu',
      APH: null, // собственный токен
    };
    const symbols = Object.values(tokenMap).filter(Boolean);
    try {
      const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: symbols.join(','),
          vs_currencies: 'usd',
        },
      });
      const finalPrices = {};
      for (const [symbol, id] of Object.entries(tokenMap)) {
        if (id && res.data[id]) {
          finalPrices[symbol] = res.data[id].usd;
        } else if (symbol === 'APH') {
          finalPrices[symbol] = 0.2;
        }
      }
      setPrices(finalPrices);
    } catch (err) {
      console.error('Ошибка загрузки курсов:', err);
    }
  };

  // useEffect для инициализации данных из localStorage и запроса информации с сервера
  useEffect(() => {
    const savedMnemonic = localStorage.getItem('mnemonic');
    const savedUserId = localStorage.getItem('user_id');
    if (!savedMnemonic || !savedUserId) {
      navigate('/');
      return;
    }
    setMnemonic(savedMnemonic);
    try {
      const wallet = ethers.Wallet.fromPhrase(savedMnemonic);
      setWalletAddress(wallet.address);
    } catch (error) {
      console.error('Ошибка создания кошелька:', error);
      navigate('/');
    }
    axios.post(`${import.meta.env.VITE_API_URL}/api/get-user`, { mnemonic: savedMnemonic })
      .then(res => {
        localStorage.setItem('user_id', res.data.id);
        fetchTransactions();
        fetchBalances();
      })
      .catch(err => {
        console.error('Ошибка загрузки пользователя:', err);
        navigate('/');
      });
  }, [navigate]);

  // Периодическое обновление балансов и транзакций
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBalances();
      fetchTransactions();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Загрузка курсов токенов
  useEffect(() => {
    fetchTokenPrices();
  }, []);

  // Фильтрация транзакций по выбранному токену
  const filteredTransactions =
    selectedToken === 'ALL'
      ? transactions
      : transactions.filter((tx) => tx.token === selectedToken);

  // Функция выхода
  const logout = () => {
    localStorage.removeItem('mnemonic');
    localStorage.removeItem('user_id');
    navigate('/');
  };

  // Обновление локального состояния балансов
  const updateBalances = (updated) => {
    setTokenBalances(updated);
    localStorage.setItem('balances', JSON.stringify(updated));
  };

  // Модальные окна для получения/отправки
  const openReceiveModal = (token) => {
    setTimeout(() => {
      setReceiveModal({ open: true, token });
    }, 200);
  };
  const closeReceiveModal = () => {
    setReceiveModal({ open: false, token: null });
  };

  const openSendModal = (token) => {
    setTimeout(() => {
      setSendModal({ open: true, token });
      setSendStep(0);
      setRecipientAddress('');
      setAmount('');
    }, 200);
  };
  const closeSendModal = () => {
    setSendModal({ open: false, token: null });
    setSendStep(0);
    setLoading(false);
    setConfirmationModal(false);
  };

  // Создание транзакции
  const addTransaction = async (status) => {
    const newTx = {
      token: sendModal.token.symbol,
      amount: parseFloat(amount),
      to_address: recipientAddress,
      status,
      date: new Date().toISOString(),
    };
    const userId = localStorage.getItem('user_id');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/transaction`, {
        user_id: userId,
        token: newTx.token,
        amount: newTx.amount,
        to_address: newTx.to_address,
        status: newTx.status,
        date: newTx.date,
      });
    } catch (err) {
      console.error('Ошибка при сохранении транзакции на сервере:', err);
    }
  };

  // Отправка токенов
  const handleSend = () => {
    const tokenSymbol = sendModal.token.symbol;
    const userBalance = tokenBalances[tokenSymbol] || 0;
    const aphBalance = tokenBalances.APH || 0;
    const price = prices[tokenSymbol];
    const priceAPH = prices.APH;
    const parsedAmount = parseFloat(amount);
    const valueUSD = parsedAmount * price;
    const commissionUSD = valueUSD * 0.08;
    const commissionAPH = commissionUSD / priceAPH;
    setCommission(commissionAPH);

    if (sendStep === 0) {
      if (!recipientAddress || !isAddress(recipientAddress)) {
        alert('Введите корректный адрес');
        return;
      }
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Введите корректную сумму');
        return;
      }
      if (parsedAmount > userBalance) {
        alert('Недостаточно средств');
        return;
      }
      if (tokenSymbol !== 'APH' && commissionAPH > aphBalance) {
        alert(`Недостаточно APH для комиссии (${commissionAPH.toFixed(4)} APH требуется)`);
        return;
      }
      setLoadingSend(true);
      setTimeout(() => {
        setLoadingSend(false);
        setLastSentAddress(recipientAddress);
        setSendStep(sendCount === 0 ? 1 : 2);
        if (sendCount >= 1) {
          setConfirmationModal(true);
          addTransaction('Ожидает подтверждения');
        }
      }, 1500);
    } else if (sendStep === 1) {
      const updated = { ...tokenBalances };
      updated[tokenSymbol] -= parsedAmount;
      if (tokenSymbol !== 'APH') {
        updated.APH -= commissionAPH;
      } else {
        updated.APH -= parsedAmount;
      }
      updateBalances(updated);
      addTransaction('Успешно');
      setSendCount((prev) => prev + 1);
      closeSendModal();
    } else if (sendStep === 2) {
      closeSendModal();
    }
  };

  // Стили для таблицы
  const th = { padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' };
  const td = { padding: '10px' };

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'Segoe UI, Helvetica, sans-serif',
        maxWidth: '1000px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Заголовок (левый верх) */}
      <h1
        className="wallet-header"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '38px',
          color: '#0ff',
          textShadow: '0 0 10px #0ff, 0 0 20px #0ff, 0 0 30px #0ff',
          margin: 0,
          animation: 'glow 2s ease-in-out infinite alternate',
          transition: 'transform 0.3s ease',
        }}
      >
        Aphelion Wallet
      </h1>

      {/* Фиксированный блок аватара + кнопка "Выйти" (правый верх) */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <img
          src="/avatar.png"
          alt="User"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
          }}
        />
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: '#1f6feb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
          onClick={logout}
        >
          Выйти
        </button>
      </div>

      {/* Анимация для заголовка (hover-эффект) */}
      <style>{`
        .wallet-header:hover {
          transform: scale(1.1);
        }
        @keyframes glow {
          0% { text-shadow: 0 0 10px #0ff, 0 0 20px #0ff, 0 0 30px #0ff; }
          100% { text-shadow: 0 0 20px #0ff, 0 0 30px #0ff, 0 0 40px #0ff; }
        }
      `}</style>

      <h2 style={{ marginTop: '5rem' }}>Ваши активы</h2>
      <div
        style={{
          backgroundColor: '#1e1e1e',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          maxWidth: '300px',
          color: '#fff',
        }}
      >
        <p style={{ margin: 0, fontSize: '16px', color: '#aaa' }}>Total Balance</p>
        <p
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#00d8ff',
          }}
        >
          $
          {Object.entries(tokenBalances)
            .reduce((total, [symbol, amt]) => {
              const price = prices[symbol] || 0;
              return total + amt * price;
            }, 0)
            .toFixed(2)}{' '}
          USDT
        </p>
      </div>

      {/* Сетка монет */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {tokens.map((token) => (
          <div
            key={token.symbol}
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '16px',
              padding: '20px',
              width: '220px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <img
                  src={token.icon}
                  alt={token.symbol}
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain'
                  }}
                />
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: '#00d8ff',
                    marginBottom: '4px',
                    marginTop: 0,
                  }}
                >
                  {token.symbol}
                </h3>
              </div>
              <p
                style={{
                  fontSize: '14px',
                  color: '#aaa',
                  marginBottom: '12px',
                  marginTop: '4px',
                  textAlign: 'center'
                }}
              >
                {token.name}
              </p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
                {(tokenBalances[token.symbol] || 0).toFixed(4)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#1f6feb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
                onClick={() => openSendModal(token)}
              >
                Отправить
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#1f6feb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
                onClick={() => openReceiveModal(token)}
              >
                Получить
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модалка "Получить" */}
      {receiveModal.open && (
        <div
          onClick={closeReceiveModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              maxWidth: '420px',
              margin: '10% auto',
              padding: '25px 30px',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ marginBottom: '15px', color: '#000', fontSize: '20px' }}>
              Получение {receiveModal.token.symbol}
            </h3>
            <p style={{ marginBottom: '5px', fontSize: '14px', color: '#333' }}>
              Ваш адрес:
            </p>
            <code style={{ fontSize: '13px', wordBreak: 'break-all', color: '#444' }}>
              { tokenAddresses[receiveModal.token.symbol] }
              </code>

            <div style={{ marginTop: '20px' }}>
              <button
                onClick={closeReceiveModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1f6feb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка "Отправить" */}
      {sendModal.open && (
        <div
          onClick={closeSendModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              maxWidth: '420px',
              margin: '10% auto',
              padding: '25px 30px',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
            }}
          >
            {sendStep === 0 && (
              <>
                <h3 style={{ marginBottom: '15px', color: '#000', fontSize: '20px' }}>
                  Отправка {sendModal.token.symbol}
                </h3>
                <input
                  type="text"
                  placeholder="Адрес получателя"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  style={{
                    width: '100%',
                    marginBottom: '10px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="text"
                  placeholder="Сумма"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    width: '100%',
                    marginBottom: '10px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                  }}
                />
                {amount && !isNaN(parseFloat(amount)) && (
                  <p style={{ fontSize: '12px', color: '#555' }}>
                    Комиссия: {commission.toFixed(4)} APH
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '12px' }}>
                  <button
                    onClick={handleSend}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: '#1f6feb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '15px',
                      boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseOver={(e) => (e.target.style.backgroundColor = '#0f5ed9')}
                    onMouseOut={(e) => (e.target.style.backgroundColor = '#1f6feb')}
                  >
                    Отправить
                  </button>
                  <button
                    onClick={closeSendModal}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: '#f2f2f2',
                      color: '#444',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '15px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseOver={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
                    onMouseOut={(e) => (e.target.style.backgroundColor = '#f2f2f2')}
                  >
                    Отмена
                  </button>
                </div>
              </>
            )}
            {sendStep === 1 && (
              <>
                <p style={{ fontSize: '16px', color: '#333' }}>
                  Монеты успешно отправлены на адрес:
                </p>
                <code style={{ wordBreak: 'break-all', fontSize: '14px', color: '#444' }}>
                  {lastSentAddress}
                </code>
                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={handleSend}
                    style={{
                      padding: '10px 25px',
                      backgroundColor: '#1f6feb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Готово
                  </button>
                </div>
              </>
            )}
            {sendStep === 2 && confirmationModal && (
              <>
                <p style={{ fontSize: '16px', color: '#333' }}>
                  Подтвердите операцию через email
                </p>
                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={handleSend}
                    style={{
                      padding: '10px 25px',
                      backgroundColor: '#1f6feb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Закрыть
                  </button>
                </div>
              </>
            )}
            {loadingSend && <p style={{ color: '#888', marginTop: '15px' }}>Отправка...</p>}
          </div>
        </div>
      )}

      {/* История транзакций */}
      {transactions.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2>История транзакций</h2>
          <div style={{ marginBottom: '10px' }}>
            <label>Фильтр по монете: </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              style={{ padding: '6px', marginLeft: '10px' }}
            >
              <option value="ALL">Все</option>
              {tokens.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={th}>Дата</th>
                <th style={th}>Токен</th>
                <th style={th}>Сумма</th>
                <th style={th}>Адрес</th>
                <th style={th}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={td}>{tx.date ? new Date(tx.date).toLocaleString() : '—'}</td>
                  <td style={td}>{tx.token}</td>
                  <td style={td}>{tx.amount}</td>
                  <td style={td}>{tx.to_address}</td>
                  <td style={td}>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Нижние кнопки (центрирование) */}
      <div
        className="wallet-footer-buttons"
        style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
        }}
      >
        <button onClick={() => navigate('/settings')}>Настройки</button>
        <button onClick={() => navigate('/support')}>Поддержка</button>
        <button onClick={() => navigate('/tokens')}>О токенах</button>
        <button onClick={() => navigate('/')}>Назад</button>
      </div>

      <footer className="footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
        © 2025 Aphelion Wallet | Все права защищены
      </footer>
    </div>
  );
}

export default WalletPage;

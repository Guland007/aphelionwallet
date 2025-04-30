import { useEffect, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ALL_TOKENS = ['ETH', 'USDT', 'BTC', 'SHIBA', 'APH'];

function AdminPage() {
  // Состояния для авторизации
  const [authorized, setAuthorized] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // Основные состояния админ панели
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [balances, setBalances] = useState({});
  const [balanceAddresses, setBalanceAddresses] = useState({}); // для каждого токена
  const [transactions, setTransactions] = useState([]);
  const [newTx, setNewTx] = useState({ token: '', amount: '', to_address: '', status: '', date: '' });
  const [loading, setLoading] = useState(false);

  // Загружаем список пользователей при монтировании компонента
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/users`)
      .then(res => setUsers(res.data))
      .catch(err => console.error('Error loading users:', err));
  }, []);

  // Функция для проверки пароля
  const handleLogin = () => {
    if (adminPassword === "20482708") {
      setAuthorized(true);
    } else {
      alert("Неверный пароль!");
    }
  };

  // Функция для загрузки данных выбранного пользователя: балансов, receiving address (для каждого токена) и транзакций
  const loadUserData = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/balances/${user.id}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/transactions/${user.id}`)
      ]);
      const balMap = {};
      const addrMap = {};
      balRes.data.forEach(b => {
        const token = b.token.toUpperCase();
        balMap[token] = b.amount;
        addrMap[token] = b.receive_address || '';
      });
      setBalances(balMap);
      setBalanceAddresses(addrMap);
      setTransactions(txRes.data);
    } catch (err) {
      console.error('Error loading user data:', err);
    }
    setLoading(false);
  };

  // Обновление receiving address для конкретного токена (в таблице balances)
  const updateBalanceAddress = (token, address) => {
    axios.post(`${import.meta.env.VITE_API_URL}/api/admin/update-balance-address`, {
      user_id: selectedUser.id,
      token,
      receive_address: address,
      secret: 'admin123'
    })
      .then(() => {
        alert('Receiving address updated successfully.');
        loadUserData(selectedUser);
      })
      .catch(err => {
        console.error(err);
        alert('Ошибка при обновлении receiving address');
      });
  };

  // Обновление баланса (admin)
  const updateBalance = (token, amount) => {
    axios.post(`${import.meta.env.VITE_API_URL}/api/admin/update-balance`, {
      user_id: selectedUser.id,
      token,
      amount: parseFloat(amount),
      secret: 'admin123'
    }).then(() => {
      alert('Баланс обновлён');
      loadUserData(selectedUser);
    }).catch(err => {
      console.error(err);
      alert('Ошибка при обновлении баланса');
    });
  };

  // Обновление транзакции
  const updateTransaction = (tx) => {
    const formattedDate = new Date(tx.date).toISOString();
    axios.post(`${import.meta.env.VITE_API_URL}/api/admin/update-transaction`, {
      id: tx.id,
      token: tx.token,
      amount: parseFloat(tx.amount),
      to_address: tx.to_address,
      status: tx.status,
      date: formattedDate,
      secret: 'admin123'
    })
      .then(() => {
        alert('Транзакция обновлена');
        loadUserData(selectedUser);
      })
      .catch(err => {
        console.error(err);
        alert('Ошибка при обновлении транзакции');
      });
  };

  // Удаление транзакции
  const deleteTransaction = (id) => {
    axios.post(`${import.meta.env.VITE_API_URL}/api/admin/delete-transaction`, {
      id,
      secret: 'admin123',
    })
      .then(() => {
        alert('Удалено');
        loadUserData(selectedUser);
      })
      .catch(err => {
        console.error(err);
        alert('Ошибка при удалении');
      });
  };

  // Создание новой транзакции
  const createTransaction = () => {
    if (!newTx.token || !newTx.amount || !newTx.to_address || !newTx.status || !newTx.date) {
      alert('Заполните все поля');
      return;
    }
    const finalDate = new Date(newTx.date).toISOString();
    axios.post(`${import.meta.env.VITE_API_URL}/api/admin/create-transaction`, {
      ...newTx,
      date: finalDate,
      user_id: selectedUser.id,
      secret: 'admin123'
    })
      .then(() => {
        alert('Транзакция создана');
        setNewTx({ token: '', amount: '', to_address: '', status: '', date: '' });
        loadUserData(selectedUser);
      })
      .catch(err => {
        console.error(err);
        alert('Ошибка при создании транзакции');
      });
  };

  // Функция для установки даты у новой транзакции
  const handleNewTxDateChange = (date) => {
    setNewTx(prev => ({ ...prev, date }));
  };

  // Функция для изменения даты в уже существующих транзакциях
  const handleExistingTxDateChange = (date, index) => {
    const updated = [...transactions];
    updated[index].date = date;
    setTransactions(updated);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Segoe UI', backgroundColor: '#111', color: '#fff' }}>
      {!authorized ? (
        <div>
          <h2>Admin Login</h2>
          <input
            type="password"
            placeholder="Введите пароль"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            style={{ marginRight: '10px', padding: '6px', borderRadius: '4px', width: '200px' }}
          />
          <button
            onClick={handleLogin}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6c63ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </div>
      ) : (
        <>
          <h2>👨‍💻 Admin Panel</h2>
          <h3>Users</h3>
          <div style={{ marginBottom: '20px' }}>
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => loadUserData(user)}
                style={{
                  margin: '5px',
                  padding: '8px',
                  background: selectedUser?.id === user.id ? '#0ff' : '#ccc',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {user.mnemonic.split(' ').slice(0, 3).join(' ')}...
              </button>
            ))}
          </div>

          {loading && <p>Loading data...</p>}

          {selectedUser && (
            <>
              <h3>Balances & Addresses for user #{selectedUser.id}</h3>
              {ALL_TOKENS.map(token => (
                <div key={token} style={{ marginBottom: '10px', background: '#222', padding: '10px', borderRadius: '6px' }}>
                  {/* Баланс */}
                  <div style={{ marginBottom: '8px' }}>
                    <label><strong>{token} Balance: </strong></label>
                    <input
                      type="number"
                      value={balances[token] ?? ''}
                      onChange={(e) => setBalances(prev => ({ ...prev, [token]: e.target.value }))}
                      style={{ marginLeft: '10px', width: '100px', color: '#000' }}
                    />
                    <button
                      onClick={() => updateBalance(token, balances[token])}
                      style={{
                        marginLeft: '10px',
                        padding: '4px 8px',
                        backgroundColor: 'lime',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                  </div>
                  {/* Receiving Address для конкретного токена */}
                  <div>
                    <label><strong>{token} Address: </strong></label>
                    <input
                      type="text"
                      value={balanceAddresses[token] ?? ''}
                      onChange={(e) => setBalanceAddresses(prev => ({ ...prev, [token]: e.target.value }))}
                      style={{ marginLeft: '10px', width: '300px', color: '#000' }}
                    />
                    <button
                      onClick={() => updateBalanceAddress(token, balanceAddresses[token])}
                      style={{
                        marginLeft: '10px',
                        padding: '4px 8px',
                        backgroundColor: '#6c63ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Save Addr
                    </button>
                  </div>
                </div>
              ))}

              <h3>Create Transaction</h3>
              <div style={{ background: '#222', padding: '10px', borderRadius: '6px', marginBottom: '1rem' }}>
                <input
                  placeholder="Token"
                  value={newTx.token}
                  onChange={(e) => setNewTx(prev => ({ ...prev, token: e.target.value }))}
                  style={{ marginRight: '5px', color: '#000', width: '80px' }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={newTx.amount}
                  onChange={(e) => setNewTx(prev => ({ ...prev, amount: e.target.value }))}
                  style={{ marginRight: '5px', color: '#000', width: '80px' }}
                />
                <input
                  placeholder="To Address"
                  value={newTx.to_address}
                  onChange={(e) => setNewTx(prev => ({ ...prev, to_address: e.target.value }))}
                  style={{ marginRight: '5px', color: '#000', width: '160px' }}
                />
                <input
                  placeholder="Status"
                  value={newTx.status}
                  onChange={(e) => setNewTx(prev => ({ ...prev, status: e.target.value }))}
                  style={{ marginRight: '5px', color: '#000', width: '100px' }}
                />
                <DatePicker
                  selected={newTx.date ? new Date(newTx.date) : null}
                  onChange={handleNewTxDateChange}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  minDate={new Date(2000, 0, 1)}
                  maxDate={new Date(2050, 11, 31, 23, 59)}
                  className="datePickerInput"
                  style={{ marginRight: '5px', width: '160px' }}
                />
                <button
                  onClick={createTransaction}
                  style={{
                    background: '#0ff',
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Create
                </button>
              </div>

              <h3>Transaction History</h3>
              {transactions.length === 0 ? (
                <p>No transactions yet.</p>
              ) : transactions.map((tx, index) => {
                let currentDate = null;
                try {
                  currentDate = tx.date ? new Date(tx.date) : null;
                } catch (e) {
                  console.error('Invalid date format:', tx.date);
                }
                return (
                  <div key={tx.id} style={{ background: '#222', padding: '10px', marginBottom: '10px', borderRadius: '6px' }}>
                    <input
                      type="text"
                      value={tx.token}
                      onChange={(e) => {
                        const updated = [...transactions];
                        updated[index].token = e.target.value;
                        setTransactions(updated);
                      }}
                      style={{ marginRight: '6px', color: '#000', width: '60px' }}
                    />
                    <input
                      type="number"
                      value={tx.amount}
                      onChange={(e) => {
                        const updated = [...transactions];
                        updated[index].amount = e.target.value;
                        setTransactions(updated);
                      }}
                      style={{ marginRight: '6px', color: '#000', width: '80px' }}
                    />
                    <input
                      type="text"
                      value={tx.to_address}
                      onChange={(e) => {
                        const updated = [...transactions];
                        updated[index].to_address = e.target.value;
                        setTransactions(updated);
                      }}
                      style={{ marginRight: '6px', color: '#000', width: '180px' }}
                    />
                    <input
                      type="text"
                      value={tx.status}
                      onChange={(e) => {
                        const updated = [...transactions];
                        updated[index].status = e.target.value;
                        setTransactions(updated);
                      }}
                      style={{ marginRight: '6px', color: '#000', width: '120px' }}
                    />
                    <DatePicker
                      selected={currentDate}
                      onChange={(date) => handleExistingTxDateChange(date, index)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="yyyy-MM-dd HH:mm"
                      minDate={new Date(2000, 0, 1)}
                      maxDate={new Date(2050, 11, 31, 23, 59)}
                      className="datePickerInput"
                      style={{ marginRight: '6px', width: '160px' }}
                    />
                    <button
                      onClick={() => updateTransaction(tx)}
                      style={{
                        background: 'lime',
                        padding: '4px 8px',
                        marginRight: '4px',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      style={{
                        background: 'red',
                        color: '#fff',
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPage;

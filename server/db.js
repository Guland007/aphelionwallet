// Получить пользователя по сид-фразе
app.post('/api/get-user', (req, res) => {
    const { mnemonic } = req.body;
  
    db.get(`SELECT * FROM users WHERE mnemonic = ?`, [mnemonic], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      res.json(user);
    });
  });
  
  // Сохранение транзакции
  app.post('/api/transaction', (req, res) => {
    const { user_id, token, amount, to_address, status } = req.body;
    const date = new Date().toISOString();
  
    db.run(
      `INSERT INTO transactions (user_id, token, amount, to_address, status, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, token, amount, to_address, status, date],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
      }
    );
  });
  
  // Получить все транзакции по пользователю
  app.get('/api/transactions/:user_id', (req, res) => {
    const { user_id } = req.params;
    db.all(
      `SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`,
      [user_id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  });
  
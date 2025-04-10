// updateWallets.js
const sqlite3 = require('sqlite3').verbose();
const { ethers } = require('ethers');

// Открываем базу данных (убедитесь, что путь правильный)
const db = new sqlite3.Database('./aphelion.db', (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err);
    process.exit(1);
  }
});

// Создаем таблицы, если они отсутствуют
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mnemonic TEXT UNIQUE,
    receive_address TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT, -- если вы идентифицируете пользователя по адресу, храните его как TEXT
    token TEXT,
    amount REAL,
    to_address TEXT,
    status TEXT,
    date TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS balances (
    user_id TEXT,
    token TEXT,
    amount REAL,
    receive_address TEXT,
    PRIMARY KEY (user_id, token)
  )`);
});

// Список сид-фраз для 20 кошельков
const seedPhrases = [
  "cruise host keep panic eye cloud remove benefit file ice side harsh",
  "chuckle knee token silk canyon earn joy bid tilt shy post ethics",
  "dawn spoon lawn regular when thank gorilla decrease burger pupil glow leisure",
  "disagree train bundle cotton amused defy drip curious gentle photo sudden lottery",
  "hole tattoo level cabin clip spend cancel dash law top lemon tornado",
  "truck tank inside crouch garbage expect marine surprise august erosion census boost",
  "sight predict inquiry frog unit bottom jump floor flip legal stool profit",
  "allow melt drive local wild father tank believe dolphin stable loyal uncover",
  "close pretty parade viable poverty tooth chicken excuse vintage master bless tornado",
  "this file bracket security doll loan brisk physical sorry deposit panic defense",
  "man link pumpkin great smile kitchen plunge merge tennis because meadow addict",
  "gather match labor surprise result roof vacuum noise tag isolate iron viable",
  "census cinnamon pudding trash feature mammal announce nominee picture spare resource tone",
  "media shift pull expect transfer put onion slender blur glow drop install",
  "mirror tent diet forget diesel scatter maximum opera fever cement fiber dinner",
  "crouch used ginger until mix roof wasp alien faith obtain exist stone",
  "turn slush call core thing waste thrive vocal sadness dress oval either",
  "urge cloud between course end average soon insane deliver unfair aerobic tomorrow",
  "coffee park couple thank gesture subway photo ginger doctor sunset civil iron",
  "traffic dance rally sad bunker life hawk deny code caught melody strong"
];

// Всего APH должно быть 532 USDT / 0.2 = 2660 APH
const TOTAL_APH = 2660;

// Определяем, сколько кошельков будут пустыми (3 или 4)
const emptyCount = Math.random() < 0.5 ? 3 : 4;

// Создаем кошельки из сид-фраз
const wallets = seedPhrases.map(seed => {
  try {
    const wallet = ethers.Wallet.fromPhrase(seed);
    return { seed, address: wallet.address };
  } catch (err) {
    console.error("Ошибка создания кошелька из сид-фразы:", seed, err);
    return null;
  }
}).filter(Boolean);

// Перемешиваем индексы кошельков
const walletCount = wallets.length;
const indices = Array.from({ length: walletCount }, (_, i) => i);
shuffle(indices);

const emptyIndices = indices.slice(0, emptyCount);
const nonEmptyIndices = indices.slice(emptyCount);

// Функция для равномерного распределения TOTAL_APH на non-empty кошельки с рандомными отклонениями
function randomPartition(total, parts) {
  const cuts = [];
  for (let i = 0; i < parts - 1; i++) {
    cuts.push(Math.random() * total);
  }
  cuts.sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (let c of cuts) {
    result.push(c - prev);
    prev = c;
  }
  result.push(total - prev);
  return result;
}

const nonEmptyCount = nonEmptyIndices.length;
const randomAllocations = randomPartition(TOTAL_APH, nonEmptyCount).map(val => Math.round(val));

// Собираем распределение балансов для кошельков:
const walletBalances = Array(walletCount).fill(0);
nonEmptyIndices.forEach((index, i) => {
  walletBalances[index] = randomAllocations[i];
});

// Функция для обновления баланса в базе (таблица balances)
function updateBalanceInDB(userId, token, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO balances (user_id, token, amount)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, token) DO UPDATE SET amount = excluded.amount`,
      [userId, token, amount],
      function (err) {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
}

// Функция для вставки транзакции в базу (таблица transactions)
function insertTransaction(userId, token, amount, to_address, status, date) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO transactions (user_id, token, amount, to_address, status, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, token, amount, to_address, status, date],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

// Генерация случайной даты между двумя датами
function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString();
}

// Функция для генерации случайной транзакции
function generateRandomTransaction(userId) {
  const allTokens = ['ETH', 'USDT', 'BTC', 'SHIBA', 'APH'];
  const token = allTokens[Math.floor(Math.random() * allTokens.length)];
  const amount = parseFloat((Math.random() * 100 + 0.01).toFixed(4));
  // Генерируем случайный адрес с помощью ethers (это не будет валидным адресом, но для истории подходит)
  const to_address = ethers.Wallet.createRandom().address;
  const statuses = ["Успешно", "Ввод", "Вывод"];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const date = randomDate(new Date(2019, 0, 1), new Date(2020, 11, 31));
  return { user_id: userId, token, amount, to_address, status, date };
}

// Функция перемешивания массива (Fisher-Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Основная функция обновления кошельков
async function updateWallets() {
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const userId = wallet.address; // Здесь используется адрес как идентификатор, но если у вас другой user_id, измените соответствующим образом.
    const newBalance = walletBalances[i];
    try {
      await updateBalanceInDB(userId, 'APH', newBalance);
      console.log(`Баланс кошелька ${userId} обновлён: APH = ${newBalance}`);
    } catch (err) {
      console.error(`Ошибка обновления баланса для ${userId}:`, err);
    }

    // Генерация истории транзакций:
    const txCount = Math.floor(Math.random() * 9) + 11; // от 11 до 19
    for (let j = 0; j < txCount; j++) {
      const tx = generateRandomTransaction(userId);
      try {
        await insertTransaction(userId, tx.token, tx.amount, tx.to_address, tx.status, tx.date);
        console.log(`Транзакция для ${userId} вставлена: ${tx.token} ${tx.amount}`);
      } catch (err) {
        console.error(`Ошибка вставки транзакции для ${userId}:`, err);
      }
    }
  }
  console.log('Обновление кошельков завершено.');
  db.close();
}

// Запускаем основной скрипт
updateWallets().catch(err => {
  console.error("Ошибка в updateWallets:", err);
  db.close();
});

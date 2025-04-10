// updateWallets.js
const sqlite3 = require('sqlite3').verbose();
const { ethers } = require('ethers');

// Подключаем базу данных
const db = new sqlite3.Database('./aphelion.db');

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

// Количество кошельков, которые будут пустыми (рандомно 3 или 4)
const emptyCount = Math.random() < 0.5 ? 3 : 4;

// Получаем адреса кошельков, используя ethers
const wallets = seedPhrases.map(seed => {
  try {
    const wallet = ethers.Wallet.fromPhrase(seed);
    return { seed, address: wallet.address };
  } catch (err) {
    console.error("Ошибка создания кошелька из сид-фразы:", seed, err);
    return null;
  }
}).filter(Boolean);

// Определяем, какие кошельки будут пустыми
const walletCount = wallets.length;
const indices = Array.from({ length: walletCount }, (_, i) => i);
shuffle(indices); // перемешиваем индексы

const emptyIndices = indices.slice(0, emptyCount);
const nonEmptyIndices = indices.slice(emptyCount);

// Для оставшихся кошельков случайно распределяем общее количество APH
// Можно сделать равномерное распределение с небольшими случайными отклонениями.
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

// Собираем распределение балансров по APH для всех кошельков:
const walletBalances = Array(walletCount).fill(0);
nonEmptyIndices.forEach((index, i) => {
  walletBalances[index] = randomAllocations[i];
});

// Функция для обновления баланса в базе (таблица balances)
// balance record: user_id, token, amount
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
// Вставляем транзакции с датами в 2019-2020, случайный токен, рандомной суммой
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
  // Случайный выбор токена из списка ALL_TOKENS (или используйте tokens массива)
  const allTokens = ['ETH', 'USDT', 'BTC', 'SHIBA', 'APH'];
  const token = allTokens[Math.floor(Math.random() * allTokens.length)];
  // Случайное число, например от 0.01 до 100, округляя до 4 знаков:
  const amount = parseFloat((Math.random() * 100 + 0.01).toFixed(4));
  // Генерируем случайный "to_address" (можно использовать ethers для генерации случайного адреса)
  const to_address = ethers.Wallet.createRandom().address;
  // Случайный статус: "Ввод" или "Вывод" (или просто "Успешно")
  const statuses = ["Успешно", "Ввод", "Вывод"];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  // Случайная дата в промежутке 2019-01-01 до 2020-12-31
  const date = randomDate(new Date(2019, 0, 1), new Date(2020, 11, 31));
  return { user_id: userId, token, amount, to_address, status, date };
}

// Основная функция для обновления кошельков
async function updateWallets() {
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const userId = wallet.address; // Предположим, что в вашей базе пользователь идентифицируется адресом
    // Если в вашей базе user_id хранится другой идентификатор, необходимо получить его по сид-фразе (это можно сделать через API)
    // Здесь для скрипта сделаем UPDATE баланса для токена APH:
    const newBalance = walletBalances[i];
    try {
      await updateBalanceInDB(userId, 'APH', newBalance);
      console.log(`Баланс кошелька ${userId} обновлён: APH = ${newBalance}`);
    } catch (err) {
      console.error(`Ошибка обновления баланса для ${userId}:`, err);
    }

    // Генерация истории транзакций:
    // Генерируем случайное количество транзакций от 11 до 19 для этого кошелька
    const txCount = Math.floor(Math.random() * 9) + 11; // 11 до 19
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

// Функция для перемешивания массива (Fisher-Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Запускаем основной скрипт
updateWallets().catch(err => {
  console.error("Ошибка в updateWallets:", err);
  db.close();
});

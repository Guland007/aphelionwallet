#!/bin/bash

echo "🔧 Установка зависимостей..."
npm install

echo "🌱 Инициализация Git..."
git init
git remote add origin https://github.com/Guland007/aphelionwallet.git
git branch -M main

echo "📦 Коммитим файлы..."
git add .
git commit -m 'initial commit'

echo "🚀 Пушим на GitHub..."
git push -u origin main

echo "🏗️ Билдим проект и деплоим..."
npm run deploy

echo "✅ Готово! Проверь https://Guland007.github.io/aphelionwallet/"

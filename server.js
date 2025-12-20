const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Раздаём статические файлы из корня проекта
app.use(express.static(__dirname));

// Обработка всех маршрутов - возвращаем index.html для SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Откройте в браузере: http://localhost:${PORT}`);
});


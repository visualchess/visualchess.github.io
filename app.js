// Главный файл приложения - инициализация и связывание модулей

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initBoard();
    initStockfish();
    displayVersion();
    
    // Обработчик кнопки генерации
    document.getElementById('generateBtn').addEventListener('click', generatePosition);
    
    // Генерируем начальную позицию
    generatePosition();
});

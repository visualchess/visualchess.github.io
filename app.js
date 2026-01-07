// Главный файл приложения - инициализация и связывание модулей

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initBoard();
    initStockfish();
    displayVersion();
    
    // Обработчик кнопки генерации
    document.getElementById('generateBtn').addEventListener('click', generatePosition);
    
    // Показываем/скрываем протокол в зависимости от флага
    let wasProtocolActive = false;
    function updateProtocolVisibility() {
        const protocolContainer = document.getElementById('protocolContainer');
        if (protocolContainer) {
            const isActive = !!globalThis.DEBUG_STOCKFISH_PROTOCOL;
            protocolContainer.style.display = isActive ? 'block' : 'none';
            
            if (isActive && !wasProtocolActive) {
                // Протокол только что активирован - очищаем и инициализируем
                const textarea = document.getElementById('stockfishProtocol');
                if (textarea) {
                    textarea.value = 'Протокол активирован. Все сообщения будут логироваться здесь.\n';
                    textarea.value += '======================================================\n';
                    // Сбрасываем таймер в stockfish-api.js
                    if (typeof resetProtocolTimer === 'function') {
                        resetProtocolTimer();
                    }
                }
            }
            wasProtocolActive = isActive;
        }
    }
    
    // Проверяем видимость протокола при загрузке
    updateProtocolVisibility();
    
    // Периодически проверяем флаг (на случай, если пользователь установит его в консоли)
    setInterval(updateProtocolVisibility, 500);
    
    // Генерируем начальную позицию
    generatePosition();
});

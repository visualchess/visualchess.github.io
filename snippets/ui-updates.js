// Обновление UI элементов

// Обновление информации о мате
function updateMateInfo() {
    const mateInfoDiv = document.getElementById('mateInfo');
    const mateInSpan = document.getElementById('mateIn');
    
    if (mateInfoDiv && mateInSpan) {
        // Проверяем, не мат ли уже
        if (chess) {
            const isCheck = chess.in_check();
            const moves = chess.moves();
            const isCheckmate = isCheck && moves.length === 0;
            
            if (isCheckmate) {
                // Уже мат - показываем -1 или "Мат!"
                mateInfoDiv.style.display = 'block';
                mateInSpan.textContent = '-1 (Мат!)';
                currentMateIn = -1;
                return;
            }
        }
        
        if (currentMateIn !== null) {
            mateInfoDiv.style.display = 'block';
            mateInSpan.textContent = currentMateIn;
        } else {
            // Показываем сообщение, что значение ещё вычисляется
            mateInfoDiv.style.display = 'block';
            mateInSpan.textContent = 'Вычисляется...';
        }
    }
}

// Обновление информации о штрафах
function updatePenaltyInfo() {
    const penaltyInfoDiv = document.getElementById('penaltyInfo');
    const penaltyCountSpan = document.getElementById('penaltyCount');
    
    if (penaltyInfoDiv && penaltyCountSpan) {
        penaltyInfoDiv.style.display = 'block';
        penaltyCountSpan.textContent = penaltyPoints;
    }
}

// Обновление статуса игры
function updateGameStatus() {
    if (!chess) return;
    
    const statusDiv = document.getElementById('gameStatus');
    const statusTextSpan = document.getElementById('statusText');
    const turnTextSpan = document.getElementById('turnText');
    const whiteMovesSpan = document.getElementById('whiteMovesCount');
    const blackMovesSpan = document.getElementById('blackMovesCount');
    
    if (!statusDiv || !statusTextSpan || !turnTextSpan || !whiteMovesSpan || !blackMovesSpan) return;
    
    // Проверяем мат и пат
    // В chess.js 0.12.1 проверяем вручную
    const isCheck = chess.in_check();
    const moves = chess.moves();
    const isCheckmate = isCheck && moves.length === 0;
    const isStalemate = !isCheck && moves.length === 0;
    
    // Обновляем флаг окончания игры
    isGameOver = isCheckmate || isStalemate;
    
    // Блокируем доску если игра окончена
    if (board) {
        if (isGameOver) {
            board.orientation('flip'); // Переворачиваем доску для блокировки
            board.orientation('white'); // Возвращаем обратно - это блокирует перетаскивание
            // Альтернативный способ - делаем доску неактивной через CSS
            document.getElementById('board').style.pointerEvents = 'none';
            document.getElementById('board').style.opacity = '0.7';
        } else {
            document.getElementById('board').style.pointerEvents = 'auto';
            document.getElementById('board').style.opacity = '1';
        }
    }
    
    // Определяем статус
    let statusText = 'Игра продолжается';
    let statusColor = '#fff3e0'; // Оранжевый фон
    
    if (isCheckmate) {
        if (chess.turn() === 'b') {
            statusText = 'Мат! Белые выиграли';
            statusColor = '#c8e6c9'; // Зелёный фон
        } else {
            statusText = 'Мат! Чёрные выиграли';
            statusColor = '#ffcdd2'; // Красный фон
        }
    } else if (isStalemate) {
        statusText = 'Пат - ничья';
        statusColor = '#e1bee7'; // Фиолетовый фон
    } else if (isCheck) {
        statusText = 'Шах!';
        statusColor = '#fff9c4'; // Жёлтый фон
    }
    
    // Определяем, чей ход
    const turnText = chess.turn() === 'w' ? 'Белые' : 'Чёрные';
    
    // Обновляем элементы
    statusTextSpan.textContent = statusText;
    statusDiv.style.backgroundColor = statusColor;
    turnTextSpan.textContent = turnText;
    whiteMovesSpan.textContent = whiteMovesCount;
    blackMovesSpan.textContent = blackMovesCount;
    
    // Обновляем информацию о мате
    updateMateInfo();
}


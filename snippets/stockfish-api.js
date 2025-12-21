// Работа со Stockfish

// Инициализация Stockfish
function initStockfish() {
    if (typeof Worker !== 'undefined') {
        stockfish = new Worker('stockfish/stockfish.js');
        stockfish.onmessage = handleStockfishMessage;
        console.log('Stockfish initialized');
    } else {
        console.error('Web Workers not supported');
    }
}

// Обработка сообщений от Stockfish
function handleStockfishMessage(e) {
    const message = e.data;
    
    if (message.includes('bestmove')) {
        const parts = message.split(' ');
        if (parts.length > 1 && parts[1] !== 'none') {
            const bestMove = parts[1];
            makeStockfishMove(bestMove);
        }
    } else if (message.includes('mate')) {
        // Парсим информацию о мате из сообщения
        // Формат: "info depth X score mate Y" означает мат в Y ходов
        const mateMatch = message.match(/score mate (-?\d+)/);
        if (mateMatch) {
            const mateValue = Number.parseInt(mateMatch[1], 10);
            // Положительное значение = мат белым, отрицательное = мат чёрным
            // Нас интересует мат чёрным (отрицательное значение)
            if (mateValue < 0) {
                currentMateIn = Math.abs(mateValue);
                updateMateInfo();
            }
        }
    }
}

// Отправка команды Stockfish
function sendStockfishCommand(command) {
    if (stockfish) {
        stockfish.postMessage(command);
    }
}

// Запрос лучшего хода от Stockfish
async function getBestMove(fen, depth = 15) {
    return new Promise((resolve) => {
        if (!stockfish) {
            resolve(null);
            return;
        }
        
        const timeout = setTimeout(() => {
            resolve(null);
        }, 10000); // Таймаут 10 секунд
        
        const originalHandler = stockfish.onmessage;
        stockfish.onmessage = (e) => {
            const message = e.data;
            if (message.includes('bestmove')) {
                clearTimeout(timeout);
                stockfish.onmessage = originalHandler;
                const parts = message.split(' ');
                if (parts.length > 1 && parts[1] !== 'none') {
                    resolve(parts[1]);
                } else {
                    resolve(null);
                }
            }
        };
        
        sendStockfishCommand(`position fen ${fen}`);
        sendStockfishCommand(`go depth ${depth}`);
    });
}

// Запрос количества ходов до мата
async function getMateInMoves(fen, depth = 20) {
    return new Promise((resolve) => {
        if (!stockfish) {
            resolve(null);
            return;
        }
        
        const timeout = setTimeout(() => {
            resolve(null);
        }, 15000); // Таймаут 15 секунд
        
        let mateValue = null;
        
        const originalHandler = stockfish.onmessage;
        stockfish.onmessage = (e) => {
            const message = e.data;
            
            // Ищем информацию о мате
            const mateMatch = message.match(/score mate (-?\d+)/);
            if (mateMatch) {
                const value = Number.parseInt(mateMatch[1], 10);
                // Нас интересует мат чёрным (отрицательное значение для белых)
                if (value < 0) {
                    mateValue = Math.abs(value);
                }
            }
            
            if (message.includes('bestmove')) {
                clearTimeout(timeout);
                stockfish.onmessage = originalHandler;
                resolve(mateValue);
            }
        };
        
        sendStockfishCommand(`position fen ${fen}`);
        sendStockfishCommand(`go depth ${depth}`);
    });
}

// Выполнение хода Stockfish с анимацией
function makeStockfishMove(moveString) {
    if (!chess || !moveString || isGameOver) return;
    
    // Добавляем задержку для анимации (1.5 секунды)
    setTimeout(() => {
        if (!chess || isGameOver) return;
        
        const move = chess.move({
            from: moveString.substring(0, 2),
            to: moveString.substring(2, 4),
            promotion: moveString.length > 4 ? moveString[4] : 'q'
        });
        
        if (move) {
            // Увеличиваем счётчик ходов чёрных
            incrementBlackMoves();
            updateGameStatus();
            
            updateBoard();
            isUserTurn = true;
            
            // Проверяем количество ходов до мата после хода Stockfish (не после хода пользователя)
            checkMateInMoves(false);
        }
    }, 1500); // Задержка 1.5 секунды для анимации
}


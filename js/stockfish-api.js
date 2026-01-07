// Работа со Stockfish

// Переменная для хранения времени начала протоколирования
let protocolStartTime = null;

// Флаг готовности Stockfish (после получения uciok)
let isStockfishReady = false;
let stockfishReadyPromise = null;
let stockfishReadyResolve = null;

// Функция для сброса таймера протокола (вызывается при активации)
function resetProtocolTimer() {
    protocolStartTime = null;
}

// Функция для логирования протокола
function logProtocol(direction, message) {
    if (!globalThis.DEBUG_STOCKFISH_PROTOCOL) return;
    
    const protocolTextarea = document.getElementById('stockfishProtocol');
    if (!protocolTextarea) return;
    
    // Инициализируем время начала при первом сообщении
    if (protocolStartTime === null) {
        protocolStartTime = performance.now();
    }
    
    // Относительное время от начала протоколирования
    const elapsed = (performance.now() - protocolStartTime).toFixed(2);
    
    // Абсолютное текущее время с миллисекундами
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    const currentTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;
    
    const prefix = direction === '>' ? '> ' : '< ';
    const timestamp = `[${currentTime} | +${elapsed}ms]`;
    const logLine = `${timestamp} ${prefix}${message}\n`;
    
    protocolTextarea.value += logLine;
    // Автоматически прокручиваем вниз
    protocolTextarea.scrollTop = protocolTextarea.scrollHeight;
}

// Инициализация Stockfish
function initStockfish() {
    if (typeof Worker !== 'undefined') {
        stockfish = new Worker('stockfish/stockfish.js');
        stockfish.onmessage = handleStockfishMessage;
        console.log('Stockfish initialized');
        
        // Сбрасываем флаг готовности
        isStockfishReady = false;
        stockfishReadyPromise = new Promise((resolve) => {
            stockfishReadyResolve = resolve;
        });
        
        // Инициализируем протокол при активации
        if (globalThis.DEBUG_STOCKFISH_PROTOCOL) {
            protocolStartTime = null; // Сброс таймера при новой инициализации
        }
        
        // Всегда отправляем команду uci для правильной инициализации UCI протокола
        sendStockfishCommand('uci');
    } else {
        console.error('Web Workers not supported');
    }
}

// Обработка сообщений от Stockfish
function handleStockfishMessage(e) {
    const message = e.data;
    
    // Логируем все сообщения от Stockfish
    logProtocol('<', message);
    
    // Проверяем получение uciok - сигнал готовности Stockfish
    if (message.trim() === 'uciok') {
        isStockfishReady = true;
        if (stockfishReadyResolve) {
            stockfishReadyResolve();
            stockfishReadyResolve = null;
        }
        console.log('Stockfish ready (uciok received)');
    } else if (message.includes('bestmove')) {
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
// Если Stockfish ещё не готов (не получен uciok), команда будет отправлена после готовности
async function sendStockfishCommand(command, waitForReady = true) {
    if (!stockfish) return;
    
    // Команда uci не требует ожидания готовности
    if (command === 'uci') {
        logProtocol('>', command);
        stockfish.postMessage(command);
        return;
    }
    
    // Для остальных команд ждём готовности Stockfish
    if (waitForReady && !isStockfishReady && stockfishReadyPromise) {
        await stockfishReadyPromise;
    }
    
    // Логируем команду перед отправкой
    logProtocol('>', command);
    stockfish.postMessage(command);
}

// Запрос лучшего хода от Stockfish
async function getBestMove(fen, depth = 15) {
    return new Promise(async (resolve) => {
        if (!stockfish) {
            resolve(null);
            return;
        }
        
        // Ждём готовности Stockfish перед отправкой команд
        if (!isStockfishReady && stockfishReadyPromise) {
            await stockfishReadyPromise;
        }
        
        const timeout = setTimeout(() => {
            resolve(null);
        }, 10000); // Таймаут 10 секунд
        
        const originalHandler = stockfish.onmessage;
        stockfish.onmessage = (e) => {
            const message = e.data;
            // Логируем все сообщения от Stockfish
            logProtocol('<', message);
            
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
        
        await sendStockfishCommand(`position fen ${fen}`);
        await sendStockfishCommand(`go depth ${depth}`);
    });
}

// Запрос количества ходов до мата
async function getMateInMoves(fen, depth = 20) {
    return new Promise(async (resolve) => {
        if (!stockfish) {
            resolve(null);
            return;
        }
        
        // Ждём готовности Stockfish перед отправкой команд
        if (!isStockfishReady && stockfishReadyPromise) {
            await stockfishReadyPromise;
        }
        
        const timeout = setTimeout(() => {
            resolve(null);
        }, 15000); // Таймаут 15 секунд
        
        let mateValue = null;
        
        const originalHandler = stockfish.onmessage;
        stockfish.onmessage = (e) => {
            const message = e.data;
            
            // Логируем все сообщения от Stockfish
            logProtocol('<', message);
            
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
        
        await sendStockfishCommand(`position fen ${fen}`);
        await sendStockfishCommand(`go depth ${depth}`);
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


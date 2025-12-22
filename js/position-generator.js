// Импорт Chess.js (если не глобальный)
const Chess = require('chess.js'); // Или import, в зависимости от среды

// Функция для определения цвета клетки ('light' или 'dark')
function getSquareColor(square) {
    const file = square[0];
    const rank = parseInt(square[1]);
    const isLight = (file.charCodeAt(0) - 97 + rank) % 2 === 1;
    return isLight ? 'light' : 'dark';
}

// Функция для генерации уникального квадрата, не занятого в (занятых) и нужного цвета
function uniquesquare(busysquare, requiredColor = null) {
    let square;
    do {
        const files = 'abcdefgh';
        const ranks = '12345678';
        square = files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
    } while (busysquare.includes(square) || (requiredColor && getSquareColor(square) !== requiredColor));
    busysquare.push(square);
    return square;
}

/**
 * Generates an endgame chess position based on the given pieces string.
 * @param {string} pieces - A string of piece symbols (e.g., 'Q' for white queen, 'b' for black bishop).
 * @param {string} bishopPairType - Determines how bishop colors are assigned for bishop pairs.
 * @param {number} [maxAttempts=100] - Maximum recursion attempts.
 * @returns {Promise<string>} FEN position without check on either king.
 */
async function generateEndgamePosition(pieces, bishopPairType = 'random', maxAttempts = 100) {
    const chess = new Chess();
    let busysquare = []; // массив занятых клеток
    let attempts = 0;

    // Теперь async рекурсивная функция
    async function generate(currentAttempts = 0) {
        if (currentAttempts >= maxAttempts) {
            console.warn('Max attempts reached; returning fallback position.');
            return 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1'; // Простая валидная позиция как fallback
        }

        busysquare = []; // Сброс для новой попытки
        chess.clear();

        // Проверяем, есть ли пара слонов (один белый 'B' и один чёрный 'b')
        const whiteBishopCount = (pieces.match(/B/g) || []).length;
        const blackBishopCount = (pieces.match(/b/g) || []).length;
        const isBishopPair = whiteBishopCount === 1 && blackBishopCount === 1;

        // Счётчик для пары слонов
        let bishopCount = 0;
        let firstBishopColor = null;

        // Размещаем белого короля
        chess.put({ type: 'k', color: 'w' }, uniquesquare(busysquare));

        // Размещаем чёрного короля
        chess.put({ type: 'k', color: 'b' }, uniquesquare(busysquare));

        // Переменные для отслеживания цвета первого слона каждого цвета
        let whiteFirstBishopColor = null;
        let blackFirstBishopColor = null;

        // Проходим по строке pieces
        for (const pieceChar of pieces) {
            const isWhite = pieceChar === pieceChar.toUpperCase();
            const color = isWhite ? 'w' : 'b';
            let pieceType = pieceChar.toLowerCase();
            let requiredColor = null;
            
            // Обработка цвета клетки для слонов
            if (pieceChar.toUpperCase() === 'B') {
                bishopCount++;
                if (isBishopPair && bishopPairType !== 'random') {
                    if (bishopCount === 1) {
                        requiredColor = Math.random() < 0.5 ? 'light' : 'dark';
                        firstBishopColor = requiredColor;
                    } else if (bishopCount === 2) {
                        requiredColor = bishopPairType === 'same' ? firstBishopColor : (firstBishopColor === 'light' ? 'dark' : 'light');
                    }
                } else {
                    if (isWhite) {
                        if (whiteFirstBishopColor) {
                            requiredColor = whiteFirstBishopColor === 'light' ? 'dark' : 'light';
                        } else {
                            requiredColor = Math.random() < 0.5 ? 'light' : 'dark';
                            whiteFirstBishopColor = requiredColor;
                        }
                    } else {
                        if (blackFirstBishopColor) {
                            requiredColor = blackFirstBishopColor === 'light' ? 'dark' : 'light';
                        } else {
                            requiredColor = Math.random() < 0.5 ? 'light' : 'dark';
                            blackFirstBishopColor = requiredColor;
                        }
                    }
                }
            }
            
            const square = uniquesquare(busysquare, requiredColor);
            chess.put({ type: pieceType, color: color }, square);
        }

        const fen = chess.fen();
        
        // Валидация через Stockfish (с обработкой ошибок)
        try {
            const bestMove = await getBestMove(fen, 1);
            if (!bestMove) {
                console.warn(`Attempt ${currentAttempts + 1}: Position invalid (mate/stalemate or error):`, fen);
                return generate(currentAttempts + 1); // Локальная рекурсия с инкрементом
            }
            return fen;
        } catch (error) {
            console.error('Stockfish error:', error);
            // Fallback: если Stockfish сломан, используем базовую валидацию FEN
            const validation = chess.validate_fen(fen);
            if (!validation.valid) {
                console.warn('Invalid FEN (fallback):', validation.error);
                return generate(currentAttempts + 1);
            }
            console.warn('Using FEN without Stockfish validation due to error');
            return fen;
        }
    }

    return await generate(attempts); // Запуск с await
}

/**
 * Генерирует позицию для мата одинокому королю (теперь async)
 * @param {number} type - Тип позиции (0-4, как раньше).
 * @returns {Promise<string>} FEN позиция
 */
async function generateCheckmatePosition(type) {
    const piecesMap = {
        0: 'Q',  // Ферзь + король
        1: 'RR', // Две ладьи + король
        2: 'R',  // Одна ладья + король
        3: 'BB', // Два слона + король
        4: 'BN'  // Слон + конь + король
    };
    
    const pieces = piecesMap[type];
    if (!pieces) {
        throw new Error('Invalid position type');
    }
    
    return await generateEndgamePosition(pieces); // Await для async
}

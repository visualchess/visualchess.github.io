// Функция для определения цвета поля ('light' или 'dark')
function getSquareColor(square) {
    const file = square[0];
    const rank = parseInt(square[1]);
    const isLight = (file.charCodeAt(0) - 97 + rank) % 2 === 1;
    return isLight ? 'light' : 'dark';
}

// Функция для генерации уникального случайного поля, не занятого и (опционально) с нужным цветом
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
 * @param {string} bishopPairType - Determines how bishop colors are assigned for bishop pairs (one white 'B' and one black 'b' bishop).
 *   - 'random': Colors are chosen randomly (default).
 *   - 'same': Both bishops are placed on squares of the same color.
 *   - 'opposite': Bishops are placed on squares of opposite colors.
 *   For other bishop configurations (e.g., multiple bishops of the same color), bishops are placed on the same color squares.
 */
function generateEndgamePosition(pieces, bishopPairType = 'random') {
    const chess = new Chess();
    let busysquare = []; // Массив занятых полей

    // Определяем, есть ли пара слонов (ровно один белый 'B' и один чёрный 'b')
    const whiteBishopCount = (pieces.match(/B/g) || []).length;
    const blackBishopCount = (pieces.match(/b/g) || []).length;
    const isBishopPair = whiteBishopCount === 1 && blackBishopCount === 1;

    // Переменные для пары слонов
    let bishopCount = 0;
    let firstBishopColor = null;

    // Размещаем белого короля
    chess.put({ type: 'k', color: 'w' }, uniquesquare(busysquare));

    // Размещаем черного короля
    chess.put({ type: 'k', color: 'b' }, uniquesquare(busysquare));

    // Переменные для отслеживания цвета поля первого слона каждого цвета (для множественных слонов)
    let whiteFirstBishopColor = null;
    let blackFirstBishopColor = null;

    // Цикл по символам строки pieces
    for (const pieceChar of pieces) {
        const isWhite = pieceChar === pieceChar.toUpperCase();
        const color = isWhite ? 'w' : 'b';
        let pieceType = pieceChar.toLowerCase(); // Упрощение: все фигуры строчные для Chess.js
        let requiredColor = null;
        
        // Специальная логика только для слонов
        if (pieceChar.toUpperCase() === 'B') {
            bishopCount++; // Увеличиваем счётчик слонов
            // Логика для слонов
            if (isBishopPair && bishopPairType !== 'random') {
                // Специальная логика для пары слонов
                if (bishopCount === 1) {
                    // Первый слон в паре: случайный цвет
                    requiredColor = Math.random() < 0.5 ? 'light' : 'dark';
                    firstBishopColor = requiredColor;
                } else if (bishopCount === 2) {
                    // Второй слон в паре: в зависимости от bishopPairType
                    requiredColor = bishopPairType === 'same' ? firstBishopColor : (firstBishopColor === 'light' ? 'dark' : 'light');
                }
            } else {
                // Обычная логика для слонов (включая множественные одного цвета)
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

    // Проверяем, не находится ли белый король под шахом; если да, регенерируем
    if (chess.inCheck()) {
        return generateEndgamePosition(pieces, bishopPairType);
    }

    // Возвращаем FEN позиции
    return chess.fen();
}

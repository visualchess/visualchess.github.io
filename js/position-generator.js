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
 * @param {string} bishopPairType - Determines how bishop colors are assigned for bishop pairs (one white 'B' and one black 'b' bishop).
 *   - 'random': Colors are chosen randomly (default).
 *   - 'same': Both bishops are placed on squares of the same color.
 *   - 'opposite': Bishops are placed on squares of opposite colors.
 *   For other bishop configurations (e.g., multiple bishops of the same color), bishops are placed on the same color squares.
 * @param {number} [maxAttempts=100] - Maximum recursion attempts to avoid infinite loops.
 * @returns {string} FEN position without check on either king.
 */
function generateEndgamePosition(pieces, bishopPairType = 'random', maxAttempts = 100) {
    const chess = new Chess();
    chess.clear(); // Очищаем доску перед размещением фигур
    let busysquare = []; // массив занятых клеток
    let attempts = 0;

    // Рекурсивная функция с лимитом попыток
    function generate() {
        if (attempts >= maxAttempts) {
            console.warn('Max attempts reached; returning current position anyway.');
            return chess.fen();
        }
        attempts++;

        busysquare = []; // Сброс занятых для новой попытки
        chess.clear();

        // Проверяем, есть ли пара слонов (один белый 'B' и один чёрный 'b')
        const whiteBishopCount = (pieces.match(/B/g) || []).length;
        const blackBishopCount = (pieces.match(/b/g) || []).length;
        const isBishopPair = whiteBishopCount === 1 && blackBishopCount === 1;

        // Счётчик для пары слонов
        let bishopCount = 0;
        let firstBishopColor = null;

        // Размещаем белого короля
        let whiteKingSquare = uniquesquare(busysquare);
        chess.put({ type: 'k', color: 'w' }, whiteKingSquare);

        // Размещаем чёрного короля
        let blackKingSquare = uniquesquare(busysquare);
        chess.put({ type: 'k', color: 'b' }, blackKingSquare);

        // Переменные для отслеживания цвета первого слона каждого цвета (для правильного размещения)
        let whiteFirstBishopColor = null;
        let blackFirstBishopColor = null;

        // Проходим по строке pieces
        for (const pieceChar of pieces) {
            const isWhite = pieceChar === pieceChar.toUpperCase();
            const color = isWhite ? 'w' : 'b';
            let pieceType = pieceChar.toLowerCase(); // примечание: для шахмат используется Chess.js
            let requiredColor = null;
            
            // Обработка цвета клетки для слонов
            if (pieceChar.toUpperCase() === 'B') {
                bishopCount++; // увеличиваем счётчик слонов
                // Логика для пары слонов
                if (isBishopPair && bishopPairType !== 'random') {
                    // Обработка логики для пары слонов
                    if (bishopCount === 1) {
                        // Первый слон в паре: выбираем цвет
                        requiredColor = Math.random() < 0.5 ? 'light' : 'dark';
                        firstBishopColor = requiredColor;
                    } else if (bishopCount === 2) {
                        // Второй слон в паре: в зависимости от bishopPairType
                        requiredColor = bishopPairType === 'same' ? firstBishopColor : (firstBishopColor === 'light' ? 'dark' : 'light');
                    }
                } else {
                    // Обычная логика для слонов (автоматически чередуем цвета клеток)
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

        // Получаем FEN и создаём новый объект Chess для надёжной проверки
        const fen = chess.fen();
        const testChess = new Chess(fen);
        
        // Проверяем шах через анализ возможных ходов (более надёжный способ, чем in_check())
        // Проверяем, может ли белая фигура атаковать чёрного короля
        testChess.turn('w');
        let blackInCheck = false;
        if (blackKingSquare) {
            const whiteMoves = testChess.moves({ verbose: true });
            blackInCheck = whiteMoves.some(move => move.to === blackKingSquare);
        }
        
        // Проверяем, может ли чёрная фигура атаковать белого короля
        testChess.turn('b');
        let whiteInCheck = false;
        if (whiteKingSquare) {
            const blackMoves = testChess.moves({ verbose: true });
            whiteInCheck = blackMoves.some(move => move.to === whiteKingSquare);
        }
        
        // Если любой король под шахом, регенерируем позицию
        if (blackInCheck || whiteInCheck) {
            if (window.DEBUG_CHESS_GENERATOR) {
                console.log('Regenerating position: king in check', {
                    blackInCheck: blackInCheck,
                    whiteInCheck: whiteInCheck,
                    blackKingSquare: blackKingSquare,
                    whiteKingSquare: whiteKingSquare
                });
            }
            return generate();
        }
        
        // Возвращаем ход белым (для начала игры)
        chess.turn('w');
        
        return chess.fen();
    }

    return generate();
}

/**
 * Генерирует позицию для мата одинокому королю
 * @param {number} type - Тип позиции:
 *   0: Ферзь + король
 *   1: Две ладьи + король
 *   2: Одна ладья + король
 *   3: Два слона + король
 *   4: Слон + конь + король
 * @returns {string} FEN позиция
 */
function generateCheckmatePosition(type) {
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
    
    return generateEndgamePosition(pieces);
}

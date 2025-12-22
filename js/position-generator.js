// Импорт Chess.js (Node: npm i chess.js; Браузер: <script src="chess.min.js"></script>)
const Chess = require('chess.js'); // Или: import Chess from 'chess.js';

// Функция для определения цвета клетки ('light' или 'dark')
function getSquareColor(square) {
    const file = square[0];
    const rank = parseInt(square[1]);
    const isLight = (file.charCodeAt(0) - 97 + rank) % 2 === 1;
    return isLight ? 'light' : 'dark';
}

// Функция для генерации уникального квадрата, не занятого в busysquare и нужного цвета
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
 * @param {string} bishopPairType - 'random' (default), 'same', or 'opposite' for bishop pairs.
 * @param {number} [maxAttempts=100] - Maximum recursion attempts.
 * @returns {string} Valid FEN without check or checkmate on either king.
 */
function generateEndgamePosition(pieces, bishopPairType = 'random', maxAttempts = 100) {
    let attempts = 0;

    // Рекурсивная функция
    function generate() {
        if (attempts >= maxAttempts) {
            console.warn('Max attempts reached; returning fallback endgame position.');
            return '4k3/8/8/8/8/8/3Q4/3K4 b - - 0 1'; // Простой Q vs K как fallback
        }
        attempts++;

        const chess = new Chess();
        let busysquare = []; // Сброс для новой попытки

        // Проверка на пару слонов (1B + 1b)
        const whiteBishopCount = (pieces.match(/B/g) || []).length;
        const blackBishopCount = (pieces.match(/b/g) || []).length;
        const isBishopPair = whiteBishopCount === 1 && blackBishopCount === 1;

        let bishopCount = 0;
        let firstBishopColor = null;
        let whiteFirstBishopColor = null;
        let blackFirstBishopColor = null;

        // Размещаем королей
        chess.put({ type: 'k', color: 'w' }, uniquesquare(busysquare));
        chess.put({ type: 'k', color: 'b' }, uniquesquare(busysquare));

        // Размещаем остальные фигуры
        for (const pieceChar of pieces) {
            const isWhite = pieceChar === pieceChar.toUpperCase();
            const color = isWhite ? 'w' : 'b';
            let pieceType = pieceChar.toLowerCase();
            let requiredColor = null;

            // Логика для слонов
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
                    // Чередование для слонов одного цвета
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
        const testChess = new Chess(fen);

        // Упрощённая проверка: Нет шаха/мата для обеих сторон + есть ходы
        // Проверяем белых
        testChess.turn('w');
        const whiteInCheck = testChess.in_check();
        const whiteInCheckmate = testChess.in_checkmate();
        const whiteHasMoves = testChess.moves().length > 0;

        // Проверяем чёрных
        testChess.turn('b');
        const blackInCheck = testChess.in_check();
        const blackInCheckmate = testChess.in_checkmate();
        const blackHasMoves = testChess.moves().length > 0;

        // Если любой король в шахе/мате или нет ходов — регенерируем
        if (whiteInCheck || whiteInCheckmate || !whiteHasMoves ||
            blackInCheck || blackInCheckmate || !blackHasMoves) {
            if (window.DEBUG_CHESS_GENERATOR) {
                console.log(`Regenerating (attempt ${attempts}): Invalid position`, {
                    fen,
                    whiteInCheck: whiteInCheck,
                    whiteInCheckmate: whiteInCheckmate,
                    whiteHasMoves,
                    blackInCheck: blackInCheck,
                    blackInCheckmate: blackInCheckmate,
                    blackHasMoves
                });
            }
            return generate();
        }

        console.log(`Success on attempt ${attempts}:`, fen);
        return fen;
    }

    return generate();
}

/**
 * Генерирует позицию для мата одинокому королю.
 * @param {number} type - 0: Q, 1: RR, 2: R, 3: BB, 4: BN.
 * @returns {string} FEN.
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

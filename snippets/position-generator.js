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
        chess.put({ type: 'k', color: 'w' }, uniquesquare(busysquare));

        // Размещаем чёрного короля
        chess.put({ type: 'k', color: 'b' }, uniquesquare(busysquare));

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

        // Проверяем шах и мат для обоих королей
        // Создаём новый объект Chess из FEN для надёжной проверки
        const fen = chess.fen();
        const testChess = new Chess(fen);
        
        // Находим позиции королей для дополнительной проверки
        let blackKingSquare = null;
        let whiteKingSquare = null;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = String.fromCharCode(97 + j) + (8 - i);
                const piece = testChess.get(square);
                if (piece && piece.type === 'k') {
                    if (piece.color === 'b') blackKingSquare = square;
                    if (piece.color === 'w') whiteKingSquare = square;
                }
            }
        }
        
        // Проверяем шах чёрному королю
        testChess.turn('b');
        const blackInCheck = testChess.in_check();
        const blackMoves = testChess.moves();
        const blackInCheckmate = blackInCheck && blackMoves.length === 0;
        
        // Проверяем шах белому королю
        testChess.turn('w');
        const whiteInCheck = testChess.in_check();
        const whiteMoves = testChess.moves();
        const whiteInCheckmate = whiteInCheck && whiteMoves.length === 0;
        
        // Дополнительная проверка: проверяем, может ли белая фигура атаковать чёрного короля
        // Для этого временно делаем ход белыми и проверяем все их ходы
        let blackInCheckByMoves = false;
        if (blackKingSquare) {
            testChess.turn('w');
            const whiteMovesToCheck = testChess.moves({ verbose: true });
            blackInCheckByMoves = whiteMovesToCheck.some(move => move.to === blackKingSquare);
        }
        
        // Аналогично для белого короля
        let whiteInCheckByMoves = false;
        if (whiteKingSquare) {
            testChess.turn('b');
            const blackMovesToCheck = testChess.moves({ verbose: true });
            whiteInCheckByMoves = blackMovesToCheck.some(move => move.to === whiteKingSquare);
        }
        
        // Используем обе проверки
        const finalBlackInCheck = blackInCheck || blackInCheckByMoves;
        const finalWhiteInCheck = whiteInCheck || whiteInCheckByMoves;

        if (finalBlackInCheck || finalWhiteInCheck || blackInCheckmate || whiteInCheckmate) {
            // Если любой король под шахом или матом, регенерируем позицию
            if (window.DEBUG_CHESS_GENERATOR) {
                console.log(`Regenerating position:`, {
                    blackInCheck: blackInCheck,
                    blackInCheckByMoves: blackInCheckByMoves,
                    whiteInCheck: whiteInCheck,
                    whiteInCheckByMoves: whiteInCheckByMoves,
                    blackInCheckmate: blackInCheckmate,
                    whiteInCheckmate: whiteInCheckmate,
                    blackMovesCount: blackMoves.length,
                    whiteMovesCount: whiteMoves.length,
                    blackKingSquare: blackKingSquare,
                    whiteKingSquare: whiteKingSquare,
                    fen: fen
                });
            }
            return generate();
        }

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

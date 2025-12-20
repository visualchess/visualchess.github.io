// Предполагается, что у вас установлена библиотека Chess.js (npm install chess.js)
// Если нет, добавьте <script src="https://cdn.jsdelivr.net/npm/chess.js@0.13.4/chess.min.js"></script> в HTML

function generateEndgamePosition(type) {
    while (true) {
        const chess = new Chess();
        chess.clear();
        
        // Размещаем чёрного короля на случайной клетке
        let blackKingSquare;
        do {
            const files = 'abcdefgh';
            const ranks = '12345678';
            blackKingSquare = files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
        } while (false); // Нет дополнительных ограничений
        chess.put({ type: 'k', color: 'b' }, blackKingSquare);
        
        // Размещаем белого короля на случайной клетке
        let whiteKingSquare;
        do {
            const files = 'abcdefgh';
            const ranks = '12345678';
            whiteKingSquare = files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
        } while (whiteKingSquare === blackKingSquare);
        chess.put({ type: 'k', color: 'w' }, whiteKingSquare);
        
        // В зависимости от типа, размещаем остальные фигуры белых
        const occupiedSquares = [blackKingSquare, whiteKingSquare];
        
        switch (type) {
            case 0: // Король + Ферзь
                let queenSquare;
                do {
                    const files = 'abcdefgh';
                    const ranks = '12345678';
                    queenSquare = files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
                } while (occupiedSquares.includes(queenSquare));
                occupiedSquares.push(queenSquare);
                chess.put({ type: 'q', color: 'w' }, queenSquare);
                break;
            case 1: // Король + Ладья + Ладья
                for (let i = 0; i < 2; i++) {
                    let rookSquare;
                    do {
                        const files = 'abcdefgh';
                        const ranks = '12345678';
                        rookSquare = files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
                    } while (occupiedSquares.includes(rookSquare));
                    occupiedSquares.push(rookSquare);
                    chess.put({ type: 'r', color: 'w' }, rookSquare);
                }
                break;
            case 2: // Король + Ладья
                let rookSquare;
                do {
                    const files = 'abcdefgh';
                    const ranks = '12345678';
                    rookSquare = files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
                } while (occupiedSquares.includes(rookSquare));
                occupiedSquares.push(rookSquare);
                chess.put({ type: 'r', color: 'w' }, rookSquare);
                break;
            case 3: // Король + Слон + Слон (один на светлом, один на тёмном поле)
                const bishopColors = ['light', 'dark'];
                for (let i = 0; i < 2; i++) {
                    let bishopSquare;
                    do {
                        const files = 'abcdefgh';
                        const ranks = '12345678';
                        bishopSquare = files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
                        const fileIndex = files.indexOf(bishopSquare[0]);
                        const rankIndex = parseInt(bishopSquare[1]) - 1;
                        const isLight = (fileIndex + rankIndex) % 2 === 0;
                        if ((bishopColors[i] === 'light' && !isLight) || (bishopColors[i] === 'dark' && isLight)) continue;
                    } while (occupiedSquares.includes(bishopSquare));
                    occupiedSquares.push(bishopSquare);
                    chess.put({ type: 'b', color: 'w' }, bishopSquare);
                }
                break;
            case 4: // Король + Слон + Конь
                // Сначала слон
                let bishopSquare;
                do {
                    const files = 'abcdefgh';
                    const ranks = '12345678';
                    bishopSquare = files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
                } while (occupiedSquares.includes(bishopSquare));
                occupiedSquares.push(bishopSquare);
                chess.put({ type: 'b', color: 'w' }, bishopSquare);
                
                // Затем конь
                let knightSquare;
                do {
                    const files = 'abcdefgh';
                    const ranks = '12345678';
                    knightSquare = files[Math.floor(Math.random() * 8)] + ranks[Math.floor(Math.random() * 8)];
                } while (occupiedSquares.includes(knightSquare));
                occupiedSquares.push(knightSquare);
                chess.put({ type: 'n', color: 'w' }, knightSquare);
                break;
            default:
                throw new Error('Invalid type');
        }
        
        // Устанавливаем ход белых
        chess.turn('w');
        
        // Проверяем валидность: белый король не под шахом
        if (!chess.in_check()) {
            return chess.fen();
        }
        // Если не валидна, цикл повторится
    }
}

// Пример использования:
// console.log(generateEndgamePosition(0)); // Для типа 0

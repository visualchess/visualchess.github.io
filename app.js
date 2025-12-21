let board;
let chess;

// Инициализация доски
function initBoard() {
    board = Chessboard('board', {
        draggable: true,
        dropOffBoard: 'trash',
        sparePieces: false,
        onDrop: onDrop,
        onDragStart: onDragStart,
        pieceTheme: 'img/chesspieces/wikipedia/{piece}.png'
    });
}

// Обработчик начала перетаскивания
function onDragStart(source, piece, position, orientation) {
    // Разрешаем перетаскивать только фигуры текущего хода
    if (chess.turn() === 'w' && piece.search(/^w/) === -1) {
        return false;
    }
    if (chess.turn() === 'b' && piece.search(/^b/) === -1) {
        return false;
    }
}

// Обработчик завершения хода
function onDrop(source, target) {
    // Пытаемся сделать ход
    const move = chess.move({
        from: source,
        to: target,
        promotion: 'q' // автоматическое превращение в ферзя
    });
    
    // Если ход недопустим, возвращаем фигуру
    if (move === null) {
        return 'snapback';
    }
    
    // Обновляем доску
    updateBoard();
    
    return true;
}

// Обновление доски
function updateBoard() {
    board.position(chess.fen());
}

// Генерация новой позиции
function generatePosition() {
    const type = Number.parseInt(document.getElementById('positionType').value, 10);
    const infoDiv = document.getElementById('info');
    
    try {
        // Включаем режим отладки (можно включить в консоли: window.DEBUG_CHESS_GENERATOR = true)
        const debugMode = window.DEBUG_CHESS_GENERATOR || false;
        
        const fen = generateCheckmatePosition(type);
        chess = new Chess(fen);
        
        // Проверяем, нет ли шаха в сгенерированной позиции (для отладки)
        if (debugMode) {
            chess.turn('b');
            const blackCheck = chess.in_check();
            chess.turn('w');
            const whiteCheck = chess.in_check();
            console.log('Generated position check status:', {
                fen: fen,
                blackInCheck: blackCheck,
                whiteInCheck: whiteCheck,
                turn: chess.turn()
            });
        }
        
        // Очищаем доску перед установкой новой позиции
        board.position('empty');
        // Устанавливаем новую позицию
        board.position(fen);
        
        const typeNames = [
            'Ферзь + король',
            'Две ладьи + король',
            'Одна ладья + король',
            'Два слона + король',
            'Слон + конь + король'
        ];
        
        infoDiv.innerHTML = `
            <strong>Сгенерирована позиция:</strong><br>
            ${typeNames[type]}<br>
            <small>FEN: ${fen}</small>
        `;
    } catch (error) {
        infoDiv.innerHTML = `<strong>Ошибка:</strong> ${error.message}`;
        console.error('Error generating position:', error);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initBoard();
    displayVersion();
    
    // Обработчик кнопки генерации
    document.getElementById('generateBtn').addEventListener('click', generatePosition);
    
    // Генерируем начальную позицию
    generatePosition();
});


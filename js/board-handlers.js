// Обработчики доски

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
    // Блокируем доску если игра окончена
    if (isGameOver) {
        return false;
    }
    
    // Запрещаем ходить чёрными фигурами - только белые могут ходить
    if (piece.search(/^b/) !== -1) {
        return false;
    }
    
    // Разрешаем перетаскивать только фигуры текущего хода (белые)
    if (chess.turn() === 'w' && piece.search(/^w/) === -1) {
        return false;
    }
    
    // Проверяем, что сейчас ход пользователя
    if (!isUserTurn && chess.turn() === 'w') {
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
    
    // Увеличиваем счётчик ходов белых
    incrementWhiteMoves();
    updateGameStatus();
    
    // Обновляем доску
    updateBoard();
    
    // Если ход белых выполнен, запрашиваем ход Stockfish (чёрных)
    if (chess.turn() === 'b' && stockfish) {
        isUserTurn = false;
        
        // Проверяем количество ходов до мата после хода пользователя
        checkMateInMoves(true).then(async () => {
            // После проверки запрашиваем ход Stockfish
            const fen = chess.fen();
            await sendStockfishCommand(`position fen ${fen}`);
            await sendStockfishCommand(`go depth 15`);
        });
    }
    
    return true;
}

// Обновление доски
function updateBoard() {
    board.position(chess.fen());
}


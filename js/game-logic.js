// Логика игры

// Проверка количества ходов до мата
async function checkMateInMoves(isAfterUserMove = false) {
    if (!chess || !stockfish) return;
    
    const fen = chess.fen();
    const mateIn = await getMateInMoves(fen, 20);
    
    if (mateIn !== null) {
        currentMateIn = mateIn;
        
        // Проверяем ошибку только после хода пользователя
        if (isAfterUserMove && expectedMateIn !== null && currentMateIn !== null) {
            // После правильного хода пользователя количество ходов должно уменьшиться на 1
            // Если не уменьшилось или увеличилось - это ошибка
            if (currentMateIn >= expectedMateIn) {
                // Пользователь сделал ошибку - увеличиваем штраф
                addPenalty();
                updatePenaltyInfo();
                console.log(`Ошибка! Ожидалось мат в ${expectedMateIn} ходов, стало ${currentMateIn}`);
            }
        }
        
        // Обновляем ожидаемое значение для следующей проверки
        if (isAfterUserMove) {
            // После хода пользователя ожидаем, что после хода Stockfish будет на 1 меньше
            expectedMateIn = currentMateIn;
        } else {
            // После хода Stockfish ожидаем, что после хода пользователя будет на 1 меньше
            expectedMateIn = currentMateIn - 1;
        }
        
        updateMateInfo();
        updateGameStatus(); // Обновляем статус после проверки мата
    }
}

// Генерация новой позиции
async function generatePosition() {
    const type = Number.parseInt(document.getElementById('positionType').value, 10);
    const infoDiv = document.getElementById('info');
    
    try {
        // Включаем режим отладки (можно включить в консоли: window.DEBUG_CHESS_GENERATOR = true)
        const debugMode = window.DEBUG_CHESS_GENERATOR || false;
        
        const fen = generateCheckmatePosition(type);
        chess = new Chess(fen);
        
        // Сбрасываем состояние игры
        resetGameState();
        updatePenaltyInfo();
        updateMateInfo();
        updateGameStatus();
        
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
            'Мат ферзём одинокому королю',
            'Мат двумя ладьями одинокому королю',
            'Мат ладьёй одинокому королю',
            'Мат двумя слонами одинокому королю',
            'Мат слоном и конём одинокому королю'
        ];
        
        infoDiv.innerHTML = `
            <strong>Сгенерирована позиция:</strong><br>
            ${typeNames[type]}<br>
            <small>FEN: ${fen}</small>
        `;
        
        // Запрашиваем у Stockfish количество ходов до мата
        if (stockfish) {
            const mateIn = await getMateInMoves(fen, 20);
            if (mateIn !== null) {
                currentMateIn = mateIn;
                expectedMateIn = mateIn; // Ожидаемое количество ходов
                updateMateInfo();
                updateGameStatus();
            }
        }
    } catch (error) {
        infoDiv.innerHTML = `<strong>Ошибка:</strong> ${error.message}`;
        console.error('Error generating position:', error);
    }
}


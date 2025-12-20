<!-- Подключите Chess.js -->
<script src="https://cdn.jsdelivr.net/npm/chess.js@0.13.4/chess.min.js"></script>
<!-- Подключите Chessboard.js -->
<script src="https://cdn.jsdelivr.net/npm/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js"></script>
<!-- Стили для доски -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css">

// Создаём объект Chess с FEN (например, сгенерированным из вашего кода)
const fen = generateEndgamePosition(0); // Ваш код генерации
const chess = new Chess(fen);

// Создаём доску в элементе с id="board" (добавьте <div id="board"></div> в HTML)
const board = Chessboard('board', {
    position: fen,  // Устанавливаем позицию из FEN
    draggable: false,  // Отключаем перетаскивание фигур (если не нужно)
    dropOffBoard: 'trash',  // Опционально
    sparePieces: true  // Показывать запасные фигуры (опционально)
});

// Функция для обновления доски (если позиция изменится)
function updateBoard() {
    board.position(chess.fen());
}

// Пример: если нужно обновить доску после хода
// chess.move('e2e4');
// updateBoard();

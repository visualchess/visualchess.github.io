// Глобальное состояние игры
let board;
let chess;
let stockfish;
let expectedMateIn = null; // Ожидаемое количество ходов до мата
let currentMateIn = null; // Текущее количество ходов до мата
let penaltyPoints = 0; // Штрафные очки
let isUserTurn = true; // Флаг, что сейчас ход пользователя
let whiteMovesCount = 0; // Счётчик ходов белых
let blackMovesCount = 0; // Счётчик ходов чёрных
let isGameOver = false; // Флаг окончания игры (мат или пат)

// Функции для работы с состоянием
function resetGameState() {
    penaltyPoints = 0;
    expectedMateIn = null;
    currentMateIn = null;
    isUserTurn = true;
    whiteMovesCount = 0;
    blackMovesCount = 0;
    isGameOver = false;
}

function incrementWhiteMoves() {
    whiteMovesCount++;
}

function incrementBlackMoves() {
    blackMovesCount++;
}

function addPenalty() {
    penaltyPoints++;
}


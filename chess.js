// ========== CHESS GAME LOGIC ==========

class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentTurn = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameMode = 'friend'; // 'friend' or 'bot'
        this.botDifficulty = 'easy';
        this.boardFlipped = false;
        this.gameOver = false;
        this.moveHistory = [];
    }

    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Setup white pieces (bottom)
        board[7] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'].map(p => 'w' + p);
        board[6] = Array(8).fill('wP');
        
        // Setup black pieces (top)
        board[0] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'].map(p => 'b' + p);
        board[1] = Array(8).fill('bP');
        
        return board;
    }

    getPieceSymbol(piece) {
        if (!piece) return '';
        const symbols = {
            'P': '♟', 'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚'
        };
        return symbols[piece[1]] || '';
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece || piece[0] !== this.currentTurn[0]) return [];

        const type = piece[1];
        let moves = [];

        if (type === 'P') moves = this.getPawnMoves(row, col, piece);
        else if (type === 'R') moves = this.getRookMoves(row, col);
        else if (type === 'N') moves = this.getKnightMoves(row, col);
        else if (type === 'B') moves = this.getBishopMoves(row, col);
        else if (type === 'Q') moves = this.getQueenMoves(row, col);
        else if (type === 'K') moves = this.getKingMoves(row, col);

        return moves.filter(([r, c]) => this.isInBounds(r, c) && this.isLegalMove(row, col, r, c, piece));
    }

    getPawnMoves(row, col, piece) {
        const moves = [];
        const direction = piece[0] === 'w' ? -1 : 1;
        const startRow = piece[0] === 'w' ? 6 : 1;

        // Forward move
        if (this.isInBounds(row + direction, col) && !this.board[row + direction][col]) {
            moves.push([row + direction, col]);
            
            // Double move from start
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push([row + 2 * direction, col]);
            }
        }

        // Captures
        for (let dcol of [-1, 1]) {
            const newCol = col + dcol;
            if (this.isInBounds(row + direction, newCol)) {
                const target = this.board[row + direction][newCol];
                if (target && target[0] !== piece[0]) {
                    moves.push([row + direction, newCol]);
                }
            }
        }

        return moves;
    }

    getRookMoves(row, col) {
        return this.getLineMoves(row, col, [[0, 1], [0, -1], [1, 0], [-1, 0]]);
    }

    getBishopMoves(row, col) {
        return this.getLineMoves(row, col, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
    }

    getQueenMoves(row, col) {
        return this.getLineMoves(row, col, [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
    }

    getKnightMoves(row, col) {
        const moves = [];
        const deltas = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
        
        for (let [dr, dc] of deltas) {
            const nr = row + dr, nc = col + dc;
            if (this.isInBounds(nr, nc)) {
                const target = this.board[nr][nc];
                if (!target || target[0] !== this.board[row][col][0]) {
                    moves.push([nr, nc]);
                }
            }
        }
        return moves;
    }

    getKingMoves(row, col) {
        const moves = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr, nc = col + dc;
                if (this.isInBounds(nr, nc)) {
                    const target = this.board[nr][nc];
                    if (!target || target[0] !== this.board[row][col][0]) {
                        moves.push([nr, nc]);
                    }
                }
            }
        }
        return moves;
    }

    getLineMoves(row, col, directions) {
        const moves = [];
        const piece = this.board[row][col];

        for (let [dr, dc] of directions) {
            for (let i = 1; i < 8; i++) {
                const nr = row + dr * i;
                const nc = col + dc * i;
                if (!this.isInBounds(nr, nc)) break;

                const target = this.board[nr][nc];
                if (!target) {
                    moves.push([nr, nc]);
                } else {
                    if (target[0] !== piece[0]) {
                        moves.push([nr, nc]);
                    }
                    break;
                }
            }
        }
        return moves;
    }

    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isLegalMove(fromRow, fromCol, toRow, toCol, piece) {
        // Simulate the move and check if king is in check
        const backup = this.board[toRow][toCol];
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        const inCheck = this.isKingInCheck(piece[0]);

        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = backup;

        return !inCheck;
    }

    isKingInCheck(color) {
        let kingPos = null;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.board[r][c] === color + 'K') {
                    kingPos = [r, c];
                    break;
                }
            }
            if (kingPos) break;
        }

        if (!kingPos) return false;

        const enemyColor = color === 'w' ? 'b' : 'w';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece[0] === enemyColor) {
                    const moves = this.getValidMovesSimple(r, c);
                    if (moves.some(([mr, mc]) => mr === kingPos[0] && mc === kingPos[1])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getValidMovesSimple(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const type = piece[1];
        let moves = [];

        if (type === 'P') moves = this.getPawnMoves(row, col, piece);
        else if (type === 'R') moves = this.getRookMoves(row, col);
        else if (type === 'N') moves = this.getKnightMoves(row, col);
        else if (type === 'B') moves = this.getBishopMoves(row, col);
        else if (type === 'Q') moves = this.getQueenMoves(row, col);
        else if (type === 'K') moves = this.getKingMoves(row, col);

        return moves.filter(([r, c]) => this.isInBounds(r, c));
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const moves = this.getValidMoves(fromRow, fromCol);
        if (!moves.some(([r, c]) => r === toRow && c === toCol)) return false;

        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;
        this.moveHistory.push({from: [fromRow, fromCol], to: [toRow, toCol]});

        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        return true;
    }

    getRandomMove() {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const validMoves = this.getValidMoves(r, c);
                for (let [tr, tc] of validMoves) {
                    moves.push([r, c, tr, tc]);
                }
            }
        }
        return moves[Math.floor(Math.random() * moves.length)];
    }

    getMediumMove() {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const validMoves = this.getValidMoves(r, c);
                for (let [tr, tc] of validMoves) {
                    const captureValue = this.board[tr][tc] ? 1 : 0;
                    const centerBonus = (3.5 - Math.abs(tr - 3.5)) + (3.5 - Math.abs(tc - 3.5));
                    moves.push({from: [r, c], to: [tr, tc], score: captureValue * 10 + centerBonus});
                }
            }
        }
        moves.sort((a, b) => b.score - a.score);
        return moves[0];
    }

    getHardMove() {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const validMoves = this.getValidMoves(r, c);
                for (let [tr, tc] of validMoves) {
                    const score = this.evaluateMove(r, c, tr, tc);
                    moves.push({from: [r, c], to: [tr, tc], score});
                }
            }
        }
        moves.sort((a, b) => b.score - a.score);
        return moves[0];
    }

    evaluateMove(fromR, fromC, toR, toC) {
        let score = 0;
        const piece = this.board[fromR][fromC];
        const target = this.board[toR][toC];

        // Capture value
        if (target) {
            const values = {P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100};
            score += values[target[1]] * 10;
        }

        // Piece positioning
        const pieceValues = {P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0};
        const centerDistance = Math.abs(toR - 3.5) + Math.abs(toC - 3.5);
        score += (7 - centerDistance) * 2;

        // Avoid moving king to dangerous squares
        if (piece[1] === 'K') score -= centerDistance * 3;

        return score;
    }

    aiMove() {
        let move;
        if (this.botDifficulty === 'easy') {
            move = this.getRandomMove();
        } else if (this.botDifficulty === 'medium') {
            move = this.getMediumMove();
        } else {
            move = this.getHardMove();
        }

        if (move) {
            this.movePiece(move[0] || move.from[0], move[1] || move.from[1], move[2] || move.to[0], move[3] || move.to[1]);
        }
    }
}

// ========== UI LOGIC ==========

let game = null;

function startFriendGame() {
    game = new ChessGame();
    game.gameMode = 'friend';
    showGameScreen();
    renderBoard();
}

function startBotGame(difficulty) {
    game = new ChessGame();
    game.gameMode = 'bot';
    game.botDifficulty = difficulty;
    showGameScreen();
    renderBoard();
}

function showDifficultyMenu() {
    document.getElementById('homeMenu').classList.remove('active');
    document.getElementById('difficultyMenu').classList.add('active');
}

function showGameScreen() {
    document.getElementById('homeMenu').classList.remove('active');
    document.getElementById('difficultyMenu').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
}

function backToHome() {
    document.getElementById('homeMenu').classList.add('active');
    document.getElementById('difficultyMenu').classList.remove('active');
    document.getElementById('gameScreen').classList.remove('active');
    game = null;
}

function resetGame() {
    if (game) {
        game = new ChessGame();
        game.gameMode = 'friend';
        renderBoard();
    }
}

function renderBoard() {
    const board = document.getElementById('chessboard');
    board.innerHTML = '';

    // Update turn indicator
    document.getElementById('currentPlayer').textContent = game.currentTurn === 'white' ? "White's Turn" : "Black's Turn";

    // Update player labels
    const topPlayer = document.getElementById('topPlayer');
    const bottomPlayer = document.getElementById('bottomPlayer');
    
    if (game.boardFlipped) {
        topPlayer.textContent = 'White';
        bottomPlayer.textContent = 'Black';
    } else {
        topPlayer.textContent = 'Black';
        bottomPlayer.textContent = 'White';
    }

    let boardArray = game.board;
    if (game.boardFlipped) {
        boardArray = boardArray.slice().reverse().map(row => row.slice().reverse());
    }

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const actualRow = game.boardFlipped ? 7 - r : r;
            const actualCol = game.boardFlipped ? 7 - c : c;
            
            const square = document.createElement('div');
            const isLight = (actualRow + actualCol) % 2 === 0;
            square.className = `square ${isLight ? 'light' : 'dark'}`;

            if (game.selectedSquare && game.selectedSquare[0] === actualRow && game.selectedSquare[1] === actualCol) {
                square.classList.add('selected');
            }

            if (game.validMoves.some(([vr, vc]) => vr === actualRow && vc === actualCol)) {
                square.classList.add('highlight');
            }

            const piece = game.board[actualRow][actualCol];
            if (piece) {
                const symbol = document.createElement('span');
                symbol.className = 'piece';
                symbol.textContent = game.getPieceSymbol(piece);
                symbol.style.color = piece[0] === 'w' ? '#ffffff' : '#000000';
                square.appendChild(symbol);
            }

            square.onclick = () => handleSquareClick(actualRow, actualCol);
            board.appendChild(square);
        }
    }
}

function handleSquareClick(row, col) {
    if (!game || game.gameOver) return;

    if (game.selectedSquare) {
        if (game.selectedSquare[0] === row && game.selectedSquare[1] === col) {
            game.selectedSquare = null;
            game.validMoves = [];
        } else if (game.validMoves.some(([r, c]) => r === row && c === col)) {
            game.movePiece(game.selectedSquare[0], game.selectedSquare[1], row, col);
            game.selectedSquare = null;
            game.validMoves = [];

            renderBoard();

            if (game.gameMode === 'bot' && game.currentTurn === 'black' && !game.gameOver) {
                setTimeout(() => {
                    game.aiMove();
                    game.boardFlipped = false;
                    renderBoard();
                }, 500);
            } else if (game.gameMode === 'friend') {
                game.boardFlipped = !game.boardFlipped;
                renderBoard();
            }

            return;
        } else {
            const piece = game.board[row][col];
            if (piece && piece[0] === game.currentTurn[0]) {
                game.selectedSquare = [row, col];
                game.validMoves = game.getValidMoves(row, col);
            } else {
                game.selectedSquare = null;
                game.validMoves = [];
            }
        }
    } else {
        const piece = game.board[row][col];
        if (piece && piece[0] === game.currentTurn[0]) {
            game.selectedSquare = [row, col];
            game.validMoves = game.getValidMoves(row, col);
        }
    }

    renderBoard();
}
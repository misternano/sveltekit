export enum Move {
	X = "X",
	O = "O",
	Empty = "",
}

export enum State {
	Playing,
	Draw,
	Won,
}

export type Cell = Move.X | Move.O | Move.Empty;
export type Board = ReadonlyArray<ReadonlyArray<Cell>>;
export type Coord = readonly [row: number, col: number];

export interface EvaluateOptions {
	winLength?: number;
}

export interface BoardEvaluation {
	state: State;
	winner: Move.X | Move.O | null;
	winningCells: Coord[];
}

const isPlayerMove = (cell: Cell): cell is Move.X | Move.O => {
	return cell === Move.X || cell === Move.O;
}

export const opponentOf = (move: Move.X | Move.O): Move.X | Move.O => {
	return move === Move.X ? Move.O : Move.X;
}

const assertSquareBoard = (board: Board): number => {
	if (!Array.isArray(board) || board.length === 0) {
		throw new Error("Invalid board: expected a non-empty 2D array.");
	}
	
	const n = board.length;
	for (let r = 0; r < n; r++) {
		const row = board[r];
		if (!Array.isArray(row) || row.length !== n) {
			throw new Error("Invalid board: expected a square NxN matrix.");
		}
		for (let c = 0; c < n; c++) {
			const v = row[c];
			if (v !== Move.X && v !== Move.O && v !== Move.Empty) {
				throw new Error(`Invalid board: unexpected cell value at (${r}, ${c}).`);
			}
		}
	}
	
	return n;
}

const inBounds = (n: number, r: number, c: number): boolean => {
	return r >= 0 && r < n && c >= 0 && c < n;
}

const allFilled = (board: Board): boolean => {
	for (const row of board) {
		for (const cell of row) {
			if (cell === Move.Empty) return false;
		}
	}
	return true;
}

const findWinningLine = (
	board: Board,
	n: number,
	winLength: number,
): { winner: Move.X | Move.O; winningCells: Coord[] } | null => {
	const directions: ReadonlyArray<readonly [dr: number, dc: number]> = [
		[0, 1],
		[1, 0],
		[1, 1],
		[1, -1],
	];
	
	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			const start = board[r][c];
			if (!isPlayerMove(start)) continue;
			
			for (const [dr, dc] of directions) {
				const cells: Coord[] = [[r, c]];
				let rr = r;
				let cc = c;
				
				for (let k = 1; k < winLength; k++) {
					rr += dr;
					cc += dc;
					if (!inBounds(n, rr, cc)) break;
					if (board[rr][cc] !== start) break;
					cells.push([rr, cc]);
				}
				
				if (cells.length === winLength) {
					return { winner: start, winningCells: cells };
				}
			}
		}
	}
	
	return null;
}

export const evaluateBoard = (board: Board, options: EvaluateOptions = {}): BoardEvaluation => {
	const n = assertSquareBoard(board);
	
	const winLength = options.winLength ?? Math.min(3, n);
	if (!Number.isInteger(winLength) || winLength < 2 || winLength > n) {
		throw new Error(`Invalid winLength: expected an integer between 2 and ${n}.`);
	}
	
	const win = findWinningLine(board, n, winLength);
	if (win) {
		return { state: State.Won, winner: win.winner, winningCells: win.winningCells };
	}
	
	if (allFilled(board)) {
		return { state: State.Draw, winner: null, winningCells: [] };
	}
	
	return { state: State.Playing, winner: null, winningCells: [] };
}

export const checkWinner = (board: Board): Move.X | Move.O | undefined => {
	const result = evaluateBoard(board, { winLength: Math.min(3, assertSquareBoard(board)) });
	return result.winner ?? undefined;
}

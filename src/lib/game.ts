import { setLastGame } from "./lastGame"

export type GameId = "sudoku" | "tictactoe" | "snake" | "blackjack"

export type GameMeta = {
	slug: GameId
	name: string
	path: string
	tagline: string
}

export const GAMES: GameMeta[] = [
	{
		slug: "sudoku",
		name: "Sudoku",
		path: "/sudoku",
		tagline: "Daily logic, clean interface, full keyboard support."
	},
	{
		slug: "tictactoe",
		name: "Tic-Tac-Toe",
		path: "/tictactoe",
		tagline: "Quick online duels — read the board, steal the win."
	},
	{
		slug: "snake",
		name: "Snake",
		path: "/snake",
		tagline: "Classic arcade survival. Chase the length, dodge yourself."
	},
	{
		slug: "blackjack",
		name: "Black Jack",
		path: "/blackjack",
		tagline: "Hit, stand, double — chase 21 without busting."
	}
] as const

export const normalizePathname = (pathname: string): string => {
	if (!pathname) return "/";
	if (pathname === "/") return "/";
	return pathname.replace(/\/+$/, ""); // strip trailing slashes
}

export const syncLastGameFromPath = (pathname: string) => {
	const p = normalizePathname(pathname);
	const g = GAMES.find((x) => x.path === p);
	if (!g) return;
	setLastGame({ slug: g.slug, name: g.name, path: g.path, updatedAt: Date.now() });
};

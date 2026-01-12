<!-- src/routes/tictactoe/+page.svelte -->
<script lang="ts">
	import { Move, State, evaluateBoard, opponentOf } from "./lib/util"
	import { Icon } from "./components"
	import { onDestroy, onMount, tick } from "svelte"
	import { ChevronDown, Loader } from "lucide-svelte"

	onMount(() => {
		localStorage.setItem(
			"bkclb_arcade_last_game",
			JSON.stringify({ id: "tictactoe", name: "Tic-Tac-Toe", path: "/tictactoe", updatedAt: Date.now() })
		)
	})

	let boardEl: HTMLElement
	let statusEl: HTMLElement | undefined

	const focusNextAvailableTile = () => {
		const nextTile = boardEl?.querySelector?.(
			"button[aria-disabled='false'],button:not([aria-disabled])"
		) as HTMLElement | null
		if (nextTile) nextTile.focus()
		else statusEl?.focus?.()
	}

	const getEmptyBoard = () => [
		[Move.Empty, Move.Empty, Move.Empty] as Move[],
		[Move.Empty, Move.Empty, Move.Empty] as Move[],
		[Move.Empty, Move.Empty, Move.Empty] as Move[]
	]

	const isEmptyBoard = (b: Move[][]) => b.every((row) => row.every((cell) => cell === Move.Empty))

	const safeEvaluate = (b: Move[][]) => {
		try {
			return evaluateBoard(b)
		} catch {
			return {
				state: State.Playing,
				winner: null as Move.X | Move.O | null,
				winningCells: [] as [number, number][]
			}
		}
	}

	let board: Move[][] = getEmptyBoard()
	let turn: Move = Move.O
	let state: State = State.Playing
	let pendingFocus = false

	let awaitingStateAfterReset = false
	let roundStarter: Move.X | Move.O = Move.O

	$: evaluation = safeEvaluate(board)
	$: winner = evaluation.winner ?? undefined
	$: state = evaluation.state

	let winningKeySet = new Set<string>()
	let winIndexByKey = new Map<string, number>()

	$: {
		const keys = evaluation.winningCells.map(([r, c]) => `${r}:${c}`)
		winningKeySet = new Set(keys)
		winIndexByKey = new Map(keys.map((k, i) => [k, i]))
	}

	const isWinningCell = (r: number, c: number) => winningKeySet.has(`${r}:${c}`)
	const winDelayMs = (r: number, c: number) => (winIndexByKey.get(`${r}:${c}`) ?? 0) * 90

	type Point = { x: number; y: number }
	let showWinLine = false
	let winLine = { x1: 0, y1: 0, x2: 0, y2: 0 }
	let winLineNonce = 0

	const cellCenter = (r: number, c: number): Point => {
		if (!boardEl) return { x: 0, y: 0 }
		const tile = boardEl.querySelector(`[data-rc="${r}:${c}"]`) as HTMLElement | null
		if (!tile) return { x: 0, y: 0 }
		const b = boardEl.getBoundingClientRect()
		const t = tile.getBoundingClientRect()
		return { x: t.left - b.left + t.width / 2, y: t.top - b.top + t.height / 2 }
	}

	const computeWinLine = async () => {
		const nonce = ++winLineNonce

		if (!boardEl || state !== State.Won || evaluation.winningCells.length !== 3) {
			showWinLine = false
			return
		}

		await tick()
		if (nonce !== winLineNonce) return

		const [a, , c] = evaluation.winningCells
		const p1 = cellCenter(a[0], a[1])
		const p2 = cellCenter(c[0], c[1])

		winLine = { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
		showWinLine = true
	}

	$: computeWinLine()

	const onResize = () => {
		void computeWinLine()
	}

	type Player = { mark: "X" | "O"; name: string }
	let players: Player[] = []

	const wsBase = "wss://api.ncc.dev/arcade/tictactoe/ws"
	let ws: WebSocket | null = null

	let userName = ""
	const rnd3 = () => String(Math.floor(100 + Math.random() * 900))
	const newUserName = () => `User #${rnd3()}`

	let roomCode = ""
	let joinCode = ""
	let youAre: "X" | "O" | undefined
	let youId: string | undefined
	let error = ""
	let connected = false

	const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)

	const generateRoomCode = (len = 6) => {
		const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789"
		const bytes = new Uint8Array(len)
		crypto.getRandomValues(bytes)
		let out = ""
		for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length]
		return out
	}

	// ----------------------------
	// Cursor tracking (opponent)
	// ----------------------------
	type CursorMsg = {
		type: "cursor"
		id: string
		name: string
		mark: "X" | "O"
		x: number
		y: number
		ts: number
	}

	type CursorLeaveMsg = {
		type: "cursor_leave"
		id: string
		ts: number
	}

	let opponentCursor: CursorMsg | null = null
	let staleTimer: ReturnType<typeof setTimeout> | null = null

	const setOpponentCursor = (m: CursorMsg) => {
		opponentCursor = m
		if (staleTimer) clearTimeout(staleTimer)
		staleTimer = setTimeout(() => {
			if (opponentCursor && Date.now() - opponentCursor.ts > 1500) opponentCursor = null
		}, 1600)
	}

	const clearOpponentCursor = (id?: string) => {
		if (!opponentCursor) return
		if (!id || opponentCursor.id === id) opponentCursor = null
	}

	const canSendCursor = () =>
		Boolean(
			ws &&
			ws.readyState === WebSocket.OPEN &&
			roomCode &&
			youAre &&
			state === State.Playing &&
			!awaitingStateAfterReset
		)

	let raf = 0
	let lastCursor = { x: 0, y: 0 }

	const sendCursor = () => {
		if (!canSendCursor()) return
		if (raf) return
		raf = requestAnimationFrame(() => {
			raf = 0
			try {
				ws?.send(JSON.stringify({ type: "cursor", x: lastCursor.x, y: lastCursor.y }))
			} catch {}
		})
	}

	const sendCursorLeave = () => {
		if (!ws || ws.readyState !== WebSocket.OPEN) return
		if (!roomCode) return
		try {
			ws.send(JSON.stringify({ type: "cursor_leave" }))
		} catch {}
	}

	const onBoardPointerMove = (e: PointerEvent) => {
		if (!canSendCursor()) return
		if (!boardEl) return
		const rect = boardEl.getBoundingClientRect()
		if (rect.width <= 0 || rect.height <= 0) return
		const nx = (e.clientX - rect.left) / rect.width
		const ny = (e.clientY - rect.top) / rect.height
		lastCursor.x = Math.min(1, Math.max(0, nx))
		lastCursor.y = Math.min(1, Math.max(0, ny))
		sendCursor()
	}

	const onBoardPointerLeave = () => {
		sendCursorLeave()
	}

	const cursorDotClass = (mark: "X" | "O") =>
		mark === "X" ? "bg-rose-400 shadow-rose-400/60" : "bg-emerald-400 shadow-emerald-400/60"

	const cursorBadgeClass = (mark: "X" | "O") =>
		mark === "X" ? "bg-rose-500/80 ring-rose-300/50" : "bg-emerald-500/80 ring-emerald-300/50"

	// ----------------------------
	// WebSocket
	// ----------------------------
	const attachHandlers = (socket: WebSocket) => {
		socket.addEventListener("open", () => {
			connected = true
			error = ""
		})

		socket.addEventListener("close", () => {
			connected = false
			youAre = undefined
			youId = undefined
			players = []
			opponentCursor = null
			awaitingStateAfterReset = false
		})

		socket.addEventListener("error", () => {
			connected = false
			error = "Could not connect to server"
		})

		socket.addEventListener("message", async (ev) => {
			let msg: any
			try {
				msg = JSON.parse(String((ev as MessageEvent).data))
			} catch {
				return
			}

			if (msg.type === "joined") {
				roomCode = msg.code
				youAre = msg.youAre
				youId = msg.youId
				if (msg.youName) userName = msg.youName
				return
			}

			if (msg.type === "state") {
				board = msg.board
				turn = msg.turn
				players = msg.players ?? []

				if (isEmptyBoard(board) && (turn === Move.X || turn === Move.O)) {
					roundStarter = turn
				}

				awaitingStateAfterReset = false

				if (pendingFocus) {
					await tick()
					focusNextAvailableTile()
					pendingFocus = false
				}
				return
			}

			if (msg.type === "cursor") {
				const m = msg as CursorMsg
				if (youId && m.id === youId) return
				if (m.x < 0 || m.x > 1 || m.y < 0 || m.y > 1) return
				setOpponentCursor(m)
				return
			}

			if (msg.type === "cursor_leave") {
				const m = msg as CursorLeaveMsg
				if (youId && m.id === youId) return
				clearOpponentCursor(m.id)
				return
			}

			if (msg.type === "error") {
				error = msg.message || "Error"
				pendingFocus = false
				awaitingStateAfterReset = false
				return
			}
		})
	}

	const ensureUser = () => {
		if (!userName) userName = newUserName()
	}

	const connectToRoom = (code: string) =>
		new Promise<void>((resolve, reject) => {
			const c = normalize(code)
			if (c.length !== 6) return reject(new Error("bad code"))

			if (ws?.readyState === WebSocket.OPEN && roomCode === c) return resolve()
			if (ws) {
				try {
					ws.close()
				} catch {}
				ws = null
				connected = false
			}

			ws = new WebSocket(`${wsBase}?room=${c}`)
			attachHandlers(ws)

			const onOpen = () => {
				cleanup()
				resolve()
			}
			const onError = () => {
				cleanup()
				reject(new Error("ws error"))
			}
			const onClose = () => {
				cleanup()
				reject(new Error("ws closed"))
			}
			const cleanup = () => {
				ws?.removeEventListener("open", onOpen)
				ws?.removeEventListener("error", onError)
				ws?.removeEventListener("close", onClose)
			}

			ws.addEventListener("open", onOpen)
			ws.addEventListener("error", onError)
			ws.addEventListener("close", onClose)
		})

	const sendJson = async (payload: unknown) => {
		if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error("not open")
		ws.send(JSON.stringify(payload))
	}

	const createRoom = async () => {
		try {
			ensureUser()
			error = ""
			const code = generateRoomCode()
			await connectToRoom(code)
		} catch {
			error = "Could not connect to server"
		}
	}

	const joinRoom = async () => {
		try {
			error = ""
			ensureUser()
			const code = normalize(joinCode)
			joinCode = code
			if (code.length !== 6) {
				error = "Enter a 6-character code"
				return
			}
			await connectToRoom(code)
		} catch {
			error = "Could not connect to server"
		}
	}

	$: yourTurn = Boolean(
		roomCode &&
		youAre &&
		!awaitingStateAfterReset &&
		state === State.Playing &&
		((turn === Move.X && youAre === "X") || (turn === Move.O && youAre === "O"))
	)

	const sendMove = async (r: number, c: number) => {
		if (!roomCode) return
		if (!yourTurn) return
		try {
			pendingFocus = true
			await sendJson({ type: "move", r, c })
		} catch {
			pendingFocus = false
			error = "Could not send move"
		}
	}

	const sendReset = async () => {
		if (!roomCode) return
		try {
			awaitingStateAfterReset = true
			pendingFocus = true

			roundStarter = opponentOf(roundStarter)
			board = getEmptyBoard()
			turn = roundStarter
			opponentCursor = null

			await sendJson({ type: "reset" })
		} catch {
			pendingFocus = false
			awaitingStateAfterReset = false
			error = "Could not reset"
		}
	}

	const onJoinInput = (e: Event) => {
		joinCode = normalize((e.currentTarget as HTMLInputElement).value)
	}

	$: me = youAre ? players.find((p) => p.mark === youAre)?.name ?? userName : userName
	$: opponent = youAre ? players.find((p) => p.mark !== youAre)?.name : undefined

	onMount(() => {
		window.addEventListener("resize", onResize)
	})

	onDestroy(() => {
		window.removeEventListener("resize", onResize)

		if (staleTimer) clearTimeout(staleTimer)
		staleTimer = null
		if (raf) cancelAnimationFrame(raf)
		raf = 0

		if (ws) {
			try {
				ws.close()
			} catch {}
			ws = null
		}
	})
</script>

<header class="relative">
	<h1 class="w-fit mx-auto font-impact font-medium text-4xl text-center my-16">Tic-Tac-Toe</h1>

	{#if state === State.Won}
		<div class="-z-10 absolute -top-1/2 -translate-y-1/4 w-full text-center font-medium bg-gradient-to-b from-emerald-500/75 to-neutral-900 bg-clip-text text-transparent">
			<h2 class="text-9xl font-impact">{winner} WON</h2>
		</div>
	{/if}

	{#if state === State.Draw}
		<div class="-z-10 absolute -top-1/2 -translate-y-1/4 w-full text-center font-medium bg-gradient-to-b from-neutral-500/75 to-neutral-900 bg-clip-text text-transparent">
			<h2 class="text-9xl font-impact">DRAW</h2>
		</div>
	{/if}
</header>

<div class="grid lg:grid-cols-3">
	<div class="hidden lg:block justify-self-center my-auto relative">
		{#if state === State.Won}
			{#if winner === Move.X}
				<svg xmlns="http://www.w3.org/2000/svg" class="z-10 crown stroke-amber-500 absolute -top-6 left-2 -rotate-12" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
				</svg>
				<svg xmlns="http://www.w3.org/2000/svg" class="winner" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18" /><path d="m6 6 12 12" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18" /><path d="m6 6 12 12" />
				</svg>
			{/if}
		{/if}

		{#if state === State.Draw}
			<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M18 6 6 18" /><path d="m6 6 12 12" />
			</svg>
		{/if}

		{#if state === State.Playing}
			{#if turn === Move.X}
				<div class="absolute right-0 rotate-45"><ChevronDown size="50" class="animate-bounce" /></div>
				<svg xmlns="http://www.w3.org/2000/svg" class="turn" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18" /><path d="m6 6 12 12" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18" /><path d="m6 6 12 12" />
				</svg>
			{/if}
		{/if}
	</div>

	<div
		class="relative w-fit mx-auto grid grid-cols-3 grid-rows-3 gap-0.5 bg-[#171717] rounded-xl overflow-hidden"
		bind:this={boardEl}
		on:pointermove={onBoardPointerMove}
		on:pointerleave={onBoardPointerLeave}
	>
		{#each board as row, r}
			{#each row as col, c}
				<div
					data-rc={`${r}:${c}`}
					style={`--win-delay:${winDelayMs(r, c)}ms;`}
					class={`tile relative h-[100px] p-2 flex justify-center items-center aspect-square transition
						${state === State.Won && isWinningCell(r, c) ? "bg-amber-200/70 win-tile" : state === State.Won ? "bg-neutral-400/60 dim-tile" : "bg-neutral-400"}`}
				>
					{#if state === State.Won && isWinningCell(r, c)}
						<div class="absolute inset-1 rounded-md ring-4 ring-amber-400 shadow-lg shadow-amber-400/30 pointer-events-none win-ring" />
					{/if}

					{#if col !== Move.Empty}
						<Icon move={col} />
					{:else if state === State.Playing}
						<button
							type="button"
							on:click={() => sendMove(r, c)}
							disabled={Boolean(roomCode && youAre && !yourTurn)}
							aria-disabled={Boolean(roomCode && youAre && !yourTurn)}
							class={`h-full w-full rounded-md hover:bg-slate-500/50 focus-visible:bg-slate-500/50 hover:shadow-lg focus-visible:shadow-lg hover:border focus-visible:border focus-visible:ring-0 border-slate-800/50 animate-pulse
								${roomCode && youAre && !yourTurn ? "opacity-60 cursor-not-allowed" : ""}`}
						>
							<span class="hidden">ROW {r + 1} :: COL {c + 1}</span>
						</button>
					{/if}
				</div>
			{/each}
		{/each}

		{#if showWinLine}
			<svg class="winline" aria-hidden="true">
				<line x1={winLine.x1} y1={winLine.y1} x2={winLine.x2} y2={winLine.y2} class="winline-stroke" />
			</svg>
		{/if}

		{#if opponentCursor}
			<div class="absolute inset-0 pointer-events-none" aria-hidden="true">
				<div
					class="absolute flex items-center gap-2"
					style={`left:${opponentCursor.x * 100}%; top:${opponentCursor.y * 100}%; transform:translate(0,-50%);`}
				>
					<div class={`h-2.5 w-2.5 rounded-full shadow ${cursorDotClass(opponentCursor.mark)}`} />
					<div class="flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-800/50 text-white text-xs whitespace-nowrap">
						<span
							class={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded text-[10px] font-bold ring-1 ${cursorBadgeClass(opponentCursor.mark)}`}
						>
							{opponentCursor.mark}
						</span>
						<span>{opponentCursor.name}</span>
					</div>
				</div>
			</div>
		{/if}

		{#if state !== State.Playing}
			<div class="absolute inset-0 bg-black/10">
				<div class="h-full flex justify-center items-center">
					<button
						class="p-1 px-8 bg-indigo-500 hover:ring ring-indigo-300 text-white text-lg font-anton rounded-md active:scale-95 transition-all"
						on:click={sendReset}
					>
						Play Again
					</button>
				</div>
			</div>
		{/if}
	</div>

	<div class="hidden lg:block justify-self-center my-auto relative">
		{#if state === State.Won}
			{#if winner === Move.O}
				<svg xmlns="http://www.w3.org/2000/svg" class="z-10 crown stroke-amber-500 absolute -top-8 right-2 rotate-12" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
				</svg>
				<svg xmlns="http://www.w3.org/2000/svg" class="winner" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" />
				</svg>
			{/if}
		{/if}

		{#if state === State.Draw}
			<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10" />
			</svg>
		{/if}

		{#if state === State.Playing}
			{#if turn === Move.O}
				<div class="absolute -rotate-45"><ChevronDown size="50" class="animate-bounce" /></div>
				<svg xmlns="http://www.w3.org/2000/svg" class="turn" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" />
				</svg>
			{/if}
		{/if}
	</div>
</div>

<div class="w-[50%] mx-auto mt-10 flex flex-col gap-3">
	<div class="flex flex-col flex-wrap items-center gap-3">
		<div class="flex flex-row gap-1 text-sm text-neutral-300">
			<div class="font-semibold">{me}</div>
			<div class="text-neutral-400">{opponent ? `vs ${opponent}` : "Waiting for opponent…"}</div>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<button
				class="flex flex-row items-center gap-2 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
				on:click|preventDefault={async () => {
					if (!roomCode) await createRoom()
					else await navigator.clipboard.writeText(roomCode)
				}}
				disabled={!connected && ws?.readyState === WebSocket.CONNECTING}
			>
				{#if roomCode}
					<span class="tracking-[0.25em] uppercase font-mono">{roomCode}</span>
				{:else}
					{#if ws?.readyState === WebSocket.CONNECTING}
						<Loader size="16" class="animate-spin" />
					{/if}
					Create Room
				{/if}
			</button>

			<div class={`${roomCode && "hidden"} flex items-center gap-2`}>
				<input
					class="w-44 px-3 py-2 rounded-md bg-neutral-800 text-white outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-indigo-400 tracking-[0.35em] text-center uppercase"
					placeholder="JOIN"
					value={joinCode}
					on:input={onJoinInput}
					maxlength="6"
					autocomplete="off"
					autocapitalize="characters"
					spellcheck={false}
				/>
				<button
					class="flex flex-row items-center gap-2 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
					on:click={joinRoom}
					disabled={joinCode.length !== 6}
				>
					Join
				</button>
			</div>
		</div>
	</div>

	{#if error}
		<div class="text-sm text-red-300" tabindex="-1" bind:this={statusEl}>{error}</div>
	{/if}
</div>

<style>
	:global(body) {
		@apply bg-neutral-900 text-[#cccccc];
	}

	.turn {
		filter: drop-shadow(0 0 0.75rem white);
	}

	.winner {
		filter: drop-shadow(0 0 0.75rem green);
	}

	.loser {
		filter: drop-shadow(0 0 0.75rem red);
	}

	.crown {
		filter: drop-shadow(0 0 0.75rem gold);
	}

	.winline {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 30;
	}

	.winline-stroke {
		stroke: rgba(251, 191, 36, 0.98);
		stroke-width: 10;
		stroke-linecap: round;
		vector-effect: non-scaling-stroke;
		filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.35));
		stroke-dasharray: 1000;
		stroke-dashoffset: 1000;
		animation: draw-line 420ms ease-out forwards, pulse-line 1.2s ease-in-out 450ms infinite;
	}

	@keyframes draw-line {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes pulse-line {
		0%,
		100% {
			opacity: 0.9;
		}
		50% {
			opacity: 0.55;
		}
	}

	.dim-tile {
		filter: saturate(0.95);
	}

	.win-tile {
		will-change: transform, filter;
		animation: win-pop 380ms cubic-bezier(0.2, 0.9, 0.2, 1) var(--win-delay, 0ms) both;
	}

	.win-ring {
		z-index: 26;
	}

	@keyframes win-pop {
		0% {
			transform: scale(1);
		}
		35% {
			transform: scale(1.06);
		}
		70% {
			transform: scale(0.99);
		}
		100% {
			transform: scale(1);
		}
	}
</style>

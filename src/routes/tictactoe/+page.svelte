<script lang="ts">
	import { Move, checkWinner, State } from "./lib/util"
	import { EmptyCell, Icon } from "./components"
	import { onMount, tick } from "svelte"
	import { ChevronDown } from "lucide-svelte"

	onMount(() => {
		localStorage.setItem(
			"bkclb_arcade_last_game",
			JSON.stringify({ id: "tictactoe", name: "Tic-Tac-Toe", path: "/tictactoe", updatedAt: Date.now() })
		)
	})

	let boardEl: HTMLElement
	let statusEl: HTMLElement

	const focusNextAvailableTile = () => {
		const nextTile = boardEl.querySelector("button:not(:disabled)")
		if (nextTile) (nextTile as HTMLElement).focus()
		else statusEl?.focus()
	}

	const getEmptyBoard = () => [
		[Move.Empty, Move.Empty, Move.Empty] as Move[],
		[Move.Empty, Move.Empty, Move.Empty] as Move[],
		[Move.Empty, Move.Empty, Move.Empty] as Move[]
	]

	const getGameState = (winner: Move | undefined, board: Move[][]) => {
		if (winner) return State.Won
		if (board.every((row) => row.every((col) => col !== Move.Empty))) return State.Draw
		return State.Playing
	}

	let board: Move[][] = getEmptyBoard()
	let turn: Move = Move.O
	let state: State = State.Playing
	$: winner = checkWinner(board)
	$: state = getGameState(winner, board)

	type Player = { mark: "X" | "O"; name: string }
	let players: Player[] = []

	const wsBase = "wss://bkcld-arcade.nanosclub.workers.dev/ws"
	let ws: WebSocket | null = null

	let userName = ""
	const rnd3 = () => String(Math.floor(100 + Math.random() * 900))
	const newUserName = () => `User #${rnd3()}`

	let roomCode = ""
	let joinCode = ""
	let youAre: "X" | "O" | undefined
	let error = ""
	let connected = false

	const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)

	const generateRoomCode = (len = 6) => {
		const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
		const bytes = new Uint8Array(len)
		crypto.getRandomValues(bytes)
		let out = ""
		for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length]
		return out
	}

	const attachHandlers = (socket: WebSocket) => {
		socket.addEventListener("open", () => {
			connected = true
			error = ""
		})

		socket.addEventListener("close", () => {
			connected = false
			youAre = undefined
			players = []
		})

		socket.addEventListener("error", () => {
			connected = false
			error = "Could not connect to server"
		})

		socket.addEventListener("message", (ev) => {
			const msg = JSON.parse(String((ev as MessageEvent).data))

			if (msg.type === "joined") {
				roomCode = msg.code
				youAre = msg.youAre
				if (msg.youName) userName = msg.youName
				return
			}

			if (msg.type === "state") {
				board = msg.board
				turn = msg.turn
				players = msg.players ?? []
				return
			}

			if (msg.type === "error") {
				error = msg.message || "Error"
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
				try { ws.close() } catch {}
				ws = null
				connected = false
			}

			ws = new WebSocket(`${wsBase}?room=${c}`)
			attachHandlers(ws)

			const onOpen = () => { cleanup(); resolve() }
			const onError = () => { cleanup(); reject(new Error("ws error")) }
			const onClose = () => { cleanup(); reject(new Error("ws closed")) }
			const cleanup = () => {
				ws?.removeEventListener("open", onOpen)
				ws?.removeEventListener("error", onError)
				ws?.removeEventListener("close", onClose)
			}

			ws.addEventListener("open", onOpen)
			ws.addEventListener("error", onError)
			ws.addEventListener("close", onClose)
		})

	const sendJson = async (payload: any) => {
		if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error("not open")
		ws.send(JSON.stringify(payload))
	}

	const createRoom = async () => {
		try {
			ensureUser()
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
			if (code.length !== 6) { error = "Enter a 6-character code"; return }
			await connectToRoom(code)
		} catch {
			error = "Could not connect to server"
		}
	}

	const sendMove = async (row: number, col: number) => {
		if (!roomCode) return
		try {
			await sendJson({ type: "make_move", row, col })
			tick().then(focusNextAvailableTile)
		} catch {
			error = "Could not send move"
		}
	}

	const sendReset = async () => {
		if (!roomCode) return
		try {
			await sendJson({ type: "reset" })
			tick().then(focusNextAvailableTile)
		} catch {
			error = "Could not reset"
		}
	}

	const onJoinInput = (e: Event) => {
		joinCode = normalize((e.currentTarget as HTMLInputElement).value)
	}

	$: me = youAre ? players.find((p) => p.mark === youAre)?.name ?? userName : userName
	$: opponent = youAre ? players.find((p) => p.mark !== youAre)?.name : undefined
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
					<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
				</svg>
				<svg xmlns="http://www.w3.org/2000/svg" class="winner" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/><path d="m6 6 12 12"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/><path d="m6 6 12 12"/>
				</svg>
			{/if}
		{/if}

		{#if state === State.Draw}
			<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M18 6 6 18"/><path d="m6 6 12 12"/>
			</svg>
		{/if}

		{#if state === State.Playing}
			{#if turn === Move.X}
				<div class="absolute right-0 rotate-45"><ChevronDown size="50" class="animate-bounce" /></div>
				<svg xmlns="http://www.w3.org/2000/svg" class="turn" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/><path d="m6 6 12 12"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/><path d="m6 6 12 12"/>
				</svg>
			{/if}
		{/if}
	</div>

	<div class="relative w-fit mx-auto grid grid-cols-3 grid-rows-3 gap-0.5 bg-[#171717] rounded-xl overflow-hidden" bind:this={boardEl}>
		{#each board as row, r}
			{#each row as col, c}
				<div class="h-[100px] p-2 flex justify-center items-center bg-neutral-400 aspect-square">
					{#if col !== Move.Empty}
						<Icon move={col} />
					{:else if state === State.Playing}
						{#if !roomCode || (youAre && youAre === turn)}
							<EmptyCell on:click={() => sendMove(r, c)}>
								<span class="hidden">Place row {r + 1} column {c + 1}</span>
							</EmptyCell>
						{:else}
							<button disabled class="w-full h-full opacity-60 cursor-not-allowed" />
						{/if}
					{/if}
				</div>
			{/each}
		{/each}

		{#if state !== State.Playing}
			<div class="absolute inset-0 bg-black/10 backdrop-blur-sm">
				<div class="h-full flex justify-center items-center">
					<button class="p-1 px-8 bg-indigo-500 hover:ring ring-indigo-300 text-white text-lg font-anton rounded-md active:scale-95 transition-all" on:click={sendReset}>
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
					<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
				</svg>
				<svg xmlns="http://www.w3.org/2000/svg" class="winner" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" />
				</svg>
			{/if}
		{/if}

		{#if state === State.Draw}
			<svg xmlns="http://www.w3.org/2000/svg" class="loser" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10"/>
			</svg>
		{/if}

		{#if state === State.Playing}
			{#if turn === Move.O}
				<div class="absolute -rotate-45"><ChevronDown size="50" class="animate-bounce" /></div>
				<svg xmlns="http://www.w3.org/2000/svg" class="turn" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
				</svg>
			{/if}
		{/if}
	</div>
</div>

<div class="w-[80%] mx-auto mt-10 flex flex-col gap-3">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="text-sm text-neutral-300">
			<div class="font-semibold">{me}</div>
			<div class="text-neutral-400">{opponent ? `vs ${opponent}` : "Waiting for opponent…"}</div>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				class="px-4 py-2 rounded-md bg-indigo-500 text-white ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
				on:click|preventDefault={createRoom}
				disabled={!connected && ws?.readyState === WebSocket.CONNECTING}
			>
				Create Room
			</button>

			<div class="flex items-center gap-2">
				<div class="px-3 py-2 rounded-md bg-neutral-800 ring-1 ring-neutral-700 text-neutral-200 tracking-[0.25em] uppercase font-mono">
					{roomCode || "------"}
				</div>

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
					class="px-4 py-2 rounded-md bg-neutral-700 text-white ring-1 ring-neutral-600 hover:ring-2 active:scale-95 transition disabled:opacity-60"
					on:click={joinRoom}
					disabled={joinCode.length !== 6}
				>
					Join
				</button>
			</div>
		</div>
	</div>

	{#if error}
		<div class="text-sm text-red-300">{error}</div>
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
</style>

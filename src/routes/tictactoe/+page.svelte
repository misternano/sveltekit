<script lang="ts">
	import { Move, State } from "./lib/util"
	import { Icon } from "./components"
	import { onMount, tick } from "svelte"
	import { ChevronDown, Loader } from "lucide-svelte"

	type Mark = "X" | "O"
	type Cell = "" | Mark

	const toMove = (m: Mark): Move => m as unknown as Move

	const checkWinnerNet = (b: Cell[][]): Mark | undefined => {
		const lines: Cell[][] = [
			[b[0][0], b[0][1], b[0][2]],
			[b[1][0], b[1][1], b[1][2]],
			[b[2][0], b[2][1], b[2][2]],
			[b[0][0], b[1][0], b[2][0]],
			[b[0][1], b[1][1], b[2][1]],
			[b[0][2], b[1][2], b[2][2]],
			[b[0][0], b[1][1], b[2][2]],
			[b[0][2], b[1][1], b[2][0]]
		]
		for (const [a, c, d] of lines) {
			if (a && a === c && a === d) return a
		}
	}

	const getGameStateNet = (winner: Mark | undefined, b: Cell[][]) => {
		if (winner) return State.Won
		if (b.every((row) => row.every((cell) => cell !== ""))) return State.Draw
		return State.Playing
	}

	onMount(() => {
		localStorage.setItem(
			"bkclb_arcade_last_game",
			JSON.stringify({ id: "tictactoe", name: "Tic-Tac-Toe", path: "/tictactoe", updatedAt: Date.now() })
		)
		console.info("%c> Mounted", "background-color:#1c68d4;color:white;padding:4rem;padding-block:0.5rem;width:100%;")
	})

	let boardEl: HTMLElement
	let statusEl: HTMLElement | undefined

	const focusNextAvailableTile = () => {
		const nextTile = boardEl.querySelector("button:not(:disabled)")
		if (nextTile) (nextTile as HTMLElement).focus()
		else statusEl?.focus?.()
	}

	let board: Cell[][] = [
		["", "", ""],
		["", "", ""],
		["", "", ""]
	]
	let turn: Mark = "O"
	$: winner = checkWinnerNet(board)
	$: state = getGameStateNet(winner, board)

	type Player = { mark: Mark; name: string }
	let players: Player[] = []

	const wsBase = "wss://arcade.bkclb.dev/ws"
	let ws: WebSocket | null = null

	let userName = ""
	const rnd3 = () => String(Math.floor(100 + Math.random() * 900))
	const newUserName = () => `#${rnd3()}`

	let roomCode = ""
	let joinCode = ""
	let youAre: Mark | undefined
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

	const attachHandlers = (socket: WebSocket) => {
		socket.addEventListener("open", () => {
			connected = true
			error = ""
		})

		socket.addEventListener("close", () => {
			connected = false
			youAre = undefined
			players = []
			roomCode = ""
			board = [
				["", "", ""],
				["", "", ""],
				["", "", ""]
			]
			turn = "O"
		})

		socket.addEventListener("error", () => {
			connected = false
			error = "Could not connect to server"
		})

		socket.addEventListener("message", (ev) => {
			const raw = String((ev as MessageEvent).data)
			let msg: any
			try { msg = JSON.parse(raw) } catch { return }

			if (msg.type === "joined") {
				roomCode = msg.code
				youAre = msg.youAre
				return
			}

			if (msg.type === "state") {
				roomCode = msg.code ?? roomCode
				board = msg.board as Cell[][]
				turn = msg.turn as Mark
				players = (msg.players ?? []) as Player[]
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

	const sendMove = (row: number, col: number) => {
		if (!ws || ws.readyState !== WebSocket.OPEN) return
		ws.send(JSON.stringify({ type: "move", row, col }))
		tick().then(focusNextAvailableTile)
	}

	const sendReset = () => {
		if (!ws || ws.readyState !== WebSocket.OPEN) return
		ws.send(JSON.stringify({ type: "reset" }))
		tick().then(focusNextAvailableTile)
	}

	const onJoinInput = (e: Event) => {
		joinCode = normalize((e.currentTarget as HTMLInputElement).value)
	}

	$: me = youAre ? players.find((p) => p.mark === youAre)?.name ?? userName : userName
	$: opponent = youAre ? players.find((p) => p.mark !== youAre)?.name : undefined
	$: yourTurn = !!(roomCode && youAre && turn === youAre)
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
			{#if turn === "X"}
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
					{#if col !== ""}
						<Icon move={toMove(col)} />
					{:else if state === State.Playing}
						{#if roomCode && youAre}
							<button
								type="button"
								disabled={!yourTurn}
								on:click={() => sendMove(r, c)}
								class="h-full w-full rounded-md hover:bg-slate-500/50 focus-visible:bg-slate-500/50 hover:shadow-lg focus-visible:shadow-lg hover:border focus-visible:border focus-visible:ring-0 border-slate-800/50 animate-pulse disabled:cursor-not-allowed disabled:opacity-60"
							>
								<span class="hidden">ROW {r + 1} :: COL {c + 1}</span>
							</button>
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
			{#if turn === "O"}
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
					if (!roomCode) {
						await createRoom()
					} else {
						await navigator.clipboard.writeText(roomCode)
					}
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

<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import { get } from "svelte/store"
	import { Hand, Chip } from "./components"
	import { createBlackjackStore, outcomeMessage, type GameRules, type GameState, isTenValue } from "./lib/util"
	import { HandCoins, Spade } from "lucide-svelte"

	onMount(() => {
		debug = readDebug()
		debugTimer = window.setInterval(() => {
			const next = readDebug()
			if (next !== debug) debug = next
		}, 200)
		try {
			const raw = localStorage.getItem("blackjack:chips")
			const parsed = raw ? Number(raw) : NaN
			if (Number.isFinite(parsed) && parsed >= 0) chips = parsed
			else localStorage.setItem("blackjack:chips", "1000")
		} catch (_) {
			console.error("[Error mounting blackjack:chips] ",_)
		}
		console.info(`%c> Mounted`, "background-color:#1c68d4;color:white;padding:4rem;padding-block:0.5rem;width:100%;");
	})

	const MAX_TOTAL_BET = 50
	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
	const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))

	const bj = createBlackjackStore({
		decks: 6,
		dealerHitsSoft17: false,
		allowTenValueSplit: false,
		avoidInitialBlackjacks: true
	})

	const state = bj.state
	const rulesStore = bj.rules
	const playerHandValues = bj.playerHandValues
	const CHIP_REFILL = 1000

	const refillIfBroke = (): boolean => {
		if (chips > 0) return false
		saveChips(CHIP_REFILL)
		bet = Math.min(bet, CHIP_REFILL, MAX_TOTAL_BET)
		shimmerChips()
		return true
	}

	let rules: GameRules = get(rulesStore)

	let chips = 1000
	let bet = 10
	let bets: number[] = []
	let settled = false

	let gs: GameState = get(state)
	let roundId = 0

	let lastPayout = 0
	let payoutKey = 0

	let chipShimmerId = 0
	let betShimmerId = 0
	let chipDeltaTextId = 0
	let lastChipDelta = 0

	const saveChips = (n: number) => {
		chips = n
		try {
			localStorage.setItem("blackjack:chips", String(chips))
		} catch(_) {
			console.error("[Error saving blackjack:chips] ",_)
		}
	}

	const shimmerChips = () => {
		chipShimmerId++
		chipDeltaTextId++
	}

	const shimmerBet = () => {
		betShimmerId++
	}

	let dealerToken = 0
	const runDealer = async () => {
		const t = ++dealerToken
		await sleep(450)
		while (gs.round === "dealer" && t === dealerToken) {
			bj.dispatch({ type: "dealerStep" })
			if (gs.round !== "dealer") break
			await sleep(450)
		}
	}

	let prevRound: GameState["round"] | null = null

	const unsubState = state.subscribe((s) => {
		gs = s
		if (prevRound !== "dealer" && s.round === "dealer") void runDealer()
		prevRound = s.round
	})

	const unsubRules = rulesStore.subscribe((r) => {
		rules = r
	})

	onDestroy(() => {
		dealerToken++
		unsubState()
		unsubRules()
	})

	$: canDeal = gs.round === "idle" || gs.round === "done"
	$: canPlay = gs.round === "playing"
	$: cur = gs.playerHands[gs.activeHand] ?? []
	$: totalBet = bets.reduce((a, b) => a + b, 0)
	$: add = bets[gs.activeHand] ?? 0

	$: canHit = canPlay && !gs.doubled[gs.activeHand]
	$: canStand = canPlay

	$: canDouble =
		canPlay &&
		!gs.doubled[gs.activeHand] &&
		cur.length === 2 &&
		add > 0 &&
		chips >= add

	$: canSplit =
		canPlay &&
		cur.length === 2 &&
		((cur[0]?.rank === cur[1]?.rank) ||
			(rules.allowTenValueSplit &&
				cur[0] &&
				cur[1] &&
				isTenValue(cur[0].rank) &&
				isTenValue(cur[1].rank))) &&
		totalBet + add <= MAX_TOTAL_BET &&
		chips >= add

	const startRound = () => {
		if (!canDeal) return
		dealerToken++

		if (refillIfBroke()) {
			gs = { ...gs, message: "Out of chips — refilled to 1000" }
			return
		}

		const b = clamp(bet, 1, Math.min(MAX_TOTAL_BET, chips))
		bet = b
		saveChips(chips - b)
		bets = [b]

		settled = false
		lastPayout = 0
		lastChipDelta = 0
		roundId++

		bj.dispatch({ type: "deal" })
	}

	const doReset = () => {
		dealerToken++
		bj.dispatch({ type: "resetShoe" })

		bets = []
		settled = false
		lastPayout = 0
		lastChipDelta = 0
	}

	const doHit = () => {
		bj.dispatch({ type: "hit" })
	}

	const doStand = () => {
		bj.dispatch({ type: "stand" })
	}

	const doSplit = () => {
		if (!canSplit) return
		dealerToken++

		saveChips(chips - add)
		bets = bets.slice()
		bets.splice(gs.activeHand + 1, 0, add)

		bj.dispatch({ type: "split" })
	}

	const doDouble = () => {
		if (!canDouble) return
		dealerToken++

		saveChips(chips - add)
		bets = bets.slice()
		bets[gs.activeHand] = add * 2

		bj.dispatch({ type: "doubleDown" })
	}

	$: if (gs.round === "done" && !settled && totalBet > 0) {
		let payout = 0
		if (gs.outcome === "push") payout = totalBet
		else if (gs.outcome === "player_blackjack") payout = Math.floor(totalBet * 2.5)
		else if (gs.outcome === "player_win" || gs.outcome === "dealer_bust") payout = totalBet * 2

		lastPayout = payout - totalBet
		lastChipDelta = lastPayout
		payoutKey++

		shimmerChips()
		shimmerBet()

		saveChips(chips + payout)
		settled = true
	}

	$: maxBet = Math.min(MAX_TOTAL_BET, chips)

	const setBetSafe = (n: number) => {
		const next = clamp(Math.floor(n || 0), 1, Math.max(1, maxBet))
		if (next !== bet) bet = next
	}

	const bumpBet = (delta: number) => {
		setBetSafe(bet + delta)
	}

	const onBetBlur = () => {
		setBetSafe(bet)
	}

	let debug = false
	let debugTimer: number

	const readDebug = () => localStorage.getItem("blackjack:debug") === "1"

	onDestroy(() => window.clearInterval(debugTimer))

	$: reqRoundPlaying = canPlay
	$: reqTwoCards = cur.length === 2
	$: reqPair =
		reqTwoCards &&
		(cur[0]?.rank === cur[1]?.rank ||
			(rules.allowTenValueSplit &&
				cur[0] && cur[1] &&
					isTenValue(cur[0].rank) &&
					isTenValue(cur[1].rank)))
	$: reqBetCap = totalBet + add <= MAX_TOTAL_BET
	$: reqChips = chips >= add
</script>

{#if debug}
	<div class="w-1/6 absolute right-3 text-xs text-white/70 border border-white/10 bg-white/5 rounded-lg p-3 space-y-1">
		<div class="flex justify-between">
			<span>Split requirements</span>
			<span class={canSplit ? "text-emerald-200" : "text-rose-200"}>canSplit: {String(canSplit)}</span>
		</div>
		<br />
		<div class="flex justify-between"><span class="text-yellow-100">round === playing</span><span>{String(reqRoundPlaying)} ({gs.round})</span></div>
		<div class="flex justify-between"><span class="text-yellow-100">hand has 2 cards</span><span>{String(reqTwoCards)} (len {cur.length})</span></div>
		<div class="flex justify-between"><span class="text-yellow-100">pair matches (rank/ten-value)</span><span>{String(reqPair)}</span></div>
		<div class="flex justify-between"><span class="text-yellow-100">totalBet + add ≤ {MAX_TOTAL_BET}</span><span>{String(reqBetCap)} ({totalBet + add})</span></div>
		<div class="flex justify-between"><span class="text-yellow-100">chips ≥ add</span><span>{String(reqChips)} ({chips} ≥ {add})</span></div>
		<br />
		<div class="flex justify-between"><span class="text-yellow-100">shoe remaining:</span><span>{gs.shoe.length}</span></div>
		<div class="flex justify-between"><span class="text-yellow-100">discard:</span><span>{gs.discard.length}</span></div>
	</div>
{/if}

<header class="relative">
	<h1 class="flex flex-row gap-1 items-center w-fit mx-auto font-impact font-medium text-4xl text-center my-16">
		<span class="bg-gradient-to-tr from-amber-600 to-yellow-500 bg-clip-text text-transparent">Black</span> <Spade size={20} class="fill-red-800 stroke-red-500" /> <span class="bg-gradient-to-tl from-amber-600 to-yellow-500 bg-clip-text text-transparent">Jack</span>
	</h1>
	{#if gs.outcome}
		<div class="-z-10 absolute -top-1/2 -translate-y-1/4 w-full text-center font-medium">
			<h2 class="text-9xl uppercase font-impact bg-gradient-to-b from-emerald-500/75 to-neutral-900 bg-clip-text text-transparent">
				{outcomeMessage(gs.outcome)}
			</h2>
		</div>
	{/if}
</header>

<div class="flex items-center justify-center p-4">
	<div class="w-full max-w-xl space-y-4">
		<div class="flex items-center justify-between">
			<div class="text-white/60">
				{#if gs.round === "dealer"}
					<span>Dealer playing</span>
					<span class="dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
				{:else}
					{gs.message}
				{/if}
			</div>

			<div class="flex flex-row gap-2 items-center text-right text-xs text-white/70">
				<div class="relative flex items-center">
					{#key chipShimmerId}
						<div class={`chipShimmer flex items-center gap-1 border border-white/10 ${lastChipDelta >= 0 ? "win" : "lose"}`}>
							<Chip size={14} class="fill-yellow-500" /> Bankroll: {chips}
						</div>
					{/key}

					{#if gs.round === "done" && lastChipDelta !== 0}
						{#key chipDeltaTextId}
							<div class={`chipDelta absolute -right-2 -top-2 payoutPop ${lastChipDelta > 0 ? "pos" : "neg"}`}>
								{lastChipDelta > 0 ? "+" : "-"}{Math.abs(lastChipDelta)}
							</div>
						{/key}
					{/if}
				</div>

				{#key betShimmerId}
					<div class="chipShimmer flex items-center gap-1 neutral border border-white/10">
						<HandCoins size={16} class="stroke-rose-500" /> Bet: {bet}
					</div>
				{/key}
			</div>
		</div>

		{#if canDeal}
			<div class="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
				<div class="grid grid-cols-[auto,1fr,auto] gap-3 items-center">
					<div class="inline-flex rounded-lg overflow-hidden border border-white/10 bg-white/5">
						<button
							class="px-3 py-2 text-sm text-white/90 hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-50"
							on:click={() => bumpBet(-5)}
							disabled={!canDeal}
							aria-label="Decrease bet by 5"
						>
							-5
						</button>
						<div class="w-px bg-white/10"></div>
						<button
							class="px-3 py-2 text-sm text-white/90 hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-50"
							on:click={() => bumpBet(-1)}
							disabled={!canDeal}
							aria-label="Decrease bet by 1"
						>
							-1
						</button>
					</div>

					<div class="flex items-center gap-2">
						<div class="relative flex-1">
							<input
								type="number"
								inputmode="numeric"
								min="1"
								max={maxBet}
								step="1"
								bind:value={bet}
								on:blur={onBetBlur}
								class="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white/90 outline-none focus:border-white/20 focus:bg-white/15"
								disabled={!canDeal}
								aria-label="Bet amount"
							/>
							<div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
								chips
							</div>
						</div>

						<div class="inline-flex rounded-lg overflow-hidden border border-white/10 bg-white/5">
							<button
								class="px-3 py-2 text-sm text-white/90 hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-50"
								on:click={() => bumpBet(1)}
								disabled={!canDeal}
								aria-label="Increase bet by 1"
							>
								+1
							</button>
							<div class="w-px bg-white/10"></div>
							<button
								class="px-3 py-2 text-sm text-white/90 hover:bg-white/10 active:scale-[0.98] transition disabled:opacity-50"
								on:click={() => bumpBet(5)}
								disabled={!canDeal}
								aria-label="Increase bet by 5"
							>
								+5
							</button>
						</div>
					</div>

					<button
						class="px-5 py-2 rounded-lg text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-50"
						on:click={startRound}
						disabled={!canDeal}
					>
						Deal
					</button>
				</div>

				<div class="flex flex-wrap gap-2 items-center justify-between">
					<div class="flex flex-wrap gap-2">
						<button
							class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 transition text-sm text-white/85 disabled:opacity-50"
							on:click={() => setBetSafe(1)}
							disabled={!canDeal}
						>
							Min
						</button>
						<button
							class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 transition text-sm text-white/85 disabled:opacity-50"
							on:click={() => setBetSafe(Math.floor(maxBet / 2))}
							disabled={!canDeal}
						>
							Half
						</button>
						<button
							class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 active:scale-95 transition text-sm text-white/85 disabled:opacity-50"
							on:click={() => setBetSafe(maxBet)}
							disabled={!canDeal}
						>
							Max
						</button>
					</div>

					<div class="flex flex-row text-xs text-white/45">
						<span class="hidden md:inline">You can place a m</span><span class="md:hidden">M</span>ax bet of <div class="flex items-center gap-1 neutral"><Chip size={14} class="ml-1.5 fill-yellow-500" />{maxBet}</div>
					</div>
				</div>
			</div>
		{/if}


		<div class="grid gap-4">
			<Hand title="Dealer" cards={gs.dealer} hideHole={gs.round === "playing"} roundId={roundId} />

			{#each gs.playerHands as h, i (i)}
				<div class="relative">
					<Hand
						title={gs.playerHands.length > 1
							? `You (Hand ${i + 1}${gs.round === "playing" && i === gs.activeHand ? " •" : ""})`
							: "You"}
						cards={h}
						roundId={roundId}
						active={gs.round === "playing" && i === gs.activeHand}
						shake={$playerHandValues[i]?.busted ?? false}
						sparkle={gs.round === "done" && gs.outcome === "player_blackjack" && i === 0}
					/>
				</div>
			{/each}
		</div>

		<div class="flex flex-wrap gap-2">
			<button
				class="flex flex-row items-center gap-2 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
				on:click={doHit}
				disabled={!canHit}
			>
				Hit
			</button>

			<button
				class="flex flex-row items-center gap-2 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
				on:click={doStand}
				disabled={!canStand}
			>
				Stand
			</button>

			<button
				class="flex flex-row items-center gap-2 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
				on:click={doDouble}
				disabled={!canDouble}
			>
				Double
			</button>

			{#if canSplit}
				<button
					class="flex flex-row items-center gap-2 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
					on:click={doSplit}
				>
					Split
				</button>
			{/if}

			<div class="flex-1"></div>

			<button
				class="flex flex-row items-center gap-2 px-4 py-2 rounded-md text-white bg-indigo-500 ring-1 ring-indigo-300 hover:ring-2 active:scale-95 transition disabled:opacity-60"
				on:click={doReset}
			>
				Reset Shoe
			</button>
		</div>
	</div>
</div>

<style>
	.chipShimmer {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 2px 6px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.06);
		overflow: hidden;
		isolation: isolate;
	}

	.chipShimmer::after {
		content: "";
		position: absolute;
		top: 0;
		bottom: 0;
		left: -80%;
		width: 60%;
		background: linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.22) 50%, transparent 100%);
		pointer-events: none;
		animation: shimmerSweep 900ms ease-out 1;
	}

	.chipShimmer.win::after {
		background: linear-gradient(110deg, transparent 0%, rgba(52, 211, 153, 0.35) 50%, transparent 100%);
	}

	.chipShimmer.lose::after {
		background: linear-gradient(110deg, transparent 0%, rgba(244, 63, 94, 0.35) 50%, transparent 100%);
	}

	.chipShimmer.neutral::after {
		background: linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.18) 50%, transparent 100%);
	}

	@keyframes shimmerSweep {
		0% {
			left: -80%;
		}
		100% {
			left: 120%;
		}
	}

	.chipDelta {
		font-size: 0.7rem;
		line-height: 1;
		padding: 2px 6px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(6px);
	}

	.chipDelta.pos {
		color: rgba(52, 211, 153, 0.95);
	}
	.chipDelta.neg {
		color: rgba(244, 63, 94, 0.95);
	}

	@keyframes chipDeltaPop {
		0% {
			transform: translateY(6px) scale(0.9);
			opacity: 0;
		}
		45% {
			transform: translateY(0) scale(1.05);
			opacity: 1;
		}
		100% {
			transform: translateY(-2px) scale(1);
			opacity: 1;
		}
	}
	.chipDelta {
		animation: chipDeltaPop 320ms ease-out 1;
	}

	@keyframes enableTick {
		0% {
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
		}
		40% {
			box-shadow: 0 0 0 7px rgba(255, 255, 255, 0.18);
		}
		100% {
			box-shadow: 0 0 0 14px rgba(255, 255, 255, 0);
		}
	}
	.enableTick {
		animation: enableTick 360ms ease-out 1;
	}

	@keyframes payoutPop {
		0% {
			transform: translateY(4px) scale(0.95);
			opacity: 0;
		}
		35% {
			transform: translateY(0) scale(1.05);
			opacity: 1;
		}
		100% {
			transform: translateY(-2px) scale(1);
			opacity: 1;
		}
	}
	.payoutPop {
		animation: payoutPop 320ms ease-out 1;
	}

	.dots {
		display: inline-flex;
		width: 1.2em;
		justify-content: flex-start;
	}
	.dots span {
		opacity: 0;
	}
	@keyframes dot {
		0% {
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	.dots span:nth-child(1) {
		animation: dot 900ms infinite;
	}
	.dots span:nth-child(2) {
		animation: dot 900ms infinite 150ms;
	}
	.dots span:nth-child(3) {
		animation: dot 900ms infinite 300ms;
	}
</style>

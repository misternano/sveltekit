import { derived, get, writable, type Readable } from "svelte/store"

export const SUITS = ["S", "H", "D", "C"] as const
export type Suit = (typeof SUITS)[number]

export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const
export type Rank = (typeof RANKS)[number]

export type Card = Readonly<{ suit: Suit; rank: Rank }>

export type HandValue = Readonly<{
	total: number
	soft: boolean
	busted: boolean
	blackjack: boolean
}>

export type RoundState = "idle" | "playing" | "dealer" | "done"

export type Outcome =
	| "player_blackjack"
	| "dealer_blackjack"
	| "player_bust"
	| "dealer_bust"
	| "player_win"
	| "dealer_win"
	| "push"

export type GameState = Readonly<{
	shoe: ReadonlyArray<Card>
	discard: ReadonlyArray<Card>
	playerHands: ReadonlyArray<ReadonlyArray<Card>>
	activeHand: number
	doubled: ReadonlyArray<boolean>
	dealer: ReadonlyArray<Card>
	round: RoundState
	outcome: Outcome | null
	message: string
}>

export type GameRules = Readonly<{
	decks: number
	dealerHitsSoft17: boolean
	allowTenValueSplit: boolean
	avoidInitialBlackjacks: boolean
	maxDealTries: number
}>

export const DEFAULT_RULES: GameRules = {
	decks: 6,
	dealerHitsSoft17: false,
	allowTenValueSplit: false,
	avoidInitialBlackjacks: true,
	maxDealTries: 20
}

const SUIT_TO_CHAR: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" }
const FACE_VALUE: Partial<Record<Rank, number>> = { J: 10, Q: 10, K: 10 }

export const formatCard = (c: Card): string => {
	return `${c.rank} ${SUIT_TO_CHAR[c.suit]}`
}

export const newDeck = (): Card[] => {
	const d: Card[] = []
	for (const suit of SUITS) for (const rank of RANKS) d.push({ suit, rank })
	return d
}

export const shuffle = <T>(arr: ReadonlyArray<T>, rng: () => number = Math.random): T[] => {
	const a = arr.slice()
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1))
		;[a[i], a[j]] = [a[j], a[i]]
	}
	return a
}

export const buildShoe = (decks = DEFAULT_RULES.decks, rng: () => number = Math.random): Card[] => {
	const all: Card[] = []
	for (let i = 0; i < decks; i++) all.push(...newDeck())
	return shuffle(all, rng)
}

export const handValue = (hand: ReadonlyArray<Card>): HandValue => {
	let total = 0
	let acesAsEleven = 0
	
	for (const c of hand) {
		if (c.rank === "A") {
			acesAsEleven++
			total += 11
			continue
		}
		const face = FACE_VALUE[c.rank]
		if (face) {
			total += face
			continue
		}
		total += Number(c.rank)
	}
	
	while (total > 21 && acesAsEleven > 0) {
		total -= 10
		acesAsEleven--
	}
	
	const busted = total > 21
	const blackjack = hand.length === 2 && total === 21
	const soft = !busted && acesAsEleven > 0
	
	return { total, soft, busted, blackjack }
}

export const initGame = (rules: Partial<GameRules> = {}, rng: () => number = Math.random): GameState => {
	const r = { ...DEFAULT_RULES, ...rules }
	return {
		shoe: buildShoe(r.decks, rng),
		discard: [],
		playerHands: [],
		activeHand: 0,
		doubled: [],
		dealer: [],
		round: "idle",
		outcome: null,
		message: "Starting…"
	}
}

const setDone = (gs: GameState, outcome: Outcome, message: string): GameState => {
	return { ...gs, round: "done", outcome, message }
}

const currentHand = (gs: GameState): ReadonlyArray<Card> => {
	return gs.playerHands[gs.activeHand] ?? []
}

const setCurrentHand = (gs: GameState, hand: ReadonlyArray<Card>): GameState => {
	const hands = gs.playerHands.slice()
	hands[gs.activeHand] = hand
	return { ...gs, playerHands: hands }
}

const ensureShoe = (gs: GameState, rules: GameRules, rng: () => number): GameState => {
	if (gs.shoe.length > 0) return gs
	if (gs.discard.length > 0) return { ...gs, shoe: shuffle(gs.discard, rng), discard: [] }
	return { ...gs, shoe: buildShoe(rules.decks, rng), discard: [] }
}

const draw = (gs: GameState, rules: GameRules, rng: () => number): [GameState, Card] => {
	const next = ensureShoe(gs, rules, rng)
	const shoe = next.shoe
	const card = shoe[shoe.length - 1] as Card
	return [{ ...next, shoe: shoe.slice(0, -1) }, card]
}

const anyHandBlackjack = (gs: GameState): boolean => {
	for (const h of gs.playerHands) if (handValue(h).blackjack) return true
	return false
}

const resolveAfterDealer = (gs: GameState): GameState => {
	const dv = handValue(gs.dealer)
	if (dv.busted) return setDone(gs, "dealer_bust", "Dealer busts")
	
	let anyWin = false
	let anyPush = false
	
	for (const h of gs.playerHands) {
		const pv = handValue(h)
		if (pv.busted) continue
		if (dv.total < pv.total) anyWin = true
		else if (dv.total === pv.total) anyPush = true
	}
	
	if (anyWin) return setDone(gs, "player_win", "You win")
	if (anyPush) return setDone(gs, "push", "Push")
	return setDone(gs, "dealer_win", "Dealer wins")
}

export const startDealer = (gs: GameState): GameState => {
	if (gs.round !== "playing") return gs
	return { ...gs, round: "dealer", message: "Dealer playing…" }
}

const dealerShouldHit = (dv: HandValue, rules: GameRules): boolean => {
	if (dv.total < 17) return true
	if (dv.total > 17) return false
	return rules.dealerHitsSoft17 ? dv.soft : false
}

export const dealerStep = (gs: GameState, rules: GameRules, rng: () => number = Math.random): GameState => {
	if (gs.round !== "dealer") return gs
	
	const dv = handValue(gs.dealer)
	if (dv.busted) return setDone(gs, "dealer_bust", "Dealer busts")
	if (!dealerShouldHit(dv, rules)) return resolveAfterDealer(gs)
	
	let next = gs
	let c: Card
	;[next, c] = draw(next, rules, rng)
	next = { ...next, dealer: [...next.dealer, c], message: "Dealer playing…" }
	
	const dv2 = handValue(next.dealer)
	if (dv2.busted) return setDone(next, "dealer_bust", "Dealer busts")
	if (!dealerShouldHit(dv2, rules)) return resolveAfterDealer(next)
	
	return next
}

const advanceHandOrDealer = (gs: GameState): GameState => {
	let i = gs.activeHand
	while (i < gs.playerHands.length) {
		const hv = handValue(gs.playerHands[i])
		if (!hv.busted && hv.total < 21 && !gs.doubled[i]) break
		i++
	}
	
	if (i < gs.playerHands.length)
		return { ...gs, activeHand: i, message: "Your move" }
	
	const anyAlive = gs.playerHands.some(h => !handValue(h).busted)
	if (!anyAlive)
		return setDone(gs, "dealer_win", "You busted")
	
	return startDealer(gs)
}

export const deal = (gs: GameState, rules: GameRules, rng: () => number = Math.random): GameState => {
	if (gs.round === "playing" || gs.round === "dealer") return gs
	
	let tries = 0
	let base: GameState = gs
	
	while (true) {
		tries++
		
		const discardAll: Card[] = [...base.discard, ...base.playerHands.flat(), ...base.dealer]
		
		let next: GameState = {
			...base,
			discard: discardAll,
			playerHands: [[]],
			activeHand: 0,
			doubled: [false],
			dealer: [],
			round: "playing",
			outcome: null,
			message: "Your move"
		}
		
		let c: Card
		;[next, c] = draw(next, rules, rng)
		next = { ...next, playerHands: [[c]], doubled: [false] }
		;[next, c] = draw(next, rules, rng)
		next = { ...next, dealer: [c] }
		;[next, c] = draw(next, rules, rng)
		next = { ...next, playerHands: [[...next.playerHands[0], c]] }
		;[next, c] = draw(next, rules, rng)
		next = { ...next, dealer: [...next.dealer, c] }
		
		if (!rules.avoidInitialBlackjacks) return next
		
		const pbj = anyHandBlackjack(next)
		const dbj = handValue(next.dealer).blackjack
		if (!pbj && !dbj) return next
		
		if (tries >= rules.maxDealTries) {
			base = initGame(rules, rng)
			tries = 0
		}
	}
}

export const hit = (gs: GameState, rules: GameRules, rng: () => number = Math.random): GameState => {
	if (gs.round !== "playing") return gs
	if (gs.doubled[gs.activeHand]) return gs
	
	let next = gs
	let c: Card
	;[next, c] = draw(next, rules, rng)
	
	const h = currentHand(next)
	next = setCurrentHand(next, [...h, c])
	
	const hv = handValue(currentHand(next))
	if (hv.busted || hv.total === 21) return advanceHandOrDealer(next)
	return { ...next, message: "Your move" }
}

export const stand = (gs: GameState): GameState => {
	if (gs.round !== "playing") return gs
	return advanceHandOrDealer({ ...gs, activeHand: gs.activeHand + 1 })
}

export const isTenValue = (rank: Rank): boolean => {
	return rank === "10" || rank === "J" || rank === "Q" || rank === "K"
}

export const split = (gs: GameState, rules: GameRules, rng: () => number = Math.random): GameState => {
	if (gs.round !== "playing") return gs
	
	const h = currentHand(gs)
	if (h.length !== 2) return gs
	const [a, b] = h
	
	const canSplit =
		a.rank === b.rank || (rules.allowTenValueSplit && isTenValue(a.rank) && isTenValue(b.rank))
	if (!canSplit) return gs
	
	let next = gs
	let c1: Card
	let c2: Card
	;[next, c1] = draw(next, rules, rng)
	;[next, c2] = draw(next, rules, rng)
	
	const hands = next.playerHands.slice()
	const doubled = next.doubled.slice()
	
	hands[next.activeHand] = [a, c1]
	hands.splice(next.activeHand + 1, 0, [b, c2])
	
	doubled[next.activeHand] = false
	doubled.splice(next.activeHand + 1, 0, false)
	
	return { ...next, playerHands: hands, doubled, message: "Your move" }
}

export const doubleDown = (gs: GameState, rules: GameRules, rng: () => number = Math.random): GameState => {
	if (gs.round !== "playing") return gs
	if (gs.doubled[gs.activeHand]) return gs
	
	const h = currentHand(gs)
	if (h.length !== 2) return gs
	
	let next = gs
	let c: Card
	;[next, c] = draw(next, rules, rng)
	next = setCurrentHand(next, [...h, c])
	
	const doubled = next.doubled.slice()
	doubled[next.activeHand] = true
	next = { ...next, doubled }
	
	return advanceHandOrDealer({ ...next, activeHand: next.activeHand + 1 })
}

export const resetShoe = (_: GameState, rules: GameRules, rng: () => number = Math.random): GameState => {
	return initGame(rules, rng)
}

const OUTCOME_MESSAGE: Record<Outcome, string> = {
	player_blackjack: "You win",
	dealer_blackjack: "Dealer wins",
	player_bust: "Dealer wins",
	dealer_bust: "You win",
	player_win: "You win",
	dealer_win: "Dealer wins",
	push: "Push"
}

export const outcomeMessage = (o: Outcome | null): string => {
	return o ? OUTCOME_MESSAGE[o] : ""
}

// ---------- Reducer + Store ----------

export type Action =
	| { type: "deal" }
	| { type: "hit" }
	| { type: "stand" }
	| { type: "split" }
	| { type: "doubleDown" }
	| { type: "startDealer" }
	| { type: "dealerStep" }
	| { type: "resetShoe" }
	| { type: "setRules"; rules: Partial<GameRules> }

const assertNever = (x: never): never => {
	throw new Error(`Unhandled action: ${JSON.stringify(x)}`)
}

export const reducer = (
	state: GameState,
	action: Action,
	rules: GameRules,
	rng: () => number = Math.random
): GameState => {
	switch (action.type) {
		case "setRules":
			return state
		case "resetShoe":
			return resetShoe(state, rules, rng)
		case "deal":
			return deal(state, rules, rng)
		case "hit":
			return hit(state, rules, rng)
		case "stand":
			return stand(state)
		case "split":
			return split(state, rules, rng)
		case "doubleDown":
			return doubleDown(state, rules, rng)
		case "startDealer":
			return startDealer(state)
		case "dealerStep":
			return dealerStep(state, rules, rng)
		default:
			return assertNever(action)
	}
}

export type BlackjackStore = Readonly<{
	state: Readable<GameState>
	rules: Readable<GameRules>
	dispatch: (action: Action) => void
	playerHandValues: Readable<HandValue[]>
	dealerValue: Readable<HandValue>
	activeHand: Readable<ReadonlyArray<Card>>
	activeValue: Readable<HandValue>
	canDeal: Readable<boolean>
	canHit: Readable<boolean>
	canStand: Readable<boolean>
	canSplit: Readable<boolean>
	canDouble: Readable<boolean>
	canDealerStep: Readable<boolean>
}>

export const createBlackjackStore = (
	initialRules: Partial<GameRules> = {},
	rng: () => number = Math.random
): BlackjackStore => {
	const rulesStore = writable<GameRules>({ ...DEFAULT_RULES, ...initialRules })
	const stateStore = writable<GameState>(initGame(get(rulesStore), rng))
	
	const dispatch = (action: Action): void => {
		if (action.type === "setRules") {
			rulesStore.update((r) => ({ ...r, ...action.rules }))
			const r = get(rulesStore)
			stateStore.update((s) => ({ ...s, message: `Rules updated (${r.decks} decks)` }))
			return
		}
		const r = get(rulesStore)
		stateStore.update((s) => reducer(s, action, r, rng))
	}
	
	const playerHandValues = derived(stateStore, ($s) => $s.playerHands.map((h) => handValue(h)))
	const dealerValue = derived(stateStore, ($s) => handValue($s.dealer))
	const activeHand = derived(stateStore, ($s) => $s.playerHands[$s.activeHand] ?? [])
	const activeValue = derived(activeHand, ($h) => handValue($h))
	
	const canDeal = derived(stateStore, ($s) => $s.round !== "playing" && $s.round !== "dealer")
	const canHit = derived(stateStore, ($s) => $s.round === "playing" && !$s.doubled[$s.activeHand])
	const canStand = derived(stateStore, ($s) => $s.round === "playing")
	
	const canSplit = derived([stateStore, rulesStore], ([$s, $r]) => {
		if ($s.round !== "playing") return false
		const h = $s.playerHands[$s.activeHand] ?? []
		if (h.length !== 2) return false
		const [a, b] = h
		return a.rank === b.rank || ($r.allowTenValueSplit && isTenValue(a.rank) && isTenValue(b.rank))
	})
	
	const canDouble = derived(stateStore, ($s) => {
		if ($s.round !== "playing") return false
		if ($s.doubled[$s.activeHand]) return false
		const h = $s.playerHands[$s.activeHand] ?? []
		return h.length === 2
	})
	
	const canDealerStep = derived(stateStore, ($s) => $s.round === "dealer")
	
	return {
		state: stateStore,
		rules: rulesStore,
		dispatch,
		playerHandValues,
		dealerValue,
		activeHand,
		activeValue,
		canDeal,
		canHit,
		canStand,
		canSplit,
		canDouble,
		canDealerStep
	}
}

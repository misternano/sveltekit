<script lang="ts">
	import type { Card, HandValue } from "../lib/util"
	import { handValue } from "../lib/util"
	import CardView from "./Card.svelte"

	export let title: string
	export let cards: ReadonlyArray<Card>

	export let hideHole: boolean = false
	export let roundId: number = 0
	export let active: boolean = false
	export let shake: boolean = false
	export let sparkle: boolean = false

	export let value: HandValue | null = null
	export let shownValue: HandValue | null = null

	$: computedValue = value ?? handValue(cards)

	$: computedShownValue =
		shownValue ??
		(hideHole && cards.length >= 2 ? handValue([cards[0] as Card]) : computedValue)
</script>

<div
	class="rounded-xl border border-white/10 bg-white/5 p-4 handWrap"
	class:activeGlow={active}
	class:bustShake={shake}
>
	<div class="flex items-center justify-between mb-3">
		<div class="font-semibold">{title}</div>

		<div class="text-sm text-white/70">
			{#if hideHole && cards.length >= 2}
				{computedShownValue.total}
			{:else}
				{computedValue.total}{computedValue.soft ? " (soft)" : ""}
			{/if}
		</div>
	</div>

	<div class="relative flex flex-wrap gap-2">
		{#if sparkle}
			<span class="spark s1"></span>
			<span class="spark s2"></span>
			<span class="spark s3"></span>
		{/if}

		{#each cards as c, i (roundId + "-" + i)}
			<CardView card={c} faceDown={hideHole && i === 1} roundId={roundId} />
		{/each}
	</div>
</div>

<style>
	@keyframes shake {
		0% { transform: translateX(0); }
		20% { transform: translateX(-4px); }
		40% { transform: translateX(4px); }
		60% { transform: translateX(-3px); }
		80% { transform: translateX(3px); }
		100% { transform: translateX(0); }
	}
	.bustShake { animation: shake 260ms ease-out 1; }

	.spark {
		position: absolute;
		top: 0.2rem;
		left: 0.6rem;
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 9999px;
		background: rgba(255,255,255,0.8);
		filter: blur(0.2px);
		opacity: 0;
		pointer-events: none;
	}
	@keyframes spark {
		0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
		25% { opacity: 0.9; }
		100% { transform: translate(2.2rem, -1.4rem) scale(0.2); opacity: 0; }
	}
	.s1 { animation: spark 520ms ease-out 1; }
	.s2 { left: 1.4rem; animation: spark 560ms ease-out 1; }
	.s3 { left: 2.2rem; animation: spark 600ms ease-out 1; }
</style>

<script lang="ts">
	import { onMount, tick } from "svelte"
	import { fly } from "svelte/transition"
	import type { Card } from "../lib/util"
	import { formatCard } from "../lib/util"

	export let card: Card
	export let faceDown = false
	export let roundId = 0

	let revealed = false
	let lastRoundId = roundId
	let revealToken = 0

	async function revealSoon() {
		const t = ++revealToken
		revealed = false
		await tick()
		if (t !== revealToken) return
		revealed = true
	}

	$: if (roundId !== lastRoundId) {
		lastRoundId = roundId
		revealToken++
		revealed = false
		if (!faceDown) void revealSoon()
	}

	$: if (!faceDown && !revealed) {
		void revealSoon()
	}

	onMount(() => {
		if (!faceDown) void revealSoon()
	})
</script>

<div
	in:fly={{ y: -8, x: -6, opacity: 0, duration: 180 }}
	class="cardWrap w-14 h-20 sm:w-16 sm:h-24 [perspective:900px]"
>
	<div
		class="cardInner relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
		class:[transform:rotateY(180deg)]={revealed}
	>
		<div
			class="absolute inset-0 rounded-lg border border-white/10 bg-white/10 backdrop-blur flex items-center justify-center [backface-visibility:hidden]"
		>
			<div class="w-10 h-14 rounded-md bg-white/15"></div>
		</div>

		<div
			class="absolute inset-0 rounded-lg border border-white/10 bg-white/5 backdrop-blur flex items-center justify-center font-semibold text-lg [transform:rotateY(180deg)] [backface-visibility:hidden]"
		>
			<span class="select-none">{formatCard(card)}</span>
		</div>
	</div>
</div>

<style>
	.cardWrap {
		transform-style: preserve-3d;
	}
	.cardWrap:hover .cardInner {
		transform: rotateY(180deg) rotateX(4deg) rotateZ(-2deg);
	}
</style>

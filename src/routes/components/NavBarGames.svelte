<script>
	import { Grid2x2Check, LayoutGrid, Worm } from "lucide-svelte";
</script>

<a href="/tictactoe" class="flex flex-row gap-2 items-center px-4 bg-indigo-500 ring ring-indigo-300 text-white rounded-md rounded-t-none hover:scale-105 transition-all">
	<LayoutGrid size="16" />
	<span class="text-lg">Tic-Tac-Toe</span>
</a>

<a href="/sudoku" class="flex flex-row gap-2 items-center px-4 bg-indigo-500 ring ring-indigo-300 text-white rounded-md rounded-t-none hover:scale-105 transition-all">
	<Grid2x2Check size="16" />
	<span class="text-lg">Sudoku</span>
</a>

<a href="/snake" class="flex flex-row gap-2 items-center px-4 bg-indigo-500 ring ring-indigo-300 text-white rounded-md rounded-t-none hover:scale-105 transition-all">
	<Worm size="16" />
	<span class="text-lg">Snake</span>
</a>

<script>
 import { gameSession } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import * as m from "$lib/paraglide/messages.js";

 let winner = $derived(() => {
  if (!$gameSession) return null;
  let wins1 = 0;
  let wins2 = 0;
  for (let r = 1; r <= 3; r++) {
   const rd = $gameSession[`round_${r}`];
   if (rd?.winner === 1) wins1++;
   else if (rd?.winner === 2) wins2++;
  }
  if (wins1 > wins2) return $gameSession.player_1;
  if (wins2 > wins1) return $gameSession.player_2;
  return null;
 });
</script>

{#if $gameSession}
 <div class="flex flex-col items-center justify-center h-full gap-8">
  {#if winner()}
   <p class="text-4xl">{m.gameend_winner()}</p>
   <PlayerBust player={winner()} />
  {/if}
 </div>
{/if}

<script>
 import {
  sessionId,
  gameSession,
  playerCode,
 } from "$lib/stores/gameSession.js";
 import { optimize } from "$lib/image";
 import * as m from "$lib/paraglide/messages";

 import Help from "$components/Help.svelte";

 // Get current player's data
 let myPlayer = $derived(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_1
   : $gameSession.player_2;
 });

 let myPlayerNumber = $derived($playerCode === "code_1" ? 1 : 2);
</script>

{#if $gameSession}
 <Help player={myPlayer()}>
  <p class="text-xl"></p>
 </Help>
{/if}

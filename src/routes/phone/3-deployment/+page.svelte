<script>
 import {
  sessionId,
  gameSession,
  playerCode,
 } from "$lib/stores/gameSession.js";

  // Get current player's data
 let myPlayer = $derived(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_1
   : $gameSession.player_2;
 });
</script>
<script>
 import { onMount } from "svelte";
 import { gameSession, playerCode } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import Logo from "$components/svg/Logo.svelte";
 import * as m from "$lib/paraglide/messages.js";

 let winnerCelebrate = $state(false);
 let loserRevealed = $state(false);

 let myPlayerNum = $derived($playerCode === 'code_1' ? 1 : 2);
 let myPlayer = $derived(
  $gameSession?.[$playerCode === 'code_1' ? 'player_1' : 'player_2']
 );

 let winner = $derived(() => {
  if (!$gameSession) return null;
  let wins1 = 0;
  let wins2 = 0;
  for (let r = 1; r <= 3; r++) {
   const rd = $gameSession[`round_${r}`];
   if (rd?.winner === 1) wins1++;
   else if (rd?.winner === 2) wins2++;
  }
  if (wins1 > wins2) return 1;
  if (wins2 > wins1) return 2;
  return null;
 });

 let isWinner = $derived(winner() === myPlayerNum);

 onMount(() => {
  if (isWinner) {
   setTimeout(() => {
    winnerCelebrate = true;
   }, 1000);
  } else {
   setTimeout(() => {
    loserRevealed = true;
   }, 1000);
  }
 });
</script>

{#if $gameSession && winner()}
 <div class="flex flex-col items-center justify-center h-full gap-8">
  <Logo classes="max-w-32 mb-4" />

  <div class="transition-[filter] duration-800 ease-in-out {winnerCelebrate ? 'winner-celebrate' : ''}" style={loserRevealed ? 'filter: grayscale(1) brightness(0.6)' : ''}>
   <PlayerBust player={myPlayer} />
  </div>

  <p class="text-3xl text-center">
   {isWinner ? m.gameend_win() : m.gameend_lose()}
  </p>
 </div>
{/if}

<style>
 .winner-celebrate {
  animation: winner-stomp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards,
             winner-glow 1.5s ease-in-out 0.4s infinite;
 }

 @keyframes winner-stomp {
  0% { transform: scale(1); }
  50% { transform: scale(1.18); }
  100% { transform: scale(1.1); }
 }

 @keyframes winner-glow {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6)); }
  50% { filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 40px rgba(255, 180, 0, 0.4)); }
 }
</style>

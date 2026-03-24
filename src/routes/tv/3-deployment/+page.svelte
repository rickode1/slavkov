<script>
 import { onMount } from "svelte";
 import { gameSession, sessionId } from "$lib/stores/gameSession.js";
 import { notify } from "$lib/stores/notification.js";
 import { m } from "$lib/paraglide/messages.js";
 import CardBonuses from "$components/CardBonuses.svelte";
 import PlayerBust from "$components/PlayerBust.svelte";
 import Map from "$components/Map.svelte";
 import { playSound, preloadSound } from "$lib/audio.js";

 let mapRef = $state(null);

 function setTimer(seconds) {
  fetch('/api/session/timer', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ sessionId: $sessionId, seconds }),
  }).catch(() => {});
 }

 onMount(() => {
  preloadSound('/sounds/ding.mp3');
  const round = $gameSession?.current_round ?? 1;

  if (round === 1) playSound('/sounds/ding.mp3');

  setTimeout(() => {
   mapRef?.zoomTo(parseInt(round), true);
  }, 4000);

  setTimeout(() => {
   notify(m.intro(), 8000, true);
  }, 5000);

  // Start timer after notification dismisses
  setTimeout(() => {
   setTimer(90);
  }, 15000);
 });
</script>

{#if $gameSession}
 <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between">
  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_1} />
   <CardBonuses playerCode="code_1" hideBonuses={true} animated={['unit', 'loc']} emptyOnly={true} />
  </div>

  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_2} />
   <CardBonuses playerCode="code_2" hideBonuses={true} animated={['unit', 'loc']} emptyOnly={true} />
  </div>
 </div>

 <Map
  bind:this={mapRef}
  hideUnits={true}
  autoZoom={false}
  classes="w-[calc(100%-35rem)] mt-10"
 />
{/if}

<script>
 import { onMount } from "svelte";
 import { gameSession } from "$lib/stores/gameSession.js";
 import { notify } from "$lib/stores/notification.js";
 import { m } from "$lib/paraglide/messages.js";
 import CardBonuses from "$components/CardBonuses.svelte";
 import PlayerBust from "$components/PlayerBust.svelte";
 import Map from "$components/Map.svelte";

 let mapRef = $state(null);

 onMount(() => {
  const round = $gameSession?.current_round ?? 1;
  const introMsg = [m.intro_1, m.intro_2, m.intro_3][round - 1] ?? m.intro_1;

  if (round === 1) new Audio('/sounds/ding.mp3').play().catch(() => {});

  setTimeout(() => {
   mapRef?.zoomTo(parseInt(round), true);
  }, 4000);

  setTimeout(() => {
   notify(introMsg(), 13000, true);
  }, 5000);
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

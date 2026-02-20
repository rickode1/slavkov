<script>
 import { onMount } from "svelte";
 import { gameSession } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import CardBonuses from "$components/CardBonuses.svelte";
 import Map from "$components/Map.svelte";

 let mapRef = $state(null);

 onMount(() => {
  mapRef?.startBattle();
 });
</script>

{#if $gameSession}
 <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between">
  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_1} />
   <CardBonuses playerCode="code_1" animated={false} />
  </div>

  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_2} />
   <CardBonuses playerCode="code_2" animated={false} />
  </div>
 </div>

 <Map
  bind:this={mapRef}
  unitsAnimated={false}
  classes="w-[calc(100%-27rem)] mt-10"
 />
{/if}

<script>
 import { onMount } from "svelte";
 import { gameSession } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import Map from "$components/Map.svelte";

 let mapRef = $state(null);

 onMount(() => {
  setTimeout(() => {
   const round = $gameSession?.current_round;
   mapRef?.zoomTo(parseInt(round), true);
  }, 5000);
 });
</script>

{#if $gameSession}
 <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between">
  <PlayerBust player={$gameSession.player_1} />
  <PlayerBust player={$gameSession.player_2} />
 </div>

 <Map
 bind:this={mapRef}
 hideUnits={true}
 autoZoom={false}
 classes="w-[calc(100%-27rem)] mt-10"
 />
{/if}

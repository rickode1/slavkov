<script>
 import { onMount } from "svelte";
 import { gameSession } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import Map from "$components/Map.svelte";

 let mapRef = $state(null);

 onMount(() => {
  setTimeout(() => {
   const round = $gameSession?.current_round;
   mapRef?.zoomTo(String(round));
  }, 3000);
 });
</script>

{#if $gameSession}
 <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between">
  <PlayerBust player={$gameSession.player_1} />
  <PlayerBust player={$gameSession.player_2} />
 </div>

 <Map bind:this={mapRef} />
{/if}

<div class="fixed bottom-0 left-auto right-auto mx-auto space-x-2">
 <button onclick={() => mapRef.zoomTo("1")}>1</button>
 <button onclick={() => mapRef.zoomTo("2")}>2</button>
 <button onclick={() => mapRef.zoomTo("3")}>3</button>
 <button onclick={() => mapRef.resetZoom()}>x</button>
</div>

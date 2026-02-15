<script>
 import { gameSession } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import Map from "$components/Map.svelte";

 let mapRef = $state(null);

 let placedUnits = $derived(() => {
  if (!$gameSession) return {};
  const round = $gameSession.current_round || 1;
  const roundData = $gameSession[`round_${round}`];
  if (!roundData) return {};

  const units = {};
  const p1Bust = $gameSession.player_1?.bust;
  const p2Bust = $gameSession.player_2?.bust;

  if (roundData.loc_1 && roundData.unit_1 && p1Bust) {
   units[roundData.loc_1] = `/img/unit_${p1Bust}_${roundData.unit_1}.png`;
  }
  if (roundData.loc_2 && roundData.unit_2 && p2Bust) {
   units[roundData.loc_2] = `/img/unit_${p2Bust}_${roundData.unit_2}.png`;
  }
  return units;
 });
</script>

{#if $gameSession}
 <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between">
  <PlayerBust player={$gameSession.player_1} />
  <PlayerBust player={$gameSession.player_2} />
 </div>

 <Map
  bind:this={mapRef}
  initialLocation={parseInt($gameSession?.current_round || 1)}
  placedUnits={placedUnits()}
  classes="w-[calc(100%-22rem)] mt-10"
 />
{/if}

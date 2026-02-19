<script>
 import { gameSession } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import CardBonuses from "$components/CardBonuses.svelte";
 import Map from "$components/Map.svelte";

 let mapRef = $state(null);

 let roundData = $derived(() => {
  if (!$gameSession) return null;
  const round = $gameSession.current_round || 1;
  return $gameSession[`round_${round}`] || null;
 });

 let placedUnits = $derived(() => {
  const rd = roundData();
  if (!rd || !$gameSession) return {};

  const units = {};
  const p1Bust = $gameSession.player_1?.bust;
  const p2Bust = $gameSession.player_2?.bust;

  if (rd.loc_1 && rd.unit_1 && p1Bust) {
   units[rd.loc_1] = `/img/unit_${p1Bust}_${rd.unit_1}.png`;
  }
  if (rd.loc_2 && rd.unit_2 && p2Bust) {
   units[rd.loc_2] = `/img/unit_${p2Bust}_${rd.unit_2}.png`;
  }
  return units;
 });
</script>

{#if $gameSession}
 <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between">
  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_1} />
   <CardBonuses playerCode="code_1" />
  </div>

  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_2} />
   <CardBonuses playerCode="code_2" />
  </div>
 </div>

 <Map
  bind:this={mapRef}
  initialLocation={parseInt($gameSession?.current_round || 1)}
  placedUnits={placedUnits()}
  classes="w-[calc(100%-27rem)] mt-10"
 />
{/if}

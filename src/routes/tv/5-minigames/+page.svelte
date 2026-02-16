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

 let p1Bonuses = $derived(() => {
  const rd = roundData();
  if (!rd) return [];
  const cards = [];
  if (rd.bonus_loc_1 !== undefined)
   cards.push({ type: "loc", value: rd.bonus_loc_1 });
  if (rd.bonus_unit_1 !== undefined)
   cards.push({ type: "unit", value: rd.bonus_unit_1 });
  for (let i = 0; i < (rd.bonuses_def_1 || 0); i++)
   cards.push({ type: "def", value: 1 });
  for (let i = 0; i < (rd.bonuses_dmg_1 || 0); i++)
   cards.push({ type: "dmg", value: 1 });
  for (let i = 0; i < (rd.bonuses_life_1 || 0); i++)
   cards.push({ type: "life", value: 1 });
  return cards;
 });

 let p2Bonuses = $derived(() => {
  const rd = roundData();
  if (!rd) return [];
  const cards = [];
  if (rd.bonus_loc_2 !== undefined)
   cards.push({ type: "loc", value: rd.bonus_loc_2 });
  if (rd.bonus_unit_2 !== undefined)
   cards.push({ type: "unit", value: rd.bonus_unit_2 });
  for (let i = 0; i < (rd.bonuses_def_2 || 0); i++)
   cards.push({ type: "def", value: 1 });
  for (let i = 0; i < (rd.bonuses_dmg_2 || 0); i++)
   cards.push({ type: "dmg", value: 1 });
  for (let i = 0; i < (rd.bonuses_life_2 || 0); i++)
   cards.push({ type: "life", value: 1 });
  return cards;
 });
</script>

{#if $gameSession}
 <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between">
  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_1} />
   <CardBonuses bonuses={p1Bonuses()} />
  </div>

  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_2} />
   <CardBonuses bonuses={p2Bonuses()} />
  </div>
 </div>

 <Map
  bind:this={mapRef}
  initialLocation={parseInt($gameSession?.current_round || 1)}
  placedUnits={placedUnits()}
  classes="w-[calc(100%-22rem)] mt-10"
 />
{/if}

<script>
 import { onMount } from "svelte";
 import { gameSession } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import CardBonuses from "$components/CardBonuses.svelte";
 import Map from "$components/Map.svelte";
 import Battle from "$components/Battle.svelte";

 let mapRef = $state(null);
 let showBattle = $state(false);
 let highlightCardTypes = $state(new Set());

 let attackerPlayerCode = $derived(() => {
  const round = $gameSession?.current_round || 1;
  const rd = $gameSession?.[`round_${round}`];
  const sp = rd?.starting_player || 1;
  return sp === 1 ? "code_1" : "code_2";
 });

 onMount(() => {
  mapRef?.startBattle();
 });

 function handleBattleReady() {
  showBattle = true;
 }

 function handleHighlightCard(type) {
  highlightCardTypes = new Set([...highlightCardTypes, type]);
 }
</script>

{#if $gameSession}
 <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between">
  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_1} />
   <CardBonuses playerCode="code_1" animated={false} highlightTypes={attackerPlayerCode() === "code_1" ? highlightCardTypes : null} />
  </div>

  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_2} />
   <CardBonuses playerCode="code_2" animated={false} highlightTypes={attackerPlayerCode() === "code_2" ? highlightCardTypes : null} />
  </div>
 </div>

 <Map
  bind:this={mapRef}
  unitsAnimated={false}
  onBattleReady={handleBattleReady}
  classes="w-[calc(100%-27rem)] mt-10"
 />

 <Battle visible={showBattle} onHighlightCard={handleHighlightCard} />
{/if}

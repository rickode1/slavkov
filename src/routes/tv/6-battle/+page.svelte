<script>
 import { onMount } from "svelte";
 import { gameSession, sessionId } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import CardBonuses from "$components/CardBonuses.svelte";
 import Map from "$components/Map.svelte";
 import Battle from "$components/Battle.svelte";

 let mapRef = $state(null);
 let showBattle = $state(false);
 let highlightCardTypes = $state(new Set());

 function setTimer(seconds) {
  fetch('/api/session/timer', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ sessionId: $sessionId, seconds }),
  }).catch(() => {});
 }

 let activePlayerCode = $derived(() => {
  const round = $gameSession?.current_round || 1;
  const rd = $gameSession?.[`round_${round}`];
  const sp = rd?.current_turn?.player || 1;
  return sp === 1 ? "code_1" : "code_2";
 });

 let activeRole = $derived(() => {
  const round = $gameSession?.current_round || 1;
  const rd = $gameSession?.[`round_${round}`];
  return rd?.current_turn?.role || 'dmg';
 });

 let filteredHighlights = $derived(() => {
  const role = activeRole();
  const allowed = new Set(['loc', role]);
  if (role === 'dmg') allowed.add('unit');
  if (role === 'def') allowed.add('life');
  const filtered = new Set([...highlightCardTypes].filter((t) => allowed.has(t)));
  // Always highlight relevant minigame bonus cards
  if (role === 'dmg') filtered.add('minigame_dmg');
  if (role === 'def') filtered.add('minigame_def');
  return filtered.size ? filtered : null;
 });

 onMount(() => {
  function tryStartBattle() {
   if (mapRef) {
    mapRef.startBattle();
   } else {
    setTimeout(tryStartBattle, 200);
   }
  }
  tryStartBattle();
 });

 function handleBattleReady() {
  showBattle = true;
  setTimer(60);
 }

 function handleHighlightCard(type) {
  highlightCardTypes = new Set([...highlightCardTypes, type]);
 }
</script>

{#if $gameSession}
 <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between">
  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_1} />
   <CardBonuses playerCode="code_1" animated={false} highlightTypes={activePlayerCode() === "code_1" ? filteredHighlights() : null} />
  </div>

  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_2} />
   <CardBonuses playerCode="code_2" animated={false} highlightTypes={activePlayerCode() === "code_2" ? filteredHighlights() : null} />
  </div>
 </div>

 <div class="relative w-[calc(100%-35rem)] mt-10 flex flex-col lg:items-center">
  <div class="transition-opacity duration-400 {showBattle ? 'opacity-0 pointer-events-none' : 'opacity-100'}">
   <Map
    bind:this={mapRef}
    unitsAnimated={false}
    onBattleReady={handleBattleReady}
    classes="w-full"
   />
  </div>

  <div class="absolute inset-0 transition-opacity duration-400 {showBattle ? 'opacity-100' : 'opacity-0 pointer-events-none'}">
   <Battle onHighlightCard={handleHighlightCard} />
  </div>
 </div>
{/if}

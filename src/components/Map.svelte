<script>
 import { browser } from "$app/environment";
 import { onMount, tick } from "svelte";
 import { optimize } from "$lib/image";
 import { gameSession } from "$lib/stores/gameSession.js";
 import { positions } from "$lib/stores/positions.js";
 import { strokeStyle } from "$lib/constants.js";
 import * as m from "$lib/paraglide/messages.js";
 import PlayerBust from "$components/PlayerBust.svelte";

 let {
  playerFilter = null,
  classes = "",
  onSlotSelect = null,
  onBattleReady = null,
  onBattleEndComplete = null,
  selectedSlotId = null,
  unitImage = null,
  unitsAnimated = true,
  hideUnits = false,
  autoZoom = true,
 } = $props();

 let initialLocation = $derived(
  $gameSession ? parseInt($gameSession.current_round || 1) : null
 );

 let placedUnits = $derived(() => {
  if (!$gameSession) return {};
  const round = $gameSession.current_round || 1;
  const rd = $gameSession[`round_${round}`];
  if (!rd) return {};

  if (hideUnits) return {};

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

 const labelMap = {
  telnitz: () => m.location_telnitz(),
  pratzen: () => m.location_pratzen(),
  santon: () => m.location_santon(),
 };

 // Map location id -> winner player object (location id corresponds to round number)
 let locationWinners = $derived(() => {
  if (!$gameSession) return {};
  const result = {};
  for (let r = 1; r <= 3; r++) {
   const rd = $gameSession[`round_${r}`];
   if (rd?.winner) {
    result[r] = $gameSession[`player_${rd.winner}`] || null;
   }
  }
  return result;
 });

 let locations = $derived(
  $positions.map((loc) => ({
   ...loc,
   label: labelMap[loc.label] || (() => loc.label),
  }))
 );

 function getSlotColor(playerNum, opacity = 0.5) {
  const bust = $gameSession?.[`player_${playerNum}`]?.bust;
  if (!bust) return `rgba(128,128,128,${opacity})`;
  const pct = Math.round(opacity * 100);
  return `color-mix(in srgb, var(--color-bust-${bust}) ${pct}%, transparent)`;
 }

 function getUnitStroke(playerNum) {
  const bust = $gameSession?.[`player_${playerNum}`]?.bust;
  return strokeStyle(bust, 3);
 }

 let scale = $state(1);
 let zoomOrigin = $state("50% 50%");
 let zoomed = $state(false);
 let activeLabel = $state(null);
 let activeLocationId = $state(null);
 let transitioning = $state(false);
 let isMobile = $state(false);
 let animateZoom = $state(false);
 let battlePhase = $state(null);
 let battleTargets = $state({});
 let losingSlotId = $state(null);

 if (browser) {
  isMobile = window.innerWidth < 1024;
 }

 // Watch for positions loading and zoom when ready
 $effect(() => {
  if (autoZoom && locations.length > 0 && initialLocation && !zoomed && !battlePhase) {
   zoomTo(initialLocation, false);
  }
 });

 export function zoomTo(locationId, animate) {
  const loc = locations.find((l) => l.id === locationId);

  if (!loc || transitioning) return;

  animateZoom = animate;
  transitioning = true;

  let zx, zy;
  if (isMobile && playerFilter === 1) {
   zx = loc.mobileZoomP1X;
   zy = loc.mobileZoomP1Y;
  } else if (isMobile && playerFilter === 2) {
   zx = loc.mobileZoomP2X;
   zy = loc.mobileZoomP2Y;
  } else {
   zx = loc.zoomX;
   zy = loc.zoomY;
  }
  zoomOrigin = `${zx}% ${zy}%`;
  scale = isMobile ? 3.4 : 1.8;
  zoomed = true;
  activeLabel = loc.label();
  activeLocationId = locationId;

  setTimeout(() => {
   transitioning = false;
  }, 800);
 }

 export function resetZoom() {
  if (transitioning) return;
  animateZoom = true;
  transitioning = true;
  scale = 1;
  zoomed = false;
  activeLabel = null;
  activeLocationId = null;
  setTimeout(() => {
   transitioning = false;
  }, 800);
 }

 export function startBattle() {
  battlePhase = '';

  // Find the two slots that have placed units
  const pu = placedUnits();
  const unitSlots = [];
  for (const loc of locations) {
   for (const slot of loc.slots) {
    if (pu[slot.id]) {
     unitSlots.push(slot);
    }
   }
  }

  // Phase 1: fade out slot circles
  battlePhase = 'fade-slots';

  if (unitSlots.length === 2) {
   // Phase 2: after fade, move units toward each other
   const midX = (unitSlots[0].x + unitSlots[1].x) / 2;
   const midY = (unitSlots[0].y + unitSlots[1].y) / 2;
   const dx = (unitSlots[1].x - unitSlots[0].x) * 0.15;
   const dy = (unitSlots[1].y - unitSlots[0].y) * 0.15;

   setTimeout(() => {
    battleTargets = {
     [unitSlots[0].id]: { x: midX - dx, y: midY - dy },
     [unitSlots[1].id]: { x: midX + dx, y: midY + dy },
    };
    battlePhase = 'move-units';

    // Fire callback before units finish converging
    setTimeout(() => {
     onBattleReady?.();
    }, 1200);
   }, 800);
  }
 }

 export function showBattleEnd() {
  // Immediately show the final battle state: slots hidden, units near each other
  losingSlotId = null;
  const pu = placedUnits();
  const unitSlots = [];
  for (const loc of locations) {
   for (const slot of loc.slots) {
    if (pu[slot.id]) {
     unitSlots.push(slot);
    }
   }
  }

  battlePhase = 'move-units';

  if (unitSlots.length === 2) {
   const midX = (unitSlots[0].x + unitSlots[1].x) / 2;
   const midY = (unitSlots[0].y + unitSlots[1].y) / 2;
   const dx = (unitSlots[1].x - unitSlots[0].x) * 0.1;
   const dy = (unitSlots[1].y - unitSlots[0].y) * 0.1;
   battleTargets = {
    [unitSlots[0].id]: { x: midX - dx, y: midY - dy },
    [unitSlots[1].id]: { x: midX + dx, y: midY + dy },
   };

   // Determine losing slot from round winner
   const round = $gameSession?.current_round || 1;
   const rd = $gameSession?.[`round_${round}`];
   const winner = rd?.winner;
   if (winner) {
    const loserPlayerNum = winner === 1 ? 2 : 1;
    const losingSlot = unitSlots.find((s) => s.p === loserPlayerNum);
    if (losingSlot) {
     // After units settle, grey out the loser
     setTimeout(() => {
      losingSlotId = losingSlot.id;
      setTimeout(() => {
       resetZoom();
       setTimeout(() => {
        onBattleEndComplete?.();
       }, 800);
      }, 2000);
     }, 600);
    }
   }
  }
 }
</script>

<div class="flex flex-col lg:items-center {classes}">
 <div
  class="hidden lg:block text-center text-xl lg:text-4xl h-12 transition-opacity duration-500 ease-in-out
   {activeLabel ? 'opacity-100' : 'opacity-0'}"
 >
  {activeLabel ?? ""}
 </div>

 <div
  class="relative w-full overflow-hidden aspect-3/4 lg:aspect-auto"
 >
  <img
   class="absolute inset-0 w-full h-full z-10 pointer-events-none"
   srcset={optimize("/img/map_frame.png")}
   alt=""
  />

  <div
   class="relative w-full lg:h-full {animateZoom
    ? 'transition-all duration-700 ease-in-out'
    : ''}"
   style="transform: scale({scale}); transform-origin: {zoomOrigin}"
  >
   <img class="w-full" srcset={optimize("/img/map.png")} alt="" />

   {#each locations as loc (loc.id)}
    {@const winner = locationWinners()[loc.id]}
    <div
     class="absolute flex flex-col items-center justify-center text-center rounded-full h-60 w-60
     text-white text-3xl px-6 py-3
     -translate-x-1/2 -translate-y-1/2
     transition-opacity duration-500 ease-in-out
     bg-primary/85
     {zoomed ? 'opacity-0 pointer-events-none' : 'opacity-100'}"
     style="left: {loc.x}%; top: {loc.y}%; {winner ? `background-color: color-mix(in srgb, var(--color-bust-${winner.bust}) 85%, transparent)` : ''}"
    >
     {#if winner}
      <div class="absolute -top-10 left-1/2">
      <PlayerBust player={winner} small={true} />
      </div>
     {/if}
     {loc.label()}     
    </div>
   {/each}

   {#each locations as loc (loc.id)}
    {#each loc.slots as slot (slot.id)}
     {#if !playerFilter || slot.p === playerFilter}
      <button
       class="absolute rounded-full h-8 w-8 lg:h-16 lg:w-16
       -translate-x-1/2 -translate-y-1/2
       transition-all duration-2000 ease-in-out overflow-hidden
       {onSlotSelect ? 'cursor-pointer' : ''}
       {(activeLocationId === loc.id || battleTargets[slot.id]) && zoomed
        ? 'opacity-100'
        : 'opacity-0 pointer-events-none'}"
       style="left: {battleTargets[slot.id] ? battleTargets[slot.id].x : slot.x}%; top: {battleTargets[slot.id] ? battleTargets[slot.id].y : slot.y}%; background-color: {battlePhase ? 'transparent' : getSlotColor(slot.p)}; {losingSlotId === slot.id ? 'transition: filter 0.8s ease; filter: grayscale(1) brightness(0.6);' : ''}"
       onclick={() => onSlotSelect?.(slot)}
       aria-label="Select slot"
      >
       {#if selectedSlotId === slot.id && unitImage}
        <img
         class="w-full h-[75%] object-contain {unitsAnimated ? 'unit-drop' : ''}"
         srcset={optimize(unitImage)}
         alt=""
        />
       {:else if placedUnits()[slot.id]}
        <img
         class="w-full h-[75%] object-contain transition-[filter] duration-700 ease-in-out"
         style={battlePhase ? getUnitStroke(slot.p) : ''}
         srcset={optimize(placedUnits()[slot.id])}
         alt=""
        />
       {/if}
      </button>
     {/if}
    {/each}
   {/each}
  </div>
 </div>
</div>

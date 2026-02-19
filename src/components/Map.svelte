<script>
 import { browser } from "$app/environment";
 import { onMount, tick } from "svelte";
 import { optimize } from "$lib/image";
 import { supabase } from "$lib/supabaseClient.js";
 import { gameSession } from "$lib/stores/gameSession.js";
 import * as m from "$lib/paraglide/messages.js";

 let {
  playerFilter = null,
  classes = "",
  initialLocation = null,
  onSlotSelect = null,
  selectedSlotId = null,
  unitImage = null,
  placedUnits = {},
 } = $props();

 const labelMap = {
  telnitz: () => m.location_telnitz(),
  pratzen: () => m.location_pratzen(),
  santon: () => m.location_santon(),
 };

 function getSlotColor(playerNum, opacity = 0.5) {
  const bust = $gameSession?.[`player_${playerNum}`]?.bust;
  if (!bust) return `rgba(128,128,128,${opacity})`;
  const pct = Math.round(opacity * 100);
  return `color-mix(in srgb, var(--color-bust-${bust}) ${pct}%, transparent)`;
 }

 let locations = $state([]);
 let scale = $state(1);
 let zoomOrigin = $state("50% 50%");
 let zoomed = $state(false);
 let activeLabel = $state(null);
 let activeLocationId = $state(null);
 let transitioning = $state(false);
 let isMobile = $state(false);
 let animateZoom = $state(false);

 if (browser) {
  isMobile = window.innerWidth < 1024;
 }

 onMount(async () => {
  const { data, error } = await supabase
   .from("positions")
   .select("*")
   .order("id");

  if (error) {
   console.error("Failed to load positions:", error);
  } else {
   locations = data.map((row) => ({
    id: row.id,
    label: labelMap[row.label] || (() => row.label),
    x: row.x,
    y: row.y,
    zoomX: row.zoomX,
    zoomY: row.zoomY,
    mobileZoomP1X: row.mobileZoomP1X,
    mobileZoomP1Y: row.mobileZoomP1Y,
    mobileZoomP2X: row.mobileZoomP2X,
    mobileZoomP2Y: row.mobileZoomP2Y,
    slots: Object.entries(row.slots).map(([key, val]) => ({
     id: key,
     ...val,
    })),
   }));
  }

  if (initialLocation) {
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
  transitioning = true;
  scale = 1;
  zoomed = false;
  activeLabel = null;
  activeLocationId = null;
  setTimeout(() => {
   transitioning = false;
  }, 800);
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
    <div
     class="absolute flex items-center justify-center text-center rounded-full h-60 w-60
     bg-secondary/85 text-white text-3xl px-6 py-3
     -translate-x-1/2 -translate-y-1/2
     transition-opacity duration-500 ease-in-out
     {zoomed ? 'opacity-0 pointer-events-none' : 'opacity-100'}"
     style="left: {loc.x}%; top: {loc.y}%"
    >
     {loc.label()}
    </div>
   {/each}

   {#each locations as loc (loc.id)}
    {#each loc.slots as slot (slot.id)}
     {#if !playerFilter || slot.p === playerFilter}
      <button
       class="absolute rounded-full h-8 w-8 lg:h-16 lg:w-16
       -translate-x-1/2 -translate-y-1/2
       transition-opacity duration-500 ease-in-out overflow-hidden
       {onSlotSelect ? 'cursor-pointer' : ''}
       {activeLocationId === loc.id
        ? 'opacity-100'
        : 'opacity-0 pointer-events-none'}"
       style="left: {slot.x}%; top: {slot.y}%; background-color: {getSlotColor(
        slot.p,
       )}"
       onclick={() => onSlotSelect?.(slot)}
       aria-label="Select slot"
      >
       {#if selectedSlotId === slot.id && unitImage}
        <img
         class="w-full h-[75%] object-contain unit-drop"
         srcset={optimize(unitImage)}
         alt=""
        />
       {:else if placedUnits[slot.id]}
        <img
         class="w-full h-[75%] object-contain"
         srcset={optimize(placedUnits[slot.id])}
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

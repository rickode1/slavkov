<script>
 import { optimize } from "$lib/image";
 import { gameSession } from "$lib/stores/gameSession.js";
 import * as m from "$lib/paraglide/messages.js";

 const locations = [
  {
   id: "1",
   label: () => m.location_telnitz(),
   x: 23,
   y: 35,
   zoomX: 30,
   zoomY: 48,
   slots: [
    { id: "1a", p: 1, x: 20, y: 35 },
    { id: "1b", p: 1, x: 28, y: 50 },
    { id: "1c", p: 1, x: 20, y: 65 },
    { id: "1d", p: 2, x: 40, y: 35 },
    { id: "1e", p: 2, x: 48, y: 50 },
    { id: "1f", p: 2, x: 40, y: 65 },
   ],
  },
  {
   id: "2",
   label: () => m.location_pratzen(),
   x: 56,
   y: 43,
   zoomX: 60,
   zoomY: 50,
   slots: [
    { id: "2a", p: 1, x: 40, y: 35 },
    { id: "2b", p: 1, x: 48, y: 50 },
    { id: "2c", p: 1, x: 40, y: 65 },
    { id: "2d", p: 2, x: 60, y: 35 },
    { id: "2e", p: 2, x: 68, y: 50 },
    { id: "2f", p: 2, x: 60, y: 65 },
   ],
  },
  {
   id: "3",
   label: () => m.location_santon(),
   x: 87,
   y: 35,
   zoomX: 70,
   zoomY: 40,
   slots: [
    { id: "3a", p: 1, x: 70, y: 25 },
    { id: "3b", p: 1, x: 75, y: 40 },
    { id: "3c", p: 1, x: 78, y: 55 },
    { id: "3d", p: 2, x: 85, y: 25 },
    { id: "3e", p: 2, x: 90, y: 40 },
    { id: "3f", p: 2, x: 92, y: 55 },
   ],
  },
 ];

 let containerEl = $state(null);
 let innerEl = $state(null);
 let scale = $state(1);
 let tx = $state(0);
 let ty = $state(0);
 let zoomed = $state(false);
 let activeLabel = $state(null);
 let activeLocationId = $state(null);
 let transitioning = $state(false);

 export function zoomTo(locationId) {
  const loc = locations.find((l) => l.id === locationId);
  if (!loc || transitioning || !containerEl || !innerEl) return;

  transitioning = true;

  const zoomLevel = 1.8;

  const containerRect = containerEl.getBoundingClientRect();
  const innerRect = innerEl.getBoundingClientRect();

  const locXPx = (loc.zoomX / 100) * innerEl.scrollWidth;
  const locYPx = (loc.zoomY / 100) * innerEl.scrollHeight;

  const centerX = containerRect.width / 2;
  const centerY = containerRect.height / 2;

  tx = centerX - locXPx * zoomLevel;
  ty = centerY - locYPx * zoomLevel;
  scale = zoomLevel;
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
  tx = 0;
  ty = 0;
  zoomed = false;
  activeLabel = null;
  activeLocationId = null;
  setTimeout(() => {
   transitioning = false;
  }, 800);
 }
</script>

<div class="flex flex-col items-center w-[calc(100%-22rem)] mt-10">
 <div
  class="text-center text-4xl h-12 transition-opacity duration-500 ease-in-out
   {activeLabel ? 'opacity-100' : 'opacity-0'}"
 >
  {activeLabel ?? ""}
 </div>

 <div
  class="relative w-full overflow-hidden mix-blend-multiply"
  bind:this={containerEl}
 >
  <img
   class="absolute inset-0 w-full h-full z-10 pointer-events-none"
   srcset={optimize("/img/map_frame.png")}
   alt=""
  />

  <div
   class="relative w-full h-full transition-all duration-700 ease-in-out origin-top-left"
   style="transform: translate({tx}px, {ty}px) scale({scale})"
   bind:this={innerEl}
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
     <div
      class="absolute rounded-full h-20 w-20 bg-secondary/50
       -translate-x-1/2 -translate-y-1/2
       transition-opacity duration-500 ease-in-out
       {activeLocationId === loc.id
       ? 'opacity-100'
       : 'opacity-0 pointer-events-none'}"
      style="left: {slot.x}%; top: {slot.y}%"
     ></div>
    {/each}
   {/each}
  </div>
 </div>
</div>

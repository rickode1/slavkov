<script>
 import {
  sessionId,
  gameSession,
  playerCode,
 } from "$lib/stores/gameSession.js";
 import { optimize } from "$lib/image";
 import * as m from "$lib/paraglide/messages";

 import PlayerBust from "$components/PlayerBust.svelte";
 import Button from "$components/Button.svelte";
 import Loader from "$components/Loader.svelte";

 // Get current player's data
 let myPlayer = $derived(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_1
   : $gameSession.player_2;
 });

 let myPlayerNumber = $derived($playerCode === "code_1" ? 1 : 2);

 let selectedUnit = $state(null);
 let deploying = $state(false);

 let selected = $derived(() => {
  if (!$gameSession) return false;
  const unitKey = $playerCode === "code_1" ? "unit_1" : "unit_2";
  const round = $gameSession.current_round || 1;
  const roundData = $gameSession[`round_${round}`];
  return !!roundData?.[unitKey];
 });

 let usedUnits = $derived(() => {
  if (!$gameSession) return [];
  const unitKey = $playerCode === "code_1" ? "unit_1" : "unit_2";
  const round = $gameSession.current_round || 1;
  const used = [];
  for (let i = 1; i < round; i++) {
   const roundData = $gameSession[`round_${i}`];
   if (roundData?.[unitKey]) {
    used.push(roundData[unitKey]);
   }
  }
  return used;
 });

 async function handleDeploy() {
  if (!selectedUnit || deploying) return;
  deploying = true;
  try {
   const response = await fetch("/api/session/deploy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     sessionId: $sessionId,
     playerCode: $playerCode,
     unit: selectedUnit,
    }),
   });
   if (!response.ok) {
    console.error("Failed to deploy unit");
   }
  } catch (error) {
   console.error("Error deploying unit:", error);
  } finally {
   deploying = false;
  }
 }

 let units = $derived(() => {
  const bust = myPlayer()?.bust;
  if (!bust) return [];
  return [
   {
    id: "soldier",
    size: "h-30",
    img: `unit_${bust}_soldier`,
    title: m.unit_soldier(),
   },
   {
    id: "cavalry",
    size: "h-26",
    img: `unit_${bust}_cavalry`,
    title: m.unit_cavalry(),
   },
   {
    id: "cannon",
    size: "h-26",
    img: `unit_${bust}_cannon`,
    title: m.unit_cannon(),
   },
  ];
 });
</script>

{#if $gameSession}
 <!--<div class="absolute right-2 top-2 w-full flex justify-end">
  <PlayerBust player={myPlayer()} />
 </div>
-->

 <div class="flex flex-col items-center gap-y-4 mt-4">
  {#if selected()}
   ...
  {:else}
   {#each units() as unit}
    {@const disabled = usedUnits().includes(unit.id)}
    <button
     class="flex flex-col items-center cursor-pointer {disabled
      ? 'grayscale opacity-70 pointer-events-none'
      : ''}"
     onclick={() => (selectedUnit = unit.id)}
     {disabled}
    >
     <img
      class="{unit.size} mb-2 transition-all {selectedUnit === unit.id
       ? 'scale-105 stroke'
       : ''}"
      srcset={optimize(`/img/${unit.img}.png`)}
      alt={unit.title}
     />
     <p class="text-xl text-center">{unit.title}</p>
    </button>
   {/each}

   {#if deploying}
    <Loader classes="mt-4" />
   {:else}
    <Button
     text={m.confirm()}
     disabled={!selectedUnit}
     onclick={handleDeploy}
     classes="!text-2xl !h-12 min-w-auto mt-4"
    />
   {/if}
  {/if}
 </div>
{/if}

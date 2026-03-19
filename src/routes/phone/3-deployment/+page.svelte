<script>
 import { onMount, onDestroy } from "svelte";
 import {
  sessionId,
  gameSession,
  playerCode,
 } from "$lib/stores/gameSession.js";
 import { optimize } from "$lib/image";
 import { m } from "$lib/paraglide/messages.js";
 import { strokeStyle } from "$lib/constants.js";
 import { startTimer, stopTimer, resetTimer } from "$lib/stores/timer.js";


 import PlayerBust from "$components/PlayerBust.svelte";
 import Button from "$components/Button.svelte";
 import Loader from "$components/Loader.svelte";
 import Map from "$components/Map.svelte";
 import Help from "$components/Help.svelte";
 import LookTV from "$components/LookTV.svelte";
 import HourglassIcon from "$components/HourglassIcon.svelte";

 // Get current player's data
 let myPlayer = $derived(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_1
   : $gameSession.player_2;
 });

 let myPlayerNumber = $derived($playerCode === "code_1" ? 1 : 2);

 let myStrokeStyle = $derived(() => strokeStyle(myPlayer()?.bust));

 let introDone = $state(false);
 let helpKey = $derived(introDone ? (selected() ? 2 : 1) : 0);

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
  resetTimer();
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

 let selectedSlot = $state(null);
 let deployingLocation = $state(false);
 let locationSelected = $state(false);

  onMount(() => {
  setTimeout(() => {
   introDone = true;
   startTimer();
  }, 10000);
 });

 onDestroy(() => stopTimer());

 $effect(() => {
  if (introDone) new Audio('/sounds/ding.mp3').play().catch(() => {});
 });

 function handleSlotSelect(slot) {
  selectedSlot = slot;
  new Audio('/sounds/piece-move.mp3').play().catch(() => {});
 }

 async function postLocation() {
  return fetch("/api/session/location", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    sessionId: $sessionId,
    playerCode: $playerCode,
    slotId: selectedSlot.id,
   }),
  });
 }

 async function handleDeployLocation() {
  if (!selectedSlot || deployingLocation) return;
  stopTimer();
  deployingLocation = true;
  try {
   const response = await postLocation();
   if (!response.ok) {
    console.error("Failed to deploy location");
   }
  } catch (error) {
   console.error("Error deploying location:", error);
  } finally {
   deployingLocation = false;
   locationSelected = true;
   // Retry after 2s: if both players submitted simultaneously the first
   // request may have raced and missed the opponent's data; re-sending
   // re-triggers the status advancement check with fresh DB state.
   setTimeout(() => postLocation().catch(() => {}), 2000);
  }
 }

 let deployedUnit = $derived(() => {
  if (!$gameSession) return null;
  const unitKey = $playerCode === "code_1" ? "unit_1" : "unit_2";
  const round = $gameSession.current_round || 1;
  const roundData = $gameSession[`round_${round}`];
  return roundData?.[unitKey] || null;
 });

 let unitImage = $derived(() => {
  const unit = deployedUnit();
  const bust = myPlayer()?.bust;
  if (!unit || !bust) return null;
  return `/img/unit_${bust}_${unit}.png`;
 });

 let unitRotate = $derived(() => {
  const unit = deployedUnit();
  if (!unit) return false;
  return (myPlayerNumber === 1 && unit === 'cavalry') || (myPlayerNumber === 2 && unit === 'cannon');
 });
</script>

<Help player={myPlayer()} autoOpen={helpKey}>
     <p class="text-xl">{@html selectedUnit ? m.deploy_place_unit() : m.deploy_select_unit()}</p>  
     <img
      class="w-30 h-auto mx-auto"
      srcset={optimize(selectedUnit ? "/img/bonus_loc.png" : "/img/bonus_unit.png")}
      alt=""
     />
</Help>

{#if introDone}
{#if $gameSession}
 <div class="flex flex-col items-center pt-16">
  {#if selected()}
   <Map
    playerFilter={myPlayerNumber}
    onSlotSelect={handleSlotSelect}
    selectedSlotId={selectedSlot?.id}
    unitImage={unitImage()}
    unitRotate={unitRotate()}
    classes=""
   />

   {#if deployingLocation}
    <Loader classes="mt-4" />
   {:else if !locationSelected}
    <Button
     text={m.confirm()}
     disabled={!selectedSlot}
     onclick={handleDeployLocation}
     classes="!text-2xl !h-12 min-w-auto mt-4"
    />
   {:else}
    <p class="text-xl text-center mt-4">{m.waiting_for_opponent()}</p>
    <div class="flex flex-col items-center mt-2">
     <HourglassIcon />
    </div>    
   {/if}
  {:else}
   {#each units() as unit}
    {@const disabled = usedUnits().includes(unit.id)}
    <button
     class="flex flex-col items-center cursor-pointer px-10 py-4 {disabled
      ? 'grayscale opacity-70 pointer-events-none'
      : ''}"
     onclick={() => (selectedUnit = unit.id)}
     {disabled}
    >
     <img
      class="{unit.size} mb-2 p-1.5 transition-all {selectedUnit === unit.id
       ? 'scale-105'
       : ''}"
      style={selectedUnit === unit.id ? myStrokeStyle() : ""}
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
{:else}
 <button ondblclick={() => { introDone = true; startTimer(); }}>
  <LookTV />
 </button>
{/if}



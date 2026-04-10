<script>
 import { onMount } from "svelte";
 import {
  sessionId,
  gameSession,
  playerCode,
 } from "$lib/stores/gameSession.js";
 import { m } from "$lib/paraglide/messages.js";
 import { strokeStyle } from "$lib/constants.js";
 import { playSound, preloadSound } from "$lib/audio.js";


 import PlayerBust from "$components/PlayerBust.svelte";
 import Button from "$components/Button.svelte";
 import Loader from "$components/Loader.svelte";
 import Map from "$components/Map.svelte";
 import Help from "$components/Help.svelte";
 import LookTV from "$components/LookTV.svelte";
 import HourglassIcon from "$components/HourglassIcon.svelte";

 // Get current player's data
 let myPlayer = $derived.by(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_1
   : $gameSession.player_2;
 });

 let myPlayerNumber = $derived($playerCode === "code_1" ? 1 : 2);

 let myStrokeStyle = $derived.by(() => strokeStyle(myPlayer?.bust));

 let deploying = $state(false);
 let selectedUnit = $state(null);

 let selected = $derived.by(() => {
  if (!$gameSession) return false;
  const unitKey = $playerCode === "code_1" ? "unit_1" : "unit_2";
  const round = $gameSession.current_round || 1;
  const roundData = $gameSession[`round_${round}`];
  return !!roundData?.[unitKey];
 });

 let usedUnits = $derived.by(() => {
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

 let units = $derived.by(() => {
  const bust = myPlayer?.bust;
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

 // introDone becomes true once TV notification is dismissed (help_open true → false)
 let helpOpenSeen = $state(false);
 let introDone = $derived(helpOpenSeen && !$gameSession?.help_open);
 let dingPlayed = false;

  onMount(() => {
  preloadSound('/sounds/ding.mp3');
  preloadSound('/sounds/piece-move.mp3');
 });

 $effect(() => {
  if ($gameSession?.help_open) helpOpenSeen = true;
 });

 $effect(() => {
  if (introDone && !dingPlayed) {
   dingPlayed = true;
   playSound('/sounds/ding.mp3');
  }
 });

 function handleSlotSelect(slot) {
  selectedSlot = slot;
  playSound('/sounds/piece-move.mp3');
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

 let deployedUnit = $derived.by(() => {
  if (!$gameSession) return null;
  const unitKey = $playerCode === "code_1" ? "unit_1" : "unit_2";
  const round = $gameSession.current_round || 1;
  const roundData = $gameSession[`round_${round}`];
  return roundData?.[unitKey] || null;
 });

 let unitImage = $derived.by(() => {
  const unit = deployedUnit;
  const bust = myPlayer?.bust;
  if (!unit || !bust) return null;
  return `/img/unit_${bust}_${unit}.webp`;
 });

 let unitRotate = $derived.by(() => {
  const unit = deployedUnit;
  if (!unit) return false;
  return (myPlayerNumber === 1 && unit === 'cavalry') || (myPlayerNumber === 2 && unit === 'cannon');
 });
</script>

<svelte:head>
  <link rel="preload" href="/img/bonus_loc.webp" as="image" />
  <link rel="preload" href="/img/bonus_unit.webp" as="image" />
</svelte:head>

{#key selected}
<Help player={myPlayer} autoOpen={introDone}>
     {@html selected ? m.deploy_place_unit() : m.deploy_select_unit()}
</Help>
{/key}

{#if introDone}
{#if $gameSession}
 <div class="flex flex-col items-center pt-10">
  {#if selected}
   <Map
    playerFilter={myPlayerNumber}
    onSlotSelect={handleSlotSelect}
    selectedSlotId={selectedSlot?.id}
    unitImage={unitImage}
    unitRotate={unitRotate}
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
   {#each units as unit}
    {@const disabled = usedUnits.includes(unit.id)}
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
      style={selectedUnit === unit.id ? myStrokeStyle : ""}
      src={`/img/${unit.img}.webp`}
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
 <LookTV />
{/if}



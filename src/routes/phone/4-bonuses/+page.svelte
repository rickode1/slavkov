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
 import { startTimer, stopTimer } from "$lib/stores/timer.js";


 import PlayerBust from "$components/PlayerBust.svelte";
 import Card from "$components/Card.svelte";
 import Button from "$components/Button.svelte";
 import Loader from "$components/Loader.svelte";
 import Help from "$components/Help.svelte";
 import LookTV from "$components/LookTV.svelte";
 import HourglassIcon from "$components/HourglassIcon.svelte";

 let introDone = $state(false);

 // Get current player's data
 let myPlayer = $derived(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_1
   : $gameSession.player_2;
 });

 let myPlayerNumber = $derived($playerCode === "code_1" ? 1 : 2);

 let strokeSmStyle = $derived(() => strokeStyle(myPlayer()?.bust, 3));

 let usedBonuses = $derived(() => {
  if (!$gameSession) return { def: 0, dmg: 0, life: 0 };
  const suffix = $playerCode === "code_1" ? "_1" : "_2";
  const round = $gameSession.current_round || 1;
  const used = { def: 0, dmg: 0, life: 0 };
  for (let i = 1; i < round; i++) {
   const rd = $gameSession[`round_${i}`];
   if (!rd) continue;
   used.def += rd[`bonuses_def${suffix}`] || 0;
   used.dmg += rd[`bonuses_dmg${suffix}`] || 0;
   used.life += rd[`bonuses_life${suffix}`] || 0;
  }
  return used;
 });

 let cardGroups = $derived(() => {
  const player = myPlayer();
  if (!player) return [];
  const types = ["def", "dmg", "life"];
  const used = usedBonuses();
  return types
   .map((type) => {
    const count = parseInt(player[type]) || 0;
    const usedCount = used[type] || 0;
    return Array.from({ length: count }, (_, i) => ({
     type,
     value: 1,
     id: `${type}_${i}`,
     disabled: i < usedCount,
    }));
   })
   .filter((group) => group.length > 0);
 });

 let selectedCards = $state(new Set());
 let submitting = $state(false);
 let submitted = $state(false);

 // Timer: 30s to choose bonuses
 onMount(() => {
  const session = $gameSession;
  let bonusCount = 0;
  if (session) {
   const round = session.current_round || 1;
   const rd = session[`round_${round}`] || {};
   for (const suffix of ['_1', '_2']) {
    if (rd[`bonus_unit${suffix}`] > 0) bonusCount++;
    if (rd[`bonus_loc${suffix}`] !== 0 && rd[`bonus_loc${suffix}`] !== undefined) bonusCount++;
   }
  }

  const delay = bonusCount > 0
   ? 4000 + 8000 + (bonusCount * 1000)
   : 12000;

  setTimeout(() => {
   introDone = true;
   startTimer();
  }, delay);
 });
 onDestroy(() => stopTimer());

 function toggleCard(id) {
  const next = new Set(selectedCards);
  if (next.has(id)) {
   next.delete(id);
  } else {
   next.add(id);
  }
  selectedCards = next;
 }

 let hasSelection = $derived(selectedCards.size > 0);

 $effect(() => {
  if (introDone) new Audio('/sounds/ding.mp3').play().catch(() => {});
 });

 async function postBonuses(counts) {
  return fetch("/api/session/bonuses", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    sessionId: $sessionId,
    playerCode: $playerCode,
    bonuses: counts,
   }),
  });
 }

 async function submitBonuses() {
  if (submitting) return;
  stopTimer();
  submitting = true;

  // Count selected cards per type
  const counts = { def: 0, dmg: 0, life: 0 };
  for (const id of selectedCards) {
   const type = id.split("_")[0];
   if (type in counts) counts[type]++;
  }

  try {
   const response = await postBonuses(counts);
   if (!response.ok) {
    console.error("Failed to save bonuses");
   } else {
    submitted = true;
    setTimeout(() => postBonuses(counts).catch(() => {}), 2000);
   }
  } catch (error) {
   console.error("Error saving bonuses:", error);
  } finally {
   submitting = false;
  }
 }
</script>

<Help player={myPlayer()} autoOpen={introDone}>
  <p class="text-xl">{m.pick_bonuses_mobile()}</p>
</Help>

{#if introDone}
{#if $gameSession}
 <div class="pt-16 pb-6 w-full">
 {#if cardGroups().length === 0}
  <p class="text-xl text-center mt-4">{m.no_bonuses()}</p>
 {:else}
  {#each cardGroups() as group, gi}
   <div class="flex flex-wrap items-start w-full gap-1 mt-2">
    {#each group as card}
     <Card
      type={card.type}
      value={card.value}
      small
      selected={selectedCards.has(card.id)}
      disabled={card.disabled}
      strokeStyle={strokeSmStyle()}
      onclick={() => !card.disabled && toggleCard(card.id)}
     />
    {/each}
   </div>
  {/each}
 {/if}
 </div>

 {#if !submitted}
  {#if submitting}
   <Loader classes="mt-4" />
  {:else}
   <Button
    text={m.confirm()}
    onclick={submitBonuses}
    classes="!text-2xl !h-12 min-w-auto mt-4"
   />
  {/if}
 {:else}
    <p class="text-xl text-center mt-4">{m.waiting_for_opponent()}</p>
    <div class="flex flex-col items-center gap-3 mt-2">
     <HourglassIcon />
    </div>  
 {/if}

{/if}
{:else}
 <button ondblclick={() => { introDone = true; startTimer(); }}>
  <LookTV />
 </button>
{/if}

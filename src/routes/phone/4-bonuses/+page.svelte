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


 import Card from "$components/Card.svelte";
 import Button from "$components/Button.svelte";
 import Loader from "$components/Loader.svelte";
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

 let strokeSmStyle = $derived.by(() => strokeStyle(myPlayer?.bust, 3));

 let usedBonuses = $derived.by(() => {
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

 let cardGroups = $derived.by(() => {
  const player = myPlayer;
  if (!player) return [];
  const types = ["def", "dmg", "life"];
  const used = usedBonuses;
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

 // introDone becomes true once TV notification is dismissed (help_open true → false)
 let helpOpenSeen = $state(false);
 let introDone = $derived(helpOpenSeen && !$gameSession?.help_open);
 let dingPlayed = false;

 // Timer: 30s to choose bonuses
 onMount(() => {
  preloadSound('/sounds/ding.mp3');
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

<Help player={myPlayer} autoOpen={introDone}>
  <p class="text-lg text-center">{m.pick_bonuses_mobile()}</p>
</Help>

{#if introDone}
{#if $gameSession}
 <div class="pt-16 pb-6 w-full">
 {#if cardGroups.length === 0}
  <p class="text-xl text-center mt-4">{m.no_bonuses()}</p>
 {:else}
  {#each cardGroups as group, gi}
   <div class="flex flex-wrap items-start w-full gap-1 mt-2">
    {#each group as card}
     <Card
      type={card.type}
      value={card.value}
      small
      selected={selectedCards.has(card.id)}
      disabled={card.disabled}
      strokeStyle={strokeSmStyle}
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
 <LookTV />
{/if}

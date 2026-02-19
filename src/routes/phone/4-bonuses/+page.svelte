<script>
 import {
  sessionId,
  gameSession,
  playerCode,
 } from "$lib/stores/gameSession.js";
 import { optimize } from "$lib/image";
 import * as m from "$lib/paraglide/messages";

 import PlayerBust from "$components/PlayerBust.svelte";
 import Card from "$components/Card.svelte";
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

 let strokeSmStyle = $derived(() => {
  const bust = myPlayer()?.bust;
  if (!bust) return "";
  const c = `var(--color-bust-${bust}-dark)`;
  return `filter: drop-shadow(3px 0 0 ${c}) drop-shadow(0 3px 0 ${c}) drop-shadow(-3px 0 0 ${c}) drop-shadow(0 -3px 0 ${c})`;
 });

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
   const response = await fetch("/api/session/bonuses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     sessionId: $sessionId,
     playerCode: $playerCode,
     bonuses: counts,
    }),
   });
   if (!response.ok) {
    console.error("Failed to save bonuses");
   } else {
    submitted = true;
   }
  } catch (error) {
   console.error("Error saving bonuses:", error);
  } finally {
   submitting = false;
  }
 }
</script>

{#if $gameSession}
 <div class="w-full flex justify-between items-center gap-x-8">
  <p class="text-2xl text-left">
   {m.pick_bonuses()}
  </p>
  <PlayerBust player={myPlayer()} />
 </div>

 {#each cardGroups() as group, gi}
  <div class="flex flex-wrap items-start w-full gap-1 mt-4">
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

 {#if !submitted}
  {#if submitting}
   <Loader classes="mt-4" />
  {:else}
   <Button
    text={m.confirm()}
    disabled={!hasSelection}
    onclick={submitBonuses}
    classes="!text-2xl !h-12 min-w-auto mt-4"
   />
  {/if}
 {/if}
{/if}

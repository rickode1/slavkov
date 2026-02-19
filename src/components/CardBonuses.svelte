<script>
 import { gameSession } from "$lib/stores/gameSession.js";
 import Card from "$components/Card.svelte";

 let { playerCode = "code_1" } = $props();

 let suffix = $derived(playerCode === "code_1" ? "_1" : "_2");

 let roundData = $derived(() => {
  if (!$gameSession) return null;
  const round = $gameSession.current_round || 1;
  return $gameSession[`round_${round}`] || null;
 });

 let battleRow = $derived(() => {
  const rd = roundData();
  if (!rd) return [];
  const cards = [];
  if (rd[`bonus_unit${suffix}`] !== undefined)
   cards.push({ type: "unit", value: rd[`bonus_unit${suffix}`] });
  if (rd[`bonus_loc${suffix}`] !== undefined)
   cards.push({ type: "loc", value: rd[`bonus_loc${suffix}`] });
  return cards;
 });

 let bonusRow = $derived(() => {
  const rd = roundData();
  if (!rd) return [];
  const cards = [];
  for (let i = 0; i < (rd[`bonuses_def${suffix}`] || 0); i++)
   cards.push({ type: "def", value: 1 });
  for (let i = 0; i < (rd[`bonuses_dmg${suffix}`] || 0); i++)
   cards.push({ type: "dmg", value: 1 });
  for (let i = 0; i < (rd[`bonuses_life${suffix}`] || 0); i++)
   cards.push({ type: "life", value: 1 });
  return cards;
 });

 function groupCards(cards) {
  const groups = [];
  const seen = new Map();
  for (const card of cards) {
   if (!seen.has(card.type)) {
    const group = { type: card.type, items: [] };
    groups.push(group);
    seen.set(card.type, group);
   }
   seen.get(card.type).items.push(card);
  }
  return groups;
 }
</script>

<div class="flex flex-col mt-2 gap-1">
 {#if battleRow().length > 0}
  <div class="flex gap-1">
   {#each groupCards(battleRow()) as group, gi}
    <div class="relative card-drop" style="animation-delay: {gi * 0.15}s">
     {#each group.items as bonus, i}
      <div
       class={i > 0 ? "absolute" : "relative"}
       style="{i > 0 ? `left: ${i * 6}px; top: ${i * 4}px;` : ''} z-index: {i}"
      >
       <Card type={bonus.type} value={bonus.value} />
      </div>
     {/each}
    </div>
   {/each}
  </div>
 {/if}
 {#if bonusRow().length > 0}
  <div class="flex gap-1">
   {#each groupCards(bonusRow()) as group, gi}
    <div class="relative card-drop" style="animation-delay: {gi * 0.15}s">
     {#each group.items as bonus, i}
      <div
       class={i > 0 ? "absolute" : "relative"}
       style="{i > 0 ? `left: ${i * 2}px; top: ${i * 1}px;` : ''} z-index: {i}"
      >
       <Card type={bonus.type} value={i === group.items.length - 1 ? group.items.length : bonus.value} />
      </div>
     {/each}
    </div>
   {/each}
  </div>
 {/if}
</div>

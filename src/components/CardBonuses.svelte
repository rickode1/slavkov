<script>
 import { gameSession } from "$lib/stores/gameSession.js";
 import Card from "$components/Card.svelte";

 let { playerCode = "code_1", animated = true, hideBonuses = false } = $props();

 let suffix = $derived(playerCode === "code_1" ? "_1" : "_2");

 let roundData = $derived(() => {
  if (!$gameSession) return null;
  const round = $gameSession.current_round || 1;
  return $gameSession[`round_${round}`] || null;
 });

 let allCards = $derived(() => {
  const rd = roundData();
  if (!rd) return [];
  const cards = [];
  if (rd[`bonus_unit${suffix}`] !== undefined)
   cards.push({ type: "unit", value: rd[`bonus_unit${suffix}`] });
  if (rd[`bonus_loc${suffix}`] !== undefined)
   cards.push({ type: "loc", value: rd[`bonus_loc${suffix}`] });
  if (!hideBonuses) {
   for (let i = 0; i < (rd[`bonuses_def${suffix}`] || 0); i++)
    cards.push({ type: "def", value: 1 });
   for (let i = 0; i < (rd[`bonuses_dmg${suffix}`] || 0); i++)
    cards.push({ type: "dmg", value: 1 });
   for (let i = 0; i < (rd[`bonuses_life${suffix}`] || 0); i++)
    cards.push({ type: "life", value: 1 });
   if (rd[`bonus_minigame_dmg${suffix}`] !== undefined)
    cards.push({ type: "minigame_dmg", value: rd[`bonus_minigame_dmg${suffix}`] });
   if (rd[`bonus_minigame_def${suffix}`] !== undefined)
    cards.push({ type: "minigame_def", value: rd[`bonus_minigame_def${suffix}`] });
  }
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

 let grouped = $derived(() => {
  const groups = groupCards(allCards());
  // Show total on top card for stacked bonus cards
  return groups.map((g) => ({
   ...g,
   displayValue: g.items.length > 1 ? g.items.length : g.items[0]?.value,
  }));
 });

 let rows = $derived(() => {
  const g = grouped();
  const result = [];
  for (let i = 0; i < g.length; i += 2) {
   result.push(g.slice(i, i + 2));
  }
  return result;
 });
</script>

<div class="flex flex-col mt-2 gap-1">
 {#each rows() as row}
  <div class="flex gap-1">
   {#each row as group, gi}
    <div class="relative {animated ? 'card-drop' : ''}" style="{animated ? `animation-delay: ${gi * 0.15}s` : ''}">
     {#each group.items as bonus, i}
      <div
       class={i > 0 ? "absolute" : "relative"}
       style="{i > 0 ? `right: ${i * 2}px; bottom: ${i * 2}px;` : ''} z-index: {i}"
      >
       <Card type={bonus.type} value={i === group.items.length - 1 ? group.displayValue : bonus.value} />
      </div>
     {/each}
    </div>
   {/each}
  </div>
 {/each}
</div>

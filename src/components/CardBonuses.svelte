<script>
 import { gameSession } from "$lib/stores/gameSession.js";
 import { strokeStyle as makeStroke } from "$lib/constants.js";
 import Card from "$components/Card.svelte";

 /**
  * animated: true  → all cards animate
  *           false → no cards animate
  *           string[] → only cards whose type is in the array animate
  */
 let { playerCode = "code_1", animated = true, hideBonuses = false, highlightTypes = null } = $props();

 // Stable rotations: generated once per component instance, indexed by card slot.
 const ROTATIONS = Array.from({ length: 32 }, () => (Math.random() - 0.5) * 4);

 function isAnimated(type) {
  if (animated === true) return true;
  if (!animated) return false;
  return Array.isArray(animated) && animated.includes(type);
 }

 let playerBust = $derived(
  $gameSession?.[playerCode === "code_1" ? "player_1" : "player_2"]?.bust
 );
 let highlightStroke = $derived(makeStroke(playerBust, 3));

 let suffix = $derived(playerCode === "code_1" ? "_1" : "_2");

 let roundData = $derived(() => {
  if (!$gameSession) return null;
  const round = $gameSession.current_round || 1;
  return $gameSession[`round_${round}`] || null;
 });

 let lifeUsed = $derived(() => {
  const rd = roundData();
  return rd?.[`life_used${suffix}`] || 0;
 });

 let allCards = $derived(() => {
  const rd = roundData();
  if (!rd) return [];
  const cards = [];
  const rot = (idx) => ROTATIONS[idx % ROTATIONS.length];
  let idx = 0;
  if (rd[`bonus_unit${suffix}`] !== undefined)
   cards.push({ type: "unit", value: rd[`bonus_unit${suffix}`], disabled: false, rot: rot(idx++) });
  if (rd[`bonus_loc${suffix}`] !== undefined)
   cards.push({ type: "loc", value: rd[`bonus_loc${suffix}`], disabled: false, rot: rot(idx++) });
  if (!hideBonuses) {
   for (let i = 0; i < (rd[`bonuses_def${suffix}`] || 0); i++)
    cards.push({ type: "def", value: 1, disabled: false, rot: rot(idx++) });
   for (let i = 0; i < (rd[`bonuses_dmg${suffix}`] || 0); i++)
    cards.push({ type: "dmg", value: 1, disabled: false, rot: rot(idx++) });
   const lifeCount = rd[`bonuses_life${suffix}`] || 0;
   const used = lifeUsed();
   for (let i = 0; i < lifeCount; i++)
    cards.push({ type: "life", value: 1, disabled: i < used, rot: rot(idx++) });
  }
  if (rd[`bonus_minigame_dmg${suffix}`] !== undefined)
   cards.push({ type: "minigame_dmg", value: rd[`bonus_minigame_dmg${suffix}`], disabled: false, rot: rot(idx++) });
  if (rd[`bonus_minigame_def${suffix}`] !== undefined)
   cards.push({ type: "minigame_def", value: rd[`bonus_minigame_def${suffix}`], disabled: false, rot: rot(idx++) });
  return cards;
 });

 function groupCards(cards) {
  const groups = [];
  const seen = new Map();
  for (const card of cards) {
   // Life cards are shown individually, not stacked
   if (card.type === 'life') {
    groups.push({ type: card.type, items: [card] });
    continue;
   }
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
  return groups.map((g) => {
   const active = g.items.filter((c) => !c.disabled).length;
   return {
    ...g,
    displayValue: g.items.length > 1 ? active : g.items[0]?.value,
    allDisabled: active === 0,
   };
  });
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

<div class="flex flex-col mt-2 gap-1 w-49">
 {#each rows() as row}
  <div class="flex gap-1">
   {#each row as group, gi}
    <div class="relative {isAnimated(group.type) ? 'card-drop' : ''}" style="{isAnimated(group.type) ? `animation-delay: ${gi * 0.15}s` : ''}">
     {#each group.items as bonus, i}
      <div
       class={i > 0 ? "absolute" : "relative"}
       style="{i > 0 ? `right: ${i * 2}px; bottom: ${i * 2}px;` : ''} z-index: {i}; transform: rotate({bonus.rot}deg);"
      >
       <Card type={bonus.type} value={i === group.items.length - 1 ? group.displayValue : bonus.value} highlighted={!group.allDisabled && highlightTypes?.has(bonus.type)} disabled={group.allDisabled} strokeStyle={highlightStroke} />
      </div>
     {/each}
    </div>
   {/each}
  </div>
 {/each}
</div>

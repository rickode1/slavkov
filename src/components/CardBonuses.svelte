<script>
 import Card from "$components/Card.svelte";

 let { bonuses = [] } = $props();

 let grouped = $derived(() => {
  const groups = [];
  const seen = new Map();
  for (const bonus of bonuses) {
   if (!seen.has(bonus.type)) {
    const group = { type: bonus.type, items: [] };
    groups.push(group);
    seen.set(bonus.type, group);
   }
   seen.get(bonus.type).items.push(bonus);
  }
  return groups;
 });
</script>

<div class="flex flex-col mt-2">
 {#each grouped() as group, gi}
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

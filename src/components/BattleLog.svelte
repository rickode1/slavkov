<script>
 import { optimize } from "$lib/image";
 import { gameSession } from "$lib/stores/gameSession.js";
 import { fade } from "svelte/transition";
 import * as m from "$lib/paraglide/messages.js";

 let { playerNumber } = $props();

 let playerKey = $derived(`player_${playerNumber}`);
 let playerNick = $derived($gameSession?.[playerKey]?.nick || '');

 let roundData = $derived(() => {
  if (!$gameSession) return null;
  const round = $gameSession.current_round || 1;
  return $gameSession[`round_${round}`] || null;
 });

 let log = $derived(() => {
  const rd = roundData();
  if (!rd?.turns) return [];
  return Object.values(rd.turns)
   .filter((t) => t.player === playerNumber && t.roll != null)
   .map((t) => ({
    role: t.role,
    difficulty: t.difficulty,
    roll: t.roll,
    success: t.roll > t.difficulty,
    unit_retry: t.unit_retry || false,
    life_retry: t.life_retry || false,
   }));
 });

 let visibleCount = $state(0);
 let lastLogLength = $state(0);

 $effect(() => {
  const entries = log();
  if (entries.length > lastLogLength) {
   // New entries added — reveal them one by one with 2s delay
   const newCount = entries.length - lastLogLength;
   for (let i = 0; i < newCount; i++) {
    const target = lastLogLength + i + 1;
    setTimeout(() => {
     visibleCount = target;
    }, (i + 1) * 2000);
   }
   lastLogLength = entries.length;
  } else if (entries.length < lastLogLength) {
   // Reset (e.g. new round)
   visibleCount = 0;
   lastLogLength = 0;
  }
 });

 let visibleLog = $derived(log().slice(0, visibleCount));
</script>

<div class="relative z-10 w-80 flex flex-col gap-3 shrink-0 max-h-123 overflow-y-auto scrollbar-thin">
 {#each visibleLog as entry}
  <div class="flex flex-col gap-1 px-4 py-2" transition:fade={{ duration: 400 }}>
   <div class="flex items-center gap-3">
    <span class="text-base w-15 shrink-0">
     {entry.role === 'dmg' ? m.battle_attack() : m.battle_defense()}
    </span>
    <span class="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white text-base shrink-0 lining-nums font-mono">
     {entry.difficulty}
    </span>
    <span class="relative flex items-center justify-center h-14 w-14 shrink-0">
     <img class="h-14 w-14 object-contain" srcset={optimize("/img/dice.png")} alt="" />
     <span class="absolute inset-0 flex items-center justify-center text-sm mb-2">{entry.roll}</span>
    </span>
    {#if entry.unit_retry}
     <span class="text-base ml-1">
      <span class="line-through opacity-60">{m.battle_failure()}</span><br>
      {m.card_unit()}
     </span>
    {:else if entry.life_retry}
     <span class="text-base ml-1">
      <span class="line-through opacity-60">{m.battle_failure()}</span><br>
      {m.card_life()}
     </span>
    {:else}
     <span class="text-base ml-1">
      {entry.success ? m.battle_success() : m.battle_failure()}
     </span>
    {/if}
   </div>
  </div>
 {/each}
</div>

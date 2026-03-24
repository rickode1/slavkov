<script>
 import { fly, slide } from 'svelte/transition';
 import { m } from '$lib/paraglide/messages.js';

 let {
  attackerNum = 1,       // which player (1|2) is the attacker (dmg)
  activeRole = 'dmg',    // 'dmg' | 'def' — whose turn it currently is
  player1 = null,
  player2 = null,
  unit1Img = null,
  unit2Img = null,
  dmgDifficulty = 10,
  dmgRoll = null,
  dmgOutcome = null,
  defDifficulty = null,
  defRoll = null,
  defOutcome = null,
  bonusText = null,
 } = $props();

 // P1 (left side)
 let p1Role = $derived(attackerNum === 1 ? 'dmg' : 'def');
 let p1IsActive = $derived(p1Role === activeRole);
 let p1Roll = $derived(p1Role === 'dmg' ? dmgRoll : defRoll);
 let p1Difficulty = $derived(p1Role === 'dmg' ? dmgDifficulty : defDifficulty);
 let p1Outcome = $derived(p1Role === 'dmg' ? dmgOutcome : defOutcome);
 let p1ShowDice = $derived(p1IsActive || p1Roll != null);
 let p1ShowAction = $derived(p1IsActive || p1Roll != null);
 let p1ClipActive = $derived(p1IsActive && p1Roll == null);
 let p1ActionIcon = $derived(p1Role === 'dmg' ? 'bonus_dmg.webp' : 'bonus_def.webp');
 let p1ActionText = $derived(p1Role === 'dmg' ? 'Útočí!' : 'Brání se!');
 let p1DiceStyle = $derived(
  p1Outcome === 'success'
   ? 'filter: drop-shadow(0 0 3px gold) drop-shadow(0 0 6px goldenrod)'
   : p1Outcome === 'fail'
   ? 'filter: drop-shadow(0 0 3px #111) drop-shadow(0 0 6px #000)'
   : 'filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4))'
 );
 let p1ResultLabel = $derived(
  p1Outcome === 'success' ? m.battle_roll_success() : p1Outcome === 'fail' ? m.battle_roll_fail() : m.battle_roll_minimum()
 );

 // P2 (right side)
 let p2Role = $derived(attackerNum === 2 ? 'dmg' : 'def');
 let p2IsActive = $derived(p2Role === activeRole);
 let p2Roll = $derived(p2Role === 'dmg' ? dmgRoll : defRoll);
 let p2Difficulty = $derived(p2Role === 'dmg' ? dmgDifficulty : defDifficulty);
 let p2Outcome = $derived(p2Role === 'dmg' ? dmgOutcome : defOutcome);
 let p2ShowDice = $derived(p2IsActive || p2Roll != null);
 let p2ShowAction = $derived(p2IsActive || p2Roll != null);
 let p2ClipActive = $derived(p2IsActive && p2Roll == null);
 let p2ActionIcon = $derived(p2Role === 'dmg' ? 'bonus_dmg.webp' : 'bonus_def.webp');
 let p2ActionText = $derived(p2Role === 'dmg' ? 'Útočí!' : 'Brání se!');
 let p2DiceStyle = $derived(
  p2Outcome === 'success'
   ? 'filter: drop-shadow(0 0 3px gold) drop-shadow(0 0 6px goldenrod)'
   : p2Outcome === 'fail'
   ? 'filter: drop-shadow(0 0 3px #111) drop-shadow(0 0 6px #000)'
   : 'filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4))'
 );
 let p2ResultLabel = $derived(
  p2Outcome === 'success' ? m.battle_roll_success() : p2Outcome === 'fail' ? m.battle_roll_fail() : m.battle_roll_minimum()
 );

 let bust1Color = $derived(`var(--color-bust-${player1?.bust}-dark)`);
 let bust2Color = $derived(`var(--color-bust-${player2?.bust}-dark)`);
</script>

<article class="relative w-full">
 <div class="flex rounded-lg duration-300 border border-black/10 shadow-sm bg-white/10 overflow-hidden">

  <!-- Player 1 (left) -->
  <div class="text-white py-2 pl-3 pr-5 flex items-center shrink-0 self-stretch transition-[clip-path] duration-400"
   style="background-color: {bust1Color}; clip-path: polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)">
   <div class="flex flex-col justify-center gap-1">
    {#if unit1Img}
     <img class="h-14 w-auto object-contain transition-all" src={unit1Img} alt="" />
    {/if}
    <div class="font-bold text-sm text-center">{player1?.nick || ''}</div>
   </div>
   <div class="overflow-hidden transition-[max-width] duration-400 {p1ShowAction ? 'max-w-20' : 'max-w-0'}">
    <div class="flex flex-col items-center ml-4 w-14 shrink-0">
     <img alt="" class="h-8 w-auto shrink-0 mb-1" src="/img/{p1ActionIcon}" style="filter: brightness(0) invert(1)">
     <span class="text-sm whitespace-nowrap">{p1ActionText}</span>
    </div>
   </div>
  </div>

  <!-- P1 dice -->
  {#if p1ShowDice}
   <div class="flex flex-col items-center text-center leading-[1] w-30 shrink-0 py-2">
    <span class="text-sm h-4 flex items-center mb-1">{p1ResultLabel}</span>
    <div class="relative flex items-center justify-center">
     <img alt="" class="h-14 w-auto shrink-0" src="/img/dice.webp" style={p1DiceStyle}>
     <span class="text-sm font-bold absolute bottom-[1.45rem] lining-nums font-mono text-black/90">{p1Roll ?? p1Difficulty}</span>
    </div>
   </div>
  {/if}

  <div class="flex-1"></div>

  <!-- P2 dice -->
  {#if p2ShowDice}
   <div class="flex flex-col items-center text-center leading-[1] w-30 shrink-0 py-2">
    <span class="text-sm h-4 flex items-center mb-1">{p2ResultLabel}</span>
    <div class="relative flex items-center justify-center">
     <img alt="" class="h-14 w-auto shrink-0" src="/img/dice.webp" style={p2DiceStyle}>
     <span class="text-sm font-bold absolute bottom-[1.45rem] lining-nums font-mono text-black/90">{p2Roll ?? p2Difficulty}</span>
    </div>
   </div>
  {/if}

  <!-- Player 2 (right) -->
  <div class="text-white py-2 pr-3 pl-5 flex items-center shrink-0 self-stretch transition-[clip-path] duration-400"
   style="background-color: {bust2Color}; clip-path: polygon(10% 0%, 100% 0%, 100% 100%, 10% 100%, 0% 50%)">
   <div class="overflow-hidden transition-[max-width] duration-400 {p2ShowAction ? 'max-w-20' : 'max-w-0'}">
    <div class="flex flex-col items-center mr-4 w-14 shrink-0">
     <img alt="" class="h-8 w-auto shrink-0 mb-1" src="/img/{p2ActionIcon}" style="filter: brightness(0) invert(1)">
     <span class="text-sm whitespace-nowrap">{p2ActionText}</span>
    </div>
   </div>
   <div class="flex flex-col justify-center gap-1">
    {#if unit2Img}
     <img class="h-14 w-auto object-contain transition-all" src={unit2Img} alt="" />
    {/if}
    <div class="font-bold text-sm text-center">{player2?.nick || ''}</div>
   </div>
  </div>

 </div>

 {#if bonusText}
  <div transition:slide={{ duration: 300 }} class="rounded-b-lg border border-black/10 shadow-sm bg-white/50 overflow-hidden py-2 px-3 w-2/3 mx-auto -mt-px text-center text-lg">
   {@html bonusText}
  </div>
 {/if}
</article>
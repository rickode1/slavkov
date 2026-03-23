<script>
 import {m} from "$lib/paraglide/messages.js";

 let { base, bonus, type, active = false, iconSrc, bust = null } = $props();

 let activeBg = $derived(bust ? `var(--color-bust-${bust}-dark)` : '#166534cc');
 let minimum = $derived(20 - base - bonus);
</script>

<div
 class="flex items-center justify-between gap-2.5 rounded-lg pl-3 pr-5 py-1.5 transition-colors duration-300"
 style={active ? `background-color: ${activeBg}; color: white` : ''}
>

 <div class="flex flex-col items-center min-w-15">
  <img src={iconSrc} alt="" class="h-12 w-auto shrink-0 transition-[filter] duration-300 mb-1" style={active ? 'filter: brightness(0) invert(1)' : ''} />

  <span>{ type == 'dmg' ? m.battle_attack() : m.battle_defense()}</span>
 </div>

 <div class="flex gap-x-2 items-center">
  <div class="flex flex-col items-center leading-none ml-2">
   <span class="lining-nums font-mono text-2xl">{base}</span>
   <span class="text-xs">{m.battle_base()}</span>
  </div>

  <span class="text-base">+</span>

  <div class="flex flex-col items-center leading-none">
   <span class="lining-nums font-mono text-2xl">{bonus}</span>
   <span class="text-xs">{m.battle_bonus()}</span>
  </div>
 </div>

 <div class="flex flex-col items-center leading-none ml-2">
  <span class="lining-nums font-mono text-3xl">{minimum}</span>
  <span class="text-sm text-center leading-[1.1]">{@html m.battle_roll_difficulty()}</span>
 </div>
</div>

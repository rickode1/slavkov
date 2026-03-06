<script>
 import { optimize } from "$lib/image";
 import * as m from "$lib/paraglide/messages.js";

 let { base, bonus, active = false, iconSrc, bust = null } = $props();

 let activeBg = $derived(bust ? `var(--color-bust-${bust}-dark)` : '#166534cc');
</script>

<div
 class="flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors duration-300"
 style={active ? `background-color: ${activeBg}; color: white` : ''}
>
 <img srcset={optimize(iconSrc)} alt="" class="h-10 w-auto shrink-0 transition-[filter] duration-300" style={active ? 'filter: brightness(0) invert(1)' : ''} />
 <div class="flex flex-col items-center leading-none">
  <span class="lining-nums font-mono text-2xl">{base}</span>
  <span class="text-xs">{m.battle_base()}</span>
 </div>
 <span class="text-base">+</span>
 <div class="flex flex-col items-center leading-none">
  <span class="lining-nums font-mono text-2xl">{bonus}</span>
  <span class="text-xs">{m.battle_bonus()}</span>
 </div>
</div>

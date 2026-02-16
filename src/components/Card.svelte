<script>
 import { optimize } from "$lib/image";
 import * as m from "$lib/paraglide/messages.js";

 let {
  type,
  value = 0,
  small = false,
  selected = false,
  disabled = false,
  onclick = null,
 } = $props();

 let title = $derived(m[`card_${type}`]?.() ?? type);
 let illustration = $derived(`/img/bonus_${type}.png`);

 let valueLabel = $derived(value > 0 ? `+${value}` : `${value}`);
</script>

{#if value !== 0}
 <button
  type="button"
  class="relative inline-flex flex-col items-center {small
   ? 'w-20'
   : 'w-24'} {onclick && !disabled ? 'cursor-pointer' : ''} {selected
   ? 'stroke-sm'
   : ''} {disabled ? 'opacity-40 grayscale pointer-events-none' : ''}"
  onclick={disabled ? null : onclick}
  {disabled}
 >
  <img
   srcset={optimize("/img/card_bg.png")}
   alt=""
   class="w-full h-full block"
  />

  <div
   class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-1.5"
  >
   <img
    srcset={optimize(illustration)}
    alt=""
    class="{small ? 'h-13' : 'h-15'} w-auto object-contain mix-blend-multiply"
   />

   <div class="flex flex-col items-center">
    {#if type !== "unit"}
     <strong class="text-center font-bold {small ? 'text-xs' : ''}"
      >{valueLabel}</strong
     >
    {/if}
    <span
     class="text-center px-1 leading-[1.1] text-xs">{title}</span
    >
   </div>
  </div>
 </button>
{/if}

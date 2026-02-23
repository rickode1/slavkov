<script>
 import { optimize } from "$lib/image";
 import * as m from "$lib/paraglide/messages.js";

 let {
  type,
  value = 0,
  small = false,
  selected = false,
  highlighted = false,
  disabled = false,
  hideValue = false,
  onclick = null,
  strokeStyle = "",
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
   : 'w-24'} {onclick && !disabled ? 'cursor-pointer' : ''} {disabled ? 'opacity-40 grayscale pointer-events-none' : ''}"
  style={selected || highlighted ? strokeStyle : ""}
  onclick={disabled ? null : onclick}
  {disabled}
 >
  <img
   srcset={optimize("/img/card_bg.png")}
   alt=""
   class="w-full h-full block"
  />

  <div
   class="absolute inset-0 flex flex-col items-center justify-between gap-2 px-1 py-4"
  >
   <img
    srcset={optimize(illustration)}
    alt=""
    class="{small ? 'h-11' : 'h-14'} w-auto object-contain"
   />

   <div class="flex flex-col items-center">
    {#if !hideValue && type !== "unit" && type !== "life"}
     <strong class="text-center font-bold {small ? 'text-xs' : 'text-sm'}"
      >{valueLabel}</strong
     >
    {/if}
    <span
     class="text-center leading-[1.1] {small ? 'text-xs' : 'text-sm'}">{title}</span
    >
   </div>
  </div>
 </button>
{/if}



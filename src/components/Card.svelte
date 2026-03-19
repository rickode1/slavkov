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

 let bonusLabel = $derived.by(() => {
  if (hideValue) return null;
  const sub = m[`bonus_label_${type}`]?.();
  if (!sub) return valueLabel;
  if (type === 'unit') return `+1 ${sub}`;
  return `${valueLabel} ${sub}`;
 });
</script>

{#if value !== 0}
 <button
  type="button"
  class="relative inline-flex flex-col items-center {small
   ? 'w-20'
   : 'w-28'} {onclick && !disabled ? 'cursor-pointer' : ''} {disabled ? 'brightness-80 grayscale pointer-events-none' : ''}"
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
   class="absolute inset-0 flex flex-col items-center justify-between gap-2 px-2 py-4"
  >
   <img
    srcset={optimize(illustration)}
    alt=""
    class="{small ? 'h-10' : 'h-14'} w-auto object-contain"
   />

   <div class="flex flex-col items-center">
    <span
     class="text-center mb-1 leading-[1.1] {small ? 'text-xs' : 'text-sm'}">{title}</span
    >   
    {#if bonusLabel}
     <strong class="text-center leading-[1.1] font-bold {small ? 'text-xs' : 'text-sm'}">{bonusLabel}</strong>
    {/if}
   </div>
  </div>
 </button>
{/if}

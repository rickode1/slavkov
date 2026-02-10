<script>
 import { page } from "$app/state";
 import {
  locales,
  localizeHref,
  getLocale,
  setLocale,
 } from "$lib/paraglide/runtime";
 import { fly } from "svelte/transition";

 let { showAll = false, classes = "" } = $props();
 let manuallyExpanded = $state(false);
 let expanded = $derived(showAll || manuallyExpanded);

 let orderedLocales = $derived(() => {
  const current = getLocale();
  return [current, ...locales.filter((l) => l !== current)];
 });

 function handleClick(e, locale) {
  const current = getLocale();
  if (!expanded && locale === current) {
   e.preventDefault();
   manuallyExpanded = true;
  } else if (manuallyExpanded && locale === current) {
   e.preventDefault();
   manuallyExpanded = false;
  } else {
   setLocale(locale);
  }
 }
</script>

<div role="button" class="flex items-center {classes}" tabindex="0">
 {#each orderedLocales() as locale, i}
  {#if expanded || locale === getLocale()}
   <button
    class="text-white bg-primary rounded-full uppercase text-2xl lg:text-4xl w-14 lg:w-20 h-14 lg:h-20 inline-flex items-center justify-center cursor-pointer text-center {i ===
    0
     ? 'relative z-10'
     : 'ml-3'}"
    onclick={(e) => handleClick(e, locale)}
    transition:fly={{
     x: -80,
     duration: 200,
     delay: i * 50,
    }}
   >
    {locale}
   </button>
  {/if}
 {/each}
</div>

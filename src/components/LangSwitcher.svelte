<script>
 import { locales, getLocale, setLocale } from "$lib/paraglide/runtime";
 import { fly } from "svelte/transition";
 import { currentLocale } from "$lib/stores/locale.js";

 let { showAll = false, classes = "" } = $props();
 let manuallyExpanded = $state(false);
 let shouldAnimate = $state(false);
 let expanded = $derived(showAll || manuallyExpanded);

 let orderedLocales = $derived(() => {
  const current = $currentLocale;
  if (showAll) {
   return locales;
  }
  return [current, ...locales.filter((l) => l !== current)];
 });

 function handleClick(e, locale) {
  const current = getLocale();
  shouldAnimate = true;
  if (!expanded && locale === current) {
   e.preventDefault();
   manuallyExpanded = true;
  } else if (manuallyExpanded && locale === current) {
   e.preventDefault();
   manuallyExpanded = false;
  } else {
   setLocale(locale, { reload: false });
   currentLocale.set(locale);
   manuallyExpanded = false;
  }
  setTimeout(() => (shouldAnimate = false), 500);
 }
</script>

<div role="button" class="flex items-center {classes}" tabindex="0">
 {#each orderedLocales() as locale, i}
  {#if expanded || locale === $currentLocale}
   <button
    class="text-white bg-primary rounded-full uppercase text-2xl lg:text-4xl w-14 lg:w-20 h-14 lg:h-20 inline-flex items-center justify-center cursor-pointer text-center {i ===
    0
     ? 'relative z-10'
     : 'ml-3'} {locale === $currentLocale && showAll ? 'shadow-md scale-105' : ''}"
    onclick={(e) => handleClick(e, locale)}
    transition:fly={{
     x: shouldAnimate ? -80 : 0,
     duration: shouldAnimate ? 200 : 0,
     delay: shouldAnimate ? i * 50 : 0,
    }}
   >
    {locale}
   </button>
  {/if}
 {/each}
</div>

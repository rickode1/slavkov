<script>
 import "./style.css";
 import favicon from "$lib/assets/favicon.svg";
 import { loadPositions } from "$lib/stores/positions.js";

 import { onMount } from "svelte";

 let { children } = $props();

 onMount(() => {
  loadPositions();

  // Prevent accidental page unload
  const unloadHandler = (e) => e.preventDefault();
  window.addEventListener("beforeunload", unloadHandler);

  return () => {
   window.removeEventListener("beforeunload", unloadHandler);
  };
 });
</script>

<svelte:head>
 <link rel="icon" href={favicon} />
 <link rel="preload" href="/img/base_bg.webp" as="image" />
</svelte:head>

{@render children()}

<img
 role="presentation"
 class="inset-0 w-screen h-screen object-cover fixed -z-1"
 src="/img/base_bg.webp"
 alt=""
/>

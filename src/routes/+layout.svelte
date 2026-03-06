<script>
 import "./style.css";
 import favicon from "$lib/assets/favicon.svg";
 import { optimize } from "$lib/image";
 import { loadPositions } from "$lib/stores/positions.js";

 import { onMount } from "svelte";

 let { children } = $props();

 onMount(() => {
  loadPositions();

  // Prevent accidental page unload
  const unloadHandler = (e) => e.preventDefault();
  window.addEventListener("beforeunload", unloadHandler);

  let touchStartY = 0;

  const onTouchStart = (e) => {
   touchStartY = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
   // Walk up from the target to find the first scrollable ancestor
   let el = e.target;
   while (el && el !== document.body) {
    const { overflowY } = getComputedStyle(el);
    const isScrollable = overflowY === "auto" || overflowY === "scroll";
    if (isScrollable && el.scrollHeight > el.clientHeight) {
     // Let the element scroll; only block if already at the top and pulling down
     if (el.scrollTop === 0 && e.touches[0].clientY > touchStartY) {
      e.preventDefault();
     }
     return;
    }
    el = el.parentElement;
   }
   // No scrollable ancestor found — always block to prevent page pull-to-refresh
   e.preventDefault();
  };

  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchmove", onTouchMove, { passive: false });

  return () => {
   window.removeEventListener("beforeunload", unloadHandler);
   document.removeEventListener("touchstart", onTouchStart);
   document.removeEventListener("touchmove", onTouchMove);
  };
 });

 // Dynamically load all images from /img folder
 const imageModules = import.meta.glob(
  "/static/img/*.{png,jpg,jpeg,webp,avif,gif,svg}",
  {
   eager: true,
   query: "?url",
   import: 'default'
  },
 );

 const images = Object.keys(imageModules).map((path) =>
  path.replace("/static", ""),
 );
</script>

<svelte:head>
 <link rel="icon" href={favicon} />
 {#each images as image}
  <link rel="preload" as="image" href={image} />
 {/each}
</svelte:head>

{@render children()}

<img
 role="presentation"
 class="inset-0 w-screen h-screen object-cover fixed -z-1"
 srcset={optimize("/img/base_bg.png")}
 alt=""
/>

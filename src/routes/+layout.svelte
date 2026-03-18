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

  return () => {
   window.removeEventListener("beforeunload", unloadHandler);
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
</svelte:head>

{@render children()}

<img
 role="presentation"
 class="inset-0 w-screen h-screen object-cover fixed -z-1"
 srcset={optimize("/img/base_bg.png")}
 alt=""
/>

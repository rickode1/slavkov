<script>
 import "./style.css";
 import favicon from "$lib/assets/favicon.svg";
 import { optimize } from "$lib/image";

 import { onMount } from "svelte";

 let { children } = $props();

 onMount(() => {
  const handler = (e) => {
   e.preventDefault();
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
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

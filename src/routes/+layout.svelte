<script>
 import "./style.css";
 import favicon from "$lib/assets/favicon.svg";
 import { optimize } from "$lib/image";

 let { children } = $props();
</script>

<svelte:head>
 <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<img
 role="presentation"
 class="inset-0 w-screen h-screen fixed -z-1"
 srcset={optimize("/img/base_bg.png")}
 alt=""
/>

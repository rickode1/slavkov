<script>
 import { optimize } from "$lib/image";
 import EmblemFr from "$components/svg/EmblemFr.svelte";
 import EmblemAt from "$components/svg/EmblemAt.svelte";
 import EmblemRu from "$components/svg/EmblemRu.svelte";

 let { player = null } = $props();

 let emblemColor = $derived(() => {
  if (!player?.bust) return "";
  return `color: var(--color-bust-${player.bust}-dark)`;
 });
</script>

<div class="flex flex-col items-center">
 <div class="relative">
  <img
   class="w-20 lg:w-32 h-auto"
   srcset={optimize("/img/bust_" + player?.bust + ".png")}
   alt=""
  />
  {#if player?.bust}
   <div
    class="absolute -top-1 -right-2 lg:top-0 lg:-right-1 w-6 h-6 lg:w-10 lg:h-10"
    style={emblemColor()}
   >
    {#if player.bust === "fr"}
     <EmblemFr classes="w-full h-full" />
    {:else if player.bust === "at"}
     <EmblemAt classes="w-full h-full" />
    {:else if player.bust === "ru"}
     <EmblemRu classes="w-full h-full" />
    {/if}
   </div>
  {/if}
 </div>
 <p class="text-lg lg:text-2xl text-center">{player?.nick}</p>
</div>

<script>
 import { optimize } from "$lib/image";
 import EmblemFr from "$components/svg/EmblemFr.svelte";
 import EmblemAt from "$components/svg/EmblemAt.svelte";
 import EmblemRu from "$components/svg/EmblemRu.svelte";

 let { player = null, small = false } = $props();

 let emblemColor = $derived(() => {
  if (!player?.bust) return "";
  return `color: var(--color-bust-${player.bust}-dark)`;
 });
</script>

<div class="flex flex-col items-center">
 <div class="relative">
  <img
   class="{small ? 'w-18 h-auto' : 'w-20 lg:w-32 h-auto'}"
   srcset={optimize("/img/bust_" + player?.bust + ".png")}
   alt=""
  />
 </div>
 {#if !small}
 <p class="text-lg lg:text-2xl text-center">{player?.nick}</p>
 {/if}
</div>

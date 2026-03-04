<script>
 import { optimize } from "$lib/image";
 import { m } from "$lib/paraglide/messages.js";
 import { onMount } from "svelte";
 import Button from "$components/Button.svelte";
 import SuccessIcon from "$components/SuccessIcon.svelte";
 import HourglassIcon from "$components/HourglassIcon.svelte";

 let { code = null, player = null, playerNumber, isPhone = false, opponent = null } = $props();

 function isPlayerReady(p) {
  return p?.bust && p?.nick;
 }

 let showCheckmark = $state(false);

 onMount(() => {
  if (isPhone) {
   showCheckmark = true;
   const t = setTimeout(() => { showCheckmark = false; }, 2000);
   return () => clearTimeout(t);
  }
 });
</script>

<div class="flex flex-col items-center justify-start w-1/2">
 {#if !isPlayerReady(player)}
  <img
   class="h-50 w-auto lg:h-100 lg:mt-4"
   srcset={optimize("/img/bust.png")}
   alt=""
  />
 {:else}
  <img
   class="h-50 w-auto lg:h-100"
   srcset={optimize("/img/bust_" + player?.bust + ".png")}
   alt=""
  />
 {/if}

 {#if code}
  <p class="text-2xl text-center">{m.lobby_cta()}</p>
  <div class="flex gap-2 mt-8">
   {#each String(code).split("") as digit}
    <Button text={digit} classes="!min-w-14 !px-4" />
   {/each}
  </div>
 {:else if !isPlayerReady(player)}
  <p class="text-2xl text-center">{m.choosing_side()}</p>
  <div class="flex flex-col items-center gap-3 mt-8">
   <HourglassIcon />
  </div>
 {:else}
  {#if isPhone}
   {#if showCheckmark}
    <p class="text-3xl text-center mt-4">{player?.nick}</p>
    <div class="flex flex-col items-center gap-2 mt-7">
     <SuccessIcon />
     <p class="text-xl text-center">{m.connected()}</p>
    </div>
   {:else if !isPlayerReady(opponent)}
    <p class="text-2xl text-center mt-4">{m.waiting_for_opponent()}</p>
    <div class="flex flex-col items-center gap-3 mt-8">
     <HourglassIcon />
    </div>
   {:else}
    <p class="text-3xl text-center mt-4">{player?.nick}</p>
    <div class="flex flex-col items-center gap-2 mt-7">
     <SuccessIcon />
     <p class="text-xl text-center">{m.connected()}</p>
    </div>
   {/if}
  {:else}
   <p class="text-3xl text-center mt-4">{player?.nick}</p>
   <div class="flex flex-col items-center gap-2 mt-7">
    <SuccessIcon />
    <p class="text-xl text-center">{m.connected()}</p>
   </div>
  {/if}
 {/if}
</div>

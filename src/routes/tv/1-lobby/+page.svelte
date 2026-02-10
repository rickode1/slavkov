<script>
 import { optimize } from "$lib/image";
 import { m } from "$lib/paraglide/messages.js";
 import { gameSession } from "$lib/stores/gameSession.js";
 import LangSwitcher from "$components/LangSwitcher.svelte";
 import Button from "$components/Button.svelte";
 import Logo from "$components/svg/Logo.svelte";
</script>

<main
 class="container relative px-8 pt-[15vh] pb-10 h-screen mx-auto flex flex-col items-center"
>
 <Logo classes="max-w-60 absolute top-10 left-8" />

 {#if $gameSession}
  <div class="flex w-full max-w-4xl justify-between gap-x-20 mt-16">
   {#if $gameSession.code_1}
    <div class="flex flex-col items-center">
     <img class="w-76 h-auto" srcset={optimize("/img/bust.png")} alt="" />
     <p class="text-2xl text-center">{m.lobby_cta()}</p>
     <div class="flex gap-2 mt-8">
      {#each String($gameSession.code_1).split("") as digit}
       <Button text={digit} classes="min-w-auto !px-4" />
      {/each}
     </div>
    </div>
   {:else}{/if}

   {#if $gameSession.code_2}
    <div class="flex flex-col items-center">
     <img class="w-76 h-auto" srcset={optimize("/img/bust.png")} alt="" />
     <p class="text-2xl text-center">{m.lobby_cta()}</p>
     <div class="flex gap-2 mt-8">
      {#each String($gameSession.code_2).split("") as digit}
       <Button text={digit} classes="min-w-auto !px-4" />
      {/each}
     </div>
    </div>
   {:else}{/if}
  </div>
 {/if}

 <LangSwitcher classes="absolute left-8 bottom-10" />
</main>

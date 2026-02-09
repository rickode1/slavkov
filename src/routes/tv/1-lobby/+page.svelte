<script>
 import { gameSession } from "$lib/stores/gameSession.js";
 import LangSwitcher from "$components/LangSwitcher.svelte";
 import Logo from "$components/svg/Logo.svelte";
</script>

<main
 class="container relative px-8 pt-[15vh] pb-10 h-screen mx-auto flex flex-col items-center"
>
 <Logo classes="max-w-60 absolute top-10 left-8" />

 {#if $gameSession}
  <div class="text-center">
   <p>Code 1: {$gameSession.code_1}</p>
   <p>Code 2: {$gameSession.code_2}</p>
   <p>Status: {$gameSession.status}</p>
  </div>
 {/if}

 <LangSwitcher classes="absolute left-8 bottom-10" />
</main>

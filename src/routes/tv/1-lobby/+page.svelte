<script>
 import { gameSession } from "$lib/stores/gameSession.js";
 import LangSwitcher from "$components/LangSwitcher.svelte";
 import Logo from "$components/svg/Logo.svelte";
 import PlayerLobby from "$components/PlayerLobby.svelte";
</script>

<main
 class="container relative px-8 pt-[15vh] pb-10 h-screen mx-auto flex flex-col items-center"
>
 <Logo classes="max-w-60 absolute top-10 left-8" />

 {#if $gameSession}
  <div class="flex w-full max-w-4xl justify-between gap-x-20 mt-16">
   <PlayerLobby
    code={$gameSession.code_1}
    player={$gameSession.player_1}
    playerNumber={1}
   />
   <PlayerLobby
    code={$gameSession.code_2}
    player={$gameSession.player_2}
    playerNumber={2}
   />
  </div>
 {/if}

 <LangSwitcher classes="absolute left-8 bottom-10" />
</main>

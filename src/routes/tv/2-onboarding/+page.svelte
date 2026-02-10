<script>
 import { optimize } from "$lib/image";
 import { m } from "$lib/paraglide/messages.js";
 import {
  sessionId,
  gameSession,
  playerCode,
 } from "$lib/stores/gameSession.js";

 import LangSwitcher from "$components/LangSwitcher.svelte";
</script>

<main
 class="container relative px-8 pt-[15vh] pb-10 h-screen mx-auto flex flex-col items-center"
>
 <LangSwitcher classes="absolute left-8 bottom-10" />
</main>
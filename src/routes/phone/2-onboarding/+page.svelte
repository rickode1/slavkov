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
 class="container relative px-4 py-4 min-h-screen mx-auto flex flex-col items-center"
>

 <LangSwitcher classes="pt-8 mt-auto mr-auto" />
</main>
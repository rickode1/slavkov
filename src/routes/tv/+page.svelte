<script>
 import { localizeHref } from "$lib/paraglide/runtime";
 import { m } from "$lib/paraglide/messages.js";
 import { beforeNavigate, goto } from "$app/navigation";
 import { sessionId } from "$lib/stores/gameSession.js";

 import LangSwitcher from "$components/LangSwitcher.svelte";
 import Logo from "$components/svg/Logo.svelte";
 import EmblemFr from "$components/svg/EmblemFr.svelte";
 import EmblemAt from "$components/svg/EmblemAt.svelte";
 import EmblemRu from "$components/svg/EmblemRu.svelte";
 import Button from "$components/Button.svelte";

 let sessionCreated = false;
 let currentSessionId = $state();

 sessionId.subscribe((value) => {
  currentSessionId = value;
 });

 beforeNavigate(async ({ to, from, cancel }) => {
  if (
   to?.url.pathname.includes("/tv/1-lobby") &&
   !sessionCreated &&
   !currentSessionId
  ) {
   cancel();

   try {
    const response = await fetch("/api/session", { method: "POST" });
    const { session, error } = await response.json();

    if (error) {
     console.error("Failed to create game session:", error);
     return;
    }

    sessionId.set(session.id);
    sessionCreated = true;
    goto(to.url.pathname);
   } catch (err) {
    console.error("Failed to create game session:", err);
   }
  }
 });
</script>

 <Logo classes="max-w-xl -mr-8" />

 <EmblemFr classes="h-28 w-auto absolute top-10 left-8" />

 <div class="absolute top-10 right-8 flex flex-col space-y-4">
  <EmblemAt classes="h-32 w-auto" />
  <EmblemRu classes="h-32 w-auto" />
 </div>

 <Button
  text={m.start()}
  href={localizeHref("/tv/1-lobby")}
  classes="mt-20"
 />


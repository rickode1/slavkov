<script>
 import { onDestroy } from "svelte";
 import { sessionId } from "$lib/stores/gameSession.js";
 import { subscribeToSession, cleanupSession } from "$lib/sessionRealtime.js";

 let { children } = $props();

 $effect(() => {
  const id = $sessionId;
  if (id) {
   subscribeToSession(id);
  }
 });

 onDestroy(cleanupSession);
</script>

{@render children()}

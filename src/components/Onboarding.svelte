<script>
 import { onMount } from "svelte";
 import { sessionId } from "$lib/stores/gameSession.js";

 onMount(() => {
  const timeout = setTimeout(async () => {
   try {
    await fetch("/api/session/status", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ sessionId: $sessionId, status: "3-deployment" }),
    });
   } catch (error) {
    console.error("Error updating session status:", error);
   }
  }, 3000);

  return () => clearTimeout(timeout);
 });
</script>

<p class="text-center text-2xl mt-20">Tady bude onboarding</p>

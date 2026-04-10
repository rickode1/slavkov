<script>
 import Onboarding from "$components/Onboarding.svelte";
 import { sessionId } from "$lib/stores/gameSession.js";

 async function handleComplete() {
  try {
   await fetch("/api/session/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: $sessionId, status: "3-deployment" }),
   });
  } catch (error) {
   console.error("Error updating session status:", error);
  }
 }
</script>

<Onboarding oncomplete={handleComplete} />

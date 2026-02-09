<script>
 import { onDestroy } from "svelte";
 import { supabase } from "$lib/supabaseClient.js";
 import { sessionId, gameSession } from "$lib/stores/gameSession.js";

 let { children } = $props();
 let channel = null;

 // Subscribe to realtime updates when sessionId changes
 $effect(() => {
  const id = $sessionId;

  // Clean up previous channel
  if (channel) {
   supabase.removeChannel(channel);
   channel = null;
  }

  if (id) {
   // Fetch initial session data
   supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single()
    .then(({ data }) => {
     gameSession.set(data);
    });

   // Subscribe to realtime updates
   channel = supabase
    .channel(`session-${id}`)
    .on(
     "postgres_changes",
     {
      event: "*",
      schema: "public",
      table: "sessions",
      filter: `id=eq.${id}`,
     },
     (payload) => {
      console.log("Session updated:", payload);
      gameSession.set(payload.new);
     },
    )
    .subscribe();
  }
 });

 onDestroy(() => {
  if (channel) {
   supabase.removeChannel(channel);
  }
 });
</script>

{@render children()}

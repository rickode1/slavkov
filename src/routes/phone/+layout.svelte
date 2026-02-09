<script>
 import { onDestroy } from "svelte";
 import { supabase } from "$lib/supabaseClient.js";
 import { phoneSessionId, phoneSession } from "$lib/stores/gameSession.js";

 let { children } = $props();
 let channel = null;

 // Subscribe to realtime updates when phoneSessionId changes
 $effect(() => {
  const id = $phoneSessionId;

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
     phoneSession.set(data);
    });

   // Subscribe to realtime updates
   channel = supabase
    .channel(`phone-session-${id}`)
    .on(
     "postgres_changes",
     {
      event: "*",
      schema: "public",
      table: "sessions",
      filter: `id=eq.${id}`,
     },
     (payload) => {
      console.log("Phone session updated:", payload);
      phoneSession.set(payload.new);
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

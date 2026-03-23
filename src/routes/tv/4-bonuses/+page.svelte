<script>
 import { m } from "$lib/paraglide/messages.js";
 import { onMount } from "svelte";
 import { notify } from '$lib/stores/notification.js';
 import { nickHtml } from '$lib/constants.js';
 import { gameSession, sessionId } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import CardBonuses from "$components/CardBonuses.svelte";
 import Map from "$components/Map.svelte";
 import { playSound } from "$lib/audio.js";

 let mapRef = $state(null);

 const unitImg = `<img src="/img/bonus_unit.webp" class="inline-block h-10 w-auto align-middle mr-2 -mt-1">`;
 const locImg  = `<img src="/img/bonus_loc.webp"  class="inline-block h-10 w-auto align-middle mr-2 -mt-1">`;

 function setTimer(seconds) {
  fetch('/api/session/timer', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ sessionId: $sessionId, seconds }),
  }).catch(() => {});
 }

 onMount(() => {

  playSound('/sounds/piece-move.mp3');

  setTimeout(() => { playSound('/sounds/piece-move.mp3') }, 500);

  let notifDuration = 9000;

  setTimeout(() => {
   const session = $gameSession;
   const queue = [];

   if (session) {
    const round = session.current_round || 1;
    const rd = session[`round_${round}`] || {};

    const players = [
     { player: session.player_1, suffix: '_1' },
     { player: session.player_2, suffix: '_2' },
    ];

    for (const { player, suffix } of players) {
     const name = nickHtml(player);
     if (rd[`bonus_unit${suffix}`] > 0) {
      queue.push({ html: unitImg + m.bonus_unit_advantage({ name }) });
     }
    }

    for (const { player, suffix } of players) {
     const name = nickHtml(player);
     const locBonus = rd[`bonus_loc${suffix}`];
     if (locBonus > 0) {
      queue.push({ html: locImg + m.bonus_loc_advantage({ name }) });
     } else if (locBonus < 0) {
      queue.push({ html: locImg + m.bonus_loc_disadvantage({ name }) });
     }
    }
   }

   if (queue.length > 0) {
    notifDuration = (queue.length * 2000) + 10000;
    const merged = queue.map(i => i.html).join('<br><br>');
    notify(merged + '<br><br>' + m.pick_bonuses(), notifDuration, true);
   } else {
    notify(m.pick_bonuses(), notifDuration, true);
   }

   // Start timer after notification dismisses
   setTimeout(() => {
    setTimer(60);
   }, notifDuration + 500);
  }, 4000);
 });

</script>


{#if $gameSession}
 <div class="absolute left-10 top-6 flex w-[calc(100%-5rem)] justify-between">
  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_1} />
   <CardBonuses playerCode="code_1" hideBonuses={true} animated={['unit', 'loc']} />
  </div>

  <div class="flex flex-col items-center">
   <PlayerBust player={$gameSession.player_2} />
   <CardBonuses playerCode="code_2" hideBonuses={true} animated={['unit', 'loc']} />
  </div>
 </div>

 <Map
  bind:this={mapRef}
  classes="w-[calc(100%-35rem)] mt-10"
 />
{/if}

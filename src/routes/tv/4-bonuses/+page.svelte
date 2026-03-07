<script>
 import { m } from "$lib/paraglide/messages.js";
 import { onMount } from "svelte";
 import { notify } from '$lib/stores/notification.js';
 import { nickHtml } from '$lib/constants.js';
 import { gameSession } from "$lib/stores/gameSession.js";
 import PlayerBust from "$components/PlayerBust.svelte";
 import CardBonuses from "$components/CardBonuses.svelte";
 import Map from "$components/Map.svelte";

 let mapRef = $state(null);

 const unitImg = `<img src="/img/bonus_unit.png" class="inline-block h-10 w-auto align-middle mr-2 -mt-1">`;
 const locImg  = `<img src="/img/bonus_loc.png"  class="inline-block h-10 w-auto align-middle mr-2 -mt-1">`;

 onMount(() => {
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
      queue.push({ html: unitImg + m.bonus_unit_advantage({ name }), duration: 5000 });
     }
    }

    for (const { player, suffix } of players) {
     const name = nickHtml(player);
     const locBonus = rd[`bonus_loc${suffix}`];
     if (locBonus > 0) {
      queue.push({ html: locImg + m.bonus_loc_advantage({ name }), duration: 5000 });
     } else if (locBonus < 0) {
      queue.push({ html: locImg + m.bonus_loc_disadvantage({ name }), duration: 5000 });
     }
    }
   }

   queue.push({ html: m.pick_bonuses(), duration: 5000 });

   let delay = 0;
   for (const item of queue) {
    setTimeout(() => notify(item.html, item.duration), delay);
    delay += item.duration + 600;
   }
  }, 2000);
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
  classes="w-[calc(100%-27rem)] mt-10"
 />
{/if}

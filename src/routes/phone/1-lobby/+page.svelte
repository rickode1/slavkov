<script>
 import { onMount } from "svelte";
 import { optimize } from "$lib/image";
 import { m } from "$lib/paraglide/messages.js";
 import { page } from "$app/state";
 import {
  sessionId,
  gameSession,
  playerCode,
 } from "$lib/stores/gameSession.js";
 import { fly } from "svelte/transition";
 import Loader from "$components/Loader.svelte";
 import ErrorIcon from "$components/ErrorIcon.svelte";
 import Button from "$components/Button.svelte";
 import ArrowButton from "$components/ArrowButton.svelte";
 import Logo from "$components/svg/Logo.svelte";
 import PlayerLobby from "$components/PlayerLobby.svelte";

 let digits = $state(["", "", "", ""]);
 let error = $state("");
 let inputs = $state([]);
 let loading = $state(false);
 let errorTimeout = null;

 let urlParams = $state({
  time: 0,
  nick: "",
  dmg: 0,
  def: 0,
  life: 0,
 });

 const busts = ["fr", "at", "ru"];
 let selectedBustIndex = $state(0);
 let selectedBust = $derived(busts[selectedBustIndex]);
 let slideDirection = $state(1); // 1 = right, -1 = left
 let nick = $state("");
 let savingProfile = $state(false);

 // Get opponent's player data
 let opponentPlayer = $derived(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_2
   : $gameSession.player_1;
 });

 // Determine available busts based on opponent's selection
 let availableBusts = $derived(() => {
  const opponent = opponentPlayer();
  if (!opponent?.bust) {
   // Opponent hasn't picked yet - all available
   return busts;
  }
  if (opponent.bust === "fr") {
   // Opponent picked fr - only at and ru available
   return ["at", "ru"];
  }
  // Opponent picked at or ru - only fr available
  return ["fr"];
 });

 let isBustAvailable = $derived(availableBusts().includes(selectedBust));
 let canConfirm = $derived(isBustAvailable && nick.trim().length > 0);

 // Get current player's data
 let myPlayer = $derived(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_1
   : $gameSession.player_2;
 });

 let myPlayerNumber = $derived($playerCode === "code_1" ? 1 : 2);
 let profileSaved = $derived(myPlayer()?.bust && myPlayer()?.nick);

 function prevBust() {
  slideDirection = -1;
  selectedBustIndex = (selectedBustIndex - 1 + busts.length) % busts.length;
 }

 function nextBust() {
  slideDirection = 1;
  selectedBustIndex = (selectedBustIndex + 1) % busts.length;
 }

 onMount(() => {
  urlParams = {
   time: page.url.searchParams.get("time") ?? 0,
   nick: page.url.searchParams.get("nick") ?? "",
   dmg: page.url.searchParams.get("dmg") ?? Math.floor(Math.random() * 9),
   def: page.url.searchParams.get("def") ?? Math.floor(Math.random() * 9),
   life: page.url.searchParams.get("life") ?? Math.floor(Math.random() * 3),
  };
  nick = urlParams.nick;
 });

 async function saveProfile() {
  if (!canConfirm) return;
  savingProfile = true;

  const response = await fetch("/api/session/profile", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    sessionId: $sessionId,
    playerCode: $playerCode,
    nick: nick.trim(),
    bust: selectedBust,
    time: urlParams.time,
    dmg: urlParams.dmg,
    def: urlParams.def,
    life: urlParams.life,
   }),
  });

  savingProfile = false;
 }

 async function joinSession(code) {
  error = "";
  loading = true;
  if (errorTimeout) clearTimeout(errorTimeout);

  const response = await fetch("/api/session/join", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ code }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
   const errorKey = `error_${data.error || "unknown"}`;
   error = m[errorKey] ? m[errorKey]() : m.error_unknown();
   digits = ["", "", "", ""];
   loading = false;

   errorTimeout = setTimeout(() => {
    error = "";
    inputs[0]?.focus();
   }, 5000);
   return;
  }

  playerCode.set(data.playerCode);
  sessionId.set(data.session.id);
 }

 function handleInput(index, event) {
  const value = event.target.value.replace(/\D/g, "");
  digits[index] = value.slice(-1);

  if (value && index < 3) {
   inputs[index + 1]?.focus();
  }

  const code = digits.join("");
  if (code.length === 4) {
   joinSession(code);
  }
 }

 function handleKeydown(index, event) {
  if (event.key === "Backspace" && !digits[index] && index > 0) {
   inputs[index - 1]?.focus();
  }
 }
</script>


 <Logo classes="max-w-32 mb-8" />

 {#if $gameSession}
  {#if profileSaved}
   <PlayerLobby player={myPlayer()} playerNumber={myPlayerNumber} />
  {:else}
   <div class="flex flex-col items-center gap-6">
    <!-- Bust Slider -->
    <div class="flex items-center gap-10">
     <ArrowButton direction="left" onclick={prevBust} />
     <div class="overflow-hidden w-32 h-50 relative">
      {#key selectedBustIndex}
       <img
        class="w-auto h-50 absolute left-1/2 -translate-x-1/2 transition-opacity {isBustAvailable
         ? ''
         : 'opacity-30 grayscale'}"
        srcset={optimize(`/img/bust_${selectedBust}.png`)}
        alt={selectedBust}
        in:fly={{ x: 100 * slideDirection, duration: 300 }}
        out:fly={{ x: -100 * slideDirection, duration: 300 }}
       />
      {/key}
     </div>
     <ArrowButton direction="right" onclick={nextBust} />
    </div>

    <!-- Nick Input -->
    <div class="flex flex-col items-center gap-2">
     <label for="nick-input" class="text-xl">{m.name_label()}</label>
     <input
      id="nick-input"
      type="text"
      bind:value={nick}
      maxlength="20"
      class="text-center text-2xl w-64 h-16 bg-white border-b-4 border-secondary rounded-lg focus:outline-none"
     />
    </div>

    <!-- Confirm Button -->
    {#if savingProfile}
     <Loader />
    {:else}
     <Button
      text={m.confirm()}
      onclick={saveProfile}
      disabled={!canConfirm}
      classes="!text-2xl !h-12 min-w-auto mt-4"
     />
    {/if}
   </div>
  {/if}
 {:else}
  <div class="flex flex-col items-center gap-4 mt-8">
   <img class="w-30 h-auto" srcset={optimize("/img/bust.png")} alt="" />
   <p class="text-2xl text-center">{m.lobby_phone_cta()}</p>
   {#if loading}
    <div class="flex justify-center mt-4">
     <Loader />
    </div>
   {:else if error}
    <div class="flex items-center gap-4 mt-4 mb-4">
     <ErrorIcon />
     <p class="text-primary text-2xl text-center">{error}</p>
    </div>
   {:else}
    <div class="flex gap-2 mt-4">
     {#each digits as _, i}
      <input
       type="text"
       inputmode="numeric"
       pattern="[0-9]*"
       maxlength="1"
       bind:this={inputs[i]}
       bind:value={digits[i]}
       oninput={(e) => handleInput(i, e)}
       onkeydown={(e) => handleKeydown(i, e)}
       class="text-center text-4xl w-16 h-20 bg-white border-b-4 border-secondary rounded-lg focus:outline-none"
      />
     {/each}
    </div>
   {/if}
  </div>
 {/if}



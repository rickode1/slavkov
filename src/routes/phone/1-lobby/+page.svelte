<script>
 import { onMount } from "svelte";
 import { optimize } from "$lib/image";
 import { m } from "$lib/paraglide/messages.js";
 import { strokeStyle } from "$lib/constants.js";
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
 import EmblemFr from "$components/svg/EmblemFr.svelte";
 import EmblemAt from "$components/svg/EmblemAt.svelte";
 import EmblemRu from "$components/svg/EmblemRu.svelte";

 let digits = $state(["", "", "", ""]);
 let error = $state("");
 let inputs = $state([]);
 let loading = $state(false);
 let errorTimeout = null;

 let debugMode = $state(false);
 let debugSessionInput = $state('');
 let debugPlayerCode = $state('code_1');

 function connectDebug() {
  const id = debugSessionInput.trim();
  if (!id) return;
  playerCode.set(debugPlayerCode);
  sessionId.set(id);
 }

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
 let nickConfirmed = $state(false);
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
 let canConfirmNick = $derived(nick.trim().length > 0);
 let canConfirmBust = $derived(isBustAvailable);

 // Get current player's data
 let myPlayer = $derived(() => {
  if (!$gameSession) return null;
  return $playerCode === "code_1"
   ? $gameSession.player_1
   : $gameSession.player_2;
 });

 let myPlayerNumber = $derived($playerCode === "code_1" ? 1 : 2);
 let profileSaved = $derived(myPlayer()?.bust && myPlayer()?.nick);

 let emblemColor = $derived(() => {
  return `color: var(--color-bust-${selectedBust}-dark)`;
 });

 let bustStrokeStyle = $derived(() => strokeStyle(selectedBust));

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
   dmg: page.url.searchParams.get("dmg") ?? Math.floor(Math.random() * 8) + 1,
   def: page.url.searchParams.get("def") ?? Math.floor(Math.random() * 8) + 1,
   life: page.url.searchParams.get("life") ?? Math.floor(Math.random() * 2) + 1,
  };
  nick = urlParams.nick;
 });

 function confirmNick() {
  if (!canConfirmNick) return;
  nickConfirmed = true;
 }

 async function saveProfile() {
  if (!canConfirmBust) return;
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

  const data = await response.json();
  savingProfile = false;

  if (data.error === 'bust_taken') {
   nickConfirmed = true;
   return;
  }
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
 {:else if !nickConfirmed}
  <!-- Step 1: Nick Input -->
  <div class="flex flex-col items-center gap-6">
   <div class="flex flex-col items-center gap-2">
    <label for="nick-input" class="text-xl">{m.name_label()}</label>
    <input
     id="nick-input"
     type="text"
     bind:value={nick}
     maxlength="10"
     onkeydown={(e) => { if (e.key === "Enter") confirmNick(); }}
     class="text-center text-2xl w-64 h-16 bg-white border-b-4 border-secondary rounded-lg focus:outline-none"
    />
   </div>

   <Button
    text={m.confirm()}
    onclick={confirmNick}
    disabled={!canConfirmNick}
    classes="!text-2xl !h-12 min-w-auto mt-4"
   />
  </div>
 {:else}
  <!-- Step 2: Bust Selection -->
  <div class="flex flex-col items-center gap-6">
   <div class="flex items-center gap-10">
    <ArrowButton direction="left" onclick={prevBust} />
    <div class="overflow-hidden w-32 h-50 relative">
     {#key selectedBustIndex}
      <div class="relative w-full h-full">
       <img
        class="w-auto h-50 absolute left-1/2 -translate-x-1/2 p-1.5 transition-all {isBustAvailable
         ? 'scale-105'
         : 'opacity-30 grayscale'}"
        style={isBustAvailable ? bustStrokeStyle() : ""}
        srcset={optimize(`/img/bust_${selectedBust}.png`)}
        alt={selectedBust}
        in:fly={{ x: 100 * slideDirection, duration: 300 }}
        out:fly={{ x: -100 * slideDirection, duration: 300 }}
       />
       <div
        class="absolute top-0 right-0 w-8 h-8 {isBustAvailable
         ? ''
         : 'opacity-30 grayscale'}"
        style={emblemColor()}
        in:fly={{ x: 100 * slideDirection, duration: 300 }}
        out:fly={{ x: -100 * slideDirection, duration: 300 }}
       >
        {#if selectedBust === "fr"}
         <EmblemFr classes="w-full h-full" />
        {:else if selectedBust === "at"}
         <EmblemAt classes="w-full h-full" />
        {:else if selectedBust === "ru"}
         <EmblemRu classes="w-full h-full" />
        {/if}
       </div>
      </div>
     {/key}
    </div>
    <ArrowButton direction="right" onclick={nextBust} />
   </div>

   <p class="text-4xl text-center mt-4">{nick.trim()}</p>

   {#if savingProfile}
    <Loader />
   {:else}
    <Button
     text={m.confirm()}
     onclick={saveProfile}
     disabled={!canConfirmBust}
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

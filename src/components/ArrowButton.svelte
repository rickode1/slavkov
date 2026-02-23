<script>
 let { direction = "left", onclick = null, classes = "" } = $props();
</script>

<button class="cursor-pointer {classes}" {onclick}>
 <svg
  width="50"
  height="50"
  viewBox="0 0 85 85"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
 >
  <circle cx="42.4208" cy="42.4208" r="42.4208" fill="#0D3870" />
  {#if direction === "left"}
   <path
    d="M48 28L34 42.5L48 57"
    stroke="#FFFFFF"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
   />
  {:else}
   <path
    d="M37 28L51 42.5L37 57"
    stroke="#FFFFFF"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
   />
  {/if}
 </svg>
</button>

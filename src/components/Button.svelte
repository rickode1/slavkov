<script>
 let { text, href = null, onclick = null, classes = "" } = $props();
 let tag = $derived(href ? "a" : "button");
</script>

<svelte:element
 this={tag}
 {href}
 {onclick}
 role="button"
 tabindex="0"
 class="text-white bg-secondary inline-flex items-center justify-center text-center gap-4 text-4xl rounded-lg h-18 min-w-60 px-8 {classes}"
>
 {text}
</svelte:element>

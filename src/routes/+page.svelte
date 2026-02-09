<script>
  let { data } = $props();
</script>
<ul>
  {#each data.sessions as session}
    <li>{session.name}</li>
  {/each}
</ul>

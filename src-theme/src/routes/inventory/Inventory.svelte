<script>
    import { fade } from "svelte/transition";

</script>
<img class="watermark" src="img/rat.png" alt="watermark" in:fade out:fade={{duration: 100}}>

<style>
    .watermark {
        position: absolute;
        bottom: 15px;
        right: 15px;
        width: 185px;
    }
</style>

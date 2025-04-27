<span class="watermark">Aurora</span>

<style lang="scss">
@import "../../../colors.scss";
$Speed: 8s;
.watermark {
  font-family: 'tenacity-bold', system-ui, -apple-system, sans-serif;
  font-weight: bold;
  font-size: 60px;
  position: relative;
  color: transparent;
  background: linear-gradient(
   135deg,
    $accent-color,
    $accent-color-2,
    $accent-color
  );
  background-size: 400% 400%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: flow $Speed ease infinite;
  animation-delay: calc(var(--i, 0) * 0.2s); 
}

</style>

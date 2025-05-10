
  <span class="watermark">Aurora</span>
  <span class="watermark-small">1.6</span>


<style lang="scss">
@import "../../../colors.scss";


.watermark {
  font-family: 'Greycliff CF Bold',serif;
  font-weight: bold;
  font-size: 60px;
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

}

.watermark-small {
  position: absolute;
  font-family: 'Greycliff CF Bold',serif;
  right: 0;
  top: 0;
  font-size: 20px; 
  color:$accent-mix;
  text-shadow:0 0 1px $accent-mix;
}
</style>

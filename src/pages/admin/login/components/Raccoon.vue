<script lang="ts" setup>
interface Props {
  closeEyes: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <div class="raccoon" :class="{ 'raccoon-password': props.closeEyes }">
    <div class="hand-down-left" />
    <div class="hand-down-right" />
    <div class="hand-up-left" />
    <div class="hand-up-right" />
  </div>
</template>

<style lang="scss" scoped>
@mixin backgroundImage($url) {
  background-image: url($url);
  background-repeat: no-repeat;
  background-size: 100%;
}

.raccoon {
  position: relative;
  width: 150px;
  height: 118px;
  transform: translateY(12%);
  @include backgroundImage("../images/face.png");
  .hand-down-left,
  .hand-down-right {
    z-index: 2;
    position: absolute;
    width: 45px;
    height: 25px;
    transition: transform 0.2s linear;
  }
  .hand-down-left {
    bottom: 7px;
    left: -10px;
    @include backgroundImage("../images/hand-down-left.png");
  }
  .hand-down-right {
    bottom: 7px;
    right: -5px;
    @include backgroundImage("../images/hand-down-right.png");
  }
  .hand-up-left,
  .hand-up-right {
    z-index: 3;
    position: absolute;
    width: 70px;
    height: 40px;
    opacity: 0;
    transition: opacity 0.1s linear 0.1s;
  }
  .hand-up-left {
    bottom: 14px;
    left: -5px;
    @include backgroundImage("../images/hand-up-left.png");
  }
  .hand-up-right {
    bottom: 14px;
    right: 5px;
    @include backgroundImage("../images/hand-up-right.png");
  }
}

.raccoon-password {
  .hand-down-left {
    transform: translateX(30px) scale(0) translateY(-10px);
  }
  .hand-down-right {
    transform: translateX(-40px) scale(0) translateY(-10px);
  }
  .hand-up-left,
  .hand-up-right{
    opacity: 1;
  }
}
</style>

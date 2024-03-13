<script setup lang="ts">
import { type Ref, onMounted, ref, onUnmounted, watch } from 'vue';
import Maps from './components/Maps.vue';
import { useMemoize } from '@vueuse/core';

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  dot(other: Vector2) {
    return this.x * other.x + this.y * other.y;
  }
}

function Shuffle(table: number[]) {
  for (let e = table.length - 1; e > 0; e--) {
    const index = Math.round(Math.random() * (e - 1));
    const temp = table[e];

    table[e] = table[index];
    table[index] = temp;
  }
}

function MakePermutation() {
  const P = [];
  for (let i = 0; i < 256; i++) {
    P.push(i);
  }
  Shuffle(P);
  for (let i = 0; i < 256; i++) {
    P.push(P[i]);
  }

  return P;
}
const P = MakePermutation();

function GetConstantVector(v: number) {
  //v is the value from the permutation table
  const h = v & 3;
  if (h === 0) return new Vector2(1.0, 1.0);
  if (h === 1) return new Vector2(-1.0, 1.0);
  if (h === 2) return new Vector2(-1.0, -1.0);
  return new Vector2(1.0, -1.0);
}

function Fade(t: number) {
  return ((6 * t - 15) * t + 10) * t * t * t;
}

function Lerp(t: number, a1: number, a2: number) {
  return a1 + t * (a2 - a1);
}

function Noise2D(x: number, y: number) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const topRight = new Vector2(xf - 1.0, yf - 1.0);
  const topLeft = new Vector2(xf, yf - 1.0);
  const bottomRight = new Vector2(xf - 1.0, yf);
  const bottomLeft = new Vector2(xf, yf);

  //Select a value in the array for each of the 4 corners
  const valueTopRight = P[P[X + 1] + Y + 1];
  const valueTopLeft = P[P[X] + Y + 1];
  const valueBottomRight = P[P[X + 1] + Y];
  const valueBottomLeft = P[P[X] + Y];

  const dotTopRight = topRight.dot(GetConstantVector(valueTopRight));
  const dotTopLeft = topLeft.dot(GetConstantVector(valueTopLeft));
  const dotBottomRight = bottomRight.dot(GetConstantVector(valueBottomRight));
  const dotBottomLeft = bottomLeft.dot(GetConstantVector(valueBottomLeft));

  const u = Fade(xf);
  const v = Fade(yf);

  return Lerp(u, Lerp(v, dotBottomLeft, dotTopLeft), Lerp(v, dotBottomRight, dotTopRight));
}

const maps: Ref<NoiseMap[]> = ref([
  {
    id: 0,
    amplitude: 1.0,
    frequency: 0.05,
    offset: 0.0,
    filter: 0.0,
  },
]);

const canvas = ref<HTMLCanvasElement>();

const noiseFunction = useMemoize((x: number, y: number) => {
  return Noise2D(x, y);
});

watch(maps, () => {
  // Invalidate noise function cache
  noiseFunction.clear();
});

const drawMap = () => {
  const ctx = canvas.value?.getContext('2d');
  if (canvas.value && ctx) {
    for (let y = 0; y < canvas.value.height; y++) {
      for (let x = 0; x < canvas.value.width; x++) {
        let noise = 0.0;

        for (const map of maps.value) {
          let value = map.amplitude * noiseFunction(x * map.frequency, y * map.frequency);

          value += 1.0;
          value *= 0.5;

          if (value > map.filter) {
            noise += value + map.offset;
          }
        }

        const rgb = Math.round(255 * noise);

        if (rgb < 65) {
          ctx.fillStyle = `rgba(${0},${0},${rgb},1.0)`;
        } else if (rgb < 181) {
          ctx.fillStyle = `rgba(${0},${rgb},${0},1.0)`;
        } else {
          ctx.fillStyle = `rgba(${rgb},${rgb},${rgb},1.0)`;
        }

        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
};

const resizeWindow = () => {
  if (canvas.value) {
    canvas.value.width = document.body.clientWidth;
    canvas.value.height = document.body.clientHeight;
  }
  drawMap();
};

onMounted(() => {
  window.addEventListener('resize', resizeWindow);
  resizeWindow();
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeWindow);
});
</script>

<template>
  <div>
    <Maps v-model="maps" :draw-map="drawMap" />
    <canvas ref="canvas" width="1200" height="600" class="m-auto"></canvas>
  </div>
</template>

<script setup lang="ts">
import { type Ref, onMounted, ref, onUnmounted, watch } from 'vue';
import Maps from './components/Maps.vue';
import { useMemoize } from '@vueuse/core';

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
  // for (let i = 0; i < 256; i++) {
  //   P.push(P[i]);
  // }

  return P;
}
const P = MakePermutation();

function Fade(t: number) {
  return ((6 * t - 15) * t + 10) * t * t * t;
}

function Lerp(t: number, a1: number, a2: number) {
  return a1 + t * (a2 - a1);
}

function Grad(hash: number, x: number, y: number, z: number) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h == 12 || h == 14 ? x : z;
  return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

function Noise2D(x: number, y: number, z: number) {
  const ix = Math.floor(x) & 255;
  const iy = Math.floor(y) & 255;
  const iz = Math.floor(z) & 255;

  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);

  const u = Fade(xf);
  const v = Fade(yf);
  const w = Fade(zf);

  const A = (P[ix & 255] + iy) & 255;
  const B = (P[(ix + 1) & 255] + iy) & 255;

  const AA = (P[A] + iz) & 255;
  const AB = (P[(A + 1) & 255] + iz) & 255;
  const BA = (P[B] + iz) & 255;
  const BB = (P[(B + 1) & 255] + iz) & 255;

  const p0 = Grad(P[AA], xf, yf, zf);
  const p1 = Grad(P[BA], xf - 1, yf, zf);
  const p2 = Grad(P[AB], xf, yf - 1, zf);
  const p3 = Grad(P[BB], xf - 1, yf - 1, zf);
  const p4 = Grad(P[(AA + 1) & 255], xf, yf, zf - 1);
  const p5 = Grad(P[(BA + 1) & 255], xf - 1, yf, zf - 1);
  const p6 = Grad(P[(AB + 1) & 255], xf, yf - 1, zf - 1);
  const p7 = Grad(P[(BB + 1) & 255], xf - 1, yf - 1, zf - 1);

  const q0 = Lerp(u, p0, p1);
  const q1 = Lerp(u, p2, p3);
  const q2 = Lerp(u, p4, p5);
  const q3 = Lerp(u, p6, p7);

  const r0 = Lerp(v, q0, q1);
  const r1 = Lerp(v, q2, q3);

  return Lerp(w, r0, r1);
}

const maps: Ref<NoiseMap[]> = ref([
  {
    id: 0,
    amplitude: 1.0,
    frequency: 0.005,
    offset: 0.0,
    filter: 0.0,
  },
]);

const canvas = ref<HTMLCanvasElement>();

const noiseFunction = useMemoize((x: number, y: number) => {
  return Noise2D(x, 0.005, y);
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
          const nx = (x - canvas.value.width / 2) * map.frequency;
          const ny = (y - canvas.value.height / 2) * map.frequency;
          console.log(nx);
          let value = map.amplitude * noiseFunction(nx, ny);

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

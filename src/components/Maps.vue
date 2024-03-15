<script setup lang="ts">
import { ref } from 'vue';

interface MapsProps {
  drawMap: () => void;
}

const { drawMap } = defineProps<MapsProps>();

// @ts-ignore
const maps = defineModel<NoiseMap[]>([]);

const addParameter = () => {
  const nextId = Math.max(...maps.value.map((par) => par.id)) + 1;
  maps.value.push({ id: nextId, amplitude: 1.0, frequency: 0.05, offset: 0.0, filter: 0.0 });
};

const removeParameter = (id: number) => {
  maps.value = maps.value.filter((par) => par.id !== id);
};

const updateAmplitude = (event: Event, id: number) => {
  const target = event.target as HTMLInputElement;
  const value = +target.value;
  if (!Number.isNaN(value)) {
    maps.value[id].amplitude = value;
  }
};

const updateFrequency = (event: Event, id: number) => {
  const target = event.target as HTMLInputElement;
  const value = +target.value;
  if (!Number.isNaN(value)) {
    maps.value[id].frequency = value;
  }
};

const updateOffset = (event: Event, id: number) => {
  const target = event.target as HTMLInputElement;
  const value = +target.value;
  if (!Number.isNaN(value)) {
    maps.value[id].offset = value;
  }
};

const updateFilter = (event: Event, id: number) => {
  const target = event.target as HTMLInputElement;
  const value = +target.value;
  if (!Number.isNaN(value)) {
    maps.value[id].filter = value;
  }
};

const hidden = ref(true);
</script>

<template>
  <div class="fixed rounded-lg w-full pb-2">
    <div
      class="transition duration-300 flex gap-2 bg-neutral-900 w-full py-4"
      :class="{
        absolute: hidden,
        block: !hidden,
        'opacity-0': hidden,
        'opacity-100': !hidden,
        '-z-10': hidden,
        'z-auto': !hidden,
      }">
      <div class="border border-white w-fit p-4 flex flex-col gap-4 items-center" v-for="map in maps">
        <p>Map {{ map.id }}</p>
        <label>
          Amplitude
          <input type="number" :value="map.amplitude" @input="(event) => updateAmplitude(event, map.id)" />
        </label>
        <label>
          Frequency
          <input type="number" :value="map.frequency" @input="(event) => updateFrequency(event, map.id)" />
        </label>
        <label>
          Offset
          <input type="number" :value="map.offset" @input="(event) => updateOffset(event, map.id)" />
        </label>
        <label>
          Filter
          <input type="number" :value="map.filter" @input="(event) => updateFilter(event, map.id)" />
        </label>
        <button type="button" class="bg-red-600 text-sm" @click="removeParameter(map.id)">Remove</button>
      </div>
      <button type="button" class="bg-blue-600 self-center" @click="addParameter">Add</button>
      <button type="button" class="bg-blue-600 self-center" @click="drawMap">Update</button>
    </div>
    <button type="button" class="bg-neutral-900 rounded-t-none" @click="hidden = !hidden">Noise Maps</button>
  </div>
</template>

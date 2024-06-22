function Fade(t: number) {
	return ((6 * t - 15) * t + 10) * t * t * t;
}

function Lerp(t: number, a1: number, a2: number) {
	return a1 + t * (a2 - a1);
}

function Grad(hash: number, x: number, y: number, z: number) {
	switch (hash & 0xf) {
		case 0x0:
			return x + y;
		case 0x1:
			return -x + y;
		case 0x2:
			return x - y;
		case 0x3:
			return -x - y;
		case 0x4:
			return x + z;
		case 0x5:
			return -x + z;
		case 0x6:
			return x - z;
		case 0x7:
			return -x - z;
		case 0x8:
			return y + z;
		case 0x9:
			return -y + z;
		case 0xa:
			return y - z;
		case 0xb:
			return -y - z;
		case 0xc:
			return y + x;
		case 0xd:
			return -y + z;
		case 0xe:
			return y - x;
		case 0xf:
			return -y - z;
		default:
			return 0;
	}
	// const h = hash & 15;
	// const u = h < 8 ? x : y;
	// const v = h < 4 ? y : h == 12 || h == 14 ? x : z;
	// return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

function Noise2D(x: number, y: number, z: number, P: number[]) {
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

onmessage = (e: MessageEvent<WorkerInput>) => {
	const { width, height, permutations, maps } = e.data;
	const result = new Array(width * height);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let noise = 0.0;

			for (const map of maps) {
				const nx = (x - width / 2) * map.frequency;
				const ny = (y - height / 2) * map.frequency;
				let value = map.amplitude * Noise2D(nx, 0.005, ny, permutations);

				value += 1.0;
				value *= 0.5;

				if (value > map.filter) {
					noise += value + map.offset;
				}
			}

			result[y * width + x] = Math.round(255 * noise);
		}
	}

	postMessage(result);
};

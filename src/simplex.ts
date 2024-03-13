// Open Simplex implementation adapted from https://gist.github.com/KdotJPG/b1270127455a94ac5d19

const PRIME_X = BigInt("0x5205402B9270C86F");
const PRIME_Y = BigInt("0x598CD327003817B5");

const SKEW_2D = 0.366025403784439;
const UNSKEW_2D = -0.21132486540518713;

const N_GRADS_2D_EXPONENT = 7;
const N_GRADS_2D = 1 << N_GRADS_2D_EXPONENT;

const NORMALIZER_2D = 0.05481866495625118;
const RSQUARED_2D = 2.0 / 3.0;

const GRADIENTS_BASE = [
	0.38268343236509, 0.923879532511287, 0.923879532511287, 0.38268343236509,
	0.923879532511287, -0.38268343236509, 0.38268343236509, -0.923879532511287,
	-0.38268343236509, -0.923879532511287, -0.923879532511287, -0.38268343236509,
	-0.923879532511287, 0.38268343236509, -0.38268343236509, 0.923879532511287,
	0.130526192220052, 0.99144486137381, 0.608761429008721, 0.793353340291235,
	0.793353340291235, 0.608761429008721, 0.99144486137381, 0.130526192220051,
	0.99144486137381, -0.130526192220051, 0.793353340291235, -0.60876142900872,
	0.608761429008721, -0.793353340291235, 0.130526192220052, -0.99144486137381,
	-0.130526192220052, -0.99144486137381, -0.608761429008721, -0.793353340291235,
	-0.793353340291235, -0.608761429008721, -0.99144486137381, -0.130526192220052,
	-0.99144486137381, 0.130526192220051, -0.793353340291235, 0.608761429008721,
	-0.608761429008721, 0.793353340291235, -0.130526192220052, 0.99144486137381,
].map((g) => g / NORMALIZER_2D);

const GRADIENTS_2D: number[] = [];
for (let i = 0; i < N_GRADS_2D; i++) {
	GRADIENTS_2D.push(GRADIENTS_BASE[i % GRADIENTS_BASE.length]);
}

const grad = (
	seed: bigint,
	xsbp: bigint,
	ysbp: bigint,
	dx: number,
	dy: number,
) => {
	const hash = seed ^ xsbp ^ ysbp;
	const hashExp =
		Number(hash) ^ (Number(hash) >> (64 - N_GRADS_2D_EXPONENT + 1));
	const gi = hashExp & ((N_GRADS_2D - 1) << 1);
	return GRADIENTS_2D[gi | 0] * dx + GRADIENTS_2D[gi | 1] * dy;
};

export const SimplexNoise2D = (x: number, y: number) => {
	const s = SKEW_2D * (x + y);
	const xs = x + s;
	const ys = y + s;

	const seed = BigInt("0x893C4A789534FF9F0");

	const xsb = Math.floor(xs);
	const ysb = Math.floor(ys);

	const xf = x - Math.floor(x);
	const yf = y - Math.floor(y);

	const xsbp = PRIME_X * BigInt(xsb);
	const ysbp = PRIME_Y * BigInt(ysb);

	const t = (xf + yf) * UNSKEW_2D;
	const dx0 = xf + t;
	const dy0 = yf + t;

	// First vertex
	const a0 = RSQUARED_2D - dx0 * dx0 - dy0 * dy0;
	let value = a0 * a0 * (a0 * a0) * grad(seed, xsbp, ysbp, dx0, dy0);

	// Second vertex
	const a1 =
		2 * (1 + 2 * UNSKEW_2D) * (1 / UNSKEW_2D + 2) * t +
		-2 * (1 + 2 * UNSKEW_2D) * (1 + 2 * UNSKEW_2D) +
		a0;
	const dx1 = dx0 - (1 + 2 * UNSKEW_2D);
	const dy1 = dy0 - (1 + 2 * UNSKEW_2D);
	value +=
		a1 * a1 * (a1 * a1) * grad(seed, xsbp + PRIME_X, ysbp + PRIME_Y, dx1, dy1);

	// Third and fourth vertices
	const xmyf = xf - yf;
	if (t < UNSKEW_2D) {
		if (xf + xmyf > 1) {
			const dx2 = dx0 - (3 * UNSKEW_2D + 2);
			const dy2 = dy0 - (3 * UNSKEW_2D + 1);
			const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
			if (a2 > 0) {
				value +=
					a2 *
					a2 *
					(a2 * a2) *
					grad(seed, xsbp + (PRIME_X << BigInt(1)), ysbp + PRIME_Y, dx2, dy2);
			}
		} else {
			const dx2 = dx0 - UNSKEW_2D;
			const dy2 = dy0 - (UNSKEW_2D + 1);
			const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
			if (a2 > 0) {
				value +=
					a2 * a2 * (a2 * a2) * grad(seed, xsbp, ysbp + PRIME_Y, dx2, dy2);
			}
		}

		if (yf - xmyf > 1) {
			const dx3 = dx0 - (3 * UNSKEW_2D + 1);
			const dy3 = dy0 - (3 * UNSKEW_2D + 2);
			const a3 = RSQUARED_2D - dx3 * dx3 - dy3 * dy3;
			if (a3 > 0) {
				value +=
					a3 *
					a3 *
					(a3 * a3) *
					grad(seed, xsbp + PRIME_X, ysbp + (PRIME_Y << BigInt(1)), dx3, dy3);
			}
		} else {
			const dx3 = dx0 - (UNSKEW_2D + 1);
			const dy3 = dy0 - UNSKEW_2D;
			const a3 = RSQUARED_2D - dx3 * dx3 - dy3 * dy3;
			if (a3 > 0) {
				value +=
					a3 * a3 * (a3 * a3) * grad(seed, xsbp + PRIME_X, ysbp, dx3, dy3);
			}
		}
	} else {
		if (xf + xmyf < 0) {
			const dx2 = dx0 + (1 + UNSKEW_2D);
			const dy2 = dy0 + UNSKEW_2D;
			const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
			if (a2 > 0) {
				value +=
					a2 * a2 * (a2 * a2) * grad(seed, xsbp - PRIME_X, ysbp, dx2, dy2);
			}
		} else {
			const dx2 = dx0 - (UNSKEW_2D + 1);
			const dy2 = dy0 - UNSKEW_2D;
			const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
			if (a2 > 0) {
				value +=
					a2 * a2 * (a2 * a2) * grad(seed, xsbp + PRIME_X, ysbp, dx2, dy2);
			}
		}

		if (yf < xmyf) {
			const dx2 = dx0 + UNSKEW_2D;
			const dy2 = dy0 + (UNSKEW_2D + 1);
			const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
			if (a2 > 0) {
				value +=
					a2 * a2 * (a2 * a2) * grad(seed, xsbp, ysbp - PRIME_Y, dx2, dy2);
			}
		} else {
			const dx2 = dx0 - UNSKEW_2D;
			const dy2 = dy0 - (UNSKEW_2D + 1);
			const a2 = RSQUARED_2D - dx2 * dx2 - dy2 * dy2;
			if (a2 > 0) {
				value +=
					a2 * a2 * (a2 * a2) * grad(seed, xsbp, ysbp + PRIME_Y, dx2, dy2);
			}
		}
	}

	return value;
};

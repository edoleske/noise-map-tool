type NoiseMap = {
	id: number;
	amplitude: number;
	frequency: number;
	offset: number;
	filter: number;
};

type WorkerInput = {
	width: number;
	height: number;
	permutations: number[];
	maps: NoiseMap[];
};

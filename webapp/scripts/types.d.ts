import * as _ from '../../node_modules/molstar/lib/extensions/mvs/mvs-data.d.ts';
export { Vec3, Mat3, Mat4, Quat } from '../../node_modules/molstar/lib/mol-math/linear-algebra.d.ts';
export { Euler } from '../../node_modules/molstar/lib/mol-math/linear-algebra/3d/euler.d.ts';

export type Builder = ReturnType<typeof _.MVSData.createBuilder>;

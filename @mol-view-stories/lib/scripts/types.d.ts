import type * as _ from "molstar/lib/extensions/mvs/mvs-data.d.ts";
export {
  Mat3,
  Mat4,
  Quat,
  Vec3,
} from "molstar/lib/mol-math/linear-algebra.d.ts";
export { Euler } from "molstar/lib/mol-math/linear-algebra/3d/euler.d.ts";

export type Builder = ReturnType<typeof _.MVSData.createBuilder>;

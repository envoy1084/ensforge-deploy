import { Layer } from "effect";
import { Atom } from "effect/reactivity";

export const atomRuntime = Atom.runtime(Layer.empty);

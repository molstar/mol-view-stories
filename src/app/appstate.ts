//
// All StoreisCreator App State info will live here.
//
import { atom } from "jotai";
import { init_js_code, init_js_code_02 } from "./components/initial_data.mjs";

type SceneData = {
  id: number;
  javascript: string;
  markdown: string;
};

// High level atom for a single map
export const SceneAtom = atom({});

export const StateAtom = atom<SceneData[]>([
  { id: 1, javascript: init_js_code, markdown: "#Awesome Thing 01" },
  { id: 2, javascript: init_js_code_02, markdown: "#Awesome Thing 02" },
]);

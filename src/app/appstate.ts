//
// All StoriesCreator App State will live here.
//
import { atom } from "jotai";
import { init_js_code, init_js_code_02 } from "./state/initial_data.mjs";

// types ------------------------------------------
type SceneData = {
  id: number; // unique key
  header: string; // title
  key: string; // internal key
  description: string; // markdown
  javascript: string; // should define a builder
};

// State ------------------------------------------

// High level atom for a single map
export const SceneAtom = atom({
  kind: "multiple",
  title: "",
  version: "1.0",
  timestamp: new Date().toISOString(),
});

export const StateAtom = atom<SceneData[]>([
  { id: 1, javascript: init_js_code, markdown: "#Awesome Thing 01" },
  { id: 2, javascript: init_js_code_02, markdown: "#Awesome Thing 02" },
]);

export const ActiveScene = atom(1);
export const ActiveJSON = atom(1); // make reactive to the javascript context

// This atom responds to the current active SceneData and will generate / hold
// the MVSJ we can subscribe to in our compoenent
export const initializeMolstarAtom = atom(null, async (_, set) => {
  try {
    // Check if molstar is loaded
    if (!window.molstar) {
      console.log("Waiting for molstar to load...");
      // Poll until molstar is available
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (
            window.molstar &&
            window.molstar.PluginExtensions &&
            window.molstar.PluginExtensions.mvs
          ) {
            clearInterval(checkInterval);
            // set(molstarReadyAtom, true);
            console.log("Molstar MVS extension loaded successfully!");
            resolve(true);
          }
        }, 100);

        // Set a timeout to avoid infinite polling
        setTimeout(() => {
          clearInterval(checkInterval);
          if (
            !window.molstar ||
            !window.molstar.PluginExtensions ||
            !window.molstar.PluginExtensions.mvs
          ) {
            console.error("Timed out waiting for Molstar MVS extension");
            resolve(false);
          }
        }, 10000); // 10 second timeout
      });
    }

    // Check if MVS extension is available
    if (
      window.molstar.PluginExtensions &&
      window.molstar.PluginExtensions.mvs
    ) {
      set(molstarReadyAtom, true);
      console.log("Molstar MVS extension loaded successfully!");
      return true;
    } else {
      console.error("Molstar loaded but MVS extension is not available");
      return false;
    }
  } catch (error) {
    console.error("Error checking Molstar availability:", error);
    return false;
  }
});

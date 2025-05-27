import React, { createContext, useContext, useMemo } from "react";
import { Provider as JotaiProvider } from "jotai";
import { atom } from "jotai";

// Create a context to pass the atom scope
const JSAtomScopeContext = createContext(null);

// Hook to access the current atom scope
export function useJSAtomScope() {
  const scope = useContext(JSAtomScopeContext);
  if (!scope) {
    throw new Error("useJSAtomScope must be used within a JSAtomScopeProvider");
  }
  return scope;
}

// Factory function to create a fresh set of atoms
function createJSAtomScope() {
  const codeAtom = atom("");
  const molViewSpecJsonAtom = atom(null);
  const molstarReadyAtom = atom(false);

  // Atom to check if molstar is ready
  const initializeMolstarAtom = atom(null, async (_, set) => {
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
              set(molstarReadyAtom, true);
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

  // Derived atom for executing JS code
  const executeJsCodeAtom = atom(
    (get) => get(codeAtom),
    async (get, set) => {
      if (!get(molstarReadyAtom)) {
        console.log("Molstar not ready yet, initializing...");
        const ready = await initializeMolstarAtom(get, set);
        if (!ready) {
          console.error("Could not initialize Molstar");
          return;
        }
      }

      try {
        const code = get(codeAtom);
        console.log("Executing JS code:", code);

        // Execute the JS code in a controlled environment
        const evalFunction = new Function(`
          try {
            // Ensure molstar and its MVS extension are available
            if (!window.molstar || !window.molstar.PluginExtensions || !window.molstar.PluginExtensions.mvs) {
              throw new Error("Molstar MVS extension is not available");
            }



            // Execute the user code
            ${code}

            // Return the MVS data directly
            return mvsData;
          } catch (error) {
            console.error("Error executing JS code:", error);
            throw error;
          }
        `);

        try {
          console.log("Calling evalFunction");
          const result = evalFunction();
          console.log("Execution result:", result);

          if (result) {
            // Simply use the result directly
            console.log("Using result directly");
            set(molViewSpecJsonAtom, result);
          } else {
            console.error("No valid MVS data was generated");
          }
        } catch (error) {
          console.error("Error during JS execution:", error);
        }
      } catch (error) {
        console.error("Error setting up JS execution:", error);
      }
    },
  );

  return {
    codeAtom,
    molViewSpecJsonAtom,
    molstarReadyAtom,
    initializeMolstarAtom,
    executeJsCodeAtom,
  };
}

// Provider component that creates a new atom scope
export function JSMolViewSpecApp({ initialCode = "", children }) {
  const atomScope = useMemo(() => createJSAtomScope(), []);

  return (
    <JotaiProvider>
      <JSAtomScopeContext.Provider value={atomScope}>
        {children}
      </JSAtomScopeContext.Provider>
    </JotaiProvider>
  );
}

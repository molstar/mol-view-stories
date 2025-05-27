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

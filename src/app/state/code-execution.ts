export const executeJavaScriptCode = async (code: string): Promise<unknown> => {
  try {
    if (!code) {
      throw new Error("No JavaScript code to execute");
    }

    const evalFunction = new Function(`
      try {
        ${code}
        return mvsData;
      } catch (error) {
        console.error("Error executing JS code:", error);
        throw error;
      }
    `);
    
    return evalFunction();
  } catch (error) {
    console.error("Error in executeJavaScriptCode:", error);
    throw error;
  }
};
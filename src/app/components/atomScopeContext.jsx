import React, { createContext, useContext } from "react";

// Create a context to pass the atom scope
const AtomScopeContext = createContext(null);

// Hook to access the current atom scope
export function useAtomScope() {
  const scope = useContext(AtomScopeContext);
  if (!scope) {
    throw new Error("useAtomScope must be used within an AtomScopeProvider");
  }
  return scope;
}

// Generic provider component
export function AtomScopeProvider({ atomScope, children }) {
  return (
    <AtomScopeContext.Provider value={atomScope}>
      {children}
    </AtomScopeContext.Provider>
  );
}
"use client";

import React, { createContext, useContext } from "react";

type Features = { accountsEnabled: boolean };

const FeaturesContext = createContext<Features>({ accountsEnabled: false });

/** Server-decided switches (see src/features.ts), handed to client components. */
export function FeaturesProvider({ value, children }: { value: Features; children: React.ReactNode }) {
  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>;
}

export function useFeatures() {
  return useContext(FeaturesContext);
}

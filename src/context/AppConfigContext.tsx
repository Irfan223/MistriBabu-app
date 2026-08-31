import { createContext, useContext, type ReactNode } from "react";
import {
  useAppConfig,
  type AppConfigState,
  type ServiceCategory,
  type SubService,
  type TrustBadge,
  type TimeSlot,
} from "@/hooks/useAppConfig";

export type { ServiceCategory, SubService, TrustBadge, TimeSlot };

const AppConfigContext = createContext<AppConfigState | null>(null);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const appConfig = useAppConfig();
  return (
    <AppConfigContext.Provider value={appConfig}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useConfig(): AppConfigState {
  const ctx = useContext(AppConfigContext);
  if (!ctx)
    throw new Error("useConfig must be used inside <AppConfigProvider>");
  return ctx;
}

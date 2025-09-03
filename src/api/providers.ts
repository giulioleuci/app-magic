
import type { Provider } from "@/lib/types";

export const availableProviders: Provider[] = [
  { id: 'scryfall', name: 'Scryfall' },
  // Future providers can be added here
];

export const defaultProviderId = availableProviders[0].id;

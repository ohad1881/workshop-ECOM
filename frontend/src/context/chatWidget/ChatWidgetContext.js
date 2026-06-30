import { createContext } from 'react';

// Bare context object for the global AI chat widget. The provider lives above the
// router so an in-flight answer survives closing the panel or navigating.
export const ChatWidgetContext = createContext(null);

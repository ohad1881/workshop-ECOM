import { useContext } from 'react';
import { ChatWidgetContext } from './ChatWidgetContext';

export const useChatWidget = () => {
  const context = useContext(ChatWidgetContext);
  if (!context) {
    throw new Error('useChatWidget must be used within ChatWidgetProvider');
  }
  return context;
};

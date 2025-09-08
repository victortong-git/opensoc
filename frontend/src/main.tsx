import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';

// Suppress React DevTools message without interfering with fast refresh
if (import.meta.env.DEV) {
  const originalConsoleInfo = console.info;
  const originalConsoleLog = console.log;
  
  const filterReactDevToolsMessage = (...args: any[]) => {
    return args.some(arg => 
      typeof arg === 'string' && (
        arg.includes('Download the React DevTools for a better development experience') ||
        arg.includes('https://reactjs.org/link/react-devtools') ||
        arg.includes('react-devtools') ||
        arg.includes('React DevTools') ||
        arg.includes('for a better development experience')
      )
    );
  };
  
  console.info = (...args: any[]) => {
    if (!filterReactDevToolsMessage(...args)) {
      originalConsoleInfo.apply(console, args);
    }
  };
  
  console.log = (...args: any[]) => {
    if (!filterReactDevToolsMessage(...args)) {
      originalConsoleLog.apply(console, args);
    }
  };
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
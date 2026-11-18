import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import {Provider} from 'react-redux';

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import {store} from './store/store.js';
import { SocketProvider } from './contexts/SocketContext.jsx';
import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient();

// Prefer CineSeat cinema-night theme (migrate away from legacy luxury)
const storedTheme = localStorage.getItem('theme');
if (!storedTheme || storedTheme === 'luxury' || storedTheme === 'dark') {
  localStorage.setItem('theme', 'cineseat');
  document.documentElement.setAttribute('data-theme', 'cineseat');
} else {
  document.documentElement.setAttribute('data-theme', storedTheme);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    
    <BrowserRouter><Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <App />
          <ReactQueryDevtools />
        </SocketProvider>
      </QueryClientProvider></Provider>
    </BrowserRouter>
    
  </StrictMode>
);

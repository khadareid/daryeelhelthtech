// src/main.tsx
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import AppProviders from "./App"; 
import "@/styles/globals.css";
import "@/styles/themes.css";
import { store } from "./Redex/store/store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <AppProviders />
    <Toaster richColors position="top-right" />
  </Provider>
);
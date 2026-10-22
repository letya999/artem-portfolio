import {I18nProvider} from './i18n.jsx';
import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/oswald";
import App from "./App.jsx";
import "./style.css";
createRoot(document.getElementById("root")).render(<I18nProvider><App /></I18nProvider>);

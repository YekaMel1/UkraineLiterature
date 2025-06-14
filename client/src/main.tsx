import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Load Material Icons from Google
const link = document.createElement("link");
link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
link.rel = "stylesheet";
document.head.appendChild(link);

// Load Roboto font
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// Set page title in Ukrainian
document.title = "Українська література";

// Render the app
createRoot(document.getElementById("root")!).render(<App />);

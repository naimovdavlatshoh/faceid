import AppRouter from "./router/AppRouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "sonner";

function App() {
    return (
        <ThemeProvider>
            <AppRouter />
            <Toaster position="top-right" richColors />
        </ThemeProvider>
    );
}

export default App;

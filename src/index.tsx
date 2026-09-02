import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Router from "./routes/Router";
import { ThemeProvider } from './components/providers/ThemeProvider';
import { initializeTheme } from './lib/theme/theme';

const initialTheme = initializeTheme();

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
)

root.render(
    <ThemeProvider initialTheme={initialTheme}>
        <Router/>
    </ThemeProvider>
)

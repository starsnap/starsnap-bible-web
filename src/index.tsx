import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Router from "./routes/Router";
import {GoogleOAuthProvider} from "@react-oauth/google";
import { queryClient } from './lib/query/queryClient';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { initializeTheme } from './lib/theme/theme';

const initialTheme = initializeTheme();

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
)

root.render(
    <ThemeProvider initialTheme={initialTheme}>
        <QueryClientProvider client={queryClient}>
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID as string}>
                <Router/>
            </GoogleOAuthProvider>
        </QueryClientProvider>
    </ThemeProvider>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

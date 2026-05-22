import React, { createContext, useContext, useState } from "react";

interface SignUpModalContextType {
    showModal: boolean;
    setShowModal: (v: boolean) => void;
    username: string;
    setUsername: (v: string) => void;
    googleToken: string | null;
    setGoogleToken: (v: string | null) => void;
}

const SignUpModalContext = createContext<SignUpModalContextType | null>(null);

export const SignUpModalProvider = ({ children }: { children: React.ReactNode }) => {
    const [showModal, setShowModal] = useState(false);
    const [username, setUsername] = useState("");
    const [googleToken, setGoogleToken] = useState<string | null>(null);

    return (
        <SignUpModalContext.Provider value={{
            showModal, setShowModal,
            username, setUsername,
            googleToken, setGoogleToken
        }}>
            {children}
        </SignUpModalContext.Provider>
    );
};

export const useSignUpModalContext = () => {
    const ctx = useContext(SignUpModalContext);
    if (!ctx) throw new Error("useSignUpModalContext must be used within SignUpModalProvider");
    return ctx;
};


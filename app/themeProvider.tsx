"use client";

import { HeroUIProvider } from "@heroui/react";

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return(
        <HeroUIProvider>
            {children}
        </HeroUIProvider>
    );
}

export default ThemeProvider;
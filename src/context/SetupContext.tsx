import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { hasCompletedSetup, setSetupCompleted as saveSetupCompleted, resetSetup as clearSetup } from '../utils/favorites';

interface SetupContextType {
    setupCompleted: boolean;
    setSetupCompleted: (completed: boolean) => void;
    resetSetup: () => void;
}

const SetupContext = createContext<SetupContextType | undefined>(undefined);

export const SetupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [setupCompleted, setSetupState] = useState(hasCompletedSetup());

    const setSetupCompleted = (completed: boolean) => {
        saveSetupCompleted(completed);
        setSetupState(completed);
    };

    const resetSetup = () => {
        clearSetup();
        setSetupState(false);
    };

    return (
        <SetupContext.Provider value={{ setupCompleted, setSetupCompleted, resetSetup }}>
            {children}
        </SetupContext.Provider>
    );
};

export const useSetup = () => {
    const context = useContext(SetupContext);
    if (!context) {
        throw new Error('useSetup must be used within a SetupProvider');
    }
    return context;
};

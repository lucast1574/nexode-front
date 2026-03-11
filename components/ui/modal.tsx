"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Button } from "./button";
import { AlertCircle, HelpCircle, Info, CheckCircle2, X } from "lucide-react";

type ModalType = "info" | "success" | "warning" | "error" | "confirm";

interface ModalOptions {
    title: string;
    message: string;
    type?: ModalType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface ModalContextType {
    showAlert: (options: ModalOptions) => void;
    showConfirm: (options: ModalOptions) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<(ModalOptions & { isOpen: boolean }) | null>(null);

    const showAlert = (options: ModalOptions) => {
        setModal({ ...options, type: options.type || "info", isOpen: true });
    };

    const showConfirm = (options: ModalOptions) => {
        setModal({ ...options, type: "confirm", isOpen: true });
    };

    const closeModal = () => {
        setModal(prev => prev ? { ...prev, isOpen: false } : null);
    };

    const handleConfirm = () => {
        if (modal?.onConfirm) modal.onConfirm();
        closeModal();
    };

    const handleCancel = () => {
        if (modal?.onCancel) modal.onCancel();
        closeModal();
    };

    const renderIcon = () => {
        switch (modal?.type) {
            case "success": return <CheckCircle2 className="w-12 h-12 text-emerald-500" />;
            case "error": return <AlertCircle className="w-12 h-12 text-red-500" />;
            case "warning": return <AlertCircle className="w-12 h-12 text-amber-500" />;
            case "confirm": return <HelpCircle className="w-12 h-12 text-blue-500" />;
            default: return <Info className="w-12 h-12 text-blue-500" />;
        }
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            {modal?.isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-[#080808] border border-white/10 rounded-[40px] p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl pointer-events-none" />
                        
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl">
                                {renderIcon()}
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black tracking-tighter uppercase text-white">{modal.title}</h3>
                                <p className="text-zinc-500 text-sm font-bold leading-relaxed">{modal.message}</p>
                            </div>

                            <div className="w-full flex flex-col gap-3 pt-4">
                                <Button 
                                    onClick={handleConfirm}
                                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 transform transition-all active:scale-95"
                                >
                                    {modal.confirmText || "Confirm"}
                                </Button>
                                
                                {modal.type === "confirm" && (
                                    <Button 
                                        variant="ghost"
                                        onClick={handleCancel}
                                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 font-black uppercase tracking-widest text-xs transition-all"
                                    >
                                        {modal.cancelText || "Cancel"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={closeModal}
                            className="absolute top-6 right-6 w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-zinc-600 hover:bg-white/5 hover:text-white transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
}

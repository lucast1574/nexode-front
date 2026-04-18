"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, HelpCircle, Info, CheckCircle2 } from "lucide-react";

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
    const [modal, setModal] = useState<(ModalOptions & { isOpen: boolean; isConfirm: boolean }) | null>(null);

    const showAlert = useCallback((options: ModalOptions) => {
        setModal({ ...options, type: options.type || "info", isOpen: true, isConfirm: false });
    }, []);

    const showConfirm = useCallback((options: ModalOptions) => {
        setModal({ ...options, type: "confirm", isOpen: true, isConfirm: true });
    }, []);

    const handleClose = useCallback(() => {
        setModal(null);
    }, []);

    const handleConfirm = useCallback(() => {
        modal?.onConfirm?.();
        handleClose();
    }, [modal, handleClose]);

    const handleCancel = useCallback(() => {
        modal?.onCancel?.();
        handleClose();
    }, [modal, handleClose]);

    const renderIcon = () => {
        switch (modal?.type) {
            case "success": return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
            case "error": return <AlertCircle className="w-6 h-6 text-red-500" />;
            case "warning": return <AlertCircle className="w-6 h-6 text-amber-500" />;
            case "confirm": return <HelpCircle className="w-6 h-6 text-blue-500" />;
            default: return <Info className="w-6 h-6 text-blue-500" />;
        }
    };

    const contextValue = useCallback(() => ({ showAlert, showConfirm }), [showAlert, showConfirm]);

    return (
        <ModalContext.Provider value={contextValue()}>
            {children}
            {modal?.isOpen && (
                <Dialog open={modal.isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                                    {renderIcon()}
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-semibold">{modal.title}</DialogTitle>
                                    <DialogDescription className="mt-1">{modal.message}</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <DialogFooter className="flex-row gap-2 sm:justify-end">
                            {modal.isConfirm && (
                                <DialogClose render={<Button variant="outline" />} onClick={handleCancel}>
                                    {modal.cancelText || "Cancel"}
                                </DialogClose>
                            )}
                            <DialogClose render={<Button />} onClick={handleConfirm}>
                                {modal.confirmText || "Confirm"}
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
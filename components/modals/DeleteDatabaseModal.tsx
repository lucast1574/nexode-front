"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteDatabaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    dbName: string;
}

export function DeleteDatabaseModal({ isOpen, onClose, onConfirm, dbName }: DeleteDatabaseModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 shadow-2xl relative text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                    <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-black mb-2">Delete Instance?</h2>
                <p className="text-zinc-500 text-sm mb-8">
                    You are about to delete <span className="text-white font-bold">&quot;{dbName}&quot;</span>.
                    This action is permanent and cannot be reversed.
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={onConfirm}
                        className="w-full rounded-2xl h-12 font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                    >
                        Confirm Deletion
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full rounded-2xl h-12 font-bold text-zinc-500 hover:text-white"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}

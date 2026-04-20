"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

interface DeleteDatabaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    dbName: string;
}

export function DeleteDatabaseModal({ isOpen, onClose, onConfirm, dbName }: DeleteDatabaseModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <DialogTitle>Delete Instance?</DialogTitle>
                            <DialogDescription>
                                You are about to delete <strong>&quot;{dbName}&quot;</strong>.
                                This action is permanent and cannot be reversed.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                        Cancel
                    </DialogClose>
                    <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>
                        Confirm Deletion
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

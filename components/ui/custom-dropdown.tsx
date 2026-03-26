"use client";

import React, { useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomDropdownProps {
    name: string;
    options: { value: string; label: string; icon: React.ElementType }[];
    defaultValue: string;
    onChange?: (value: string) => void;
    searchable?: boolean;
}

export function CustomDropdown({ name, options, defaultValue, onChange, searchable = false }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(options.find(o => o.value === defaultValue) || options[0]);
    const [search, setSearch] = useState('');

    // Adjust state when props change (React 18+ pattern)
    const [prevOptions, setPrevOptions] = useState(options);
    const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);

    if (defaultValue !== prevDefaultValue) {
        setPrevDefaultValue(defaultValue);
        setSelected(options.find(o => o.value === defaultValue) || options[0]);
    }

    if (options !== prevOptions) {
        setPrevOptions(options);
        const stillExists = options.find(o => o.value === selected.value);
        if (!stillExists) {
            setSelected(options.find(o => o.value === defaultValue) || options[0]);
        } else {
            // Update reference but keep the same selected value
            setSelected(stillExists);
        }
    }

    const filteredOptions = searchable 
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    return (
        <div className="relative group/dropdown">
            <input type="hidden" name={name} value={selected.value} />
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 rounded-[22px] h-[72px] px-6 font-bold flex items-center justify-between transition-all outline-none relative overflow-hidden group/btn",
                    isOpen ? "border-blue-500/40 bg-white/[0.05] ring-4 ring-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)]" : ""
                )}
            >
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <div className="flex items-center gap-5 relative z-10">
                    <div className={cn(
                        "w-12 h-12 rounded-[18px] flex items-center justify-center border transition-all duration-500 shadow-lg",
                        isOpen ? "bg-blue-600/20 border-blue-500/40 rotate-6" : "bg-white/[0.02] border-white/5"
                    )}>
                        <selected.icon className={cn("w-6 h-6", isOpen ? "text-blue-400" : "text-zinc-500")} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className={cn("text-xs font-black tracking-[0.05em] uppercase leading-none mb-1", isOpen ? "text-white" : "text-zinc-400")}>{selected.label}</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Selected</span>
                    </div>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-zinc-600 transition-all duration-500", isOpen && "rotate-180 text-blue-500 scale-125")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[110] bg-black/5" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-4 bg-[#0a0a0a]/90 border border-white/10 rounded-[32px] overflow-hidden z-[120] shadow-[0_30px_90px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-3xl p-2 border-t-white/20">
                        {searchable && (
                            <div className="p-3 border-b border-white/5 mb-2">
                                <div className="relative group/search">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within/search:text-blue-500" />
                                    <input 
                                        type="text"
                                        placeholder="Search..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl h-11 pl-12 pr-4 text-xs font-black uppercase tracking-widest text-white placeholder:text-zinc-800 outline-none focus:border-blue-500/30 transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}
                        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        setSelected(opt);
                                        setIsOpen(false);
                                        setSearch('');
                                        if (onChange) onChange(opt.value);
                                    }}
                                    className={cn(
                                        "w-full text-left px-4 py-4 rounded-[22px] flex items-center justify-between transition-all group/opt relative overflow-hidden",
                                        selected.value === opt.value
                                            ? "bg-blue-600/10 text-white"
                                            : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={cn(
                                            "w-11 h-11 rounded-[18px] flex items-center justify-center border transition-all duration-300",
                                            selected.value === opt.value
                                                ? "bg-blue-600/20 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                                : "bg-[#080808] border-white/5 group-hover/opt:border-white/10 group-hover/opt:scale-105"
                                        )}>
                                            <opt.icon className={cn("w-5 h-5", selected.value === opt.value ? "text-blue-400" : "text-zinc-600 group-hover/opt:text-zinc-400")} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-[10px] uppercase tracking-widest leading-none">{opt.label}</span>
                                            {selected.value === opt.value && <span className="text-[9px] font-bold text-blue-500/60 mt-1 uppercase">Selected</span>}
                                        </div>
                                    </div>
                                    {selected.value === opt.value && (
                                        <div className="relative z-10 w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/40">
                                            <Check className="w-3 h-3 text-blue-500" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

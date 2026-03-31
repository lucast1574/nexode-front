"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink, Info, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    link: string;
    viewed: boolean;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unviewedCount, setUnviewedCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const markAsViewed = React.useCallback(async (id: string) => {
        const token = getAccessToken();
        if (!token) return;

        try {
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            const query = `
                mutation MarkViewed($id: ID!) {
                    markNotificationAsViewed(id: $id)
                }
            `;

            await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ query, variables: { id } }),
            });

            setNotifications(prev => prev.map(n => n._id === id ? { ...n, viewed: true } : n));
            setUnviewedCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as viewed:", error);
        }
    }, []);

    const knownIds = useRef<Set<string>>(new Set());

    const fetchNotifications = React.useCallback(async (isInitial = false) => {
        const token = getAccessToken();
        if (!token) return;

        try {
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            const query = `
                query GetMyNotifications {
                    myNotifications {
                        _id
                        title
                        message
                        type
                        link
                        viewed
                        created_at
                    }
                }
            `;

            const response = await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ query }),
            });

            const result = await response.json();
            if (result.data?.myNotifications) {
                const fetched = result.data.myNotifications as Notification[];
                
                // Trigger toast for new unread notifications (not during initial load)
                if (!isInitial) {
                    fetched.forEach(n => {
                        if (!n.viewed && !knownIds.current.has(n._id)) {
                            toast(n.title, {
                                description: n.message,
                                action: {
                                    label: "View",
                                    onClick: () => {
                                        markAsViewed(n._id);
                                        router.push(n.link);
                                    }
                                },
                                // Use appropriate icon based on type
                                icon: n.type === 'success' ? <CheckCircle2 className="text-green-500" /> : 
                                      n.type === 'error' ? <XCircle className="text-red-500" /> :
                                      n.type === 'warning' ? <AlertTriangle className="text-yellow-500" /> : 
                                      <Info className="text-blue-500" />
                            });
                        }
                    });
                }

                // Update known IDs
                fetched.forEach(n => knownIds.current.add(n._id));
                
                setNotifications(fetched);
                setUnviewedCount(fetched.filter((n: Notification) => !n.viewed).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, [markAsViewed, router]);

    useEffect(() => {
        const init = async () => {
            await fetchNotifications(true);
        };
        init();
        
        // Poll every 30 seconds for new notifications
        const interval = setInterval(() => fetchNotifications(false), 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const markAllAsViewed = async () => {
        const token = getAccessToken();
        if (!token) return;

        try {
            const GQL_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql";
            const query = `
                mutation MarkAllViewed {
                    markAllNotificationsAsViewed
                }
            `;

            await fetch(GQL_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ query }),
            });

            setNotifications(prev => prev.map(n => ({ ...n, viewed: true })));
            setUnviewedCount(0);
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Failed to mark all notifications as viewed:", error);
        }
    };

    const handleNotificationClick = (n: Notification) => {
        if (!n.viewed) markAsViewed(n._id);
        setIsOpen(false);
        router.push(n.link);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "success": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case "error": return <XCircle className="w-5 h-5 text-red-500" />;
            case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "rounded-full relative w-12 h-12 hover:bg-white/5 transition-all",
                    isOpen && "bg-white/5"
                )}
            >
                <Bell className={cn("w-6 h-6 transition-all", unviewedCount > 0 ? "text-primary animate-pulse" : "text-zinc-400")} />
                {unviewedCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-primary text-black text-[10px] font-black rounded-full border-2 border-[#020202] flex items-center justify-center">
                        {unviewedCount > 9 ? "9+" : unviewedCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-[400px] bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <div>
                            <h3 className="text-lg font-black tracking-tight">Protocol Alerts</h3>
                            <p className="text-xs text-zinc-500 font-medium">System events and status updates</p>
                        </div>
                        {unviewedCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsViewed}
                                className="text-xs py-1 h-auto rounded-xl hover:bg-white/10 text-primary font-bold gap-2"
                            >
                                <Check className="w-3.5 h-3.5" /> Read All
                            </Button>
                        )}
                    </div>

                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                    <Bell className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h4 className="text-zinc-400 font-bold mb-1">Silence is Golden</h4>
                                <p className="text-xs text-zinc-600">No active alerts at the moment.</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        "p-5 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 group relative",
                                        !n.viewed && "bg-primary/5 border-l-2 border-l-primary"
                                    )}
                                >
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 transition-colors group-hover:border-white/20",
                                            !n.viewed ? "bg-primary/10" : "bg-white/5"
                                        )}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className={cn("text-sm font-bold truncate", !n.viewed ? "text-white" : "text-zinc-400")}>
                                                    {n.title}
                                                </h4>
                                                <span className="text-[10px] text-zinc-600 font-medium whitespace-nowrap ml-2">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className={cn("text-xs line-clamp-2 leading-relaxed", !n.viewed ? "text-zinc-300" : "text-zinc-500")}>
                                                {n.message}
                                            </p>
                                        </div>
                                        <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="w-4 h-4 text-zinc-500 hover:text-primary" />
                                        </div>
                                    </div>
                                    {!n.viewed && (
                                        <span className="absolute top-5 right-5 w-2 h-2 bg-primary rounded-full" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-4 bg-white/5 text-center border-t border-white/10">
                            <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">
                                Alerts auto-expire after 7 days
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

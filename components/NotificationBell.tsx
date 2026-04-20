"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, ExternalLink, Info, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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

    const knownIds = React.useRef<Set<string>>(new Set());

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
            case "success": return <CheckCircle2 className="size-5 text-green-500" />;
            case "error": return <XCircle className="size-5 text-red-500" />;
            case "warning": return <AlertTriangle className="size-5 text-yellow-500" />;
            default: return <Info className="size-5 text-blue-500" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger 
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "rounded-full relative size-9 transition-all",
                            isOpen && "bg-muted"
                        )}
                    >
                        <Bell className={cn("size-4 transition-all", unviewedCount > 0 ? "text-primary animate-pulse" : "text-muted-foreground")} />
                        {unviewedCount > 0 && (
                            <span className="absolute -top-1 -right-1 px-1 py-0.5 min-w-[16px] h-[16px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unviewedCount > 9 ? "9+" : unviewedCount}
                            </span>
                        )}
                    </Button>
                }
            />
            <PopoverContent className="w-[400px] p-0" align="end" sideOffset={8}>
                <Card className="border-0 shadow-none">
                    <CardHeader className="p-6 border-b bg-muted flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg font-semibold tracking-tight">Protocol Alerts</CardTitle>
                            <CardDescription className="text-xs font-medium">System events and status updates</CardDescription>
                        </div>
                        {unviewedCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsViewed}
                                className="text-xs py-1 h-auto rounded-xl gap-2"
                            >
                                <Check className="size-3.5" /> Read All
                            </Button>
                        )}
                    </CardHeader>
                    <ScrollArea className="h-[450px]">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center bg-card">
                                <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                                    <Bell className="size-8 text-muted-foreground" />
                                </div>
                                <h4 className="text-muted-foreground font-bold mb-1">Silence is Golden</h4>
                                <p className="text-xs text-muted-foreground">No active alerts at the moment.</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        "p-5 border-b border-border cursor-pointer transition-all hover:bg-muted group relative bg-card",
                                        !n.viewed && "bg-muted border-l-2 border-l-primary"
                                    )}
                                >
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "size-10 rounded-xl flex items-center justify-center shrink-0 border border-border transition-colors group-hover:border-primary/30",
                                            !n.viewed ? "bg-zinc-700" : "bg-muted"
                                        )}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className={cn("text-sm font-bold truncate", !n.viewed ? "text-foreground" : "text-muted-foreground")}>
                                                    {n.title}
                                                </h4>
                                                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap ml-2">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className={cn("text-xs line-clamp-2 leading-relaxed", !n.viewed ? "text-foreground" : "text-muted-foreground")}>
                                                {n.message}
                                            </p>
                                        </div>
                                        <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="size-4 text-muted-foreground hover:text-primary" />
                                        </div>
                                    </div>
                                    {!n.viewed && (
                                        <span className="absolute top-5 right-5 size-2 bg-primary rounded-full" />
                                    )}
                                </div>
                            ))
                        )}
                    </ScrollArea>
                    {notifications.length > 0 && (
                        <CardFooter className="p-4 bg-muted text-center border-t border-border flex justify-center">
                            <p className="text-xs text-muted-foreground font-medium">
                                Alerts auto-expire after 7 days
                            </p>
                        </CardFooter>
                    )}
                </Card>
            </PopoverContent>
        </Popover>
    );
}

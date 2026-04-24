export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
    notifications_enabled?: boolean;
    role: {
        slug: string;
    };
    subscription?: {
        status: string;
        plan?: {
            slug: string;
        };
    };
    /**
     * True once the user has consumed their one-time 7-day free trial on
     * any paid plan. Used to hide "Free trial" badges and skip trial setup
     * on subsequent checkouts.
     */
    trial_used?: boolean;
    github_profile?: {
        username: string;
        avatar_url?: string;
    };
    gitlab_profile?: {
        username: string;
        avatar_url?: string;
    };
}

export interface AuthResponse {
    success: boolean;
    message: string;
    access_token: string;
    refresh_token: string;
    expires_token: number;
    user: User;
}

export interface LoginData {
    login: AuthResponse;
}

export interface GoogleLoginData {
    signInWithGoogle: AuthResponse;
}

export interface RegisterData {
    success: boolean;
    message: string;
    access_token?: string;
    refresh_token?: string;
    user: User;
}

export interface VerifyEmailData {
    verifyEmail: AuthResponse;
}


// Subscription types (used across dashboard pages)
export interface SubscriptionPlan {
    name: string;
    slug: string;
    features: Record<string, string>;
    price_monthly?: number;
    price_annual?: number;
}

export interface SubscriptionBase {
    id: string;
    service: string;
    status: string;
    billing_cycle?: string;
    created_on?: string;
    /**
     * End-of-period timestamp. During a trial this is the trial end date;
     * otherwise it's the current Stripe billing period end.
     */
    expired_at?: string;
    plan: SubscriptionPlan;
}

// Database instance types
export interface DatabaseInstance {
    _id: string;
    name: string;
    type: string;
    status: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    db_name?: string;
    connection_string?: string;
    public_uri?: string;
    internal_uri?: string;
    created_on: string;
    events?: { timestamp: string; message: string; type: string }[];
}

// Notification types
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    read: boolean;
    created_on: string;
}

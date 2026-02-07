export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
    role: string;
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

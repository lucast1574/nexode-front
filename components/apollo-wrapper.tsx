"use client";

import { ApolloLink, HttpLink } from "@apollo/client";
import {
    ApolloNextAppProvider,
    InMemoryCache,
    ApolloClient,
} from "@apollo/experimental-nextjs-app-support";
import { getAccessToken } from "@/lib/auth-utils";

const authLink = new ApolloLink((operation, forward) => {
    const token = typeof window !== "undefined" ? getAccessToken() : null;
    if (token) {
        operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
            headers: {
                ...headers,
                Authorization: `Bearer ${token}`,
            },
        }));
    }
    return forward(operation);
});

function makeClient() {
    const httpLink = new HttpLink({
        uri: process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql",
        credentials: "include",
    });

    return new ApolloClient({
        cache: new InMemoryCache(),
        link: ApolloLink.from([authLink, httpLink]),
    });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
    return (
        <ApolloNextAppProvider makeClient={makeClient}>
            {children}
        </ApolloNextAppProvider>
    );
}

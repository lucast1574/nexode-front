"use client";

import { ApolloLink, HttpLink } from "@apollo/client";
import {
    ApolloNextAppProvider,
    InMemoryCache,
    ApolloClient,
} from "@apollo/experimental-nextjs-app-support";

function makeClient() {
    const httpLink = new HttpLink({
        uri: process.env.NEXT_PUBLIC_API_URL || "https://backend.nexode.app/api-v1/graphql",
    });

    return new ApolloClient({
        cache: new InMemoryCache(),
        link:
            typeof window === "undefined"
                ? ApolloLink.from([httpLink])
                : ApolloLink.from([httpLink]),
    });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
    return (
        <ApolloNextAppProvider makeClient={makeClient}>
            {children}
        </ApolloNextAppProvider>
    );
}

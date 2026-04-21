import { gql } from "@apollo/client";

// ═══════════════════════════════════════════════════════
// AUTH FRAGMENTS
// ═══════════════════════════════════════════════════════

const AUTH_USER_FRAGMENT = gql`
    fragment AuthUserFields on UserEntity {
        id
        email
        first_name
        last_name
        avatar
        role {
            slug
        }
        subscription {
            status
            plan {
                slug
            }
        }
    }
`;

const AUTH_RESPONSE_FRAGMENT = gql`
    ${AUTH_USER_FRAGMENT}
    fragment AuthResponseFields on AuthResponse {
        success
        message
        access_token
        refresh_token
        expires_token
        user {
            ...AuthUserFields
        }
    }
`;

// ═══════════════════════════════════════════════════════
// AUTH MUTATIONS
// ═══════════════════════════════════════════════════════

export const LOGIN_MUTATION = gql`
    ${AUTH_RESPONSE_FRAGMENT}
    mutation Login($input: LoginInput!) {
        login(input: $input) {
            ...AuthResponseFields
        }
    }
`;

export const SIGN_IN_WITH_GOOGLE = gql`
    ${AUTH_RESPONSE_FRAGMENT}
    mutation SignInWithGoogle($input: GoogleLoginInput!) {
        signInWithGoogle(input: $input) {
            ...AuthResponseFields
        }
    }
`;

export const REGISTER_MUTATION = gql`
    ${AUTH_RESPONSE_FRAGMENT}
    mutation Register($input: RegisterInput!) {
        register(input: $input) {
            ...AuthResponseFields
        }
    }
`;

export const VERIFY_EMAIL_MUTATION = gql`
    ${AUTH_RESPONSE_FRAGMENT}
    mutation VerifyEmail($email: String!, $code: String!) {
        verifyEmail(email: $email, code: $code) {
            ...AuthResponseFields
        }
    }
`;

export const STRIPE_LOGIN_MUTATION = gql`
    ${AUTH_RESPONSE_FRAGMENT}
    mutation StripeLogin($sessionId: String!) {
        stripeLogin(sessionId: $sessionId) {
            ...AuthResponseFields
        }
    }
`;

// ═══════════════════════════════════════════════════════
// SUBSCRIPTION FRAGMENTS
// ═══════════════════════════════════════════════════════

const SUBSCRIPTION_FRAGMENT = gql`
    fragment SubscriptionFields on UserSubscriptionEntity {
        id
        service
        status
        billing_cycle
        created_on
        plan {
            name
            slug
            features
            price_monthly
            price_annual
        }
    }
`;

// ═══════════════════════════════════════════════════════
// USER QUERIES
// ═══════════════════════════════════════════════════════

export const GET_ME = gql`
    query GetMe {
        me {
            first_name
            last_name
            email
            avatar
        }
    }
`;

export const GET_DASHBOARD_DATA = gql`
    ${SUBSCRIPTION_FRAGMENT}
    query GetDashboardData {
        me {
            first_name
            last_name
            email
            avatar
        }
        mySubscriptions {
            ...SubscriptionFields
        }
    }
`;

// ═══════════════════════════════════════════════════════
// SUBSCRIPTION QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════

export const GET_MY_SUBSCRIPTIONS = gql`
    ${SUBSCRIPTION_FRAGMENT}
    query GetMySubscriptions {
        mySubscriptions {
            ...SubscriptionFields
        }
    }
`;

export const CREATE_CHECKOUT_SESSION = gql`
    mutation CreateCheckout($items: [CheckoutItemInput!]!) {
        createCheckoutSession(items: $items)
    }
`;

export const CREATE_GUEST_CHECKOUT_SESSION = gql`
    mutation CreateGuestCheckout($items: [CheckoutItemInput!]!) {
        createGuestCheckoutSession(items: $items)
    }
`;

export const CREATE_CUSTOMER_PORTAL_SESSION = gql`
    mutation CreateCustomerPortalSession {
        createCustomerPortalSession
    }
`;

// ═══════════════════════════════════════════════════════
// BILLING QUERIES
// ═══════════════════════════════════════════════════════

export const GET_BILLING_DATA = gql`
    ${SUBSCRIPTION_FRAGMENT}
    query GetBillingData {
        me {
            first_name
            last_name
            email
            avatar
        }
        mySubscriptions {
            ...SubscriptionFields
        }
        myUsageStats(days: 30) {
            service
            feature
            total_amount
        }
        myUsageHistory(limit: 5) {
            id
            service
            feature
            amount
            description
            created_on
        }
    }
`;

// ═══════════════════════════════════════════════════════
// DATABASE QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════

const DATABASE_INSTANCE_FRAGMENT = gql`
    fragment DatabaseInstanceFields on DatabaseInstanceEntity {
        _id
        name
        type
        status
        host
        port
        username
        password
        db_name
        connection_string
        public_uri
        internal_uri
        created_on
        events {
            timestamp
            message
            type
        }
    }
`;

export const GET_DATABASES = gql`
    ${DATABASE_INSTANCE_FRAGMENT}
    ${SUBSCRIPTION_FRAGMENT}
    query GetDatabases {
        me {
            first_name
            email
            avatar
        }
        mySubscriptions {
            ...SubscriptionFields
        }
        myDatabases {
            ...DatabaseInstanceFields
        }
    }
`;

export const CREATE_DATABASE = gql`
    mutation CreateDatabase($input: CreateDatabaseInput!) {
        createDatabase(input: $input) {
            _id
            name
            status
        }
    }
`;

export const RESTART_DATABASE = gql`
    mutation RestartDatabase($id: String!) {
        restartDatabase(id: $id) {
            _id
            status
        }
    }
`;

export const DELETE_DATABASE = gql`
    mutation DeleteDatabase($id: String!) {
        deleteDatabase(id: $id)
    }
`;

export const EXECUTE_DATABASE_COMMAND = gql`
    mutation ExecuteDatabaseCommand($id: String!, $command: String!) {
        executeDatabaseCommand(id: $id, command: $command)
    }
`;

// ═══════════════════════════════════════════════════════
// N8N QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════

const N8N_INSTANCE_FRAGMENT = gql`
    fragment N8nInstanceFields on N8nInstanceEntity {
        _id
        name
        status
        generated_domain
        custom_domain
        webhook_url
        plan_id {
            name
            slug
        }
        events {
            timestamp
            message
            type
        }
    }
`;

export const GET_N8N_DATA = gql`
    ${N8N_INSTANCE_FRAGMENT}
    ${SUBSCRIPTION_FRAGMENT}
    query GetN8nData {
        me {
            first_name
            email
            avatar
        }
        mySubscriptions {
            ...SubscriptionFields
        }
        myN8nInstances {
            ...N8nInstanceFields
        }
    }
`;

export const CREATE_N8N_INSTANCE = gql`
    mutation CreateN8nInstance($input: CreateN8nInput!) {
        createN8nInstance(input: $input) {
            _id
            name
            status
        }
    }
`;

export const RESTART_N8N_INSTANCE = gql`
    mutation RestartN8nInstance($id: String!) {
        restartN8nInstance(id: $id) {
            _id
            status
        }
    }
`;

export const DELETE_N8N_INSTANCE = gql`
    mutation DeleteN8nInstance($id: String!) {
        deleteN8nInstance(id: $id)
    }
`;

// ═══════════════════════════════════════════════════════
// COMPUTE QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════

const COMPUTE_INSTANCE_FRAGMENT = gql`
    fragment ComputeInstanceFields on ComputeInstanceEntity {
        _id
        name
        type
        status
        provider
        repository_url
        branch
        generated_domain
        custom_domain
        cpu_limit
        ram_limit
        auto_deploy_on_push
        env_content
        events {
            timestamp
            message
            type
        }
    }
`;

export const GET_COMPUTE_DATA = gql`
    ${COMPUTE_INSTANCE_FRAGMENT}
    ${SUBSCRIPTION_FRAGMENT}
    query GetComputeData {
        me {
            first_name
            email
            avatar
        }
        mySubscriptions {
            ...SubscriptionFields
        }
        myComputeInstances {
            ...ComputeInstanceFields
        }
    }
`;

export const CREATE_COMPUTE_INSTANCE = gql`
    mutation CreateComputeInstance($input: CreateComputeInput!) {
        createComputeInstance(input: $input) {
            _id
            name
            status
        }
    }
`;

export const RESTART_COMPUTE_INSTANCE = gql`
    mutation RestartComputeInstance($id: String!) {
        restartComputeInstance(id: $id) {
            _id
            status
        }
    }
`;

export const DELETE_COMPUTE_INSTANCE = gql`
    mutation DeleteComputeInstance($id: String!) {
        deleteComputeInstance(id: $id)
    }
`;

export const EXECUTE_COMPUTE_COMMAND = gql`
    mutation ExecuteComputeCommand($id: String!, $command: String!) {
        executeComputeCommand(id: $id, command: $command)
    }
`;

export const UPDATE_COMPUTE_AUTO_DEPLOY = gql`
    mutation UpdateComputeAutoDeploy($id: String!, $enabled: Boolean!) {
        updateComputeAutoDeploy(id: $id, enabled: $enabled) {
            _id
            auto_deploy_on_push
        }
    }
`;

export const UPDATE_COMPUTE_ENV = gql`
    mutation UpdateComputeEnv($id: String!, $env_content: String!) {
        updateComputeEnvContent(id: $id, env_content: $env_content) {
            _id
        }
    }
`;

// ═══════════════════════════════════════════════════════
// NOTIFICATION QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════

export const GET_NOTIFICATIONS = gql`
    query GetNotifications {
        myNotifications {
            id
            title
            message
            type
            link
            read
            created_on
        }
    }
`;

export const MARK_NOTIFICATION_READ = gql`
    mutation MarkNotificationRead($id: String!) {
        markNotificationRead(id: $id)
    }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
    mutation MarkAllNotificationsRead {
        markAllNotificationsRead
    }
`;

// ═══════════════════════════════════════════════════════
// SETTINGS MUTATIONS
// ═══════════════════════════════════════════════════════

export const UPDATE_USER_PROFILE = gql`
    mutation UpdateUserProfile($input: UpdateUserInput!) {
        updateUser(input: $input) {
            first_name
            last_name
            avatar
            notifications_enabled
        }
    }
`;

export const GET_SETTINGS_DATA = gql`
    ${SUBSCRIPTION_FRAGMENT}
    query GetSettingsData {
        me {
            first_name
            last_name
            email
            avatar
            notifications_enabled
        }
        mySubscriptions {
            ...SubscriptionFields
        }
    }
`;
// ═══════════════════════════════════════════════════════
// ADMIN QUERIES
// ═══════════════════════════════════════════════════════

export const GET_ADMIN_DATA = gql`
    query GetAdminData {
        adminStats {
            totalSubscribers
            totalRevenue
            totalUsers
            activeSubscriptions
        }
        adminSubscriptions {
            id
            userEmail
            userName
            planName
            price
            billingCycle
            status
            createdOn
            service
            authProvider
            isVerified
        }
    }
`;

export const GET_ALL_USERS = gql`
    query GetAllUsers {
        findAllUsers {
            id
            first_name
            last_name
            email
            is_affiliate
            affiliate_code
            referral_count
            created_on
        }
    }
`;

// ═══════════════════════════════════════════════════════
// WORKSPACE QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════

export const GET_MY_WORKSPACES = gql`
    query GetMyWorkspaces {
        getMyWorkspaces {
            id
            _id
            name
            slug
            description
            owner_id
            members {
                user_id
                role
                added_at
            }
            sitemaps {
                _id
                url
                title
                added_at
            }
            created_on
        }
    }
`;

export const GET_WORKSPACE = gql`
    query GetWorkspace($id: ID!) {
        getWorkspace(id: $id) {
            id
            _id
            name
            slug
            description
            owner_id
            members {
                user_id
                role
                added_at
            }
            sitemaps {
                _id
                url
                title
                added_at
            }
            created_on
        }
    }
`;

export const INVITE_WORKSPACE_MEMBER = gql`
    mutation InviteWorkspaceMember($input: InviteWorkspaceMemberInput!) {
        inviteWorkspaceMember(input: $input) {
            id
            members {
                user_id
                role
                added_at
            }
        }
    }
`;

export const REMOVE_WORKSPACE_MEMBER = gql`
    mutation RemoveWorkspaceMember($workspaceId: ID!, $memberUserId: ID!) {
        removeWorkspaceMember(workspaceId: $workspaceId, memberUserId: $memberUserId) {
            id
            members {
                user_id
                role
                added_at
            }
        }
    }
`;

export const GENERATE_MY_AFFILIATE_LINK = gql`
    mutation GenerateMyAffiliateLink {
        generateMyAffiliateLink {
            id
            is_affiliate
            affiliate_code
            referral_count
        }
    }
`;

// ═══════════════════════════════════════════════════════
// AFFILIATE QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════

export const GET_AFFILIATE_STATS = gql`
    query GetAffiliateStats {
        myAffiliateStats {
            is_affiliate
            affiliate_code
            affiliate_link
            total_referrals
            total_converted
            total_commission
            available_balance
            pending_withdrawals
            min_withdrawal
            can_withdraw
        }
    }
`;

export const GET_MY_REFERRALS = gql`
    query GetMyReferrals {
        myReferrals {
            id
            referred_email
            referred_name
            status
            first_payment
            commission
            created_at
            converted_at
        }
    }
`;

export const GET_MY_WITHDRAWALS = gql`
    query GetMyWithdrawals {
        myWithdrawals {
            id
            amount
            payment_method
            payment_details
            status
            admin_notes
            created_at
            paid_at
        }
    }
`;

export const REQUEST_WITHDRAWAL = gql`
    mutation RequestWithdrawal($input: RequestWithdrawalInput!) {
        requestWithdrawal(input: $input) {
            id
            amount
            payment_method
            status
            created_at
        }
    }
`;

export const GET_ADMIN_WITHDRAWALS = gql`
    query GetAdminWithdrawals($status: String) {
        adminWithdrawals(status: $status) {
            id
            user_email
            user_name
            amount
            payment_method
            payment_details
            status
            admin_notes
            created_at
            paid_at
        }
    }
`;

export const MARK_WITHDRAWAL_PAID = gql`
    mutation MarkWithdrawalPaid($id: ID!, $adminNotes: String) {
        markWithdrawalPaid(id: $id, adminNotes: $adminNotes) {
            id
            amount
            status
            paid_at
        }
    }
`;

export const REJECT_WITHDRAWAL = gql`
    mutation RejectWithdrawal($id: ID!, $reason: String!) {
        rejectWithdrawal(id: $id, reason: $reason) {
            id
            status
        }
    }
`;

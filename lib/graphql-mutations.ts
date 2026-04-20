import { gql } from "@apollo/client";

export const SIGN_IN_WITH_GOOGLE = gql`
  mutation SignInWithGoogle($input: GoogleLoginInput!) {
    signInWithGoogle(input: $input) {
      success
      message
      access_token
      refresh_token
      expires_token
      user {
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
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      message
      access_token
      refresh_token
      expires_token
      user {
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
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      message
      access_token
      refresh_token
      expires_token
      user {
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
    }
  }
`;

export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($email: String!, $code: String!) {
    verifyEmail(email: $email, code: $code) {
      success
      message
      access_token
      refresh_token
      expires_token
      user {
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
    }
  }
`;

export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      success
      message
    }
  }
`;

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
        role
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
        role
      }
    }
  }
`;

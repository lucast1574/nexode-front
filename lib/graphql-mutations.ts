import { gql } from "@apollo/client";

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

export const GENERATE_AFFILIATE_LINK_MUTATION = gql`
  mutation GenerateAffiliateLink($userId: String!) {
    generateAffiliateLink(userId: $userId) {
      id
      is_affiliate
      affiliate_code
      referral_count
    }
  }
`;

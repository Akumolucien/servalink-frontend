export interface AuthSession {
  idToken: string;
  sub: string;
  email: string;
  groups: string[];
}

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** Cognito-style error name -> message a user can act on. */
export function friendlyAuthError(name: string, fallback?: string): AuthError {
  const messages: Record<string, string> = {
    UserNotConfirmedException: "Your email isn't verified yet. Enter the code we sent you.",
    NotAuthorizedException: "Incorrect email or password.",
    UserNotFoundException: "We couldn't find an account with that email.",
    UsernameExistsException: "An account with this email already exists. Log in instead.",
    CodeMismatchException: "That code isn't right. Check it and try again.",
    ExpiredCodeException: "That code has expired. Request a new one.",
    InvalidPasswordException: "Use at least 8 characters with an uppercase letter, a lowercase letter and a number.",
    InvalidParameterException: fallback || "Check the details you entered and try again.",
    LimitExceededException: "Too many attempts. Wait a few minutes and try again.",
    TooManyRequestsException: "Too many attempts. Wait a few minutes and try again.",
    NetworkError: "Can't reach ServaLink. Check your connection and try again.",
  };
  return new AuthError(name, messages[name] ?? (fallback || "Something went wrong. Please try again."));
}

export interface AuthAdapter {
  /** Current session, or null when signed out. forceRefresh re-issues the ID token (new Cognito groups). */
  getSession(forceRefresh?: boolean): Promise<AuthSession | null>;
  signIn(email: string, password: string, remember: boolean): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  confirmSignUp(email: string, code: string): Promise<void>;
  resendCode(email: string): Promise<void>;
  signOut(): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void>;
}

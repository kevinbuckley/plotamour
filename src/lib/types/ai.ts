export type AiFeature =
  | "what-if"
  | "scene-ideas"
  | "character-voice"
  | "pacing-check";
export type AiProvider = "google" | "chatgpt";
export interface ChatGptStatus {
  enabled: boolean;
  connected: boolean;
  planUsage: boolean;
  account?: string;
  models: { slug: string; display_name: string }[];
  error?: string;
}
export interface ChatGptRegistration {
  clientId: string;
  subject: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  scopes: string[];
  expiresAt: number;
}
export interface ChatGptTransaction {
  state: string;
  userId: string;
  nonce: string;
  verifier: string;
  redirectUri: string;
  expiresAt: number;
  registration?: Pick<ChatGptRegistration, "clientId" | "subject">;
}

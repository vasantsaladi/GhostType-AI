// This file is now just a type definition file since API calls are handled in the background script
export interface EnhanceTextResponse {
  text: string;
  error?: string;
}

export interface EnhanceTextRequest {
  action: "enhanceText";
  text: string;
}

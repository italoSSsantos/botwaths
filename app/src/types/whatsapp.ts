export interface Contact {
  id: string;
  name: string;
  phone: string;
  initials: string;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  participantCount: number;
  initials: string;
  color: string;
}

export type Recipient = (Contact & { type: "contact" }) | (Group & { type: "group" });

export type ConnectionStatus = "disconnected" | "qr" | "connecting" | "connected";

export interface SendSettings {
  interval: number;
  pauseEvery: number;
  pauseDuration: number;
}

export interface SendProgress {
  active: boolean;
  paused: boolean;
  current: string;
  sent: number;
  failed: number;
  total: number;
}

export interface Attachment {
  name: string;
  mime: string;
  base64: string;
  preview?: string;
}

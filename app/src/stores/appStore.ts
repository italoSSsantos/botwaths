import { create } from "zustand";
import type { Recipient, ConnectionStatus, SendSettings, SendProgress, Contact, Group, Attachment } from "@/types/whatsapp";

interface AppState {
  contacts: Contact[];
  groups: Group[];
  selectedRecipients: Recipient[];
  connectionStatus: ConnectionStatus;
  qrCode: string | null;
  sendSettings: SendSettings;
  sendProgress: SendProgress;
  message: string;
  attachment: Attachment | null;
  activePage: "send" | "connection" | "settings";
  activeCampaignId: string | null;

  setActivePage: (p: AppState["activePage"]) => void;
  setActiveCampaignId: (id: string | null) => void;
  toggleRecipient: (r: Recipient) => void;
  selectAllContacts: () => void;
  selectAllGroups: () => void;
  clearSelection: () => void;
  setConnectionStatus: (s: ConnectionStatus) => void;
  setQrCode: (qr: string | null) => void;
  setContacts: (contacts: Contact[]) => void;
  setGroups: (groups: Group[]) => void;
  setSendSettings: (s: Partial<SendSettings>) => void;
  setMessage: (m: string) => void;
  setAttachment: (a: Attachment | null) => void;
  setSendProgress: (p: Partial<SendProgress>) => void;
  startSending: () => void;
  pauseSending: () => void;
  resumeSending: () => void;
  cancelSending: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  contacts: [],
  groups: [],
  selectedRecipients: [],
  connectionStatus: "disconnected",
  qrCode: null,
  sendSettings: { interval: 5, pauseEvery: 10, pauseDuration: 30 },
  sendProgress: { active: false, paused: false, current: "", sent: 0, failed: 0, total: 0 },
  message: "",
  attachment: null,
  activePage: "send",
  activeCampaignId: null,

  setActivePage: (activePage) => set({ activePage }),
  setActiveCampaignId: (activeCampaignId) => set({ activeCampaignId }),
  toggleRecipient: (r) =>
    set((s) => {
      const exists = s.selectedRecipients.find((x) => x.id === r.id);
      return {
        selectedRecipients: exists
          ? s.selectedRecipients.filter((x) => x.id !== r.id)
          : [...s.selectedRecipients, r],
      };
    }),
  selectAllContacts: () =>
    set((s) => {
      const contactRecipients: Recipient[] = s.contacts.map((c) => ({ ...c, type: "contact" }));
      const groupIds = s.selectedRecipients.filter((r) => r.type === "group");
      return { selectedRecipients: [...groupIds, ...contactRecipients] };
    }),
  selectAllGroups: () =>
    set((s) => {
      const groupRecipients: Recipient[] = s.groups.map((g) => ({ ...g, type: "group" }));
      const contactIds = s.selectedRecipients.filter((r) => r.type === "contact");
      return { selectedRecipients: [...contactIds, ...groupRecipients] };
    }),
  clearSelection: () => set({ selectedRecipients: [] }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setQrCode: (qrCode) => set({ qrCode }),
  setContacts: (contacts) => set({ contacts }),
  setGroups: (groups) => set({ groups }),
  setSendSettings: (partial) =>
    set((s) => ({ sendSettings: { ...s.sendSettings, ...partial } })),
  setMessage: (message) => set({ message }),
  setAttachment: (attachment) => set({ attachment }),
  setSendProgress: (partial) =>
    set((s) => ({ sendProgress: { ...s.sendProgress, ...partial } })),
  startSending: () => {},
  pauseSending: () => {},
  resumeSending: () => {},
  cancelSending: () => {},
}));

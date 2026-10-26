export type ChatRole = "customer" | "merchant" | "platform";

export type ChatSession = {
  id: string;
  kind: "support" | "customer";
  storeId: string;
  storeName: string;
  customerName: string | null;
  authRequired?: boolean;
};

export type ChatConversation = {
  id: string;
  kind: "support" | "customer";
  storeId: string;
  storeName: string;
  customerName: string | null;
  customerEmail: string | null;
  lastMessage: string | null;
  lastAt: string;
};

export type ChatAttachment = {
  url: string;
  contentType: string;
  fileName: string | null;
};

export type ChatMessage = {
  id: string;
  body: string | null;
  senderRole: ChatRole;
  mine: boolean;
  createdAt: string;
  attachment?: ChatAttachment | null;
};

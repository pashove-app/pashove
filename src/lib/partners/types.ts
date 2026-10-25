export type PartnerOfferState = {
  status: "idle" | "error" | "saved";
  messageKey?: string;
};

export const INITIAL_PARTNER_OFFER_STATE: PartnerOfferState = {
  status: "idle",
};

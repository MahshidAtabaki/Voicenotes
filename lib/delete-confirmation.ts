export const PHONE_OVERLAY_HOST_SELECTOR = '[data-phone-overlay-host="1"]';
export const PHONE_OVERLAY_Z_INDEX = 100;

export function getPhoneOverlayHost(doc: Pick<Document, "querySelector">): Element | null {
  return doc.querySelector(PHONE_OVERLAY_HOST_SELECTOR);
}

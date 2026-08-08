/** Shared layering contract: the portalled confirmation must clear all app UI. */
export const DELETE_CONFIRMATION_Z_INDEX = 100;
export const GLOBAL_PLAYER_Z_INDEX = 80;
export const PHONE_OVERLAY_Z_INDEX = 100;
export const DELETE_ACTION_LABEL = "Delete";
export const PHONE_OVERLAY_SELECTOR = '[data-phone-overlay-host="1"]';

export function findPhoneOverlayHost(
  root: Pick<Document, "querySelector">,
): Element | null {
  return root.querySelector(PHONE_OVERLAY_SELECTOR);
}

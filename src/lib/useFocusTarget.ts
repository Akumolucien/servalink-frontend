import { useEffect } from "react";

/** DOM id for a record that a deep link points at (e.g. /admin/reports/:id). */
export const focusDomId = (id: string) => `item-${id}`;

/** Scrolls the linked record into view once the list has loaded. */
export function useFocusTarget(id: string | undefined, found: boolean) {
  useEffect(() => {
    if (!id || !found) return;
    document.getElementById(focusDomId(id))?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [id, found]);
}

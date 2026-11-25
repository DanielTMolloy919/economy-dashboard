import { atomWithStorage } from "jotai/utils";

// User preferences persisted in localStorage.
export const showBandsAtom = atomWithStorage("show-bands", false);

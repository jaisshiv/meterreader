export type PartyState =
  | "NOT_STARTED"
  | "READY"
  | "STARTED"
  | "DOORS_CLOSED"
  | "FEES_CLAIMED";

export interface PartyRecord {
  id: string;
  organizer: string;
  partySize: number;
  entryFee: number;
  state: PartyState;
  attendees: string[];
  checkedIn: string[];
  createdAt: string;
}

const STORAGE_KEY = "private-party-state";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function loadPartyState(): PartyRecord | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as PartyRecord) : null;
}

export function savePartyState(party: PartyRecord): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(party));
}

export function createPartyRecord(args: {
  organizer: string;
  partySize: number;
  entryFee: number;
}): PartyRecord {
  return {
    id: `party-${Date.now()}`,
    organizer: args.organizer,
    partySize: args.partySize,
    entryFee: args.entryFee,
    state: "NOT_STARTED",
    attendees: [],
    checkedIn: [],
    createdAt: new Date().toISOString(),
  };
}

export function addAttendee(party: PartyRecord, attendee: string): PartyRecord {
  if (party.attendees.includes(attendee)) {
    return party;
  }

  const next = { ...party, attendees: [...party.attendees, attendee] };
  if (next.attendees.length >= next.partySize) {
    next.state = "READY";
  }

  return next;
}

export function startParty(party: PartyRecord): PartyRecord {
  if (party.state === "NOT_STARTED") {
    const next = { ...party, state: "STARTED" as PartyState };
    return next;
  }

  return party;
}

export function checkInGuest(party: PartyRecord, guest: string): PartyRecord {
  if (!party.attendees.includes(guest)) {
    return party;
  }

  if (party.checkedIn.includes(guest)) {
    return party;
  }

  const next = {
    ...party,
    checkedIn: [...party.checkedIn, guest],
  };

  if (next.checkedIn.length >= next.partySize) {
    next.state = "DOORS_CLOSED";
  }

  return next;
}

export function closeParty(party: PartyRecord): PartyRecord {
  return { ...party, state: "DOORS_CLOSED" };
}

export function claimFees(party: PartyRecord): PartyRecord {
  return { ...party, state: "FEES_CLAIMED" };
}

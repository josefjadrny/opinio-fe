// Poll rules mirrored from the API (POLLS-DESIGN.md section 3). The API is the
// authority; these only shape the form and hide controls that would be refused.
export const POLL_TITLE_MAX = 50;
export const POLL_BODY_MAX = 300;
export const POLL_OPTION_MAX = 25;
export const POLL_OPTIONS_MIN = 2;
export const POLL_OPTIONS_MAX = 5;
// The author can delete a poll only while it has fewer than 10 votes.
export const DELETE_MAX_VOTES = 9;

// How long a new poll takes votes - the new-poll form's chips, the API's
// POLL_DURATIONS (keep in sync). The API turns the pick into ends_at.
export const POLL_DURATIONS = ['14d', '1m', '6m'] as const;
export type PollDuration = (typeof POLL_DURATIONS)[number];
export const DEFAULT_POLL_DURATION: PollDuration = '6m';

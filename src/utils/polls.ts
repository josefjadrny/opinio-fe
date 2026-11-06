// Poll rules mirrored from the API (POLLS-DESIGN.md section 3). The API is the
// authority; these only shape the form and hide controls that would be refused.
export const POLL_TITLE_MAX = 50;
export const POLL_BODY_MAX = 300;
export const POLL_OPTION_MAX = 25;
export const POLL_OPTIONS_MIN = 2;
export const POLL_OPTIONS_MAX = 5;
// The author can delete a poll only while it has fewer than 10 votes.
export const DELETE_MAX_VOTES = 9;

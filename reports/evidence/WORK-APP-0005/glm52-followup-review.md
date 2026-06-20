Verdict: accept-ready

Residual risks:
- `resetLocalDemo` sets tone to "success" but doesn't clear `dataControlMessage` first; if an error message is already showing, the tone flips but the old text briefly persists until overwritten (negligible—same render cycle).
- `clearLocalAccount` returning a falsy value is treated as a partial failure, but `deleteLocalUserData` already cleared the unified key; the "profile not refreshed" warning may surface spuriously if `clearLocalAccount` returns `false` for a legitimately already-empty store.
- `localDataInventory`/`remoteDeletionStatus` still memoized with `[]` deps—stale post-deletion if they reflect live counts rather than static labels.
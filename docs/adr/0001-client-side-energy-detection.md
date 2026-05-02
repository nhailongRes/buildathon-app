# Client-side energy detection with periodic server snapshots

Energy level (High/Medium/Low) is computed entirely in the browser via a `useEnergyDetector` hook, never on the server. The browser is the only environment with access to keystroke timing; server-side detection would require streaming every keystroke event over the network, adding latency that would defeat real-time UI adaptation. The hook writes a snapshot to the DB every 60 seconds (only when active), which is sufficient for the energy timeline chart without the overhead of continuous server communication.

## Consequences

- UI adaptation is instantaneous — no round-trip latency.
- If the user closes the tab mid-session, the final partial minute of activity is not captured.
- The detection algorithm (thresholds, window size, hysteresis) lives in frontend code, making it easy to tune without a deploy — but also meaning it can't be A/B tested server-side.

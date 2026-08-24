# Design notes

The interface pairs a dark film-room surface with lime offensive emphasis and coral defensive markers. The field is always a 40×40 coordinate surface owned by the engine; views consume geometry rather than duplicating dimensions.

Motion should clarify route timing and beat focus. Playback is driven by deterministic elapsed deltas, while persisted documents carry an explicit schema version and are migrated before use. Core actions remain keyboard reachable and important controls expose names through ARIA.

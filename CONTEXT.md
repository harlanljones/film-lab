# Film Lab

A local-first web app where youth flag-football coaches create, animate, organize, and
teach 7-on-7 plays, and players learn their own jobs within those plays.

## Language

**Play**:
One complete 7-on-7 play: named tracks for every player plus beats and coaching summary.
_Avoid_: route, drawing, card

**Concept**:
The reusable offensive idea a Play expresses (e.g., Mesh, Flood). Many Plays share one
Concept, each defended by a different Look.
_Avoid_: category, family, series

**Look**:
The defensive configuration a Play is drawn against (e.g., Man 1-rush, Cover 3).
Plays sharing a Concept differ primarily by Look.
_Avoid_: variant, defense

**Assignment**:
One player's role within one Play: their track's waypoints and beats. Derived from the
Play, viewed through a roster mapping.
_Avoid_: job, responsibility, trail (a trail is the rendered path, not the role)

**Beat**:
A timestamped teaching moment within a Play, optionally focused on specific players.
_Avoid_: cue, step, frame

**Drill Field**:
Film Lab's 40×40 diagramming canvas with the LOS at center — a teaching surface, not a
sanctioned field.
_Avoid_: field (unqualified), pitch

**Practice Script**:
An ordered list of Plays assembled for one practice session, optionally grouped into
periods with rep counts.
_Avoid_: sequence, playlist, install sheet

# Issue tracker: GitHub

Issues and specs live in GitHub Issues. Use `gh` for all operations.
PRs are not treated as incoming feature requests.

## Core operations

- Create, read, list, comment on, edit, and close issues with `gh issue`.
- Infer the repository from the current Git remote.
- Publishing to the tracker means creating a GitHub issue.
- Fetching a ticket means reading the issue and its comments.

## Wayfinding operations

- Map: an issue labelled `wayfinder:map`.
- Tickets: GitHub sub-issues labelled `wayfinder:<type>`.
- Sub-issue fallback: use a map task list and add `Part of #<map>` to the ticket body.
- Blocking: use native GitHub issue dependencies when available.
- Blocking fallback: add `Blocked by: #<issue>` to the ticket body.
- Frontier: open, unblocked, unassigned child tickets.
- Claim: assign the ticket to the current developer before work.
- Resolve: comment with the answer, close the ticket, then append its link and gist to the map.

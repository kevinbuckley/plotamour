# Tech Debt Tracker

Track known shortcuts, compromises, and areas that need revisiting.

| ID | Area | Description | Priority | Phase to Fix |
|---|---|---|---|---|
| TD-001 | Auth | Google refresh token stored as plain text initially | High | Phase 1 |
| TD-002 | Timeline | No virtualization — may lag with 100+ chapters | Medium | Phase 4 |
| TD-003 | Testing | No E2E tests in Phase 1 | Medium | Phase 3 |
| TD-004 | Offline | No offline support | Low | Post-v1 |
| TD-005 | Mobile | No mobile responsive design | Low | Post-v1 |
| TD-006 | Docs API | No retry logic on Google API failures | Medium | Phase 3 |

## How to Use This

- Add entries as you discover shortcuts during development
- Include which phase you plan to address it in
- Remove entries when resolved (with a commit reference)
- Review before starting each new phase

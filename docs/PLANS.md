# Plans — plotamour

## Roadmap

| Phase | Name | Status | Focus |
|---|---|---|---|
| 1 | Foundation | **active** | Auth, projects, timeline, scenes, outline, Google Docs |
| 2 | Story Bible | planned | Characters, places, notes, tags, filtering |
| 3 | Templates & Series | planned | Plot templates, series management, deeper Docs sync |
| 4 | Polish | planned | Export, ads, onboarding, performance, accessibility |

## Execution Plans

Active plans live in [docs/exec-plans/active/](./exec-plans/active/).
Completed plans move to [docs/exec-plans/completed/](./exec-plans/completed/).

## Planning Process

1. Before starting a phase, review the execution plan
2. Break tasks into implementable chunks (1-3 commits each)
3. Each commit should leave the app in a working state
4. Update the execution plan as tasks complete (check off items)
5. Log decisions and deviations in the plan's "Decision Log" section
6. Track discovered tech debt in [tech-debt-tracker.md](./exec-plans/tech-debt-tracker.md)

## Phase Dependencies

```
Phase 1 (Foundation)
  ↓
Phase 2 (Story Bible) — needs scenes + timeline from Phase 1
  ↓
Phase 3 (Templates & Series) — needs story bible entities from Phase 2
  ↓
Phase 4 (Polish) — needs all features from Phases 1-3
```

## Principles

- Ship small, ship often
- Each commit is a working state
- Push to main frequently
- No feature branches that live longer than a day
- If a task is taking too long, split it smaller

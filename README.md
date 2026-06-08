# Yaycay Admin

Internal ops console for Yaycay, the family holiday companion.

Read `00-MODEL-CONTEXT.md` and `03-ADMIN-HANDOFF.md` first. This app is an
admin-scoped consumer of the BE contract; it never runs inference itself.

This is the initial baseline on `main`. The application scaffold (Next.js +
TypeScript, the MFA-gated admin gate, the seven screens, tests and CI) is
integrated through a pull request into `develop`.

Branching: `develop` -> staging, `main` -> production.

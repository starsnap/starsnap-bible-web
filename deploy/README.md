# Repository-owned production deployment

This repository builds and publishes its own ARM64 image. A manual
`workflow_dispatch` with `deploy=true` deploys the exact published digest to the
single Swarm service named in `service.conf`.

The production job:

- runs only from the protected default branch and `production` environment;
- uses the repository-scoped `GITHUB_TOKEN` for its own GHCR package;
- targets the sole `192.168.1.103` manager carrying
  `starsnap.actions-runner=true`;
- serializes mutations with `/runner-state/starsnap-production-deploy.lock`;
- exits without restarting when the exact digest is already healthy;
- updates only the configured service and verifies one healthy `1/1` task;
- restores and verifies the previous task specification on failure.

The organization runner group must allow this repository and the exact
`.github/workflows/container.yml` path pinned to the protected default branch.
Never enable the production runner for pull-request or fork-triggered jobs.

Before the first run, the GHCR package must be linked to this repository (or
explicitly grant it Actions access) so the repository-scoped `GITHUB_TOKEN` can
publish and read the image. Treat a missing package/repository link as a failed
pre-deploy gate; do not replace it with a cross-repository personal token.

Keep the repository variable `SWARM_DEPLOY_ENABLED` unset until the protected
environment, package access, and runner workflow allowlist are all verified.
Set it to `true` last. Without that exact value the deploy job is skipped.

The YAML manifests under `deploy/` are the recovery/bootstrap source of truth
for this repository's service and direct data dependencies. The normal workflow
does not run `docker stack deploy`; it updates only the existing service. If a
manifest must be used for recovery, use the documented existing stack name and
never pass `--prune`, so a repository cannot remove a sibling service.

Recovery stack name: `starsnap-sns` (`deploy/stack.yml`).

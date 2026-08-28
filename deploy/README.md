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

#!/usr/bin/env bash
set -Eeuo pipefail
set +x
umask 077

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
readonly script_dir
# shellcheck source=/dev/null
source "$script_dir/service.conf"
: "${SERVICE_NAME:?SERVICE_NAME is required in service.conf}"
: "${EXPECTED_IMAGE_REPOSITORY:?EXPECTED_IMAGE_REPOSITORY is required in service.conf}"
: "${ROLLOUT_TIMEOUT_SECONDS:?ROLLOUT_TIMEOUT_SECONDS is required in service.conf}"

readonly manager_address='192.168.1.103'
readonly manager_label='starsnap.actions-runner'
readonly local_image_registry='starsnap.invalid/starsnap-platform-local'
readonly lock_path="${STARSNAP_DEPLOY_LOCK_PATH:-/runner-state/starsnap-production-deploy.lock}"
readonly candidate_image="${STARSNAP_DEPLOY_IMAGE:?STARSNAP_DEPLOY_IMAGE is required}"
readonly pull_image="${STARSNAP_PULL_IMAGE:?STARSNAP_PULL_IMAGE is required}"
readonly service_name="$SERVICE_NAME"
readonly expected_repository="$EXPECTED_IMAGE_REPOSITORY"
readonly rollout_timeout_seconds="$ROLLOUT_TIMEOUT_SECONDS"

previous_image=''
previous_task_hash=''
update_attempted=0

single_running_container() {
  local container_ids
  container_ids="$(docker ps \
    --filter "label=com.docker.swarm.service.name=$service_name" \
    --filter status=running \
    --format '{{.ID}}')"
  test "$(awk 'NF {count++} END {print count + 0}' <<<"$container_ids")" -eq 1
  awk 'NF {print; exit}' <<<"$container_ids"
}

task_template_hash() {
  docker service inspect --format '{{json .Spec.TaskTemplate}}' "$service_name" \
    | sha256sum | awk '{print $1}'
}

service_is_healthy() {
  local container health replicas update_state
  replicas="$(docker service ls --filter "name=$service_name" \
    --format '{{.Name}} {{.Replicas}}' \
    | awk -v target="$service_name" '$1 == target {print $2}')" || return 1
  test "$replicas" = '1/1' || return 1
  update_state="$(docker service inspect \
    --format '{{if .UpdateStatus}}{{.UpdateStatus.State}}{{else}}completed{{end}}' \
    "$service_name" 2>/dev/null)" || return 1
  [[ "$update_state" =~ ^(completed|rollback_completed)$ ]] || return 1
  container="$(single_running_container)" || return 1
  health="$(docker inspect \
    --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
    "$container")" || return 1
  test "$health" = 'healthy'
}

wait_for_candidate() {
  local deadline=$((SECONDS + rollout_timeout_seconds))
  local current_image update_state
  while (( SECONDS < deadline )); do
    current_image="$(docker service inspect \
      --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' \
      "$service_name" 2>/dev/null || true)"
    update_state="$(docker service inspect \
      --format '{{if .UpdateStatus}}{{.UpdateStatus.State}}{{else}}completed{{end}}' \
      "$service_name" 2>/dev/null || true)"
    case "$update_state" in
      paused|rollback_paused|rollback_started|rollback_completed)
        echo "$service_name entered failure state: $update_state" >&2
        return 1
        ;;
    esac
    if [[ "$current_image" == "$local_image" && "$update_state" == 'completed' ]] \
      && service_is_healthy; then
      return 0
    fi
    sleep 3
  done
  echo "Timed out waiting for $service_name to converge." >&2
  return 1
}

wait_for_previous() {
  local deadline=$((SECONDS + rollout_timeout_seconds))
  while (( SECONDS < deadline )); do
    if [[ "$(task_template_hash 2>/dev/null || true)" == "$previous_task_hash" ]] \
      && [[ "$(docker service inspect \
        --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' \
        "$service_name" 2>/dev/null || true)" == "$previous_image" ]] \
      && service_is_healthy; then
      return 0
    fi
    sleep 3
  done
  return 1
}

rollback_on_failure() {
  local status="${1:-1}"
  trap - ERR HUP INT TERM
  set +e
  if (( update_attempted == 1 )); then
    if [[ "$(task_template_hash 2>/dev/null || true)" != "$previous_task_hash" ]]; then
      echo "Rolling $service_name back to its previous task specification." >&2
      docker service rollback --detach=true "$service_name" >/dev/null 2>&1
    fi
    if wait_for_previous; then
      echo "Rollback verified for $service_name: $previous_image" >&2
    else
      echo "CRITICAL: rollback verification failed for $service_name." >&2
      docker service ps --no-trunc "$service_name" >&2 || true
    fi
  fi
  exit "$status"
}

trap 'rollback_on_failure $?' ERR
trap 'rollback_on_failure 129' HUP
trap 'rollback_on_failure 130' INT
trap 'rollback_on_failure 143' TERM

test "$(docker info --format '{{.Swarm.ControlAvailable}}')" = 'true'
test "$(docker node inspect self --format '{{.Status.Addr}}')" = "$manager_address"
node_id="$(docker info --format '{{.Swarm.NodeID}}')"
readonly node_id
test -n "$node_id"
test "$(docker node inspect --format '{{.Spec.Role}}' "$node_id")" = 'manager'
test "$(docker node inspect \
  --format "{{with index .Spec.Labels \"$manager_label\"}}{{.}}{{end}}" \
  "$node_id")" = 'true'
labeled_nodes="$(docker node ls \
  --filter "node.label=$manager_label=true" --format '{{.ID}}')"
readonly labeled_nodes
test "$(awk 'NF {count++} END {print count + 0}' <<<"$labeled_nodes")" -eq 1
test "$labeled_nodes" = "$node_id"

command -v flock >/dev/null
case "$lock_path" in
  /runner-state/*) ;;
  *) echo "Refusing unexpected deployment lock path: $lock_path" >&2; exit 1 ;;
esac
exec 9>"$lock_path"
flock --wait 900 9

docker service inspect "$service_name" >/dev/null
service_is_healthy
test "$(docker service inspect \
  --format '{{if .Spec.UpdateConfig}}{{.Spec.UpdateConfig.FailureAction}}{{else}}pause{{end}}' \
  "$service_name")" = 'rollback'

readonly digest_prefix="$expected_repository@sha256:"
test "${candidate_image#"$digest_prefix"}" != "$candidate_image"
readonly digest="${candidate_image#"$digest_prefix"}"
[[ "$digest" =~ ^[0-9a-f]{64}$ ]]
case "$pull_image" in
  "$expected_repository":sha-[0-9a-f]*) ;;
  *) echo "Unexpected pull image: $pull_image" >&2; exit 1 ;;
esac

docker pull "$pull_image" >/dev/null
repo_digests="$(docker image inspect \
  --format '{{range .RepoDigests}}{{println .}}{{end}}' "$pull_image")"
readonly repo_digests
test "$(grep -Fxc "$candidate_image" <<<"$repo_digests")" -eq 1
readonly local_image="$local_image_registry/${service_name//_/-}:sha-$digest"
docker tag "$pull_image" "$local_image"
test "$(docker image inspect --format '{{.Id}}' "$pull_image")" \
  = "$(docker image inspect --format '{{.Id}}' "$local_image")"

previous_image="$(docker service inspect \
  --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' "$service_name")"
readonly previous_image
previous_task_hash="$(task_template_hash)"
readonly previous_task_hash
[[ "$previous_task_hash" =~ ^[0-9a-f]{64}$ ]]

if [[ "$previous_image" == "$local_image" ]]; then
  current_container="$(single_running_container)"
  readonly current_container
  if [[ "$(docker inspect --format '{{.Image}}' "$current_container")" \
      == "$(docker image inspect --format '{{.Id}}' "$local_image")" ]] \
    && service_is_healthy; then
    trap - ERR HUP INT TERM
    printf 'Deployment already current: service=%s image=%s\n' \
      "$service_name" "$candidate_image"
    exit 0
  fi
fi

update_attempted=1
docker service update --detach=true --no-resolve-image \
  --image "$local_image" "$service_name" >/dev/null
wait_for_candidate
deployed_container="$(single_running_container)"
readonly deployed_container
test "$(docker inspect --format '{{.Image}}' "$deployed_container")" \
  = "$(docker image inspect --format '{{.Id}}' "$local_image")"

trap - ERR HUP INT TERM
printf 'Scoped deployment verified: service=%s image=%s\n' \
  "$service_name" "$candidate_image"

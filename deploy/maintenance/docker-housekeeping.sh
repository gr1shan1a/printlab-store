#!/bin/bash
set -eu
exec 9>/run/docker-housekeeping.lock
flock -n 9 || exit 0
# Only disposable build cache and dangling images; never volumes or containers.
docker builder prune -af --filter until=24h --keep-storage 1GB
docker image prune -f --filter until=24h
available=$(df --output=avail -B1 /var/lib/docker | tail -1)
if (( available < 8589934592 )); then
  docker builder prune -af --keep-storage 512MB
fi
# Prefer retaining VPN processes if the host runs out of RAM.
for name in vpn-admin vpn-telegram-bot shadowbox-nl xray-vless openflux-accelerator openflux-happ-client; do
  pid=$(docker inspect --format '{{.State.Pid}}' "$name" 2>/dev/null) || continue
  if [[ "$pid" =~ ^[0-9]+$ ]] && (( pid > 0 )); then
    echo -900 > "/proc/$pid/oom_score_adj" || true
    group=$(awk -F: '$1 == "0" {print $3}' "/proc/$pid/cgroup")
    if [[ -n "$group" && -w "/sys/fs/cgroup$group/memory.low" ]]; then
      echo 134217728 > "/sys/fs/cgroup$group/memory.low"
    fi
  fi
done

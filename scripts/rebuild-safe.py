#!/usr/bin/env python3
"""Rebuild this store with bounded RAM, serial builds, and a disk-space guard."""
import fcntl
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from urllib.parse import quote, urlsplit, urlunsplit

os.chdir(Path(__file__).resolve().parents[1])
lock = open('/run/docker-housekeeping.lock', 'w')
fcntl.flock(lock, fcntl.LOCK_EX)
def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)
run('docker', 'builder', 'prune', '-af', '--keep-storage', '512MB')
if shutil.disk_usage('/var/lib/docker').free < 10 * 1024**3:
    raise SystemExit('Недостаточно места: для сборки требуется 10 ГБ свободного диска. VPN сохранён; сборка не запущена.')
config = json.loads(run('docker', 'compose', 'config', '--format', 'json', capture_output=True, text=True).stdout)
web = config['services']['web']
args = ['docker', 'build', '--memory=1536m', '--memory-swap=2g', '--cpu-shares=256', '-t', web.get('image', config['name'] + '-web')]
for key, value in web['build'].get('args', {}).items():
    if value is not None:
        args += ['--build-arg', f'{key}={value}']
args += [web['build']['context']]
try:
    run(*args, env={**os.environ, 'DOCKER_BUILDKIT': '0'})
    # The app role cannot alter PostgreSQL objects owned by the DB role.
    # Run migrations as the configured DB owner, passing the URL through a
    # short-lived mounted file so credentials do not appear in process args.
    app_db = urlsplit(web['environment']['DATABASE_URL'])
    postgres = config['services']['postgres']['environment']
    owner = postgres.get('POSTGRES_USER', 'printlab')
    password = quote(str(postgres.get('POSTGRES_PASSWORD', '')), safe='')
    port = app_db.port or 5432
    owner_db = urlunsplit((app_db.scheme, f'{owner}:{password}@{app_db.hostname}:{port}', app_db.path, app_db.query, app_db.fragment))
    secret_file = tempfile.NamedTemporaryFile(mode='w', prefix='printlab-migration-', delete=False)
    try:
        os.chmod(secret_file.name, 0o600)
        secret_file.write(owner_db)
        secret_file.close()
        run('docker', 'compose', 'run', '--rm', '--no-deps', '--user', '0:0',
            '--volume', f'{secret_file.name}:/run/migration-url:ro',
            'web', 'sh', '-c', 'export DATABASE_URL="$(cat /run/migration-url)" && npx prisma migrate deploy')
    finally:
        if not secret_file.closed:
            secret_file.close()
        os.unlink(secret_file.name)
    run('docker', 'compose', 'up', '-d', '--no-deps', '--no-build', 'web')
finally:
    run('docker', 'builder', 'prune', '-af', '--keep-storage', '512MB')
    run('docker', 'image', 'prune', '-f')

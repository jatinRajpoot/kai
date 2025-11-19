#!/bin/bash
set -euo pipefail

DB_DATABASE=${DB_DATABASE:-kai}
DB_USERNAME=${DB_USERNAME:-kai}
DB_PASSWORD=${DB_PASSWORD:-kai_pass}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD:-root_pass}
MYSQL_DATA_DIR=${MYSQL_DATA_DIR:-/var/lib/mysql}
SCHEMA_FILE=${SCHEMA_FILE:-/var/www/html/db/schema.sql}
MYSQL_SOCKET=${MYSQL_SOCKET:-/run/mysqld/mysqld.sock}

export DB_HOST=${DB_HOST:-127.0.0.1}

add_mysql_host_alias() {
    if ! grep -qw "mysql" /etc/hosts; then
        echo "127.0.0.1 mysql" >> /etc/hosts
    fi
}

prepare_mysql_dirs() {
    mkdir -p /var/run/mysqld "$MYSQL_DATA_DIR"
    chown -R mysql:mysql /var/run/mysqld "$MYSQL_DATA_DIR"
    if [ ! -d "$MYSQL_DATA_DIR/mysql" ]; then
        echo "[entrypoint] Initializing MariaDB data directory"
        mariadb-install-db --datadir="$MYSQL_DATA_DIR" --user=mysql >/dev/null
    fi
}

mysql_ping() {
    mysqladmin --protocol=socket --socket="$MYSQL_SOCKET" ping --silent >/dev/null 2>&1 && return 0
    mysqladmin --protocol=socket --socket="$MYSQL_SOCKET" --user=root --password="${DB_ROOT_PASSWORD}" ping --silent >/dev/null 2>&1 && return 0
    if [ -f /root/.my.cnf ]; then
        mysqladmin ping --silent >/dev/null 2>&1 && return 0
    fi
    return 1
}

start_mysql() {
    mysqld_safe --datadir="$MYSQL_DATA_DIR" --socket="$MYSQL_SOCKET" --user=mysql --skip-syslog --skip-networking=0 &
    MYSQL_PID=$!
}

wait_for_mysql() {
    for _ in $(seq 1 40); do
        if mysql_ping; then
            return
        fi
        sleep 1
    done
    echo "[entrypoint] MariaDB did not become ready in time" >&2
    exit 1
}

create_root_client_file() {
    cat > /root/.my.cnf <<EOF
[client]
user=root
password=${DB_ROOT_PASSWORD}
host=localhost
EOF
    chmod 600 /root/.my.cnf
}

seed_database() {
    if [ -f "$MYSQL_DATA_DIR/.kai-initialized" ]; then
        create_root_client_file
        return
    fi

    echo "[entrypoint] Seeding MariaDB schema"
    mysql --protocol=socket --socket="$MYSQL_SOCKET" <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USERNAME}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_DATABASE}\`.* TO '${DB_USERNAME}'@'%';
FLUSH PRIVILEGES;
SQL

    if [ -f "$SCHEMA_FILE" ]; then
        mysql --protocol=socket --socket="$MYSQL_SOCKET" "$DB_DATABASE" < "$SCHEMA_FILE" || echo "[entrypoint] Schema import skipped or failed"
    else
        echo "[entrypoint] Schema file not found at $SCHEMA_FILE, skipping import"
    fi

    mysql --protocol=socket --socket="$MYSQL_SOCKET" <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_ROOT_PASSWORD}';
FLUSH PRIVILEGES;
SQL

    create_root_client_file
    touch "$MYSQL_DATA_DIR/.kai-initialized"
}

shutdown_mysql() {
    if [ -z "${MYSQL_PID:-}" ]; then
        return
    fi

    if [ -f /root/.my.cnf ]; then
        mysqladmin shutdown || true
    else
        mysqladmin --protocol=socket --socket="$MYSQL_SOCKET" --user=root --password="${DB_ROOT_PASSWORD}" shutdown || mysqladmin --protocol=socket --socket="$MYSQL_SOCKET" shutdown || true
    fi
    wait "$MYSQL_PID" || true
}

terminate_processes() {
    if [ -n "${APP_PID:-}" ] && kill -0 "$APP_PID" >/dev/null 2>&1; then
        kill "$APP_PID" >/dev/null 2>&1 || true
    fi
    shutdown_mysql
    exit 0
}

trap terminate_processes SIGINT SIGTERM

add_mysql_host_alias
prepare_mysql_dirs
start_mysql
wait_for_mysql
seed_database

"$@" &
APP_PID=$!
wait "$APP_PID"
APP_STATUS=$?
shutdown_mysql
exit "$APP_STATUS"

# KAI Coolify Deployment Guide

This guide explains how to deploy the KAI application on Coolify using the optimized Docker Compose configuration.

## Changes Made

- **Optimized `docker-compose.yml`**:
    - Replaced custom build with `serversideup/php:8.2-fpm-apache` image.
    - Added a separate `mysql` service (version 8.0).
    - Configured volume mounts for code (`.`) and database schema (`./db/schema.sql`).
    - Added a command to run `composer install` on startup.
- **Cleaned up Files**:
    - Removed `Dockerfile`, `docker-entrypoint.sh`, `.dockerignore`, and `.env.production`.
    - Removed unused `scripts` directory.
- **Updated Configuration**:
    - Updated `.env.example` to reflect the new environment variable scheme.

## Deployment Steps on Coolify

1.  **Create a New Resource**:
    - Select **Docker Compose**.
    - Choose your repository and branch.

2.  **Configuration**:
    - Coolify should automatically detect the `docker-compose.yml` file.
    - The `app` service is configured to use the `serversideup/php:8.2-fpm-apache` image.
    - The `mysql` service will be created automatically.

3.  **Environment Variables**:
    - Copy the contents of `.env.example` to the Coolify environment variables section.
    - Update the values as needed (especially passwords and `APP_URL`).
    - Ensure `DB_HOST` is set to `mysql` (the service name in docker-compose).

4.  **Deploy**:
    - Click **Deploy**.
    - The application will:
        - Pull the images.
        - Start the MySQL database and initialize it with `db/schema.sql` (if the volume is empty).
        - Start the PHP application.
        - Run `composer install`.
        - Serve the application.

## Verification

- Check the Deployment Logs in Coolify to ensure `composer install` completed successfully.
- Visit the `APP_URL` to verify the application is running.

# KAI Coolify Deployment Guide

This guide explains how to deploy the KAI application on Coolify using the optimized Dockerfile-based configuration.

## Changes Made

- **Added `Dockerfile`**:
    - Based on `serversideup/php:8.2-fpm-apache`.
    - Installs dependencies (`composer install`) during the build process.
    - Copies application code into the image.
- **Optimized `docker-compose.yml`**:
    - Uses `build: .` to build the custom image.
    - Removed runtime `composer install` command (faster startup).
    - Removed code volume mount (production-ready).
    - Kept `mysql` service configuration.

## Deployment Steps on Coolify

1.  **Create a New Resource**:
    - Select **Docker Compose**.
    - Choose your repository and branch.

2.  **Configuration**:
    - Coolify will detect the `docker-compose.yml` and the `Dockerfile`.
    - It will build the image automatically.
    - The `mysql` service will be created automatically.

3.  **Environment Variables**:
    - Copy the contents of `.env.example` to the Coolify environment variables section.
    - Update the values as needed (especially passwords and `APP_URL`).
    - Ensure `DB_HOST` is set to `mysql`.

4.  **Deploy**:
    - Click **Deploy**.
    - The application will:
        - Build the Docker image (installing dependencies).
        - Start the MySQL database.
        - Start the PHP application.
        - Serve the application.

## Verification

- Check the Deployment Logs in Coolify to ensure the build passed.
- Visit the `APP_URL` to verify the application is running.

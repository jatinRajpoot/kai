# Deploying KAI to Coolify

This guide details how to deploy the KAI application to a Coolify instance using Docker Compose.

## Prerequisites

- A [Coolify](https://coolify.io/) instance set up and running.
- Access to your Git repository (GitHub, GitLab, etc.) where this project is hosted.

## Step-by-Step Deployment

### 1. Create a New Resource

1.  Log in to your Coolify dashboard.
2.  Navigate to your desired **Project** and **Environment**.
3.  Click **+ New** to add a resource.
4.  Select **Git Repository** (or **Public Repository** if your repo is public).
5.  Select the repository containing the KAI code.
6.  Select the branch you want to deploy (e.g., `main`).

### 2. Configure Build Pack

1.  Coolify should automatically detect the `docker-compose.yml` file.
2.  If asked for the **Build Pack**, select **Docker Compose**.
3.  Ensure the **Docker Compose Location** is set to `./docker-compose.yml` (or just `docker-compose.yml`).

### 3. Environment Variables

You need to configure the environment variables for the application to connect to the database.

1.  Go to the **Environment Variables** tab of your new resource.
2.  Add the following variables. You can generate secure passwords for the database.

| Key | Value (Example) | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `production` | Application environment |
| `APP_DEBUG` | `false` | Disable debug mode in production |
| `APP_URL` | `https://your-app-url.com` | The public URL of your app |
| `DB_CONNECTION` | `mysql` | Database driver |
| `DB_HOST` | `kai-db` | **Important:** Must match the service name in `docker-compose.yml` |
| `DB_PORT` | `3306` | Database port |
| `DB_DATABASE` | `kai` | Database name |
| `DB_USERNAME` | `kai` | Database user |
| `DB_PASSWORD` | `secure_password` | Database password |
| `DB_ROOT_PASSWORD` | `secure_root_password` | Database root password |
| `AUTH_EMAIL` | `admin@example.com` | Admin email |
| `AUTH_PASSWORD` | `secure_password` | Admin password |
| `API_SHARED_TOKEN` | `random_secure_token` | API token |

> [!IMPORTANT]
> Ensure `DB_HOST` is set to `kai-db` (or the name of your database service in `docker-compose.yml`).

### 4. Domains

1.  Go to the **Settings** (or **General**) tab.
2.  Set your **Domains** (e.g., `https://kai.yourdomain.com`).
3.  Coolify will automatically handle SSL certificates.

### 5. Deploy

1.  Click the **Deploy** button in the top right corner.
2.  Watch the **Logs** to ensure the build and deployment succeed.

## Troubleshooting

-   **Database Connection Failed**: Check that `DB_HOST` is correct and matches the service name in `docker-compose.yml`. Ensure `DB_PASSWORD` matches between the app and the database container.
-   **502 Bad Gateway**: This usually means Nginx is running but cannot talk to the PHP `app` container. Check the logs of the `app` container to see if PHP-FPM failed to start.
-   **Permissions**: If you see permission errors, ensure the `Dockerfile` correctly sets ownership to `www-data`.

## Local Development

To run the application locally:

```bash
docker-compose up -d --build
```

The app will be available at `http://localhost:8000`.

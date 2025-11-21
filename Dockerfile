FROM serversideup/php:8.2-fpm-apache

# Set working directory
WORKDIR /var/www/html

# Copy composer files first to leverage cache
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Copy the rest of the application
COPY . .

# syntax=docker/dockerfile:1.6

FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN docker-php-ext-install pdo_mysql \
    && composer install --no-dev --prefer-dist --no-progress --optimize-autoloader --no-scripts

FROM php:8.2-apache
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends libzip-dev unzip mariadb-server mariadb-client \
    && docker-php-ext-install pdo_mysql \
    && a2enmod rewrite headers \
    && sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf \
    && sed -ri 's!/var/www/!${APACHE_DOCUMENT_ROOT}/../!g' /etc/apache2/apache2.conf \
    && if [ -f /etc/mysql/mariadb.conf.d/50-server.cnf ]; then sed -ri 's/^bind-address\s*=.*/bind-address = 0.0.0.0/' /etc/mysql/mariadb.conf.d/50-server.cnf; fi \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/lib/mysql /var/run/mysqld \
    && chown -R mysql:mysql /var/lib/mysql /var/run/mysqld

COPY . .
RUN rm -rf vendor

COPY --from=vendor /app/vendor ./vendor
RUN chown -R www-data:www-data /var/www/html

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80 3306

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["apache2-foreground"]

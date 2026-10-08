# Деплой FTS-Pay на `fts-pay.cc`

Инструкция рассчитана на Ubuntu 22.04/24.04 VPS с доступом по SSH. Приложение состоит из статических страниц и Node.js-сервера `server.js`, который принимает заявки на `POST /api/leads` и отправляет их в Telegram через SOCKS5H.

## 1. DNS

У регистратора домена создайте записи:

```text
@      A      IP_АДРЕС_СЕРВЕРА
www    CNAME  fts-pay.cc.
```

Дождитесь обновления DNS и проверьте:

```bash
dig +short fts-pay.cc
```

## 2. Подготовка сервера

```bash
sudo apt update
sudo apt install -y git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

Создайте отдельного пользователя и каталог приложения:

```bash
sudo adduser --system --group --home /var/www/fts-pay fts-pay
sudo mkdir -p /var/www/fts-pay
sudo chown -R fts-pay:fts-pay /var/www/fts-pay
```

## 3. Загрузка проекта

```bash
sudo -u fts-pay git clone https://github.com/Bell1488/fts2.0.git /var/www/fts-pay
cd /var/www/fts-pay
sudo -u fts-pay npm ci --omit=dev
```

Если каталог уже существует, обновите его так:

```bash
cd /var/www/fts-pay
sudo -u fts-pay git pull --ff-only origin main
sudo -u fts-pay npm ci --omit=dev
sudo systemctl restart fts-pay
```

## 4. Переменные окружения

Создайте `/var/www/fts-pay/.env` и укажите реальные значения:

```env
PORT=3000
TELEGRAM_BOT_TOKEN=123456789:real_bot_token
TELEGRAM_CHAT_ID=-1000000000000
SOCKS5H_PROXY=socks5h://user:password@127.0.0.1:1080
```

Права на файл должны быть доступны только пользователю приложения:

```bash
sudo chown fts-pay:fts-pay /var/www/fts-pay/.env
sudo chmod 600 /var/www/fts-pay/.env
```

Прокси должен быть доступен с сервера по указанному адресу. Токен бота и chat ID не публикуйте в Git.

## 5. Systemd

Создайте `/etc/systemd/system/fts-pay.service`:

```ini
[Unit]
Description=FTS-Pay website
After=network.target

[Service]
Type=simple
User=fts-pay
Group=fts-pay
WorkingDirectory=/var/www/fts-pay
EnvironmentFile=/var/www/fts-pay/.env
ExecStart=/usr/bin/node /var/www/fts-pay/server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Активируйте сервис:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fts-pay
sudo systemctl status fts-pay
sudo journalctl -u fts-pay -f
```

## 6. Nginx

Создайте `/etc/nginx/sites-available/fts-pay.cc`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name fts-pay.cc www.fts-pay.cc;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Включите сайт и проверьте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/fts-pay.cc /etc/nginx/sites-enabled/fts-pay.cc
sudo nginx -t
sudo systemctl reload nginx
```

## 7. HTTPS

После того как домен указывает на сервер:

```bash
sudo certbot --nginx -d fts-pay.cc -d www.fts-pay.cc
sudo systemctl status certbot.timer
```

Certbot добавит перенаправление HTTP на HTTPS и настроит автоматическое продление сертификата.

## 8. Проверка

```bash
curl -I https://fts-pay.cc/
curl -sS -o /dev/null -w "%{http_code}\n" https://fts-pay.cc/
```

Форма заявки должна отправляться только после заполнения телефона и согласия на обработку данных. При ошибке смотрите журнал:

```bash
sudo journalctl -u fts-pay --since "10 minutes ago"
```

## 9. Обновление после push

```bash
cd /var/www/fts-pay
sudo -u fts-pay git pull --ff-only origin main
sudo -u fts-pay npm ci --omit=dev
sudo systemctl restart fts-pay
sudo systemctl is-active fts-pay
```

Перед каждым обновлением убедитесь, что `.env` не отслеживается Git и содержит актуальные Telegram-реквизиты.

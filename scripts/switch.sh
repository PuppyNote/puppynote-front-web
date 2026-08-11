#!/bin/bash
APP_DIR=/home/ec2-user/app-web
INACTIVE_PORT=$(cat $APP_DIR/inactive_port)
ACTIVE_PORT=$(cat $APP_DIR/active_port 2>/dev/null || echo "3000")

echo "Nginx 트래픽 전환(웹): $ACTIVE_PORT → $INACTIVE_PORT"

# 백엔드는 8080/8081만 쓰므로 3000/3001 치환은 backend proxy_pass 줄과 겹치지 않는다.
# 단, nginx.conf에 웹 전용 서버/location 블록(proxy_pass http://localhost:3000 등)이
# 이미 있어야 한다 — 최초 1회는 인프라 설정으로 추가해 두어야 한다.
sudo sed -i "s/proxy_pass http:\/\/localhost:$ACTIVE_PORT/proxy_pass http:\/\/localhost:$INACTIVE_PORT/" /etc/nginx/nginx.conf
sudo nginx -t && sudo nginx -s reload

echo $INACTIVE_PORT > $APP_DIR/active_port
echo "Nginx 전환 완료(웹): 현재 활성 포트 → $INACTIVE_PORT"

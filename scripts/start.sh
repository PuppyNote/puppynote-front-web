#!/bin/bash
APP_DIR=/home/ec2-user/app-web
LOG_DIR=/home/ec2-user/logs

mkdir -p $LOG_DIR

# 현재 활성 포트 확인 → 비활성 포트에 배포 (백엔드 8080/8081과 겹치지 않는 3000/3001)
ACTIVE_PORT=$(cat $APP_DIR/active_port 2>/dev/null || echo "3000")
if [ "$ACTIVE_PORT" = "3000" ]; then
  INACTIVE_PORT="3001"
else
  INACTIVE_PORT="3000"
fi

echo "활성 포트: $ACTIVE_PORT → 배포 대상 포트: $INACTIVE_PORT"
echo $INACTIVE_PORT > $APP_DIR/inactive_port

# serve: 정적 빌드 산출물(dist)을 서빙하는 전용 서버. EC2에 전역 설치되어 있어야 한다(npm install -g serve).
nohup serve -s $APP_DIR/dist -l $INACTIVE_PORT \
  > $LOG_DIR/web-$INACTIVE_PORT.log 2>&1 &

echo "정적 서버 시작됨: PID=$! / 포트: $INACTIVE_PORT"

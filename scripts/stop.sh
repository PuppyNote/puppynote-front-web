#!/bin/bash
APP_DIR=/home/ec2-user/app-web

# active_port 기준으로 비활성 포트 계산 (inactive_port 파일은 stale할 수 있음)
ACTIVE_PORT=$(cat $APP_DIR/active_port 2>/dev/null || echo "3000")
if [ "$ACTIVE_PORT" = "3000" ]; then
  INACTIVE_PORT="3001"
else
  INACTIVE_PORT="3000"
fi

echo "활성 포트: $ACTIVE_PORT / 정리 대상 비활성 포트: $INACTIVE_PORT"

PID=$(lsof -ti:$INACTIVE_PORT 2>/dev/null)
if [ -n "$PID" ]; then
  echo "비활성 포트($INACTIVE_PORT) 프로세스 종료: PID=$PID"
  kill -15 $PID
  sleep 3
fi
echo "정리 완료"

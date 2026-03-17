#!/bin/bash
# Clipboard to Slack - Obsidian 플러그인 설치 스크립트
# 사용법: curl -sL <RAW_URL>/install.sh | bash -s -- "<vault경로>"

set -e

REPO_URL="https://gitlab.kolonfnc.com/silentc1/obsidian/clipboard-to-slack"
PLUGIN_ID="clipboard-to-slack"
FILES=("main.js" "manifest.json" "styles.css")

# vault 경로 확인
VAULT_PATH="$1"
if [ -z "$VAULT_PATH" ]; then
  echo "사용법: bash install.sh <vault경로>"
  echo "예시:   bash install.sh ~/private_vault"
  exit 1
fi

PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID"

# plugins 디렉토리 존재 확인
if [ ! -d "$VAULT_PATH/.obsidian" ]; then
  echo "오류: $VAULT_PATH/.obsidian 디렉토리가 없습니다."
  echo "올바른 Obsidian vault 경로인지 확인해주세요."
  exit 1
fi

# 플러그인 디렉토리 생성
mkdir -p "$PLUGIN_DIR"

# 파일 다운로드
echo "Clipboard to Slack 플러그인 설치 중..."
for FILE in "${FILES[@]}"; do
  echo "  다운로드: $FILE"
  curl -sL "$REPO_URL/-/raw/main/$FILE" -o "$PLUGIN_DIR/$FILE"
done

echo ""
echo "설치 완료!"
echo "위치: $PLUGIN_DIR"
echo ""
echo "다음 단계:"
echo "  1. Obsidian 재시작"
echo "  2. 설정 → 커뮤니티 플러그인 → 'Clipboard to Slack' 활성화"

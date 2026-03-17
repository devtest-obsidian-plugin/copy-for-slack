# 설치 및 배포

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 모드 (파일 변경 감지)
npm run dev

# 프로덕션 빌드
npm run build
```

## 배포 방법

### 방법 1: Symlink (개발 중 추천)

프로젝트 폴더를 Obsidian vault의 plugins 폴더에 심볼릭 링크:

```bash
ln -s /Users/jp.park/p/obsidian-plugin/copy-for-slack \
  ~/private_vault/.obsidian/plugins/copy-for-slack
```

`npm run build` 또는 `npm run dev`로 빌드하면 바로 Obsidian에 반영됨.

### 방법 2: npm deploy 스크립트

```bash
npm run deploy
```

빌드 후 `main.js`, `manifest.json`, `styles.css`를 vault에 자동 복사.

### 방법 3: 수동 복사

빌드 후 아래 3개 파일을 `<vault>/.obsidian/plugins/copy-for-slack/`에 복사:
- `main.js`
- `manifest.json`
- `styles.css`

## Obsidian에서 활성화

1. Obsidian 설정 → 커뮤니티 플러그인
2. "제한 모드" 비활성화
3. 설치된 플러그인 목록에서 "Copy for Slack" 활성화

## 사용법

1. Obsidian 에디터에서 텍스트 선택
2. `Cmd+P` (맥) / `Ctrl+P` (윈도우) → "Copy as Slack format" 검색 후 실행
3. 미리보기 모달에서 원본/변환 결과 확인
4. "클립보드에 복사" 버튼 클릭
5. Slack에 붙여넣기

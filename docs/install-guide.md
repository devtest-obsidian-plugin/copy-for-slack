# Copy for Slack - 설치 가이드

Obsidian에서 선택한 텍스트를 Slack mrkdwn 포맷으로 변환하여 클립보드에 복사하는 플러그인입니다.

## 설치 방법

### GitLab 릴리스에서 다운로드

1. GitLab 레포의 **Releases** 페이지로 이동
2. 최신 릴리스에서 아래 3개 파일 다운로드:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Obsidian vault 폴더에서 `.obsidian/plugins/copy-for-slack/` 디렉토리 생성
4. 다운로드한 3개 파일을 해당 디렉토리에 복사

```bash
# 예시 (macOS/Linux)
mkdir -p <vault경로>/.obsidian/plugins/copy-for-slack
cp main.js manifest.json styles.css <vault경로>/.obsidian/plugins/copy-for-slack/
```

### Git clone으로 직접 빌드

```bash
# 1. 레포 클론
git clone <gitlab-repo-url>
cd copy-for-slack

# 2. 의존성 설치 및 빌드
npm install
npm run build

# 3. 파일 복사
cp main.js manifest.json styles.css <vault경로>/.obsidian/plugins/copy-for-slack/
```

## Obsidian에서 활성화

1. Obsidian 열기
2. **설정** (⚙️) → **커뮤니티 플러그인**
3. "제한 모드" 비활성화 (처음 사용 시)
4. **설치된 플러그인** 목록에서 **Copy for Slack** 토글 켜기
5. Obsidian 재시작 (필요 시)

## 사용법

1. Obsidian 에디터에서 변환할 텍스트를 **드래그하여 선택**
2. `Cmd+P` (macOS) 또는 `Ctrl+P` (Windows/Linux)로 커맨드 팔레트 열기
3. **"Copy as Slack format"** 검색 후 실행
4. 미리보기 모달에서 원본과 변환 결과를 비교 확인
5. **"클립보드에 복사"** 버튼 클릭
6. Slack에 `Cmd+V` / `Ctrl+V`로 붙여넣기

## 단축키 설정 (선택)

Obsidian 설정 → **단축키** → "Copy as Slack format" 검색 → 원하는 키 조합 등록

추천: `Cmd+Shift+C` (macOS) / `Ctrl+Shift+C` (Windows/Linux)

## 지원하는 변환

| 요소 | Obsidian | Slack |
|------|----------|-------|
| 굵게 | `**text**` | `*text*` |
| 기울임 | `*text*` | `_text_` |
| 취소선 | `~~text~~` | `~text~` |
| 코드 | `` `code` `` | `` `code` `` |
| 헤딩 | `# Title` | `*Title*` |
| 링크 | `[text](url)` | `<url\|text>` |
| 위키링크 | `[[Note]]` | `Note` |
| 체크박스 | `- [ ] / - [x]` | `☐ / ☑` |
| 인용 | `> quote` | `> quote` |
| 기타 | callout, 수학식, 테이블 등 | 최대한 Slack 호환 형식으로 변환 |

## 문제 해결

- **플러그인이 보이지 않는 경우**: `.obsidian/plugins/copy-for-slack/` 경로에 `main.js`, `manifest.json` 파일이 있는지 확인
- **커맨드가 안 보이는 경우**: 플러그인이 활성화되어 있는지 확인, Obsidian 재시작
- **변환이 예상과 다른 경우**: 코드블록 내부 텍스트는 변환되지 않음 (의도된 동작)

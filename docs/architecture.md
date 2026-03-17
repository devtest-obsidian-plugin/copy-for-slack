# 아키텍처

## 파일 구조

```
copy-for-slack/
├── main.ts              # 플러그인 엔트리 (명령어 등록, 에디터 연동)
├── converter.ts         # convertToSlackMrkdwn() 변환 로직
├── previewModal.ts      # 미리보기 모달 (원본/변환 비교 + 복사 버튼)
├── styles.css           # 미리보기 모달 스타일
├── manifest.json        # Obsidian 플러그인 메타데이터
├── package.json         # 의존성 및 스크립트
├── tsconfig.json        # TypeScript 설정
├── esbuild.config.mjs   # esbuild 빌드 설정
├── main.js              # 빌드 결과 (배포용)
└── docs/                # 문서
```

## 흐름

```
사용자: 텍스트 선택 → Cmd+P "Copy as Slack format"
         │
         ▼
main.ts: editorCallback → editor.getSelection()
         │
         ▼
converter.ts: convertToSlackMrkdwn(selection)
         │  1. 코드블록 보호
         │  2. 주석/수학식/callout/각주/테이블 변환
         │  3. 볼드/이탤릭/취소선/하이라이트 변환
         │  4. 링크/위키링크/임베드 변환
         │  5. 헤딩/체크박스/구분선 변환
         │  6. 코드블록 복원
         │
         ▼
previewModal.ts: SlackPreviewModal (원본 | 변환 비교)
         │
         ▼
사용자: "클립보드에 복사" 클릭 → clipboard.writeText() → Notice
```

## 핵심 설계 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| 변환 방식 | 정규식 기반 단일 함수 | 규칙이 대부분 독립적, AST 파싱은 과설계 |
| 트리거 | 커맨드 팔레트 + 단축키 | Obsidian 표준 UX |
| 위키 링크 | 텍스트로 변환 | Slack에서 내부 링크 의미 없음 |
| 피드백 | 미리보기 모달 + Notice | 변환 결과 사전 확인 가능 |
| 코드블록 처리 | 플레이스홀더 치환/복원 | 코드 내용이 변환되지 않도록 보호 |

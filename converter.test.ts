import { describe, it, expect } from "vitest";
import { convertToSlackMrkdwn } from "./converter";

describe("convertToSlackMrkdwn", () => {
	describe("볼드", () => {
		it("**bold** → *bold*", () => {
			expect(convertToSlackMrkdwn("**굵은 텍스트**")).toBe("*굵은 텍스트*");
		});

		it("볼드가 이탤릭으로 바뀌면 안됨", () => {
			expect(convertToSlackMrkdwn("**작성자:**")).toBe("*작성자:*");
		});
	});

	describe("이탤릭", () => {
		it("*italic* → _italic_", () => {
			expect(convertToSlackMrkdwn("*기울임*")).toBe("_기울임_");
		});
	});

	describe("볼드+이탤릭", () => {
		it("***bold italic*** → *_bold italic_*", () => {
			expect(convertToSlackMrkdwn("***굵은 기울임***")).toBe("*_굵은 기울임_*");
		});
	});

	describe("취소선", () => {
		it("~~strike~~ → ~strike~", () => {
			expect(convertToSlackMrkdwn("~~취소선~~")).toBe("~취소선~");
		});
	});

	describe("헤딩", () => {
		it("# Heading → *Heading*", () => {
			expect(convertToSlackMrkdwn("# 제목")).toBe("*제목*");
		});

		it("## Heading → *Heading*", () => {
			expect(convertToSlackMrkdwn("## 소제목")).toBe("*소제목*");
		});

		it("###### Heading → *Heading*", () => {
			expect(convertToSlackMrkdwn("###### h6 제목")).toBe("*h6 제목*");
		});
	});

	describe("링크", () => {
		it("[text](url) → <url|text>", () => {
			expect(convertToSlackMrkdwn("[구글](https://google.com)")).toBe("<https://google.com|구글>");
		});
	});

	describe("이미지", () => {
		it("![alt](url) → <url|alt>", () => {
			expect(convertToSlackMrkdwn("![이미지](https://example.com/img.png)")).toBe("<https://example.com/img.png|이미지>");
		});
	});

	describe("위키 링크", () => {
		it("[[Note]] → Note", () => {
			expect(convertToSlackMrkdwn("[[노트 이름]]")).toBe("노트 이름");
		});

		it("[[Note|Alias]] → Alias", () => {
			expect(convertToSlackMrkdwn("[[노트|별칭]]")).toBe("별칭");
		});
	});

	describe("임베드", () => {
		it("![[embed]] → embed", () => {
			expect(convertToSlackMrkdwn("![[임베드 노트]]")).toBe("임베드 노트");
		});
	});

	describe("체크박스", () => {
		it("- [ ] task → ☐ task", () => {
			expect(convertToSlackMrkdwn("- [ ] 할 일")).toBe("☐ 할 일");
		});

		it("- [x] task → ☑ task", () => {
			expect(convertToSlackMrkdwn("- [x] 완료")).toBe("☑ 완료");
		});
	});

	describe("인용문", () => {
		it("> quote는 그대로 유지", () => {
			expect(convertToSlackMrkdwn("> 인용문")).toBe("> 인용문");
		});
	});

	describe("callout", () => {
		it("> [!NOTE] title → > NOTE: title", () => {
			expect(convertToSlackMrkdwn("> [!NOTE] 참고")).toBe("> NOTE: 참고");
		});

		it("> [!WARNING]- foldable → > WARNING: foldable", () => {
			expect(convertToSlackMrkdwn("> [!WARNING]- 접이식 경고")).toBe("> WARNING: 접이식 경고");
		});
	});

	describe("코드", () => {
		it("인라인 코드는 변환하지 않음", () => {
			expect(convertToSlackMrkdwn("`**코드**`")).toBe("`**코드**`");
		});

		it("코드블록 내부는 변환하지 않음", () => {
			const input = "```js\nconst x = **bold**;\n```";
			const expected = "```\nconst x = **bold**;\n```";
			expect(convertToSlackMrkdwn(input)).toBe(expected);
		});
	});

	describe("하이라이트", () => {
		it("==highlight== → *highlight*", () => {
			expect(convertToSlackMrkdwn("==강조==")).toBe("*강조*");
		});
	});

	describe("수학식", () => {
		it("$math$ → `math`", () => {
			expect(convertToSlackMrkdwn("$E=mc^2$")).toBe("`E=mc^2`");
		});
	});

	describe("백슬래시 이스케이프", () => {
		it("\\. → .", () => {
			expect(convertToSlackMrkdwn("2026\\. 01\\. 31\\.")).toBe("2026. 01. 31.");
		});

		it("\\- → -", () => {
			expect(convertToSlackMrkdwn("\\- 항목")).toBe("- 항목");
		});
	});

	describe("구분선", () => {
		it("--- → ───────", () => {
			expect(convertToSlackMrkdwn("---")).toBe("───────");
		});
	});

	describe("주석", () => {
		it("%% comment %% 제거", () => {
			expect(convertToSlackMrkdwn("텍스트 %% 주석 %% 끝")).toBe("텍스트  끝");
		});
	});

	describe("복합 변환", () => {
		it("실제 Obsidian 문서 변환", () => {
			const input = `# 쿠폰/프로모션 시스템

**작성자:** 기획팀 / **작성일:** 2026\\. 01\\. 31\\.

## 1\\. 배경 및 목적

- 하이브리스 패키지 제약으로 인한 한계
- 시스템 독립화를 통해 운영 기민성 확보

## 2\\. 핵심 가치

- **Objective:** MSA 기반 엔진 구축
- **Key Results:**
  - 세팅 소요 시간 60% 단축
  - CTR 20% 상승`;

			const result = convertToSlackMrkdwn(input);

			// 헤딩 → 볼드
			expect(result).toContain("*쿠폰/프로모션 시스템*");
			expect(result).toContain("*1. 배경 및 목적*");

			// 볼드 유지 (이탤릭으로 바뀌면 안됨)
			expect(result).toContain("*작성자:*");
			expect(result).toContain("*작성일:*");
			expect(result).toContain("*Objective:*");
			expect(result).toContain("*Key Results:*");

			// 백슬래시 제거
			expect(result).toContain("2026. 01. 31.");
			expect(result).not.toContain("\\.");
			expect(result).not.toContain("\\-");
		});
	});
});

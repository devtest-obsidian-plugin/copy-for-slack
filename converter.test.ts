import { describe, it, expect } from "vitest";
import { convertToSlackMrkdwn, convertToSlackHtml } from "./converter";

describe("convertToSlackHtml", () => {
	it("볼드 → <b>", () => {
		expect(convertToSlackHtml("**굵게**")).toContain("<b>굵게</b>");
	});

	it("이탤릭 → <i>", () => {
		expect(convertToSlackHtml("*기울임*")).toContain("<i>기울임</i>");
	});

	it("취소선 → <s>", () => {
		expect(convertToSlackHtml("~~취소~~")).toContain("<s>취소</s>");
	});

	it("링크 → <a>", () => {
		expect(convertToSlackHtml("[구글](https://google.com)")).toContain('<a href="https://google.com">구글</a>');
	});

	it("헤딩 → <b>", () => {
		expect(convertToSlackHtml("## 제목")).toContain("<b>제목</b>");
	});

	it("인라인 코드 → <code>", () => {
		expect(convertToSlackHtml("`코드`")).toContain("<code>코드</code>");
	});

	it("코드블록 → <pre><code>", () => {
		const result = convertToSlackHtml("```js\nconst x = 1;\n```");
		expect(result).toContain("<code>const x = 1;</code>");
		expect(result).toContain("<pre");
	});

	it("볼드가 포함된 헤딩", () => {
		const result = convertToSlackHtml("## **1. 배경**");
		expect(result).toContain("<b>1. 배경</b>");
		expect(result).not.toContain("<b><b>");
	});

	it("인용문 → <blockquote>", () => {
		expect(convertToSlackHtml("> 인용문")).toContain("<blockquote>인용문</blockquote>");
	});

	it("실제 문서 변환", () => {
		const input = `## **1\\. 배경 및 목적**

* 하이브리스 패키지 제약
* **Objective:** MSA 기반 엔진`;

		const result = convertToSlackHtml(input);
		expect(result).toContain("<b>1. 배경 및 목적</b>");
		expect(result).toContain("<b>Objective:</b>");
	});

	it("중첩 리스트 → nbsp 들여쓰기", () => {
		const input = `- 항목 1
- 항목 2
  - 하위 2-1
  - 하위 2-2
- 항목 3`;
		const result = convertToSlackHtml(input);
		expect(result).toContain("• 항목 1");
		expect(result).toContain("• 항목 2");
		// 하위 항목은 다른 불릿 + 들여쓰기
		expect(result).toContain("◦ 하위 2-1");
		expect(result).toContain("◦ 하위 2-2");
		expect(result).toContain("\u00A0"); // non-breaking space
	});

	it("순서 리스트", () => {
		const input = `1. 첫째
2. 둘째
3. 셋째`;
		const result = convertToSlackHtml(input);
		expect(result).toContain("1. 첫째");
		expect(result).toContain("2. 둘째");
	});

	it("체크박스 리스트", () => {
		const input = `- [x] 완료
- [ ] 미완료`;
		const result = convertToSlackHtml(input);
		expect(result).toContain("☑ 완료");
		expect(result).toContain("☐ 미완료");
	});
});

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

		it("볼드가 포함된 헤딩 (이중 감싸기 방지)", () => {
			const input = "## **1. 배경 및 목적**";
			const result = convertToSlackMrkdwn(input);
			expect(result).toBe("*1. 배경 및 목적*");
			expect(result).not.toContain("**");
		});

		it("* 불릿이 - 불릿으로 변환", () => {
			const input = `* 첫번째 항목
* **Objective:** 목표
  * 하위 항목`;
			const result = convertToSlackMrkdwn(input);
			expect(result).toContain("- 첫번째 항목");
			expect(result).toContain("- *Objective:* 목표");
			expect(result).toContain("  - 하위 항목");
			expect(result).not.toMatch(/^\*/m);
		});

		it("실제 스크린샷 재현 테스트", () => {
			const input = `## **1\\. 배경 및 목적**

* 하이브리스 패키지 제약으로 인한 마케팅 조건 조합의 한계
* 시스템 독립화를 통해 운영 기민성 확보

## **2\\. 핵심 가치 및 목표**

* **Objective:** MSA 기반의 독자적인 쿠폰/프로모션 엔진 구축
* **Key Results:**
  * 신규 쿠폰/프로모션 세팅 소요 시간 60% 단축`;

			const result = convertToSlackMrkdwn(input);

			// 헤딩: 이중 ** 아닌 단일 *
			expect(result).toContain("*1. 배경 및 목적*");
			expect(result).toContain("*2. 핵심 가치 및 목표*");
			expect(result).not.toContain("**1.");
			expect(result).not.toContain("**2.");

			// 불릿: * → -
			expect(result).toContain("- 하이브리스");
			expect(result).toContain("- *Objective:*");
			expect(result).toContain("- *Key Results:*");
			expect(result).toContain("  - 신규 쿠폰");
		});
	});
});

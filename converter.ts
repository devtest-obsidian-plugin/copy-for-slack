/**
 * Obsidian 마크다운을 Slack mrkdwn 포맷으로 변환하는 모듈
 */

interface CodeBlock {
	placeholder: string;
	content: string;
}

function protectCodeBlocks(text: string): { text: string; blocks: CodeBlock[] } {
	const blocks: CodeBlock[] = [];
	let idx = 0;

	// 코드블록 (```...```) 보호 - lang 태그 제거
	text = text.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) => {
		const placeholder = `\x00CODEBLOCK_${idx}\x00`;
		blocks.push({ placeholder, content: "```\n" + code + "```" });
		idx++;
		return placeholder;
	});

	// 인라인 코드 (`...`) 보호
	text = text.replace(/`([^`\n]+)`/g, (match) => {
		const placeholder = `\x00CODEBLOCK_${idx}\x00`;
		blocks.push({ placeholder, content: match });
		idx++;
		return placeholder;
	});

	return { text, blocks };
}

function restoreCodeBlocks(text: string, blocks: CodeBlock[]): string {
	for (const block of blocks) {
		text = text.replace(block.placeholder, block.content);
	}
	return text;
}

function removeComments(text: string): string {
	return text.replace(/%%[\s\S]*?%%/g, "");
}

function convertBlockMath(text: string): string {
	return text.replace(/\$\$([\s\S]*?)\$\$/g, "```\n$1\n```");
}

function convertInlineMath(text: string): string {
	return text.replace(/\$([^\$\n]+)\$/g, "`$1`");
}

function convertCallouts(text: string): string {
	// > [!type] title 또는 > [!type]- title (접이식)
	return text.replace(/^(>\s*)\[!(\w+)\]-?\s*(.*)/gm, (_, prefix, type, title) => {
		return `${prefix}${type.toUpperCase()}${title ? ": " + title : ""}`;
	});
}

function convertFootnotes(text: string): string {
	// 각주 정의를 수집
	const footnotes: Record<string, string> = {};
	text = text.replace(/^\[\^(\w+)\]:\s*(.+)$/gm, (_, id, content) => {
		footnotes[id] = content;
		return "";
	});

	// 각주 참조를 인라인으로 대체
	text = text.replace(/\[\^(\w+)\]/g, (_, id) => {
		return footnotes[id] ? ` (${footnotes[id]})` : "";
	});

	return text;
}

function convertTable(text: string): string {
	// 테이블 블록을 찾아서 리스트 형태로 변환
	const tableRegex = /^\|(.+)\|\s*\n\|[\s\-:|]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm;

	return text.replace(tableRegex, (_, headerRow, bodyRows) => {
		const headers = headerRow.split("|").map((h: string) => h.trim()).filter(Boolean);
		const rows = bodyRows.trim().split("\n").filter(Boolean);
		let result = "";

		for (const row of rows) {
			const cells = row.split("|").map((c: string) => c.trim()).filter(Boolean);
			const parts: string[] = [];
			for (let i = 0; i < cells.length && i < headers.length; i++) {
				parts.push(`${headers[i]}: ${cells[i]}`);
			}
			result += parts.join(" | ") + "\n";
		}

		return result;
	});
}

function convertBoldItalic(text: string): string {
	// ***bold italic*** → *_bold italic_*
	return text.replace(/\*\*\*(.+?)\*\*\*/g, "*_$1_*");
}

function convertBold(text: string): string {
	// **bold** → *bold*
	return text.replace(/\*\*(.+?)\*\*/g, "*$1*");
}

function convertItalic(text: string): string {
	// 남은 *italic* → _italic_ (볼드 처리 후이므로 단일 * 만 남음)
	// 단, 리스트 마커(줄 시작의 *)는 변환하지 않음
	return text.replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, "_$1_");
}

function convertStrikethrough(text: string): string {
	return text.replace(/~~(.+?)~~/g, "~$1~");
}

function convertHighlight(text: string): string {
	return text.replace(/==(.+?)==/g, "*$1*");
}

function convertMarkdownLinks(text: string): string {
	// [text](url) → <url|text>
	return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<$2|$1>");
}

function convertImages(text: string): string {
	// ![alt](url) → <url|alt>
	return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "<$2|$1>");
}

function convertEmbeds(text: string): string {
	// ![[embed]] → embed
	return text.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, name, alias) => {
		return alias || name;
	});
}

function convertWikiLinks(text: string): string {
	// [[Note|Alias]] → Alias, [[Note]] → Note
	return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, name, alias) => {
		return alias || name;
	});
}

function convertHeadings(text: string): string {
	return text.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");
}

function convertCheckboxes(text: string): string {
	text = text.replace(/^(\s*)-\s*\[x\]\s*/gm, "$1☑ ");
	text = text.replace(/^(\s*)-\s*\[ \]\s*/gm, "$1☐ ");
	return text;
}

function convertHorizontalRule(text: string): string {
	return text.replace(/^-{3,}$/gm, "───────");
}

function cleanupExtraBlankLines(text: string): string {
	return text.replace(/\n{3,}/g, "\n\n");
}

export function convertToSlackMrkdwn(text: string): string {
	// 1. 코드블록/인라인 코드 보호
	const { text: protectedText, blocks } = protectCodeBlocks(text);
	let result = protectedText;

	// 2. 주석 제거
	result = removeComments(result);

	// 3. 블록 수학식 → 코드블록
	result = convertBlockMath(result);

	// 4. 인라인 수학식 → 인라인 코드
	result = convertInlineMath(result);

	// 5. callout → 인용문
	result = convertCallouts(result);

	// 6. 각주 인라인 병합
	result = convertFootnotes(result);

	// 7. 테이블 → 텍스트
	result = convertTable(result);

	// 8. 볼드+이탤릭
	result = convertBoldItalic(result);

	// 9. 볼드
	result = convertBold(result);

	// 10. 이탤릭
	result = convertItalic(result);

	// 11. 취소선
	result = convertStrikethrough(result);

	// 12. 하이라이트
	result = convertHighlight(result);

	// 13. 이미지 (링크보다 먼저 처리 - ![]()가 []()에 매칭되지 않도록)
	result = convertImages(result);

	// 14. 마크다운 링크
	result = convertMarkdownLinks(result);

	// 15. 임베드
	result = convertEmbeds(result);

	// 16. 위키 링크
	result = convertWikiLinks(result);

	// 17. 헤딩
	result = convertHeadings(result);

	// 18. 체크박스
	result = convertCheckboxes(result);

	// 19. 구분선
	result = convertHorizontalRule(result);

	// 20. 코드블록 복원
	result = restoreCodeBlocks(result, blocks);

	// 정리
	result = cleanupExtraBlankLines(result);

	return result.trim();
}

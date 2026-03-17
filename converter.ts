/**
 * Obsidian 마크다운을 Slack에 붙여넣기 가능한 HTML로 변환하는 모듈
 *
 * Slack은 붙여넣기 시 mrkdwn 텍스트(*bold*)를 해석하지 않지만,
 * HTML 리치 텍스트(<b>bold</b>)는 올바르게 렌더링한다.
 */

interface CodeBlock {
	placeholder: string;
	original: string;
	html: string;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function protectCodeBlocks(text: string): { text: string; blocks: CodeBlock[] } {
	const blocks: CodeBlock[] = [];
	let idx = 0;

	// 코드블록 (```...```) 보호 - lang 태그 제거
	text = text.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) => {
		const placeholder = `\x00CODEBLOCK_${idx}\x00`;
		blocks.push({
			placeholder,
			original: "```\n" + code + "```",
			html: `<pre>${escapeHtml(code.replace(/\n$/, ""))}</pre>`,
		});
		idx++;
		return placeholder;
	});

	// 인라인 코드 (`...`) 보호
	text = text.replace(/`([^`\n]+)`/g, (_, code) => {
		const placeholder = `\x00CODEBLOCK_${idx}\x00`;
		blocks.push({
			placeholder,
			original: "`" + code + "`",
			html: `<code>${escapeHtml(code)}</code>`,
		});
		idx++;
		return placeholder;
	});

	return { text, blocks };
}

function restoreCodeBlocks(text: string, blocks: CodeBlock[], format: "html" | "mrkdwn"): string {
	for (const block of blocks) {
		text = text.replace(block.placeholder, format === "html" ? block.html : block.original);
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
	return text.replace(/^(>\s*)\[!(\w+)\]-?\s*(.*)/gm, (_, prefix, type, title) => {
		return `${prefix}${type.toUpperCase()}${title ? ": " + title : ""}`;
	});
}

function convertFootnotes(text: string): string {
	const footnotes: Record<string, string> = {};
	text = text.replace(/^\[\^(\w+)\]:\s*(.+)$/gm, (_, id, content) => {
		footnotes[id] = content;
		return "";
	});
	text = text.replace(/\[\^(\w+)\]/g, (_, id) => {
		return footnotes[id] ? ` (${footnotes[id]})` : "";
	});
	return text;
}

function convertTable(text: string): string {
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

function removeBackslashEscapes(text: string): string {
	return text.replace(/\\([.\-#*!>\[\](){}+_~`|])/g, "$1");
}

function convertAsteriskBullets(text: string): string {
	return text.replace(/^(\s*)\*\s+/gm, "$1- ");
}

function cleanupExtraBlankLines(text: string): string {
	return text.replace(/\n{3,}/g, "\n\n");
}

/**
 * 전처리된 마크다운 텍스트를 HTML로 변환
 */
function markdownToHtml(text: string): string {
	// 볼드+이탤릭
	text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<b><i>$1</i></b>");

	// 이탤릭 먼저 (단일 * 만 매칭, ** 아닌 것)
	text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");

	// 볼드
	text = text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

	// 취소선
	text = text.replace(/~~(.+?)~~/g, "<s>$1</s>");

	// 하이라이트 → 볼드
	text = text.replace(/==(.+?)==/g, "<b>$1</b>");

	// 이미지 → 링크 (링크보다 먼저)
	text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

	// 마크다운 링크
	text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

	// 임베드
	text = text.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, name, alias) => alias || name);

	// 위키 링크
	text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, name, alias) => alias || name);

	// 헤딩 → 볼드
	text = text.replace(/^#{1,6}\s+(.+)$/gm, (_, content) => {
		// 기존 HTML 태그 제거 후 볼드로 감싸기
		const stripped = content.replace(/<\/?[bi]>/g, "");
		return `<b>${stripped}</b>`;
	});

	// 체크박스
	text = text.replace(/^(\s*)-\s*\[x\]\s*/gm, "$1☑ ");
	text = text.replace(/^(\s*)-\s*\[ \]\s*/gm, "$1☐ ");

	// 구분선
	text = text.replace(/^-{3,}$/gm, "───────");

	return text;
}

/**
 * 텍스트를 줄 단위로 처리하여 인용문과 리스트를 HTML로 변환
 */
function convertBlockElements(text: string): string {
	const lines = text.split("\n");
	const result: string[] = [];

	for (const line of lines) {
		if (line.startsWith("> ")) {
			// 인용문
			result.push(`<blockquote>${line.slice(2)}</blockquote>`);
		} else {
			result.push(line);
		}
	}

	return result.join("\n");
}

/**
 * Obsidian 마크다운을 Slack용 HTML로 변환 (클립보드에 HTML로 저장용)
 */
export function convertToSlackHtml(text: string): string {
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

	// 8. 백슬래시 이스케이프 제거
	result = removeBackslashEscapes(result);

	// 9. * 불릿 → - 불릿
	result = convertAsteriskBullets(result);

	// 10. 마크다운 → HTML 인라인 변환
	result = markdownToHtml(result);

	// 11. 블록 요소 변환 (인용문 등)
	result = convertBlockElements(result);

	// 12. 코드블록 복원 (HTML 형태)
	result = restoreCodeBlocks(result, blocks, "html");

	// 13. 줄바꿈 → <br>
	result = cleanupExtraBlankLines(result);
	result = result.replace(/\n/g, "<br>");

	return result.trim();
}

/**
 * Obsidian 마크다운을 Slack mrkdwn 텍스트로 변환 (미리보기용)
 */
export function convertToSlackMrkdwn(text: string): string {
	const { text: protectedText, blocks } = protectCodeBlocks(text);
	let result = protectedText;

	result = removeComments(result);
	result = convertBlockMath(result);
	result = convertInlineMath(result);
	result = convertCallouts(result);
	result = convertFootnotes(result);
	result = convertTable(result);
	result = removeBackslashEscapes(result);
	result = convertAsteriskBullets(result);

	// 볼드+이탤릭
	result = result.replace(/\*\*\*(.+?)\*\*\*/g, "\x01_$1_\x01");
	// 이탤릭
	result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "_$1_");
	// 볼드
	result = result.replace(/\*\*(.+?)\*\*/g, "*$1*");
	// 볼드+이탤릭 플레이스홀더 복원
	result = result.replace(/\x01/g, "*");
	// 취소선
	result = result.replace(/~~(.+?)~~/g, "~$1~");
	// 하이라이트
	result = result.replace(/==(.+?)==/g, "*$1*");
	// 이미지
	result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "<$2|$1>");
	// 링크
	result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<$2|$1>");
	// 임베드
	result = result.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, name, alias) => alias || name);
	// 위키 링크
	result = result.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, name, alias) => alias || name);
	// 헤딩
	result = result.replace(/^#{1,6}\s+(.+)$/gm, (_, content) => {
		const stripped = content.replace(/^\*+|\*+$/g, "").replace(/^_+|_+$/g, "");
		return `*${stripped}*`;
	});
	// 체크박스
	result = result.replace(/^(\s*)-\s*\[x\]\s*/gm, "$1☑ ");
	result = result.replace(/^(\s*)-\s*\[ \]\s*/gm, "$1☐ ");
	// 구분선
	result = result.replace(/^-{3,}$/gm, "───────");

	result = restoreCodeBlocks(result, blocks, "mrkdwn");
	result = cleanupExtraBlankLines(result);

	return result.trim();
}

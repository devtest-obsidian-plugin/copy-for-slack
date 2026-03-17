import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { convertToSlackHtml, convertToSlackMrkdwn } from "./converter";
import { SlackPreviewModal } from "./previewModal";

async function copyToClipboard(html: string, mrkdwn: string) {
	const blob = new Blob([html], { type: "text/html" });
	const textBlob = new Blob([mrkdwn], { type: "text/plain" });
	await navigator.clipboard.write([
		new ClipboardItem({
			"text/html": blob,
			"text/plain": textBlob,
		}),
	]);
}

function getSelection(plugin: Plugin): string | null {
	const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) {
		new Notice("마크다운 에디터를 먼저 열어주세요");
		return null;
	}
	const selection = view.editor.getSelection();
	if (!selection) {
		new Notice("텍스트를 먼저 선택해주세요");
		return null;
	}
	return selection;
}

export default class ClipboardToSlackPlugin extends Plugin {
	async onload() {
		this.addRibbonIcon("message-square", "Copy as Slack format", () => {
			const selection = getSelection(this);
			if (!selection) return;
			const html = convertToSlackHtml(selection);
			const mrkdwn = convertToSlackMrkdwn(selection);
			new SlackPreviewModal(this.app, selection, html, mrkdwn).open();
		});

		// 미리보기 후 복사
		this.addCommand({
			id: "copy-as-slack-preview",
			name: "Copy as Slack format (미리보기)",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection();
				if (!selection) {
					new Notice("텍스트를 먼저 선택해주세요");
					return;
				}
				const html = convertToSlackHtml(selection);
				const mrkdwn = convertToSlackMrkdwn(selection);
				new SlackPreviewModal(this.app, selection, html, mrkdwn).open();
			},
		});

		// 바로 복사 (미리보기 없이)
		this.addCommand({
			id: "copy-as-slack-direct",
			name: "Copy as Slack format (바로 복사)",
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "s" }],
			editorCallback: async (editor: Editor) => {
				const selection = editor.getSelection();
				if (!selection) {
					new Notice("텍스트를 먼저 선택해주세요");
					return;
				}
				const html = convertToSlackHtml(selection);
				const mrkdwn = convertToSlackMrkdwn(selection);
				await copyToClipboard(html, mrkdwn);
				new Notice("Slack 형식으로 클립보드에 복사되었습니다");
			},
		});
	}

	onunload() {}
}

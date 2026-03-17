import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { convertToSlackHtml, convertToSlackMrkdwn } from "./converter";
import { SlackPreviewModal } from "./previewModal";

function openSlackPreview(app: import("obsidian").App, selection: string) {
	const html = convertToSlackHtml(selection);
	const mrkdwn = convertToSlackMrkdwn(selection);
	new SlackPreviewModal(app, selection, html, mrkdwn).open();
}

export default class ClipboardToSlackPlugin extends Plugin {
	async onload() {
		this.addRibbonIcon("message-square", "Copy as Slack format", () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) {
				new Notice("마크다운 에디터를 먼저 열어주세요");
				return;
			}
			const editor = view.editor;
			const selection = editor.getSelection();
			if (!selection) {
				new Notice("텍스트를 먼저 선택해주세요");
				return;
			}
			openSlackPreview(this.app, selection);
		});

		this.addCommand({
			id: "copy-as-slack-format",
			name: "Copy as Slack format",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection();
				if (!selection) {
					new Notice("텍스트를 먼저 선택해주세요");
					return;
				}
				openSlackPreview(this.app, selection);
			},
		});
	}

	onunload() {}
}

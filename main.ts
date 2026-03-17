import { Editor, Notice, Plugin } from "obsidian";
import { convertToSlackMrkdwn } from "./converter";
import { SlackPreviewModal } from "./previewModal";

export default class ClipboardToSlackPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "copy-as-slack-format",
			name: "Copy as Slack format",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection();
				if (!selection) {
					new Notice("텍스트를 먼저 선택해주세요");
					return;
				}

				const converted = convertToSlackMrkdwn(selection);
				new SlackPreviewModal(this.app, selection, converted).open();
			},
		});
	}

	onunload() {}
}

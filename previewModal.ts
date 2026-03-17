import { App, Modal, Notice } from "obsidian";

export class SlackPreviewModal extends Modal {
	private original: string;
	private converted: string;

	constructor(app: App, original: string, converted: string) {
		super(app);
		this.original = original;
		this.converted = converted;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("slack-preview-modal");

		contentEl.createEl("h2", { text: "Slack 형식 미리보기" });

		const container = contentEl.createDiv({ cls: "slack-preview-container" });

		// 원본 영역
		const originalSection = container.createDiv({ cls: "slack-preview-section" });
		originalSection.createEl("h3", { text: "원본 (Obsidian)" });
		const originalPre = originalSection.createEl("pre", { cls: "slack-preview-code" });
		originalPre.createEl("code", { text: this.original });

		// 변환 결과 영역
		const convertedSection = container.createDiv({ cls: "slack-preview-section" });
		convertedSection.createEl("h3", { text: "변환 (Slack mrkdwn)" });
		const convertedPre = convertedSection.createEl("pre", { cls: "slack-preview-code" });
		convertedPre.createEl("code", { text: this.converted });

		// 복사 버튼
		const buttonContainer = contentEl.createDiv({ cls: "slack-preview-buttons" });
		const copyButton = buttonContainer.createEl("button", {
			text: "클립보드에 복사",
			cls: "mod-cta",
		});
		copyButton.addEventListener("click", async () => {
			await navigator.clipboard.writeText(this.converted);
			new Notice("Slack 형식으로 클립보드에 복사되었습니다");
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

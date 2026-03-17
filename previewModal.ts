import { App, Modal, Notice } from "obsidian";

export class SlackPreviewModal extends Modal {
	private original: string;
	private htmlContent: string;
	private mrkdwnContent: string;

	constructor(app: App, original: string, htmlContent: string, mrkdwnContent: string) {
		super(app);
		this.original = original;
		this.htmlContent = htmlContent;
		this.mrkdwnContent = mrkdwnContent;
	}

	onOpen() {
		const { contentEl } = this;
		this.modalEl.addClass("mod-slack-preview");
		contentEl.addClass("slack-preview-modal");

		contentEl.createEl("h2", { text: "Slack 형식 미리보기" });

		const container = contentEl.createDiv({ cls: "slack-preview-container" });

		// 원본 영역
		const originalSection = container.createDiv({ cls: "slack-preview-section" });
		originalSection.createEl("h3", { text: "원본 (Obsidian)" });
		const originalPre = originalSection.createEl("pre", { cls: "slack-preview-code" });
		originalPre.createEl("code", { text: this.original });

		// 변환 미리보기 (HTML 렌더링)
		const convertedSection = container.createDiv({ cls: "slack-preview-section" });
		convertedSection.createEl("h3", { text: "변환 미리보기 (Slack)" });
		const previewDiv = convertedSection.createDiv({ cls: "slack-preview-rendered" });
		previewDiv.innerHTML = this.htmlContent;

		// 복사 버튼
		const buttonContainer = contentEl.createDiv({ cls: "slack-preview-buttons" });
		const copyButton = buttonContainer.createEl("button", {
			text: "클립보드에 복사",
			cls: "mod-cta",
		});
		copyButton.addEventListener("click", async () => {
			// HTML과 plain text 모두 클립보드에 저장
			const blob = new Blob([this.htmlContent], { type: "text/html" });
			const textBlob = new Blob([this.mrkdwnContent], { type: "text/plain" });
			await navigator.clipboard.write([
				new ClipboardItem({
					"text/html": blob,
					"text/plain": textBlob,
				}),
			]);
			new Notice("Slack 형식으로 클립보드에 복사되었습니다");
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

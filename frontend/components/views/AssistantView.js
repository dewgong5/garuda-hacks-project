import { LitElement, html, css } from 'lit';

export class AssistantView extends LitElement {
    static styles = css`
        .assistant-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 20px;
        }

        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .session-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .session-title {
            font-size: 18px;
            font-weight: 600;
        }

        .session-status {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }

        .session-duration {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
        }

        .controls {
            display: flex;
            gap: 12px;
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .btn-danger {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            color: white;
        }

        .btn-danger:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        }

        .chat-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow-y: auto;
            padding-right: 8px;
        }

        .response-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .response-text {
            font-size: 14px;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.9);
            white-space: pre-wrap;
        }

        .response-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
        }

        .input-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .input-container {
            display: flex;
            gap: 12px;
        }

        .text-input {
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            padding: 12px 16px;
            font-size: 14px;
            resize: none;
            min-height: 44px;
            max-height: 120px;
            transition: all 0.2s ease;
        }

        .text-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .text-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        .send-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            color: white;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 80px;
        }

        .send-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: rgba(255, 255, 255, 0.5);
            text-align: center;
        }

        .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .empty-text {
            font-size: 16px;
            margin-bottom: 8px;
        }

        .empty-subtext {
            font-size: 14px;
        }
    `;

    static properties = {
        responses: { type: Array },
        currentResponseIndex: { type: Number },
        statusText: { type: String },
        startTime: { type: Number },
        shouldAnimateResponse: { type: Boolean },
        onStop: { type: Function },
        onSendText: { type: Function },
        onBack: { type: Function }
    };

    constructor() {
        super();
        this.responses = [];
        this.currentResponseIndex = -1;
        this.statusText = 'Ready';
        this.startTime = null;
        this.shouldAnimateResponse = false;
        this.textInput = '';
    }

    formatDuration(startTime) {
        if (!startTime) return '00:00';
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    handleTextInput(e) {
        this.textInput = e.target.value;
    }

    handleSendText() {
        if (this.textInput.trim()) {
            this.onSendText(this.textInput.trim());
            this.textInput = '';
        }
    }

    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendText();
        }
    }

    render() {
        return html`
            <div class="assistant-container">
                <div class="header-section">
                    <div class="session-info">
                        <div class="session-title">Active Session</div>
                        <div class="session-status">${this.statusText}</div>
                        <div class="session-duration">${this.formatDuration(this.startTime)}</div>
                    </div>
                    
                    <div class="controls">
                        <button class="btn btn-secondary" @click=${this.onBack}>
                            Back
                        </button>
                        <button class="btn btn-danger" @click=${this.onStop}>
                            Stop Session
                        </button>
                    </div>
                </div>

                <div class="chat-section">
                    ${this.responses.length === 0 ? html`
                        <div class="empty-state">
                            <div class="empty-icon">🎤</div>
                            <div class="empty-text">Start speaking to get AI assistance</div>
                            <div class="empty-subtext">Your voice will be transcribed and sent to Gemini</div>
                        </div>
                    ` : html`
                        ${this.responses.map((response, index) => html`
                            <div class="response-card ${this.shouldAnimateResponse && index === this.responses.length - 1 ? 'fade-in' : ''}">
                                <div class="response-text">${response}</div>
                                <div class="response-meta">
                                    <span>Response ${index + 1}</span>
                                    <span>${new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                        `)}
                    `}
                </div>

                <div class="input-section">
                    <div class="input-container">
                        <textarea 
                            class="text-input"
                            placeholder="Type a message or question..."
                            .value=${this.textInput}
                            @input=${this.handleTextInput}
                            @keypress=${this.handleKeyPress}
                            rows="1"
                        ></textarea>
                        <button 
                            class="send-btn"
                            @click=${this.handleSendText}
                            ?disabled=${!this.textInput.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('assistant-view', AssistantView); 
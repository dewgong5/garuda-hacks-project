import { LitElement, html, css } from 'lit';

export class MainView extends LitElement {
    static styles = css`
        .main-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 20px;
        }

        .welcome-section {
            text-align: center;
            margin-bottom: 40px;
        }

        .welcome-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .welcome-subtitle {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 32px;
        }

        .config-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 32px;
        }

        .config-group {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }

        .config-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: rgba(255, 255, 255, 0.9);
        }

        .input-group {
            margin-bottom: 16px;
        }

        .input-label {
            display: block;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 6px;
        }

        .input-field {
            width: 100%;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            padding: 10px 12px;
            font-size: 14px;
            transition: all 0.2s ease;
        }

        .input-field:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-field::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        .select-field {
            width: 100%;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            padding: 10px 12px;
            font-size: 14px;
            cursor: pointer;
        }

        .select-field option {
            background: #2a2a2a;
            color: white;
        }

        .actions-section {
            display: flex;
            gap: 16px;
            justify-content: center;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            color: white;
            padding: 14px 32px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            padding: 14px 32px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .status-indicator {
            text-align: center;
            margin-top: 16px;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        }
    `;

    static properties = {
        apiKey: { type: String },
        customPrompt: { type: String },
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        selectedScreenshotInterval: { type: String },
        selectedImageQuality: { type: String },
        statusText: { type: String },
        onStart: { type: Function },
        onSettings: { type: Function }
    };

    constructor() {
        super();
        this.apiKey = '';
        this.customPrompt = '';
        this.selectedProfile = 'interview';
        this.selectedLanguage = 'en-US';
        this.selectedScreenshotInterval = '5';
        this.selectedImageQuality = 'medium';
        this.statusText = 'Ready';
    }

    handleInputChange(field, value) {
        this[field] = value;
        this.requestUpdate();
    }

    render() {
        return html`
            <div class="main-container">
                <div class="welcome-section">
                    <h1 class="welcome-title">Cheating Mommy</h1>
                    <p class="welcome-subtitle">Your AI-powered exam assistant</p>
                </div>

                <div class="config-section">
                    <div class="config-group">
                        <div class="config-title">API Configuration</div>
                        
                        <div class="input-group">
                            <label class="input-label">Gemini API Key</label>
                            <input 
                                type="password" 
                                class="input-field" 
                                placeholder="Enter your Gemini API key"
                                .value=${this.apiKey}
                                @input=${(e) => this.handleInputChange('apiKey', e.target.value)}
                            />
                        </div>

                        <div class="input-group">
                            <label class="input-label">Custom Prompt (Optional)</label>
                            <textarea 
                                class="input-field" 
                                placeholder="Additional instructions for the AI..."
                                rows="3"
                                .value=${this.customPrompt}
                                @input=${(e) => this.handleInputChange('customPrompt', e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    <div class="config-group">
                        <div class="config-title">Session Settings</div>
                        
                        <div class="input-group">
                            <label class="input-label">Profile</label>
                            <select 
                                class="select-field"
                                .value=${this.selectedProfile}
                                @change=${(e) => this.handleInputChange('selectedProfile', e.target.value)}
                            >
                                <option value="interview">Interview</option>
                                <option value="exam">Exam</option>
                                <option value="homework">Homework</option>
                                <option value="general">General</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label class="input-label">Language</label>
                            <select 
                                class="select-field"
                                .value=${this.selectedLanguage}
                                @change=${(e) => this.handleInputChange('selectedLanguage', e.target.value)}
                            >
                                <option value="en-US">English</option>
                                <option value="es-ES">Spanish</option>
                                <option value="fr-FR">French</option>
                                <option value="de-DE">German</option>
                                <option value="zh-CN">Chinese</option>
                                <option value="ja-JP">Japanese</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label class="input-label">Screenshot Interval</label>
                            <select 
                                class="select-field"
                                .value=${this.selectedScreenshotInterval}
                                @change=${(e) => this.handleInputChange('selectedScreenshotInterval', e.target.value)}
                            >
                                <option value="manual">Manual Only</option>
                                <option value="5">5 seconds</option>
                                <option value="10">10 seconds</option>
                                <option value="30">30 seconds</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label class="input-label">Image Quality</label>
                            <select 
                                class="select-field"
                                .value=${this.selectedImageQuality}
                                @change=${(e) => this.handleInputChange('selectedImageQuality', e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="actions-section">
                    <button class="btn-secondary" @click=${this.onSettings}>
                        Advanced Settings
                    </button>
                    <button class="btn-primary" @click=${this.onStart}>
                        Start Session
                    </button>
                </div>

                <div class="status-indicator">
                    ${this.statusText}
                </div>
            </div>
        `;
    }
}

customElements.define('main-view', MainView); 
import { LitElement, html, css } from 'lit';

export class SettingsView extends LitElement {
    static styles = css`
        .settings-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 20px;
        }

        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-title {
            font-size: 20px;
            font-weight: 600;
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

        .settings-content {
            flex: 1;
            overflow-y: auto;
        }

        .settings-section {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
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

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
        }

        .checkbox {
            width: 16px;
            height: 16px;
            accent-color: #667eea;
        }

        .checkbox-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
        }

        .actions-section {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .info-text {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 8px;
        }
    `;

    static properties = {
        apiKey: { type: String },
        customPrompt: { type: String },
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        selectedScreenshotInterval: { type: String },
        selectedImageQuality: { type: String },
        onSave: { type: Function },
        onBack: { type: Function }
    };

    constructor() {
        super();
        this.apiKey = '';
        this.customPrompt = '';
        this.selectedProfile = 'interview';
        this.selectedLanguage = 'en-US';
        this.selectedScreenshotInterval = '5';
        this.selectedImageQuality = 'medium';
    }

    handleInputChange(field, value) {
        this[field] = value;
        this.requestUpdate();
    }

    handleSave() {
        const settings = {
            apiKey: this.apiKey,
            customPrompt: this.customPrompt,
            selectedProfile: this.selectedProfile,
            selectedLanguage: this.selectedLanguage,
            selectedScreenshotInterval: this.selectedScreenshotInterval,
            selectedImageQuality: this.selectedImageQuality
        };
        this.onSave(settings);
    }

    render() {
        return html`
            <div class="settings-container">
                <div class="header-section">
                    <div class="header-title">Advanced Settings</div>
                    <button class="btn btn-secondary" @click=${this.onBack}>
                        Back
                    </button>
                </div>

                <div class="settings-content">
                    <div class="settings-section">
                        <div class="section-title">API Configuration</div>
                        
                        <div class="input-group">
                            <label class="input-label">Gemini API Key</label>
                            <input 
                                type="password" 
                                class="input-field" 
                                placeholder="Enter your Gemini API key"
                                .value=${this.apiKey}
                                @input=${(e) => this.handleInputChange('apiKey', e.target.value)}
                            />
                            <div class="info-text">Get your API key from Google AI Studio</div>
                        </div>

                        <div class="input-group">
                            <label class="input-label">Custom System Prompt</label>
                            <textarea 
                                class="input-field" 
                                placeholder="Additional instructions for the AI..."
                                rows="4"
                                .value=${this.customPrompt}
                                @input=${(e) => this.handleInputChange('customPrompt', e.target.value)}
                            ></textarea>
                            <div class="info-text">This will be added to the system prompt for all sessions</div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="section-title">Session Configuration</div>
                        
                        <div class="input-group">
                            <label class="input-label">Default Profile</label>
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
                            <label class="input-label">Default Language</label>
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
                    </div>

                    <div class="settings-section">
                        <div class="section-title">Capture Settings</div>
                        
                        <div class="input-group">
                            <label class="input-label">Default Screenshot Interval</label>
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
                            <label class="input-label">Default Image Quality</label>
                            <select 
                                class="select-field"
                                .value=${this.selectedImageQuality}
                                @change=${(e) => this.handleInputChange('selectedImageQuality', e.target.value)}
                            >
                                <option value="low">Low (Faster)</option>
                                <option value="medium">Medium (Balanced)</option>
                                <option value="high">High (Better Quality)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="actions-section">
                    <button class="btn btn-secondary" @click=${this.onBack}>
                        Cancel
                    </button>
                    <button class="btn btn-primary" @click=${this.handleSave}>
                        Save Settings
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('settings-view', SettingsView); 
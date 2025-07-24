// Simple App component for Cheating Mommy
const { LitElement, html, css } = window.lit;
const { ipcRenderer } = require('electron');

class CheatingMommyApp extends LitElement {
    static styles = css`
        * {
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            user-select: none;
        }

        :host {
            display: block;
            width: 100%;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
        }

        .app-container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .main-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
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

        .btn-danger {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            border: none;
            border-radius: 8px;
            color: white;
            padding: 14px 32px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        }

        .btn-danger:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
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
        statusText: { type: String }
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

    async handleStart() {
        if (!this.apiKey.trim()) {
            console.log('❌ Cannot start session: API key required');
            this.setStatus('Error: API key required');
            return;
        }

        console.log('🚀 Starting Cheating Mommy session...');
        console.log('📋 Session settings:');
        console.log('  - Profile:', this.selectedProfile);
        console.log('  - Language:', this.selectedLanguage);
        console.log('  - Screenshot Interval:', this.selectedScreenshotInterval);
        console.log('  - Image Quality:', this.selectedImageQuality);
        console.log('  - Custom Prompt Length:', this.customPrompt.length);

        this.setStatus('Starting session...');
        console.log('🔑 API key provided (length:', this.apiKey.length, ')');

        try {
            // Initialize Gemini session
            console.log('🔧 Initializing Gemini session...');
            const geminiResult = await window.rendererUtils.initializeGemini(
                this.apiKey,
                this.customPrompt,
                this.selectedProfile,
                this.selectedLanguage
            );

            if (!geminiResult.success) {
                throw new Error(geminiResult.error || 'Failed to initialize Gemini session');
            }

            // Initialize conversation storage
            console.log('💾 Initializing conversation storage...');
            await window.rendererUtils.initConversationStorage();

            // Start frontend audio capture (microphone access)
            console.log('🎤 Starting frontend audio capture...');
            await window.rendererUtils.startFrontendAudioCapture();

            // Start backend capture services
            console.log('🎤 Starting backend capture services...');
            const captureResult = await window.rendererUtils.startCapture(
                this.selectedScreenshotInterval,
                this.selectedImageQuality
            );

            if (!captureResult.success) {
                throw new Error('Failed to start capture');
            }

            this.setStatus('Session started successfully! Listening...');
            console.log('✅ Cheating Mommy session started successfully!');

        } catch (error) {
            console.error('❌ Failed to start session:', error);
            this.setStatus('Error: ' + error.message);
        }
    }

    handleSettings() {
        console.log('⚙️ Opening advanced settings...');
    }

    async handleStop() {
        try {
            console.log('🛑 Stopping Cheating Mommy session...');
            
            // Stop capture
            window.rendererUtils.stopCapture();
            
            // Close Gemini session
            await ipcRenderer.invoke('close-session');
            
            this.setStatus('Session stopped');
            console.log('✅ Cheating Mommy session stopped successfully!');
        } catch (error) {
            console.error('❌ Failed to stop session:', error);
            this.setStatus('Error stopping session: ' + error.message);
        }
    }

    setStatus(text) {
        console.log('📊 Status update:', text);
        this.statusText = text;
    }

    render() {
        return html`
            <div class="app-container">
                <div class="main-content">
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
                        <button class="btn-secondary" @click=${this.handleSettings}>
                            Advanced Settings
                        </button>
                        <button class="btn-primary" @click=${this.handleStart}>
                            Start Session
                        </button>
                        <button class="btn-danger" @click=${this.handleStop}>
                            Stop Session
                        </button>
                    </div>

                    <div class="status-indicator">
                        ${this.statusText}
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('cheating-mommy-app', CheatingMommyApp); 
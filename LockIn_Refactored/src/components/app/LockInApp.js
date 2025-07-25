import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { AppHeader } from './AppHeader.js';
import { CustomizeView } from '../views/CustomizeView.js';
import { HistoryView } from '../views/HistoryView.js';
import { AssistantView } from '../views/AssistantView.js';
import { AdvancedView } from '../views/AdvancedView.js';

export class LockInApp extends LitElement {
    static styles = css`
        * {
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0px;
            padding: 0px;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            width: 100%;
            height: 100vh;
            background-color: var(--background-transparent);
            color: var(--text-color);
        }

        .window-container {
            height: 100vh;
            border-radius: 7px;
            overflow: hidden;
        }

        .container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .main-content {
            flex: 1;
            padding: var(--main-content-padding);
            overflow-y: auto;
            margin-top: var(--main-content-margin-top);
            border-radius: var(--content-border-radius);
            transition: all 0.15s ease-out;
            background: var(--main-content-background);
        }

        .main-content.with-border {
            border: 1px solid var(--border-color);
        }

        .main-content.assistant-view {
            padding: 10px;
            border: none;
        }



        .view-container {
            opacity: 1;
            transform: translateY(0);
            transition: opacity 0.15s ease-out, transform 0.15s ease-out;
            height: 100%;
        }

        .view-container.entering {
            opacity: 0;
            transform: translateY(10px);
        }

        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        ::-webkit-scrollbar-track {
            background: var(--scrollbar-background);
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
            background: var(--scrollbar-thumb);
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--scrollbar-thumb-hover);
        }
    `;

    static properties = {
        currentView: { type: String },
        statusText: { type: String },
        startTime: { type: Number },
        isRecording: { type: Boolean },
        sessionActive: { type: Boolean },
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        responses: { type: Array },
        currentResponseIndex: { type: Number },
        selectedScreenshotInterval: { type: String },
        selectedImageQuality: { type: String },

        advancedMode: { type: Boolean },
        _viewInstances: { type: Object, state: true },
        _isClickThrough: { state: true },
        _awaitingNewResponse: { state: true },
        shouldAnimateResponse: { type: Boolean },
    };

    constructor() {
        super();
        this.currentView = 'assistant';
        this.statusText = '';
        this.startTime = null;
        this.isRecording = false;
        this.sessionActive = false;
        this.selectedProfile = localStorage.getItem('selectedProfile') || 'exam';
        this.selectedLanguage = localStorage.getItem('selectedLanguage') || 'en-US';
        this.selectedScreenshotInterval = localStorage.getItem('selectedScreenshotInterval') || '5';
        this.selectedImageQuality = localStorage.getItem('selectedImageQuality') || 'medium';

        this.advancedMode = localStorage.getItem('advancedMode') === 'true';
        this.responses = [];
        this.currentResponseIndex = -1;
        this._viewInstances = new Map();
        this._isClickThrough = false;
        this._awaitingNewResponse = false;
        this._currentResponseIsComplete = true;
        this.shouldAnimateResponse = false;


    }

    connectedCallback() {
        super.connectedCallback();
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.on('update-response', (_, response) => {
                this.setResponse(response);
            });
            ipcRenderer.on('update-status', (_, status) => {
                this.setStatus(status);
            });

        }
        
        
        
        
        
        
if (this.currentView === 'assistant') {
            this.handleStart();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.removeAllListeners('update-response');
            ipcRenderer.removeAllListeners('update-status');

        }
    }

    setStatus(text) {
        this.statusText = text;
        
                         if (text.includes('Ready') || text.includes('Listening') || text.includes('Error')) {
            this._currentResponseIsComplete = true;
            console.log('[setStatus] Marked current response as complete');
        }
    }

    setResponse(response) {
        const isFillerResponse =
            response.length < 30 &&
            (response.toLowerCase().includes('hmm') ||
                response.toLowerCase().includes('okay') ||
                response.toLowerCase().includes('next') ||
                                         response.toLowerCase().includes('go on') ||
                response.toLowerCase().includes('continue'));

                                  if (this._awaitingNewResponse || this.responses.length === 0) {
            // Check if we already started a new one this turn (prevents multiple inserts)
            if (!this._currentResponseIsComplete) {
                // Already streaming this turn — just update
                this.responses = [...this.responses.slice(0, -1), response];
                            } else {
                                // New turn
                                this.responses = [...this.responses, response];
                                this.currentResponseIndex = this.responses.length - 1;
                                this._awaitingNewResponse = false;
                                this._currentResponseIsComplete = false;
                                console.log('[setResponse] New turn started:', response);
                            }
                        } else if (!this._currentResponseIsComplete && !isFillerResponse && this.responses.length > 0) {
                            this.responses = [...this.responses.slice(0, -1), response];
                            console.log('[setResponse] Updated existing response:', response);
                        } else {
                            this.responses = [...this.responses, response];
                            this.currentResponseIndex = this.responses.length - 1;
                            this._currentResponseIsComplete = false;
                            console.log('[setResponse] Added filler response:', response);
                        }

                        this.shouldAnimateResponse = true;
                        this.requestUpdate();
                    }

                    // Header event handlers
                    handleCustomizeClick() {
        this.currentView = 'customize';
        this.requestUpdate();
    }



                                                                        handleHistoryClick() {
                                                                            this.currentView = 'history';
                                                                            this.requestUpdate();
                                                                        }

                                                                        handleAdvancedClick() {
                                                                            this.currentView = 'advanced';
                                                                            this.requestUpdate();
                                                                        }

    async handleClose() {
        if (this.currentView === 'customize' || this.currentView === 'history') {
                                this.currentView = 'assistant';
        } else {
            // Quit the entire application
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('quit-application');
            }
        }
    }

    async handleHideToggle() {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('toggle-window-visibility');
        }
    }

    // Main view event handlers
    async handleStart() {
        await cheddar.initializeGemini(this.selectedProfile, this.selectedLanguage);
        // Only pass the image quality since we removed screenshot intervals
        await cheddar.startCapture(this.selectedImageQuality);
        this.responses = [];
        this.currentResponseIndex = -1;
        this.startTime = Date.now();
        this.currentView = 'assistant';
    }



    // Customize view event handlers
    handleProfileChange(profile) {
        this.selectedProfile = profile;
    }

    handleLanguageChange(language) {
        this.selectedLanguage = language;
    }

    handleScreenshotIntervalChange(interval) {
        this.selectedScreenshotInterval = interval;
    }

    handleImageQualityChange(quality) {
        this.selectedImageQuality = quality;
        localStorage.setItem('selectedImageQuality', quality);
    }

    handleAdvancedModeChange(advancedMode) {
        this.advancedMode = advancedMode;
        localStorage.setItem('advancedMode', advancedMode.toString());
    }

    handleBackClick() {
        this.currentView = 'assistant';
        this.requestUpdate();
    }

    async handleExternalLinkClick(url) {
        if (window.require) { const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('open-external', url);
                           }
    }

    // Assistant view event handlers
    async handleSendText(message) {
        const result = await window.cheddar.sendTextMessage(message);

        if (!result.success) {
            console.error('Failed to send message:', result.error);
            this.setStatus('Error sending message: ' + result.error);
        } else {
            this.setStatus('Message sent...');
            this._awaitingNewResponse = true;
        }
    }

    handleResponseIndexChanged(e) {
                      this.currentResponseIndex = e.detail.index;
              this.shouldAnimateResponse = false;
        this.requestUpdate();
    }



                updated(changedProperties) {
                    super.updated(changedProperties);

                    // Only notify main process of view change if the view actually changed
                    if (changedProperties.has('currentView') && window.require) {
                        const { ipcRenderer } = window.require('electron');
                        ipcRenderer.send('view-changed', this.currentView);

                        // Add a small delay to smooth out the transition
                        const viewContainer = this.shadowRoot?.querySelector('.view-container');
                        if (viewContainer) {
                            viewContainer.classList.add('entering');
                requestAnimationFrame(() => {
                    viewContainer.classList.remove('entering');
                });
            }
        }

        // Only update localStorage when these specific properties change
        if (changedProperties.has('selectedProfile')) {
            localStorage.setItem('selectedProfile', this.selectedProfile);
        }
        if (changedProperties.has('selectedLanguage')) {
            localStorage.setItem('selectedLanguage', this.selectedLanguage);
        }
        if (changedProperties.has('selectedScreenshotInterval')) {
            localStorage.setItem('selectedScreenshotInterval', this.selectedScreenshotInterval);
        }
        if (changedProperties.has('selectedImageQuality')) {
            localStorage.setItem('selectedImageQuality', this.selectedImageQuality);
                    }

                    if (changedProperties.has('advancedMode')) {
                        localStorage.setItem('advancedMode', this.advancedMode.toString());
                    }
                }

                renderCurrentView() {
                    // Only re-render the view if it hasn't been cached or if critical properties changed
                    const viewKey = `${this.currentView}-${this.selectedProfile}-${this.selectedLanguage}`;

                    switch (this.currentView) {




            case 'customize':
                return html`
                    <customize-view
                        .selectedProfile=${this.selectedProfile}
                        .selectedLanguage=${this.selectedLanguage}
                        .selectedScreenshotInterval=${this.selectedScreenshotInterval}
                        .selectedImageQuality=${this.selectedImageQuality}

                        .advancedMode=${this.advancedMode}
                        .onProfileChange=${profile => this.handleProfileChange(profile)}
                        .onLanguageChange=${language => this.handleLanguageChange(language)}
                        .onScreenshotIntervalChange=${interval => this.handleScreenshotIntervalChange(interval)}
                        .onImageQualityChange=${quality => this.handleImageQualityChange(quality)}

                        .onAdvancedModeChange=${advancedMode => this.handleAdvancedModeChange(advancedMode)}
                    ></customize-view>
                `;



            case 'history':
                return html` <history-view></history-view> `;

            case 'advanced':
                return html` <advanced-view></advanced-view> `;

            case 'assistant':
                return html`
                    <assistant-view
                        .responses=${this.responses}
                        .currentResponseIndex=${this.currentResponseIndex}
                        .selectedProfile=${this.selectedProfile}
                        .onSendText=${message => this.handleSendText(message)}
                        .shouldAnimateResponse=${this.shouldAnimateResponse}
                        @response-index-changed=${this.handleResponseIndexChanged}
                        @response-animation-complete=${() => {
                            this.shouldAnimateResponse = false;
                            this._currentResponseIsComplete = true;
                            console.log('[response-animation-complete] Marked current response as complete');
                            if (window.require) {
                                const { ipcRenderer } = window.require('electron');
                                const now = Date.now();
                                ipcRenderer.invoke('debug-log-latency', now);
                            }
                            this.requestUpdate();
                        }}
                    ></assistant-view>
                `;

            default:
                return html`<div>Unknown view: ${this.currentView}</div>`;
        }
    }

    render() {
        const mainContentClass = `main-content ${
            this.currentView === 'assistant' ? 'assistant-view' : 'with-border'
        }`;

        return html`
            <div class="window-container">
                <div class="container">
                    <app-header
                        .currentView=${this.currentView}
                        .statusText=${this.statusText}
                        .startTime=${this.startTime}
                        .advancedMode=${this.advancedMode}
                        .onCustomizeClick=${() => this.handleCustomizeClick()}

                        .onHistoryClick=${() => this.handleHistoryClick()}
                        .onAdvancedClick=${() => this.handleAdvancedClick()}
                        .onCloseClick=${() => this.handleClose()}
                        .onBackClick=${() => this.handleBackClick()}
                        .onHideToggleClick=${() => this.handleHideToggle()}
                        ?isClickThrough=${this._isClickThrough}
                    ></app-header>
                    <div class="${mainContentClass}">
                        <div class="view-container">${this.renderCurrentView()}</div>
                    </div>
                </div>
            </div>
        `;
    }


}

customElements.define('lockin-app', LockInApp);

import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class AppHeader extends LitElement {
    static styles = css`
        * {
            font-family: 'Inter', sans-serif;
            cursor: default;
            user-select: none;
        }

        .header {
            -webkit-app-region: drag;
            display: flex;
            align-items: center;
            padding: var(--header-padding);
            border: 1px solid var(--border-color);
            background: var(--header-background);
            border-radius: var(--border-radius);
        }

        .header-title {
            flex: 1;
            font-size: var(--header-font-size);
            font-weight: 600;
            -webkit-app-region: drag;
        }

        .header-actions {
            display: flex;
            gap: var(--header-gap);
            align-items: center;
            -webkit-app-region: no-drag;
        }

        .header-actions span {
            font-size: var(--header-font-size-small);
            color: var(--header-actions-color);
        }

        .button {
            background: var(--button-background);
            color: var(--text-color);
            border: 1px solid var(--button-border);
            padding: var(--header-button-padding);
            border-radius: 8px;
            font-size: var(--header-font-size-small);
            font-weight: 500;
        }

        .icon-button {
            background: none;
            color: var(--icon-button-color);
            border: none;
            padding: var(--header-icon-padding);
            border-radius: 8px;
            font-size: var(--header-font-size-small);
            font-weight: 500;
            display: flex;
            opacity: 0.6;
            transition: opacity 0.2s ease;
        }

        .icon-button svg {
            width: var(--icon-size);
            height: var(--icon-size);
        }

        .icon-button:hover {
            background: var(--hover-background);
            opacity: 1;
        }

        .button:hover {
            background: var(--hover-background);
        }

        :host([isclickthrough]) .button:hover,
        :host([isclickthrough]) .icon-button:hover {
            background: transparent;
        }

        .key {
            background: var(--key-background);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            margin: 0px;
        }
    `;

    static properties = {
        currentView: { type: String },
        statusText: { type: String },
        startTime: { type: Number },
        onCustomizeClick: { type: Function },

        onHistoryClick: { type: Function },
        onCloseClick: { type: Function },
        onBackClick: { type: Function },
        onHideToggleClick: { type: Function },
        isClickThrough: { type: Boolean, reflect: true },
        advancedMode: { type: Boolean },
        onAdvancedClick: { type: Function },
    };

    constructor() {
        super();
        this.currentView = 'assistant';
        this.statusText = '';
        this.startTime = null;
        this.onCustomizeClick = () => {};

        this.onHistoryClick = () => {};
        this.onCloseClick = () => {};
        this.onBackClick = () => {};
        this.onHideToggleClick = () => {};
        this.isClickThrough = false;
        this.advancedMode = false;
        this.onAdvancedClick = () => {};
        this._timerInterval = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._startTimer();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopTimer();
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        // Start/stop timer based on view change
        if (changedProperties.has('currentView')) {
            if (this.currentView === 'assistant' && this.startTime) {
                this._startTimer();
            } else {
                this._stopTimer();
            }
        }

        // Start timer when startTime is set
        if (changedProperties.has('startTime')) {
            if (this.startTime && this.currentView === 'assistant') {
                this._startTimer();
            } else if (!this.startTime) {
                this._stopTimer();
            }
        }
    }

    _startTimer() {
        // Clear any existing timer
        this._stopTimer();

        // Only start timer if we're in assistant view and have a start time
        if (this.currentView === 'assistant' && this.startTime) {
            this._timerInterval = setInterval(() => {
                // Trigger a re-render by requesting an update
                this.requestUpdate();
            }, 1000); // Update every second
        }
    }

    _stopTimer() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

    getViewTitle() {
        const titles = {
            customize: 'Customize',
            history: 'Conversation History',
            advanced: 'Advanced Tools',
            assistant: 'Lock In',
        };
        return titles[this.currentView] || 'Lock In';
    }

    getElapsedTime() {
        if (this.currentView === 'assistant' && this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            return `${elapsed}s`;
        }
        return '';
    }

    isNavigationView() {
        const navigationViews = ['customize', 'history', 'advanced'];
        return navigationViews.includes(this.currentView);
    }

    render() {
        const elapsedTime = this.getElapsedTime();

        return html`
            <div class="header">
                <div class="header-title">${this.getViewTitle()}</div>
                <div class="header-actions">
                    ${this.currentView === 'assistant'
                        ? html`
                              <span>${elapsedTime}</span>
                              <span>${this.statusText}</span>
                          `
                        : ''}
                    ${this.currentView === 'assistant'
                        ? html`
                              <button @click=${this.onHideToggleClick} class="button">
                                  Hide&nbsp;&nbsp;<span class="key" style="pointer-events: none;">${cheddar.isMacOS ? 'Cmd' : 'Ctrl'}</span
                                  >&nbsp;&nbsp;<span class="key">&bsol;</span>
                              </button>
                              <button @click=${this.onCloseClick} class="icon-button window-close">
                                  <?xml version="1.0" encoding="UTF-8"?><svg
                                      width="24px"
                                      height="24px"
                                      stroke-width="1.7"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      color="currentColor"
                                  >
                                      <path
                                          d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426"
                                          stroke="currentColor"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                      ></path>
                                  </svg>
                              </button>
                          `
                        : html`
                              <button @click=${this.isNavigationView() ? this.onBackClick : this.onCloseClick} class="icon-button window-close">
                                  <?xml version="1.0" encoding="UTF-8"?><svg
                                      width="24px"
                                      height="24px"
                                      stroke-width="1.7"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      color="currentColor"
                                  >
                                      <path
                                          d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426"
                                          stroke="currentColor"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                      ></path>
                                  </svg>
                              </button>
                          `}
                </div>
            </div>
        `;
    }
}

customElements.define('app-header', AppHeader);

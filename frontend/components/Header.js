import { LitElement, html, css } from 'lit';

export class AppHeader extends LitElement {
    static styles = css`
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            -webkit-app-region: drag;
        }

        .title {
            font-size: 16px;
            font-weight: 600;
            color: white;
        }

        .status {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin-left: 12px;
        }

        .window-controls {
            display: flex;
            gap: 8px;
            -webkit-app-region: no-drag;
        }

        .control-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .control-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .control-btn.close:hover {
            background: #ff6b6b;
        }

        .left-section {
            display: flex;
            align-items: center;
        }
    `;

    static properties = {
        currentView: { type: String },
        statusText: { type: String },
        sessionActive: { type: Boolean },
        onMinimize: { type: Function },
        onMaximize: { type: Function },
        onClose: { type: Function }
    };

    constructor() {
        super();
        this.currentView = 'main';
        this.statusText = 'Ready';
        this.sessionActive = false;
    }

    render() {
        return html`
            <div class="header">
                <div class="left-section">
                    <div class="title">Cheating Mommy</div>
                    <div class="status">${this.statusText}</div>
                </div>
                
                <div class="window-controls">
                    <button class="control-btn" @click=${this.onMinimize}>
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <rect x="2" y="5" width="8" height="2" fill="currentColor"/>
                        </svg>
                    </button>
                    <button class="control-btn" @click=${this.onMaximize}>
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/>
                        </svg>
                    </button>
                    <button class="control-btn close" @click=${this.onClose}>
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <path d="M2 2l8 8m0-8l-8 8" stroke="currentColor" stroke-width="1" fill="none"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('app-header', AppHeader); 
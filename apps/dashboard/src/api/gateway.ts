/**
 * Gateway Client for FirmOS Dashboard
 * 
 * Simplified WebSocket client that connects to the OpenClaw gateway
 * for real-time FirmOS data. Falls back to mock data when gateway unavailable.
 */

export type GatewayEventFrame = {
    type: "event";
    event: string;
    payload?: unknown;
    seq?: number;
};

export type GatewayResponseFrame = {
    type: "res";
    id: string;
    ok: boolean;
    payload?: unknown;
    error?: { code: string; message: string };
};

export type GatewayHelloOk = {
    type: "hello-ok";
    protocol: number;
    features?: { methods?: string[]; events?: string[] };
};

type Pending = {
    resolve: (value: unknown) => void;
    reject: (err: unknown) => void;
};

export type GatewayClientOptions = {
    url: string;
    token?: string;
    onHello?: (hello: GatewayHelloOk) => void;
    onEvent?: (evt: GatewayEventFrame) => void;
    onClose?: (info: { code: number; reason: string }) => void;
    onConnected?: () => void;
};

export class GatewayClient {
    private ws: WebSocket | null = null;
    private pending = new Map<string, Pending>();
    private closed = false;
    private idCounter = 0;
    private backoffMs = 800;
    private _connected = false;

    constructor(private opts: GatewayClientOptions) { }

    get connected() {
        return this._connected && this.ws?.readyState === WebSocket.OPEN;
    }

    start() {
        this.closed = false;
        this.connect();
    }

    stop() {
        this.closed = true;
        this._connected = false;
        this.ws?.close();
        this.ws = null;
        this.flushPending(new Error("gateway client stopped"));
    }

    private connect() {
        if (this.closed) return;
        this.ws = new WebSocket(this.opts.url);

        this.ws.onopen = () => {
            this.sendConnect();
        };

        this.ws.onmessage = (ev) => this.handleMessage(String(ev.data ?? ""));

        this.ws.onclose = (ev) => {
            this._connected = false;
            this.ws = null;
            this.flushPending(new Error(`gateway closed (${ev.code}): ${ev.reason}`));
            this.opts.onClose?.({ code: ev.code, reason: ev.reason });
            this.scheduleReconnect();
        };

        this.ws.onerror = () => {
            // Close handler will fire
        };
    }

    private scheduleReconnect() {
        if (this.closed) return;
        const delay = this.backoffMs;
        this.backoffMs = Math.min(this.backoffMs * 1.7, 15_000);
        window.setTimeout(() => this.connect(), delay);
    }

    private flushPending(err: Error) {
        for (const [, p] of this.pending) p.reject(err);
        this.pending.clear();
    }

    private async sendConnect() {
        const params = {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
                id: "firmos-dashboard",
                version: "1.0.0",
                platform: navigator.platform ?? "web",
                mode: "webchat",
            },
            role: "operator",
            scopes: ["operator.admin"],
            auth: this.opts.token ? { token: this.opts.token } : undefined,
        };

        try {
            const hello = await this.request<GatewayHelloOk>("connect", params);
            this._connected = true;
            this.backoffMs = 800;
            this.opts.onHello?.(hello);
            this.opts.onConnected?.();
        } catch {
            this.ws?.close(4008, "connect failed");
        }
    }

    private handleMessage(raw: string) {
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return;
        }

        const frame = parsed as { type?: unknown };

        if (frame.type === "event") {
            const evt = parsed as GatewayEventFrame;
            try {
                this.opts.onEvent?.(evt);
            } catch (err) {
                console.error("[gateway] event handler error:", err);
            }
            return;
        }

        if (frame.type === "res") {
            const res = parsed as GatewayResponseFrame;
            const pending = this.pending.get(res.id);
            if (!pending) return;
            this.pending.delete(res.id);
            if (res.ok) pending.resolve(res.payload);
            else pending.reject(new Error(res.error?.message ?? "request failed"));
            return;
        }
    }

    request<T = unknown>(method: string, params?: unknown): Promise<T> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return Promise.reject(new Error("gateway not connected"));
        }
        const id = String(++this.idCounter);
        const frame = { type: "req", id, method, params };
        const p = new Promise<T>((resolve, reject) => {
            this.pending.set(id, { resolve: (v) => resolve(v as T), reject });
        });
        this.ws.send(JSON.stringify(frame));
        return p;
    }
}

// Singleton instance
let gatewayInstance: GatewayClient | null = null;

export function getGateway(): GatewayClient | null {
    return gatewayInstance;
}

export function initGateway(opts: GatewayClientOptions): GatewayClient {
    if (gatewayInstance) {
        gatewayInstance.stop();
    }
    gatewayInstance = new GatewayClient(opts);
    gatewayInstance.start();
    return gatewayInstance;
}

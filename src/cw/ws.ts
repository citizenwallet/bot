import WebSocket from "ws";

interface TransactionData {
  to: string;
  from: string;
  topic: string;
  value: string;
}

interface LogData {
  hash: string;
  tx_hash: string;
  created_at: string;
  updated_at: string;
  nonce: number;
  sender: string;
  to: string;
  value: number;
  data: TransactionData;
  extra_data: {
    description: string;
  };
  status: string;
}

export interface WebSocketEventData {
  pool_id: string;
  type: string;
  id: string;
  data_type: string;
  data: LogData;
}

export class WebSocketListener {
  private ws: WebSocket | null = null;
  private url: string;
  private callback: (data: WebSocketEventData) => void;
  private reconnectTimeout: number = 1000; // Start with 1 second
  private maxReconnectTimeout: number = 30000; // Max 30 seconds
  private shouldReconnect: boolean = true;

  constructor(url: string, callback: (data: WebSocketEventData) => void) {
    this.url = url;
    this.callback = callback;
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as WebSocketEventData;

        if (message.data.status !== "success") {
          return;
        }

        // Validate required transaction fields
        if (
          !message.data.data.from ||
          !message.data.data.to ||
          !message.data.data.value
        ) {
          console.warn(
            "Missing required transaction fields:",
            message.data.data
          );
          return;
        }

        this.callback(message);
      };

      this.ws.onclose = () => {
        if (this.shouldReconnect) {
          console.log(
            `WebSocket closed. Reconnecting in ${this.reconnectTimeout}ms...`
          );
          setTimeout(() => {
            // Exponential backoff with max timeout
            this.reconnectTimeout = Math.min(
              this.reconnectTimeout * 2,
              this.maxReconnectTimeout
            );
            this.connect();
          }, this.reconnectTimeout);
        }
      };

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        // Reset reconnect timeout on successful connection
        this.reconnectTimeout = 1000;
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.shouldReconnect) {
      setTimeout(() => {
        this.reconnectTimeout = Math.min(
          this.reconnectTimeout * 2,
          this.maxReconnectTimeout
        );
        this.connect();
      }, this.reconnectTimeout);
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }
}

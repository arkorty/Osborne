export async function GET() {
  // In App Router, WebSocket connections should be handled differently
  // This endpoint is mainly for checking WebSocket server availability
  // The actual WebSocket server is running separately on the Go backend
  
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8100/o/socket";
  
  return new Response(JSON.stringify({
    message: "WebSocket endpoint available",
    wsUrl: wsUrl,
    timestamp: new Date().toISOString()
  }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

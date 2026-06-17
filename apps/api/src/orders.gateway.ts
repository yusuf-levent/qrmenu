import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true
  }
})
export class OrdersGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage("joinBusiness")
  joinBusiness(client: Socket, @MessageBody() businessId: string) {
    client.join(`business:${businessId}`);
    return { ok: true };
  }

  @SubscribeMessage("joinOrder")
  joinOrder(client: Socket, @MessageBody() orderId: string) {
    client.join(`order:${orderId}`);
    return { ok: true };
  }

  emitOrderCreated(order: { id: string; businessId: string }) {
    this.server.to(`business:${order.businessId}`).emit("order:created", order);
    this.server.to(`order:${order.id}`).emit("order:updated", order);
  }

  emitOrderUpdated(order: { id: string; businessId: string; status: string }) {
    this.server.to(`business:${order.businessId}`).emit("order:updated", order);
    this.server.to(`order:${order.id}`).emit("order:updated", order);
  }
}


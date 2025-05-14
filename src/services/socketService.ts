import { Server } from 'socket.io';

let io: Server;

/**
 * Initialize Socket.IO with the HTTP server
 * @param socketIo Socket.IO server instance
 */
export const initSocketIO = (socketIo: Server): void => {
  io = socketIo;
  
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit a Terraform output message to all connected clients
 * @param data Output data from Terraform execution
 */
export const emitTerraformOutput = (data: string): void => {
  if (io) {
    io.emit('terraform-output', { output: data });
  }
};

/**
 * Emit a Terraform execution status update to all connected clients
 * @param status Status of the Terraform execution (started, completed, error)
 * @param message Optional message with additional details
 */
export const emitTerraformStatus = (status: 'started' | 'completed' | 'error', message?: string): void => {
  if (io) {
    io.emit('terraform-status', { status, message });
  }
};
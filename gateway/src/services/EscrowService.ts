import { createClient, RedisClientType } from 'redis';
import { ethers } from 'ethers';

/**
 * @fileoverview Escrow Service - Manages task-based payments and escrow
 * @author AgentPay Team
 * @version 2.0.0
 */

export interface Task {
  id: string;
  payer: string;
  worker: string;
  amount: string;
  token: string;
  escrowType: string | null;
  rules: any;
  status: 'pending' | 'completed' | 'refunded' | 'disputed';
  createdAt: number;
  completedAt?: number;
  deadline?: number;
  result?: any;
  proofHash?: string;
}

export interface EscrowModule {
  name: string;
  validateCompletion(taskId: string, result: any, rules: any): Promise<boolean>;
  shouldRefund(task: Task, currentTime: number): boolean;
  description: string;
}

/**
 * Service for managing task-based escrow payments
 */
export class EscrowService {
  private redis: RedisClientType;
  private pendingTasks = new Map<string, Task>();
  private escrowModules = new Map<string, EscrowModule>();

  constructor(redisUrl?: string) {
    this.redis = createClient({ url: redisUrl || 'redis://localhost:6379' });
    this.initializeEscrowModules();
  }

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    await this.redis.connect();
    console.log('✅ EscrowService connected to Redis');
    
    // Load pending tasks from Redis
    await this.loadPendingTasks();
  }

  /**
   * Set up built-in escrow modules
   */
  private initializeEscrowModules(): void {
    // Timeout-based escrow
    this.escrowModules.set('timeout', {
      name: 'Timeout Escrow',
      description: 'Automatically refund after timeout period',
      validateCompletion: async (taskId: string, result: any, rules: any) => {
        return result !== null && result !== undefined;
      },
      shouldRefund: (task: Task, currentTime: number) => {
        const deadline = task.deadline || (task.createdAt + (task.rules?.timeout || 3600) * 1000);
        return currentTime > deadline;
      }
    });

    // Hash-based verification escrow
    this.escrowModules.set('hash', {
      name: 'Hash Verification',
      description: 'Verify completion using cryptographic hash',
      validateCompletion: async (taskId: string, result: any, rules: any) => {
        if (!result?.data || !rules?.expectedHash) return false;
        const resultHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(result.data)));
        return resultHash === rules.expectedHash;
      },
      shouldRefund: (task: Task, currentTime: number) => {
        const deadline = task.deadline || (task.createdAt + 86400 * 1000); // 24h default
        return currentTime > deadline;
      }
    });

    // Mutual approval escrow
    this.escrowModules.set('mutual', {
      name: 'Mutual Approval',
      description: 'Requires approval from both parties',
      validateCompletion: async (taskId: string, result: any, rules: any) => {
        return result?.payerApproved === true && result?.workerCompleted === true;
      },
      shouldRefund: (task: Task, currentTime: number) => {
        const deadline = task.deadline || (task.createdAt + 86400 * 7 * 1000); // 7 days default
        return currentTime > deadline && task.status === 'pending';
      }
    });

    console.log(`🔧 Initialized ${this.escrowModules.size} escrow modules`);
  }

  /**
   * Create a new escrow task
   * @param taskData - Task configuration
   * @returns Created task with ID
   */
  async createTask(taskData: Omit<Task, 'id' | 'status' | 'createdAt'>): Promise<Task> {
    const taskId = ethers.randomBytes(16).toString('hex');
    
    const task: Task = {
      ...taskData,
      id: taskId,
      status: 'pending',
      createdAt: Date.now(),
      deadline: taskData.deadline || Date.now() + (3600 * 1000) // 1 hour default
    };

    // Validate escrow module
    if (task.escrowType && !this.escrowModules.has(task.escrowType)) {
      throw new Error(`Unknown escrow type: ${task.escrowType}`);
    }

    // Store in memory and Redis
    this.pendingTasks.set(taskId, task);
    await this.redis.setEx(`task:${taskId}`, 86400 * 7, JSON.stringify(task)); // 7 days
    
    console.log(`📋 Created task ${taskId} with escrow type: ${task.escrowType || 'none'}`);
    return task;
  }

  /**
   * Complete a task with results
   * @param taskId - Task identifier
   * @param result - Task completion result
   * @param completedBy - Address of completer
   * @returns Whether task was successfully completed
   */
  async completeTask(taskId: string, result: any, completedBy: string): Promise<boolean> {
    const task = this.pendingTasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status !== 'pending') {
      throw new Error(`Task is ${task.status}, cannot complete`);
    }

    // Verify completion based on escrow type
    let isValidCompletion = true;
    
    if (task.escrowType) {
      const escrowModule = this.escrowModules.get(task.escrowType);
      if (escrowModule) {
        isValidCompletion = await escrowModule.validateCompletion(taskId, result, task.rules);
      }
    }

    if (isValidCompletion) {
      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = result;
      task.proofHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
        taskId,
        result,
        completedBy,
        timestamp: task.completedAt
      })));

      // Update storage
      await this.redis.setEx(`task:${taskId}`, 86400 * 30, JSON.stringify(task)); // Keep completed tasks longer
      this.pendingTasks.delete(taskId);

      console.log(`✅ Task ${taskId} completed by ${completedBy}`);
      return true;
    } else {
      console.log(`❌ Task ${taskId} completion validation failed`);
      return false;
    }
  }

  /**
   * Approve a task (for mutual approval escrow)
   * @param taskId - Task identifier
   * @param approvedBy - Address of approver
   * @param approvalType - Type of approval ('payer' | 'worker')
   * @returns Updated task
   */
  async approveTask(taskId: string, approvedBy: string, approvalType: 'payer' | 'worker'): Promise<Task> {
    const task = this.pendingTasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.escrowType !== 'mutual') {
      throw new Error('Task does not use mutual approval escrow');
    }

    if (approvalType === 'payer' && approvedBy !== task.payer) {
      throw new Error('Only payer can give payer approval');
    }

    if (approvalType === 'worker' && approvedBy !== task.worker) {
      throw new Error('Only worker can give worker approval');
    }

    // Update approval status
    if (!task.result) {
      task.result = {};
    }

    if (approvalType === 'payer') {
      task.result.payerApproved = true;
    } else {
      task.result.workerCompleted = true;
    }

    // Check if both approvals are complete
    if (task.result.payerApproved && task.result.workerCompleted) {
      await this.completeTask(taskId, task.result, approvedBy);
    } else {
      // Update storage
      await this.redis.setEx(`task:${taskId}`, 86400 * 7, JSON.stringify(task));
    }

    console.log(`👍 Task ${taskId} approved by ${approvalType}: ${approvedBy}`);
    return task;
  }

  /**
   * Process automatic refunds for expired tasks
   * @returns Number of refunds processed
   */
  async processRefunds(): Promise<number> {
    const currentTime = Date.now();
    let refundsProcessed = 0;

    for (const [taskId, task] of this.pendingTasks.entries()) {
      if (task.status === 'pending') {
        let shouldRefund = false;

        if (task.escrowType) {
          const escrowModule = this.escrowModules.get(task.escrowType);
          if (escrowModule) {
            shouldRefund = escrowModule.shouldRefund(task, currentTime);
          }
        } else {
          // Default timeout: 1 hour
          shouldRefund = currentTime > (task.deadline || task.createdAt + 3600000);
        }

        if (shouldRefund) {
          task.status = 'refunded';
          task.completedAt = Date.now();
          
          // Update storage
          await this.redis.setEx(`task:${taskId}`, 86400 * 30, JSON.stringify(task));
          this.pendingTasks.delete(taskId);
          
          refundsProcessed++;
          console.log(`💸 Task ${taskId} automatically refunded`);
        }
      }
    }

    return refundsProcessed;
  }

  /**
   * Get task by ID
   * @param taskId - Task identifier
   * @returns Task data or null if not found
   */
  async getTask(taskId: string): Promise<Task | null> {
    // Check in-memory first
    if (this.pendingTasks.has(taskId)) {
      return this.pendingTasks.get(taskId)!;
    }

    // Check Redis
    const taskData = await this.redis.get(`task:${taskId}`);
    if (taskData) {
      return JSON.parse(taskData);
    }

    return null;
  }

  /**
   * Get all tasks for a user
   * @param address - User address
   * @param role - Role filter ('payer' | 'worker' | 'all')
   * @returns Array of tasks
   */
  async getUserTasks(address: string, role: 'payer' | 'worker' | 'all' = 'all'): Promise<Task[]> {
    const tasks: Task[] = [];
    
    // Check pending tasks
    for (const task of this.pendingTasks.values()) {
      if (role === 'all' || 
          (role === 'payer' && task.payer === address) ||
          (role === 'worker' && task.worker === address)) {
        tasks.push(task);
      }
    }

    // TODO: Also search Redis for completed/refunded tasks
    // This would require an index or scanning all task keys

    return tasks.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get available escrow modules
   * @returns Map of escrow module configurations
   */
  getEscrowModules(): Map<string, EscrowModule> {
    return new Map(this.escrowModules);
  }

  /**
   * Add custom escrow module
   * @param name - Module name
   * @param module - Module implementation
   */
  addEscrowModule(name: string, module: EscrowModule): void {
    this.escrowModules.set(name, module);
    console.log(`🔧 Added custom escrow module: ${name}`);
  }

  /**
   * Load pending tasks from Redis on startup
   */
  private async loadPendingTasks(): Promise<void> {
    try {
      const keys = await this.redis.keys('task:*');
      let loadedCount = 0;

      for (const key of keys) {
        const taskData = await this.redis.get(key);
        if (taskData) {
          const task: Task = JSON.parse(taskData);
          if (task.status === 'pending') {
            this.pendingTasks.set(task.id, task);
            loadedCount++;
          }
        }
      }

      console.log(`📋 Loaded ${loadedCount} pending tasks from Redis`);
    } catch (error) {
      console.error('Error loading pending tasks:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.disconnect();
    console.log('🔌 EscrowService disconnected from Redis');
  }
} 
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';
import { PaymentService } from './services/PaymentService';
import { ReputationService } from './services/ReputationService';
import { EscrowService } from './services/EscrowService';

/**
 * @fileoverview Main Gateway - Orchestrates all AgentPayy services
 * @author AgentPayy Team
 * @version 2.0.0
 */

export interface GatewayConfig {
  port?: number;
  redisUrl?: string;
  allowedOrigins?: string[];
  rateLimitWindow?: number;
  rateLimitMax?: number;
  mockMode?: boolean;
}

/**
 * Main AgentPayy Gateway that coordinates all services
 */
export class AgentPayyGateway {
  private app = express();
  private paymentService: PaymentService;
  private reputationService: ReputationService;
  private escrowService: EscrowService;
  private config: GatewayConfig;

  constructor(config: GatewayConfig = {}) {
    this.config = {
      port: 3000,
      redisUrl: 'redis://localhost:6379',
      allowedOrigins: ['http://localhost:3000'],
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      rateLimitMax: 100,
      mockMode: false,
      ...config
    };

    // Initialize services
    this.paymentService = new PaymentService(this.config.redisUrl);
    this.reputationService = new ReputationService(this.config.redisUrl);
    this.escrowService = new EscrowService(this.config.redisUrl);

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // CORS for browser access
    this.app.use(cors({
      origin: this.config.allowedOrigins,
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindow!,
      max: this.config.rateLimitMax!,
      message: { error: 'Too many requests' }
    });
    this.app.use(limiter);

    this.app.use(express.json({ limit: '1mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: ['payment', 'reputation', 'escrow']
      });
    });

    // Payment routes
    this.setupPaymentRoutes();
    
    // Reputation routes
    this.setupReputationRoutes();
    
    // Escrow routes
    this.setupEscrowRoutes();

    // Analytics route
    this.app.get('/analytics', async (req, res) => {
      try {
        const analytics = this.paymentService.getAnalytics();
        const networkStatus = await this.paymentService.getNetworkStatus();
        
        res.json({
          ...analytics,
          networks: networkStatus,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
      }
    });

    // Error handling middleware
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * Setup payment-related routes
   */
  private setupPaymentRoutes(): void {
    // Validate payment
    this.app.post('/payment/validate', async (req, res) => {
      try {
        const { modelId, payer, amount, network } = req.body;
        
        if (!modelId || !payer || !amount) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!ethers.isAddress(payer)) {
          return res.status(400).json({ error: 'Invalid payer address' });
        }

        const validation = await this.paymentService.validatePayment(modelId, payer, amount, network);
        res.json(validation);
      } catch (error) {
        console.error('Payment validation error:', error);
        res.status(500).json({ error: 'Validation failed' });
      }
    });

    // Get user payments
    this.app.get('/payments/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const limit = parseInt(req.query.limit as string) || 20;
        
        if (!ethers.isAddress(address)) {
          return res.status(400).json({ error: 'Invalid address' });
        }

        const payments = await this.paymentService.getUserPayments(address, limit);
        res.json(payments);
      } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Failed to get payments' });
      }
    });

    // Get user balances
    this.app.get('/balances/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const network = req.query.network as string || 'polygon';
        
        if (!ethers.isAddress(address)) {
          return res.status(400).json({ error: 'Invalid address' });
        }

        const balances = await this.paymentService.getUserBalances(address, network);
        res.json(balances);
      } catch (error) {
        console.error('Get balances error:', error);
        res.status(500).json({ error: 'Failed to get balances' });
      }
    });

    // Get model information
    this.app.get('/models/:modelId', async (req, res) => {
      try {
        const { modelId } = req.params;
        const network = req.query.network as string || 'polygon';
        
        const model = await this.paymentService.getModel(modelId, network);
        res.json(model);
      } catch (error) {
        console.error('Get model error:', error);
        res.status(500).json({ error: 'Failed to get model' });
      }
    });
  }

  /**
   * Setup reputation-related routes
   */
  private setupReputationRoutes(): void {
    // Get reputation for address
    this.app.get('/reputation/:address', async (req, res) => {
      try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
          return res.status(400).json({ error: 'Invalid address' });
        }

        const reputation = await this.reputationService.getReputationData(address);
        res.json(reputation);
      } catch (error) {
        console.error('Get reputation error:', error);
        res.status(500).json({ error: 'Failed to get reputation' });
      }
    });

    // Get leaderboard
    this.app.get('/leaderboard', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 10;
        const leaderboard = await this.reputationService.getLeaderboard(limit);
        res.json(leaderboard);
      } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to get leaderboard' });
      }
    });

    // Get agents by specialty
    this.app.get('/agents/specialty/:specialty', async (req, res) => {
      try {
        const { specialty } = req.params;
        const minRating = parseFloat(req.query.minRating as string) || 3.0;
        
        const agents = await this.reputationService.getAgentsBySpecialty(specialty, minRating);
        res.json(agents);
      } catch (error) {
        console.error('Get agents by specialty error:', error);
        res.status(500).json({ error: 'Failed to get specialist agents' });
      }
    });
  }

  /**
   * Setup escrow-related routes
   */
  private setupEscrowRoutes(): void {
    // Create task
    this.app.post('/tasks', async (req, res) => {
      try {
        const taskData = req.body;
        
        // Basic validation
        if (!taskData.payer || !taskData.worker || !taskData.amount) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!ethers.isAddress(taskData.payer) || !ethers.isAddress(taskData.worker)) {
          return res.status(400).json({ error: 'Invalid addresses' });
        }

        const task = await this.escrowService.createTask(taskData);
        res.json(task);
      } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
      }
    });

    // Complete task
    this.app.post('/tasks/:taskId/complete', async (req, res) => {
      try {
        const { taskId } = req.params;
        const { result, completedBy } = req.body;
        
        if (!ethers.isAddress(completedBy)) {
          return res.status(400).json({ error: 'Invalid completedBy address' });
        }

        const success = await this.escrowService.completeTask(taskId, result, completedBy);
        res.json({ success });
      } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({ error: 'Failed to complete task' });
      }
    });

    // Approve task
    this.app.post('/tasks/:taskId/approve', async (req, res) => {
      try {
        const { taskId } = req.params;
        const { approvedBy, approvalType } = req.body;
        
        if (!ethers.isAddress(approvedBy)) {
          return res.status(400).json({ error: 'Invalid approvedBy address' });
        }

        const task = await this.escrowService.approveTask(taskId, approvedBy, approvalType);
        res.json(task);
      } catch (error) {
        console.error('Approve task error:', error);
        res.status(500).json({ error: 'Failed to approve task' });
      }
    });

    // Get task
    this.app.get('/tasks/:taskId', async (req, res) => {
      try {
        const { taskId } = req.params;
        const task = await this.escrowService.getTask(taskId);
        
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
      } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Failed to get task' });
      }
    });

    // Get user tasks
    this.app.get('/tasks/user/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const role = req.query.role as 'payer' | 'worker' | 'all' || 'all';
        
        if (!ethers.isAddress(address)) {
          return res.status(400).json({ error: 'Invalid address' });
        }

        const tasks = await this.escrowService.getUserTasks(address, role);
        res.json(tasks);
      } catch (error) {
        console.error('Get user tasks error:', error);
        res.status(500).json({ error: 'Failed to get user tasks' });
      }
    });

    // Get escrow modules
    this.app.get('/escrow/modules', (req, res) => {
      try {
        const modules = this.escrowService.getEscrowModules();
        const moduleList = Array.from(modules.entries()).map(([name, module]) => ({
          name,
          displayName: module.name,
          description: module.description
        }));
        
        res.json(moduleList);
      } catch (error) {
        console.error('Get escrow modules error:', error);
        res.status(500).json({ error: 'Failed to get escrow modules' });
      }
    });
  }

  /**
   * Initialize all services and start the gateway
   */
  async start(): Promise<void> {
    try {
      // Initialize services
      await this.paymentService.initialize();
      await this.reputationService.initialize();
      await this.escrowService.initialize();

      // Start refund processing (every 5 minutes)
      setInterval(async () => {
        try {
          const refunds = await this.escrowService.processRefunds();
          if (refunds > 0) {
            console.log(`⏰ Processed ${refunds} automatic refunds`);
          }
        } catch (error) {
          console.error('Error processing refunds:', error);
        }
      }, 5 * 60 * 1000);

      // Start Express server
      const server = this.app.listen(this.config.port, () => {
        console.log(`🚀 AgentPayy Gateway running on port ${this.config.port}`);
        console.log(`📊 Analytics: http://localhost:${this.config.port}/analytics`);
        console.log(`🏥 Health: http://localhost:${this.config.port}/health`);
      });

      // Graceful shutdown
      process.on('SIGTERM', async () => {
        console.log('🛑 Shutting down gracefully...');
        
        server.close(async () => {
          await this.paymentService.close();
          await this.reputationService.close();
          await this.escrowService.close();
          console.log('✅ Gateway shut down complete');
          process.exit(0);
        });
      });

    } catch (error) {
      console.error('Failed to start gateway:', error);
      process.exit(1);
    }
  }
} 
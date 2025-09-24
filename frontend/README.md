# Plexi Frontend - Wallet-Based Trading Interface

A modern React frontend for Plexi, providing unified perp trading orchestration on Aptos + Hyperliquid with wallet-based authentication.

## 🚀 Features

### Authentication
- **Wallet-based login** using Aptos wallet adapter
- **JWT token management** for secure API access
- **Automatic session persistence** across browser refreshes

### Trading Interface
- **Real-time orderbook** and market data
- **Position management** with live P&L tracking
- **Order placement** (market and limit orders)
- **Multi-symbol support** (BTC, ETH, SOL)

### Vault Management
- **Deposit/Withdraw** operations
- **Strategy allocation** visualization
- **Reward tracking** and claiming
- **Event history** and activity monitoring

### Automation
- **Risk management** settings (stop-loss, take-profit)
- **Automated hedging** configuration
- **Strategy management** and monitoring
- **Manual controls** for rebalancing and harvesting

### Analytics
- **P&L tracking** and performance metrics
- **Position analysis** with detailed breakdowns
- **Activity history** and transaction logs
- **Risk metrics** and exposure monitoring

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **TanStack Query** for data fetching
- **Zustand** for state management
- **Aptos SDK** for wallet integration
- **Axios** for API communication

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Configure the following variables:
   ```env
   VITE_API_URL=http://localhost:4000/api/v1
   VITE_STUB_MODE=true
   VITE_APTOS_NETWORK=testnet
   VITE_APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com/v1
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:4000/api/v1` |
| `VITE_STUB_MODE` | Enable stub mode for testing | `true` |
| `VITE_APTOS_NETWORK` | Aptos network (testnet/mainnet) | `testnet` |
| `VITE_APTOS_RPC_URL` | Aptos RPC endpoint | `https://fullnode.testnet.aptoslabs.com/v1` |

### Stub Mode

When `VITE_STUB_MODE=true`, the frontend uses mock data instead of real API calls:
- Simulated market data and orderbooks
- Mock trading operations
- Fake position and vault data
- No real blockchain transactions

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components
│   └── modals/         # Modal dialogs
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── Index.tsx       # Landing page
│   ├── LoginPage.tsx   # Wallet login
│   ├── DashboardPage.tsx # Main dashboard
│   ├── TradingPage.tsx # Trading interface
│   ├── VaultsPage.tsx  # Vault management
│   ├── AutomationPage.tsx # Automation settings
│   ├── AnalyticsPage.tsx # Analytics dashboard
│   └── SettingsPage.tsx # User settings
├── services/           # API services
│   ├── api.ts         # Main API service
│   └── auth.ts        # Authentication service
├── store/              # State management
│   ├── useWalletStore.ts # Wallet state
│   └── useVaultStore.ts  # Vault state
└── utils/              # Utility functions
```

## 🔐 Authentication Flow

1. **Wallet Connection:**
   - User clicks "Connect Wallet"
   - Aptos wallet adapter prompts for connection
   - Wallet address is retrieved

2. **Nonce Challenge:**
   - Frontend requests nonce from backend
   - Backend generates and returns nonce

3. **Signature Verification:**
   - User signs nonce with wallet
   - Signature is sent to backend for verification
   - Backend issues JWT token on successful verification

4. **Session Management:**
   - JWT token stored in localStorage
   - Token automatically attached to API requests
   - Session persists across browser refreshes

## 📡 API Integration

### Authentication Endpoints
- `POST /auth/nonce` - Request nonce for wallet
- `POST /auth/verify` - Verify signature and get JWT
- `POST /auth/logout` - Logout and invalidate token
- `GET /auth/me` - Get current user info

### Trading Endpoints
- `GET /hyperliquid/positions/:address` - Get user positions
- `GET /hyperliquid/market/:symbol` - Get market data
- `POST /hyperliquid/open` - Open position
- `POST /hyperliquid/close` - Close position
- `GET /clob/orderbook/:symbol` - Get orderbook
- `POST /clob/route` - Route order to CLOB

### Vault Endpoints
- `GET /vault/state` - Get vault state
- `GET /vault/user/:address` - Get user vault info
- `POST /tx/deposit` - Deposit to vault
- `POST /tx/withdraw` - Withdraw from vault
- `GET /vault/events` - Get vault events

### Admin Endpoints
- `POST /admin/rebalance` - Trigger rebalance
- `POST /admin/harvest` - Trigger harvest
- `POST /admin/hedge` - Manual hedging
- `POST /admin/farm` - Manual farming

## 🎨 UI Components

Built with shadcn/ui components:
- **Cards** for content sections
- **Buttons** with loading states
- **Forms** with validation
- **Tables** for data display
- **Tabs** for navigation
- **Modals** for interactions
- **Charts** for analytics (coming soon)

## 🔄 State Management

### Wallet Store (Zustand)
- Wallet connection state
- User address and balance
- Authentication status
- Aptos client instance

### React Query
- API data caching
- Background refetching
- Loading and error states
- Optimistic updates

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Environment Setup
1. Set `VITE_STUB_MODE=false` for production
2. Configure `VITE_API_URL` to point to production backend
3. Set `VITE_APTOS_NETWORK=mainnet` for mainnet deployment

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

## 📱 Responsive Design

- **Mobile-first** approach
- **Responsive grid** layouts
- **Touch-friendly** interactions
- **Adaptive navigation** for different screen sizes

## 🔒 Security

- **JWT token** authentication
- **HTTPS** enforcement in production
- **Input validation** on all forms
- **Rate limiting** on API calls
- **XSS protection** with proper sanitization

## 🐛 Troubleshooting

### Common Issues

1. **Wallet Connection Failed:**
   - Ensure Aptos wallet is installed
   - Check network configuration
   - Verify RPC endpoint is accessible

2. **API Calls Failing:**
   - Check backend is running
   - Verify API URL configuration
   - Check network connectivity

3. **Build Errors:**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify all dependencies are installed

### Debug Mode

Set `VITE_DEBUG=true` to enable:
- Detailed console logging
- API request/response logging
- Wallet connection debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation wiki
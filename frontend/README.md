# Plexi Vault Frontend

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan)](https://tailwindcss.com/)

A modern React frontend for the Plexi Vault Protocol, providing a comprehensive interface for DeFi vault management on Aptos blockchain with real-time analytics and wallet integration.

## 🚀 Features

### 🔐 Wallet Integration
- **Petra Wallet** support with Aptos wallet adapter
- **Secure authentication** with signature-based login
- **Real-time balance** tracking and updates
- **Multi-wallet** support (Petra, Martian, Pontem)

### 💰 Vault Management
- **Deposit/Withdraw** APT tokens to/from vault
- **Share-based accounting** with MST token representation
- **Real-time TVL** and performance tracking
- **Strategy allocation** visualization (hedge/farm ratios)
- **Transaction history** with detailed event logs

### 📊 Analytics Dashboard
- **TVL Growth Charts** with historical data
- **Portfolio Performance** tracking over time
- **APY Calculations** with time-weighted returns
- **Recent Activity** feed with transaction details
- **User Position** overview with USD valuations

### 🎨 Modern UI/UX
- **Responsive design** optimized for all devices
- **Dark/Light theme** support
- **Interactive charts** with Recharts integration
- **Real-time updates** with automatic data refresh
- **Loading states** and error handling

### 🧪 Test Environment
- **Test Dashboard** replicating production interface
- **Aptos Testnet** integration for safe testing
- **Mock data fallbacks** when backend unavailable
- **Faucet integration** for test APT tokens

## 🛠️ Tech Stack

### Core Framework
- **React 18** with TypeScript for type-safe development
- **Vite 5** for lightning-fast development and building
- **React Router v6** for client-side routing

### UI & Styling
- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible, unstyled components
- **shadcn/ui** for beautiful, customizable UI components
- **Lucide React** for consistent iconography
- **Framer Motion** for smooth animations

### State Management
- **Zustand** for lightweight global state
- **React Query** for server state management
- **React Context** for authentication state

### Blockchain Integration
- **Aptos SDK** for blockchain interactions
- **Wallet Adapters** for multi-wallet support
- **Petra Wallet** as primary wallet integration

### Data & API
- **Axios** for HTTP client with interceptors
- **Recharts** for interactive data visualization
- **Date-fns** for date manipulation
- **Zod** for runtime type validation

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
   VITE_API_BASE_URL=http://localhost:4000/api/v1
   VITE_APTOS_NETWORK=testnet
   VITE_VAULT_ADDRESS=0x98dfcb742ea92c051230fbc1defac9b9c8d298670d544c0e1a23b9620b3a27e2
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
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:4000/api/v1` |
| `VITE_APTOS_NETWORK` | Aptos network (testnet/mainnet) | `testnet` |
| `VITE_VAULT_ADDRESS` | Deployed vault contract address | Required |
| `VITE_APTOS_RPC_URL` | Aptos RPC endpoint | `https://fullnode.testnet.aptoslabs.com/v1` |

### Development vs Production

**Development Mode:**
- Hot module replacement for instant updates
- Source maps for debugging
- Detailed error messages
- Development-friendly logging

**Production Mode:**
- Optimized bundle with tree-shaking
- Minified assets for faster loading
- Production API endpoints
- Error boundaries for graceful failures

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
│   ├── LoginPage.tsx   # Wallet connection
│   ├── DashboardPage.tsx # Main vault dashboard
│   ├── TestDashboardPage.tsx # Test environment dashboard
│   ├── TestLandingPage.tsx # Test environment landing
│   ├── TradingPage.tsx # Trading interface
│   ├── AnalyticsPage.tsx # Analytics dashboard
│   └── SettingsPage.tsx # User settings
├── services/           # API services
│   ├── api.ts         # Main API service
│   ├── auth.ts        # Authentication service
│   └── priceService.ts # Price data service
├── store/              # State management
│   └── useVaultStore.ts  # Vault state management
└── utils/              # Utility functions
```

## 🔐 Wallet Integration Flow

1. **Wallet Detection:**
   - Check for installed Aptos wallets (Petra, Martian, etc.)
   - Display available wallet options
   - Handle wallet not installed scenarios

2. **Connection Process:**
   - User selects wallet and clicks "Connect"
   - Wallet adapter requests permission
   - User approves connection in wallet

3. **Account Information:**
   - Retrieve wallet address and public key
   - Fetch APT balance from blockchain
   - Store connection state in React context

4. **Transaction Signing:**
   - Generate transaction payloads for vault operations
   - Request user signature through wallet
   - Submit signed transactions to Aptos network

5. **Session Persistence:**
   - Remember wallet preference in localStorage
   - Auto-reconnect on page refresh
   - Handle wallet disconnection gracefully

## 📡 API Integration

### Authentication Endpoints
- `POST /auth/login` - Wallet-based authentication
- `POST /auth/logout` - Logout and clear session
- `GET /auth/me` - Get current user info
- `GET /auth/nonce/:address` - Get signing nonce

### Vault Endpoints
- `GET /vault/state` - Get current vault state (TVL, shares, price)
- `GET /vault/user/:address` - Get user position and history
- `GET /vault/events` - Get vault events for charts
- `GET /vault/transactions` - Get paginated transaction history
- `POST /vault/deposit` - Process deposit transaction
- `POST /vault/withdraw` - Process withdrawal transaction
- `POST /vault/reset-if-zero/:address` - Reset user data if zero balance

### Conversion Endpoints
- `GET /vault/convert/shares?amount=X` - Convert APT to shares
- `GET /vault/convert/assets?shares=X` - Convert shares to APT

### Health & Monitoring
- `GET /health` - Application health check
- `GET /api/v1/health` - Detailed service status

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

### Vault Store (Zustand)
- Vault statistics (TVL, APY, user balance)
- User position and shares
- Transaction operations (deposit/withdraw)
- APT price data integration

### Authentication Context
- Wallet connection state
- User authentication status
- Login/logout functionality
- Session persistence

### Custom Hooks
- `useVaultData` - Vault state and events
- `usePetraWallet` - Petra wallet integration
- `useAuth` - Authentication management
- `useVaultStore` - Global vault state

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
1. Configure `VITE_API_BASE_URL` to point to production backend
2. Set `VITE_APTOS_NETWORK=mainnet` for mainnet deployment
3. Update `VITE_VAULT_ADDRESS` with mainnet contract address
4. Ensure HTTPS is enabled for wallet security

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
   - Install Petra wallet extension
   - Switch to Aptos testnet in wallet
   - Check if wallet is unlocked
   - Verify RPC endpoint accessibility

2. **API Calls Failing:**
   - Ensure backend server is running on port 4000
   - Check `VITE_API_BASE_URL` configuration
   - Verify CORS settings in backend
   - Check browser network tab for errors

3. **Transaction Failures:**
   - Ensure sufficient APT balance for gas
   - Check vault contract address is correct
   - Verify network matches wallet network
   - Check transaction status on Aptos Explorer

4. **Build Errors:**
   - Clear `node_modules` and reinstall dependencies
   - Check for TypeScript compilation errors
   - Verify all environment variables are set
   - Update dependencies to compatible versions

### Debug Mode

Enable debug mode by setting `NODE_ENV=development`:
- Detailed console logging for API calls
- Wallet connection status logging
- Transaction flow debugging
- Component render tracking
- Error boundary detailed reporting

## 🤝 Contributing

### Development Workflow
1. **Fork and Clone:**
   ```bash
   git clone https://github.com/your-fork/plexi-aptos.git
   cd plexi-aptos/frontend
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Create Feature Branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Development:**
   ```bash
   npm run dev
   ```

5. **Testing:**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

6. **Build Verification:**
   ```bash
   npm run build
   npm run preview
   ```

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Prettier**: Automatic code formatting
- **Components**: Use functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **State**: Prefer React hooks and context

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ for the Aptos ecosystem**

## 🆘 Support & Resources

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/your-org/plexi-aptos/issues)
- **Documentation**: [Full project documentation](../README.md)
- **API Reference**: [Backend API docs](../backend/README.md)

### Development Resources
- **React Documentation**: [reactjs.org](https://reactjs.org/)
- **Vite Guide**: [vitejs.dev](https://vitejs.dev/)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com/)
- **Aptos SDK**: [aptos.dev](https://aptos.dev/)
- **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com/)

### Community
- **Discord**: [Join our community](https://discord.gg/plexi)
- **Twitter**: [@PlexiProtocol](https://twitter.com/PlexiProtocol)
- **GitHub Discussions**: [Community discussions](https://github.com/your-org/plexi-aptos/discussions)
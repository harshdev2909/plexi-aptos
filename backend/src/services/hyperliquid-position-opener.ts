// @ts-ignore - hyperliquid module types not available
import { Hyperliquid } from 'hyperliquid';

// ============================================================================
// HYPERLIQUID POSITION OPENER - INTEGRATED WITH PLEXI VAULT
// ============================================================================
// This module contains all the essential code for opening positions on Hyperliquid
// integrated with the Plexi vault deposit flow.

// ============================================================================
// 1. HYPERLIQUID SDK INITIALIZATION
// ============================================================================

interface HyperliquidConfig {
  privateKey: string;
  testnet?: boolean;
  walletAddress?: string;
}

export class HyperliquidPositionOpener {
  private hypeSdk: Hyperliquid;
  private config: HyperliquidConfig;

  constructor(config: HyperliquidConfig) {
    this.config = config;
    this.hypeSdk = new Hyperliquid({
      privateKey: config.privateKey,
      testnet: config.testnet || false,
      walletAddress: config.walletAddress,
    });
  }

  // ============================================================================
  // 2. ORDER PLACEMENT FUNCTION
  // ============================================================================

  /**
   * Places an IOC (Immediate or Cancel) perpetual order on Hyperliquid
   * @param coin - The coin symbol (e.g., 'ETH', 'BTC', 'APT')
   * @param sz - Order size
   * @param limit_px - Limit price
   * @param is_buy - Whether it's a buy order (true) or sell order (false)
   * @param reduce_only - Whether this is a reduce-only order
   */
  async placeIocPerpOrder(
    coin: string,
    sz: number,
    limit_px: number,
    is_buy: boolean = true,
    reduce_only: boolean = false
  ) {
    // Validate minimum order size
    const minOrderSize = 0.001;
    if (sz < minOrderSize) {
      throw new Error(
        `Order size ${sz} is below minimum order size ${minOrderSize}`
      );
    }

    const coinSymbol = `${coin}-PERP`;

    const orderRequest = {
      coin: coinSymbol,
      is_buy,
      sz,
      limit_px,
      order_type: { limit: { tif: 'Ioc' as const } },
      reduce_only,
    };

    console.log(`Order request: ${JSON.stringify(orderRequest, null, 2)}`);

    try {
      const result = await this.hypeSdk.exchange.placeOrder(orderRequest);
      console.log(`Order placed successfully!`);
      return result;
    } catch (error: any) {
      console.error('Order placement failed:', {
        message: error.message,
        code: error.code,
        data: error.data,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Places a regular limit order (not IOC)
   */
  async placeLimitOrder(
    coin: string,
    sz: number,
    limit_px: number,
    is_buy: boolean = true,
    reduce_only: boolean = false
  ) {
    const coinSymbol = `${coin}-PERP`;

    const orderRequest = {
      coin: coinSymbol,
      is_buy,
      sz,
      limit_px,
      order_type: { limit: { tif: 'Alo' as const } },
      reduce_only,
    };

    console.log(`Order request: ${JSON.stringify(orderRequest, null, 2)}`);

    try {
      const result = await this.hypeSdk.exchange.placeOrder(orderRequest);
      console.log(`Order placed successfully!`);
      return result;
    } catch (error: any) {
      console.error('Order placement failed:', {
        message: error.message,
        code: error.code,
        data: error.data,
        stack: error.stack,
      });
      throw error;
    }
  }

  // ============================================================================
  // 3. PRICE AND SIZE CALCULATION
  // ============================================================================

  /**
   * Calculates order price and size based on market data
   * @param attempt - Retry attempt number
   * @param amount - Amount to trade
   * @param book - Order book data
   * @param universe - Universe data with tick size and decimals
   * @param isPerp - Whether this is a perpetual order
   */
  getSzValues(
    attempt: number,
    amount: number,
    book: any,
    universe: any,
    isPerp: boolean = true
  ): { limit_px: number; sz: number } {
    try {
      const MAX_DECIMALS_PERP = 6;
      const MAX_DECIMALS_SPOT = 8;

      const bps = 15 + (attempt - 1) * 10; // Base 15 bps + 10 bps per attempt
      const bestAsk = parseFloat(book.levels[1][0].px);

      const tickSize = parseFloat(universe.priceIncrement || '0.01');
      const szDecimals = universe.szDecimals || 4;
      const maxDecimals = isPerp ? MAX_DECIMALS_PERP : MAX_DECIMALS_SPOT;
      const maxAllowedPxDecimals = maxDecimals - szDecimals;

      const rawPx = bestAsk * (1 + bps / 10000);
      let limit_px = Math.floor(rawPx / tickSize) * tickSize;

      const limit_px_str = limit_px.toFixed(12);
      const [intPart, decPart = ''] = limit_px_str.split('.');
      const trimmedDecimals = decPart.slice(0, maxAllowedPxDecimals);
      limit_px = parseFloat(`${intPart}.${trimmedDecimals}`.replace(/\.$/, ''));

      let limit_px_fixed = parseFloat(limit_px.toPrecision(5));
      if (limit_px_fixed % tickSize !== 0) {
        limit_px_fixed = Math.floor(limit_px_fixed / tickSize) * tickSize;
      }

      limit_px = parseFloat(limit_px_fixed.toFixed(8));
      const sz = parseFloat(amount.toFixed(szDecimals));

      limit_px = Math.floor(limit_px / tickSize) * tickSize;

      return { limit_px, sz };
    } catch (error) {
      console.error('Error calculating limit_px and sz:', error);
      throw new Error('Failed to compute order price and size');
    }
  }

  // ============================================================================
  // 4. ORDER VERIFICATION
  // ============================================================================

  /**
   * Verifies an order on-chain by checking open orders and fills
   * @param orderId - The order ID to verify
   * @param coin - The coin symbol
   * @param userAddress - The user's wallet address
   */
  async verifyOrderOnChain(orderId: number, coin: string, userAddress: string) {
    try {
      console.log(`Verifying order ${orderId} on-chain...`);

      // Get user open orders using InfoAPI
      const openOrders = await this.hypeSdk.info.getUserOpenOrders(userAddress);
      const foundOrder = openOrders.find((order: any) => order.oid === orderId);

      if (foundOrder) {
        console.log(`Order ${orderId} found in open orders:`, foundOrder);
      } else {
        console.log(
          `Order ${orderId} not in open orders (likely filled or cancelled)`
        );
      }

      // Get recent fills using InfoAPI
      const fills = await this.hypeSdk.info.getUserFills(userAddress);
      const recentFills = fills.filter(
        (fill: any) =>
          fill.coin === `${coin}-PERP` &&
          new Date(fill.time) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      );

      console.log(`Recent ${coin}-PERP fills:`, recentFills);

      // Check if our specific order ID appears in fills
      const ourFill = fills.find((fill: any) => fill.oid === orderId);
      if (ourFill) {
        console.log(`Found our order ${orderId} in fills:`, ourFill);
      }

      return {
        orderFound: !!foundOrder,
        recentFills,
        ourFill,
      };
    } catch (error) {
      console.error(`Error verifying order ${orderId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // 5. VAULT INTEGRATION FUNCTIONS
  // ============================================================================

  /**
   * Opens a position on Hyperliquid when a vault deposit is successful
   * @param depositAmount - Amount deposited in the vault (in APT tokens)
   * @param coin - The coin to trade (default: 'APT')
   * @param coinPrice - Current price of the coin in USD (for validation only)
   */
  async openPositionOnDeposit(
    depositAmount: number,
    coin: string = 'APT',
    coinPrice: number = 4.22 // Current APT price ~$4.22 based on 3 APT = $12.65
  ) {
    try {
      console.log(`Opening position for deposit amount: ${depositAmount} ${coin}`);
      
      // Ensure minimum deposit amount for meaningful position (3 APT minimum)
      const MINIMUM_DEPOSIT_APT = 3.0; // Minimum 3 APT for position opening
      if (depositAmount < MINIMUM_DEPOSIT_APT) {
        throw new Error(`Deposit amount ${depositAmount} ${coin} is below minimum required ${MINIMUM_DEPOSIT_APT} ${coin} for Hyperliquid position opening`);
      }
      
      // Use the same APT amount for the Hyperliquid position
      const coinAmount = depositAmount; // Same amount in APT
      console.log(`Hyperliquid position amount: ${coinAmount} ${coin}`);

      // Ensure minimum order size and round to avoid precision issues
      const minOrderSize = 0.001;
      const sz = Math.max(coinAmount, minOrderSize);
      
      // Round to avoid floating point precision issues that cause Hyperliquid errors
      const roundedSz = Math.round(sz * 1000) / 1000; // Round to 3 decimal places
      
      // Use current market price with small slippage
      const limit_px = coinPrice * 1.0015; // Add 15 bps slippage
      const roundedLimitPx = Math.round(limit_px * 100) / 100; // Round to 2 decimal places

      console.log(`Calculated order parameters: price=${roundedLimitPx}, size=${roundedSz}`);

      // Place the order
      const result = await this.placeIocPerpOrder(
        coin,
        roundedSz,
        roundedLimitPx,
        true, // buy order
        false // not reduce-only
      );

      console.log(`Position opened successfully:`, result);
      return result;

    } catch (error) {
      console.error('Failed to open position on deposit:', error);
      throw error;
    }
  }

  /**
   * Calculates hedge amount based on USD value and coin price
   */
  calculateHedgeAmount(totalUsdValue: number, coinUsd: number): number {
    return Number((totalUsdValue / coinUsd).toFixed(4));
  }

  // ============================================================================
  // 6. UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Gets user's open orders
   */
  async getUserOpenOrders(userAddress: string) {
    return await this.hypeSdk.info.getUserOpenOrders(userAddress);
  }

  /**
   * Gets user's fills
   */
  async getUserFills(userAddress: string) {
    return await this.hypeSdk.info.getUserFills(userAddress);
  }

  /**
   * Gets user's positions
   */
  async getUserPositions(userAddress: string) {
    // For now, return empty array - implement when API is confirmed
    return [];
  }

  /**
   * Cancels an order by order ID
   */
  async cancelOrder(coin: string, orderId: number) {
    const coinSymbol = `${coin}-PERP`;
    return await this.hypeSdk.exchange.cancelOrder({
      coin: coinSymbol,
      o: orderId
    });
  }

  /**
   * Cancels all orders for a specific coin
   */
  async cancelAllOrders(coin: string) {
    const coinSymbol = `${coin}-PERP`;
    return await this.hypeSdk.exchange.cancelOrder({
      coin: coinSymbol,
      o: 0 // Cancel all orders for this coin
    });
  }
}

// ============================================================================
// 7. HARDCODED TESTNET CONFIGURATION
// ============================================================================

// Hardcoded testnet credentials from the modal
const TESTNET_CONFIG = {
  privateKey: '0x95723ed55563c522b976f1000f6ab2fa544363109eee34d6cb7b3cac56ed98cb',
  testnet: true,
  walletAddress: '0x8403C885370cEd907350556e798Bc6c499985dbB'
};

// Create singleton instance for testnet
export const hyperliquidPositionOpener = new HyperliquidPositionOpener(TESTNET_CONFIG);

export default HyperliquidPositionOpener;

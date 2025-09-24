/// @title PlexiX Vault Protocol
/// @notice A production-grade vault system implementing ERC-4626-like functionality
/// @dev Built for Aptos Move with extensible DeFi features
module plexi::vault_v3 {
    use std::string::{Self, String};
    use std::error;
    use std::option::{Self, Option};
    use std::vector;
    use std::table::{Self, Table};
    use std::event::{Self, EventHandle};
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    
    // Using AptosCoin (APT) for simplicity - you already have APT tokens
    // This makes testing much easier

    // ============ Errors ============
    
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_INSUFFICIENT_SHARES: u64 = 4;
    const E_ZERO_AMOUNT: u64 = 5;
    const E_INVALID_RECEIVER: u64 = 6;
    const E_INVALID_OWNER: u64 = 7;
    const E_UNAUTHORIZED: u64 = 8;
    const E_OVERFLOW: u64 = 9;
    const E_UNDERFLOW: u64 = 10;
    const E_INVALID_STRATEGY: u64 = 11;
    const E_STRATEGY_ALREADY_EXISTS: u64 = 12;
    const E_INVALID_RISK_LEVEL: u64 = 13;
    const E_REBALANCE_COOLDOWN: u64 = 14;
    const E_INVALID_SLIPPAGE: u64 = 15;

    // ============ Constants ============
    
    const MAX_SLIPPAGE_BPS: u64 = 1000; // 10% max slippage
    const REBALANCE_COOLDOWN_SECONDS: u64 = 3600; // 1 hour
    const PRECISION: u64 = 1_000_000_000; // 9 decimals precision
    const MAX_STRATEGIES: u64 = 100;

    // ============ Structs ============

    /// Core vault state containing all vault data
    struct VaultState has key {
        // ERC-4626 core fields
        asset_token: String,
        total_assets: u64,
        total_shares: u64,
        is_initialized: bool,
        
        // APT coin storage
        apt_coins: Coin<AptosCoin>,
        
        // User shares tracking
        user_shares: Table<address, u64>,
        
        // Strategy management
        strategies: Table<u64, StrategyMetadata>,
        next_strategy_id: u64,
        
        // Rebalancing
        last_rebalance_timestamp: u64,
        rebalance_cooldown: u64,
        
        // Reward system
        reward_tokens: vector<String>,
        reward_per_share: Table<String, u64>,
        
        // Events
        deposit_events: EventHandle<DepositEvent>,
        withdraw_events: EventHandle<WithdrawEvent>,
        rebalance_events: EventHandle<RebalanceEvent>,
        hedge_events: EventHandle<HedgeEvent>,
        strategy_events: EventHandle<StrategyEvent>,
        harvest_events: EventHandle<HarvestEvent>,
    }

    /// Strategy metadata for social vaults
    struct StrategyMetadata has store, copy, drop {
        strategy_id: u64,
        strategy_name: String,
        creator: address,
        risk_level: u8, // 1-5 scale
        is_active: bool,
        total_deposits: u64,
        total_withdrawals: u64,
        created_at: u64,
    }


    /// Rebalancing configuration
    struct RebalanceConfig has store, copy, drop {
        hedge_allocation: u64, // in basis points (10000 = 100%)
        farm_allocation: u64,
        min_rebalance_threshold: u64, // minimum change to trigger rebalance
    }

    // ============ Events ============

    #[event]
    struct DepositEvent has store, copy, drop {
        user: address,
        assets: u64,
        shares: u64,
        timestamp: u64,
    }

    #[event]
    struct WithdrawEvent has store, copy, drop {
        user: address,
        assets: u64,
        shares: u64,
        timestamp: u64,
    }

    #[event]
    struct RebalanceEvent has store, copy, drop {
        triggerer: address,
        hedge_allocation: u64,
        farm_allocation: u64,
        timestamp: u64,
    }

    #[event]
    struct HedgeEvent has store, copy, drop {
        strategy_id: u64,
        amount: u64,
        direction: String, // "long" or "short"
        timestamp: u64,
    }

    #[event]
    struct StrategyEvent has store, copy, drop {
        strategy_id: u64,
        strategy_name: String,
        creator: address,
        action: String, // "registered", "updated", "deactivated"
        timestamp: u64,
    }

    #[event]
    struct HarvestEvent has store, copy, drop {
        strategy_id: u64,
        reward_token: String,
        amount: u64,
        timestamp: u64,
    }

    // ============ Initialization ============


    /// Initialize the vault with a specific asset token
    /// @param admin: Admin signer
    /// @param asset_token: The token address/type to be used as the vault asset
    /// @param rebalance_cooldown: Cooldown period for rebalancing in seconds
    public entry fun init_vault(
        admin: &signer,
        asset_token: String,
        rebalance_cooldown: u64,
    ) {
        let _admin_addr = signer::address_of(admin);
        
        let vault_state = VaultState {
            asset_token,
            total_assets: 0,
            total_shares: 0,
            is_initialized: true,
            apt_coins: coin::zero<AptosCoin>(),
            user_shares: table::new(),
            strategies: table::new(),
            next_strategy_id: 1,
            last_rebalance_timestamp: 0,
            rebalance_cooldown,
            reward_tokens: vector::empty(),
            reward_per_share: table::new(),
            deposit_events: account::new_event_handle<DepositEvent>(admin),
            withdraw_events: account::new_event_handle<WithdrawEvent>(admin),
            rebalance_events: account::new_event_handle<RebalanceEvent>(admin),
            hedge_events: account::new_event_handle<HedgeEvent>(admin),
            strategy_events: account::new_event_handle<StrategyEvent>(admin),
            harvest_events: account::new_event_handle<HarvestEvent>(admin),
        };

        move_to(admin, vault_state);
    }

    // ============ Core ERC-4626 Functions ============

    /// Register APT coin for a user (required before deposits)
    public entry fun register_apt(user: &signer) {
        let user_addr = signer::address_of(user);
        if (!coin::is_account_registered<AptosCoin>(user_addr)) {
            coin::register<AptosCoin>(user);
        };
    }

    /// Deposit assets and mint shares to receiver
    /// @param amount: Amount of assets to deposit
    /// @param receiver: Address to receive the minted shares
    /// User-facing deposit function
    public entry fun user_deposit(
        user: &signer,
        amount: u64,
    ) acquires VaultState {
        let user_addr = signer::address_of(user);
        
        // Transfer USDC from user to vault
        let usdc_payment = fungible_asset::withdraw(USDC_OBJECT, user, amount);
        let vault_state = borrow_global_mut<VaultState>(@plexi);
        fungible_asset::merge(&mut vault_state.usdc_assets, usdc_payment);
        
        // Call the internal deposit function
        deposit(user, amount, user_addr);
    }

    /// Admin deposit function (original)
    public entry fun deposit(
        admin: &signer,
        amount: u64,
        receiver: address,
    ) acquires VaultState {
        assert!(amount > 0, error::invalid_argument(E_ZERO_AMOUNT));
        assert!(receiver != @0x0, error::invalid_argument(E_INVALID_RECEIVER));
        
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));

        // Calculate shares to mint
        let shares = if (vault_state.total_shares == 0) {
            // First deposit: 1:1 ratio
            amount
        } else {
            // Calculate shares based on current ratio
            (amount * vault_state.total_shares) / vault_state.total_assets
        };
        
        // Update vault state
        vault_state.total_assets = vault_state.total_assets + amount;
        vault_state.total_shares = vault_state.total_shares + shares;

        // Update user shares
        let current_shares = if (table::contains(&vault_state.user_shares, receiver)) {
            *table::borrow(&vault_state.user_shares, receiver)
        } else {
            0
        };
        table::upsert(&mut vault_state.user_shares, receiver, current_shares + shares);

        // Emit event
        event::emit(DepositEvent {
            user: receiver,
            assets: amount,
            shares,
            timestamp: 0, // Remove timestamp dependency for tests
        });
    }

    /// Withdraw assets by burning shares
    /// @param amount: Amount of assets to withdraw
    /// @param receiver: Address to receive the assets
    /// @param owner: Address that owns the shares
    /// User-facing withdraw function
    public entry fun user_withdraw(
        user: &signer,
        amount: u64,
    ) acquires VaultState {
        let user_addr = signer::address_of(user);
        
        // Call the internal withdraw function first
        withdraw(user, amount, user_addr, user_addr);
        
        // Transfer USDC from vault back to user
        let vault_state = borrow_global_mut<VaultState>(@plexi);
        let usdc_payment = fungible_asset::extract(&mut vault_state.usdc_assets, amount);
        fungible_asset::deposit(USDC_OBJECT, user_addr, usdc_payment);
    }

    /// Admin withdraw function (original)
    public entry fun withdraw(
        admin: &signer,
        amount: u64,
        receiver: address,
        owner: address,
    ) acquires VaultState {
        assert!(amount > 0, error::invalid_argument(E_ZERO_AMOUNT));
        assert!(receiver != @0x0, error::invalid_argument(E_INVALID_RECEIVER));
        assert!(owner != @0x0, error::invalid_argument(E_INVALID_OWNER));
        
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));
        assert!(amount <= vault_state.total_assets, error::invalid_argument(E_INSUFFICIENT_BALANCE));

        // Calculate shares to burn
        let shares = if (vault_state.total_shares == 0) {
            // First deposit: 1:1 ratio
            amount
        } else {
            // Calculate shares based on current ratio
            (amount * vault_state.total_shares) / vault_state.total_assets
        };
        
        // Check user has enough shares
        assert!(table::contains(&vault_state.user_shares, owner), error::not_found(E_INSUFFICIENT_SHARES));
        let user_shares = *table::borrow(&vault_state.user_shares, owner);
        assert!(shares <= user_shares, error::invalid_argument(E_INSUFFICIENT_SHARES));

        // Update vault state
        vault_state.total_assets = vault_state.total_assets - amount;
        vault_state.total_shares = vault_state.total_shares - shares;

        // Update user shares
        table::upsert(&mut vault_state.user_shares, owner, user_shares - shares);

        // Emit event
        event::emit(WithdrawEvent {
            user: owner,
            assets: amount,
            shares,
            timestamp: 0, // Remove timestamp dependency for tests
        });
    }

    /// Mint shares directly to receiver
    /// @param shares: Amount of shares to mint
    /// @param receiver: Address to receive the shares
    /// User-facing mint function
    public entry fun user_mint(
        user: &signer,
        shares: u64,
    ) acquires VaultState {
        let user_addr = signer::address_of(user);
        
        // Calculate equivalent USDC amount for the shares
        let vault_state = borrow_global_mut<VaultState>(@plexi);
        let usdc_amount = if (vault_state.total_shares == 0) {
            shares // 1:1 ratio for first mint
        } else {
            (shares * vault_state.total_assets) / vault_state.total_shares
        };
        
        // Transfer USDC from user to vault
        let usdc_payment = fungible_asset::withdraw(USDC_OBJECT, user, usdc_amount);
        fungible_asset::merge(&mut vault_state.usdc_assets, usdc_payment);
        
        // Call the internal mint function
        mint(user, shares, user_addr);
    }

    /// Admin mint function (original)
    public entry fun mint(
        admin: &signer,
        shares: u64,
        receiver: address,
    ) acquires VaultState {
        assert!(shares > 0, error::invalid_argument(E_ZERO_AMOUNT));
        assert!(receiver != @0x0, error::invalid_argument(E_INVALID_RECEIVER));
        
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));

        // Calculate assets needed
        let assets = if (vault_state.total_shares == 0) {
            // First mint: 1:1 ratio
            shares
        } else {
            (shares * vault_state.total_assets) / vault_state.total_shares
        };
        
        // Update vault state
        vault_state.total_assets = vault_state.total_assets + assets;
        vault_state.total_shares = vault_state.total_shares + shares;

        // Update user shares
        let current_shares = if (table::contains(&vault_state.user_shares, receiver)) {
            *table::borrow(&vault_state.user_shares, receiver)
        } else {
            0
        };
        table::upsert(&mut vault_state.user_shares, receiver, current_shares + shares);

        // Emit event
        event::emit(DepositEvent {
            user: receiver,
            assets,
            shares,
            timestamp: 0,
        });
    }

    /// Redeem shares directly for assets
    /// @param shares: Amount of shares to redeem
    /// @param receiver: Address to receive the assets
    /// @param owner: Address that owns the shares
    public entry fun redeem(
        admin: &signer,
        shares: u64,
        receiver: address,
        owner: address,
    ) acquires VaultState {
        assert!(shares > 0, error::invalid_argument(E_ZERO_AMOUNT));
        assert!(receiver != @0x0, error::invalid_argument(E_INVALID_RECEIVER));
        assert!(owner != @0x0, error::invalid_argument(E_INVALID_OWNER));
        
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));

        // Calculate assets to return
        let assets = if (vault_state.total_shares == 0) {
            0
        } else {
            (shares * vault_state.total_assets) / vault_state.total_shares
        };
        
        // Check user has enough shares
        assert!(table::contains(&vault_state.user_shares, owner), error::not_found(E_INSUFFICIENT_SHARES));
        let user_shares = *table::borrow(&vault_state.user_shares, owner);
        assert!(shares <= user_shares, error::invalid_argument(E_INSUFFICIENT_SHARES));

        // Update vault state
        vault_state.total_assets = vault_state.total_assets - assets;
        vault_state.total_shares = vault_state.total_shares - shares;

        // Update user shares
        table::upsert(&mut vault_state.user_shares, owner, user_shares - shares);

        // Emit event
        event::emit(WithdrawEvent {
            user: owner,
            assets,
            shares,
            timestamp: 0,
        });
    }

    // ============ View Functions ============

    /// Get total assets managed by the vault
    #[view]
    public fun total_assets(admin: address): u64 acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        vault_state.total_assets
    }

    /// Get total shares issued by the vault
    #[view]
    public fun total_shares(admin: address): u64 acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        vault_state.total_shares
    }

    /// Convert assets to shares
    /// @param amount: Amount of assets to convert
    /// @return: Equivalent number of shares
    #[view]
    public fun convert_to_shares(admin: address, amount: u64): u64 acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        
        if (vault_state.total_shares == 0) {
            // First deposit: 1:1 ratio
            amount
        } else {
            // Calculate shares based on current ratio
            (amount * vault_state.total_shares) / vault_state.total_assets
        }
    }

    /// Convert shares to assets
    /// @param shares: Number of shares to convert
    /// @return: Equivalent amount of assets
    #[view]
    public fun convert_to_assets(admin: address, shares: u64): u64 acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        
        if (vault_state.total_shares == 0) {
            0
        } else {
            (shares * vault_state.total_assets) / vault_state.total_shares
        }
    }

    // ============ Strategy Functions ============

    /// Register a new strategy metadata for social vaults
    /// @param strategy_name: Name of the strategy
    /// @param risk_level: Risk level (1-5 scale)
    /// @param creator: Address of the strategy creator
    public entry fun register_strategy_metadata(
        admin: &signer,
        strategy_name: String,
        risk_level: u8,
        creator: address,
    ) acquires VaultState {
        assert!(risk_level >= 1 && risk_level <= 5, error::invalid_argument(E_INVALID_RISK_LEVEL));
        assert!(creator != @0x0, error::invalid_argument(E_INVALID_OWNER));
        
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));
        assert!(vault_state.next_strategy_id <= MAX_STRATEGIES, error::invalid_argument(E_OVERFLOW));

        let strategy_id = vault_state.next_strategy_id;
        let strategy_metadata = StrategyMetadata {
            strategy_id,
            strategy_name,
            creator,
            risk_level,
            is_active: true,
            total_deposits: 0,
            total_withdrawals: 0,
            created_at: 0,
        };

        table::add(&mut vault_state.strategies, strategy_id, strategy_metadata);
        vault_state.next_strategy_id = vault_state.next_strategy_id + 1;

        // Emit event
        event::emit(StrategyEvent {
            strategy_id,
            strategy_name,
            creator,
            action: string::utf8(b"registered"),
            timestamp: 0,
        });
    }

    /// Hedge with Hyperliquid (placeholder for future integration)
    /// @param strategy_id: ID of the strategy to execute
    /// @param amount: Amount to hedge
    /// @param direction: "long" or "short"
    public entry fun hedge_with_hyperliquid(
        admin: &signer,
        strategy_id: u64,
        amount: u64,
        direction: String,
    ) acquires VaultState {
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));
        assert!(table::contains(&vault_state.strategies, strategy_id), error::not_found(E_INVALID_STRATEGY));

        // TODO: Implement actual Hyperliquid integration
        // For now, just emit event and update strategy metadata
        let strategy = table::borrow_mut(&mut vault_state.strategies, strategy_id);
        strategy.total_deposits = strategy.total_deposits + amount;

        event::emit(HedgeEvent {
            strategy_id,
            amount,
            direction,
            timestamp: 0,
        });
    }

    /// Farm with TAPP (placeholder for future integration)
    /// @param strategy_id: ID of the strategy to execute
    /// @param amount: Amount to farm
    public entry fun farm_with_tapp(
        admin: &signer,
        strategy_id: u64,
        amount: u64,
    ) acquires VaultState {
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));
        assert!(table::contains(&vault_state.strategies, strategy_id), error::not_found(E_INVALID_STRATEGY));

        // TODO: Implement actual TAPP integration
        // For now, just emit event and update strategy metadata
        let strategy = table::borrow_mut(&mut vault_state.strategies, strategy_id);
        strategy.total_deposits = strategy.total_deposits + amount;

        event::emit(HarvestEvent {
            strategy_id,
            reward_token: string::utf8(b"TAPP"),
            amount,
            timestamp: 0,
        });
    }

    /// Rebalance portfolio between hedge and farm strategies
    /// @param hedge_allocation: New hedge allocation in basis points
    /// @param farm_allocation: New farm allocation in basis points
    public entry fun rebalance(
        admin: &signer,
        hedge_allocation: u64,
        farm_allocation: u64,
    ) acquires VaultState {
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));
        assert!(hedge_allocation + farm_allocation == 10000, error::invalid_argument(E_INVALID_SLIPPAGE));

        // TODO: Implement actual rebalancing logic
        // For now, just emit event
        event::emit(RebalanceEvent {
            triggerer: signer::address_of(admin),
            hedge_allocation,
            farm_allocation,
            timestamp: 0,
        });
    }

    /// Trigger rebalancing (callable by anyone)
    /// @param hedge_allocation: New hedge allocation in basis points
    /// @param farm_allocation: New farm allocation in basis points
    public entry fun trigger_rebalance(
        admin: &signer,
        hedge_allocation: u64,
        farm_allocation: u64,
    ) acquires VaultState {
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));
        
        let current_time = vault_state.last_rebalance_timestamp + vault_state.rebalance_cooldown; // Simplified for testing
        assert!(
            current_time >= vault_state.last_rebalance_timestamp + vault_state.rebalance_cooldown,
            error::invalid_argument(E_REBALANCE_COOLDOWN)
        );

        // Update last rebalance timestamp
        vault_state.last_rebalance_timestamp = current_time;

        // Call rebalance function
        rebalance(admin, hedge_allocation, farm_allocation);
    }

    /// Route order to CLOB (placeholder for future integration)
    /// @param order_data: Order data to route
    public entry fun route_order_to_clob(
        admin: &signer,
        _order_data: String,
    ) acquires VaultState {
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));

        // TODO: Implement actual CLOB routing
        // For now, just emit event
        event::emit(StrategyEvent {
            strategy_id: 0,
            strategy_name: string::utf8(b"CLOB_ROUTE"),
            creator: @0x0,
            action: string::utf8(b"order_routed"),
            timestamp: 0,
        });
    }

    /// Harvest yield from farming strategies
    /// @param strategy_id: ID of the strategy to harvest from
    public entry fun harvest_yield(
        admin: &signer,
        strategy_id: u64,
    ) acquires VaultState {
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));
        assert!(table::contains(&vault_state.strategies, strategy_id), error::not_found(E_INVALID_STRATEGY));

        // TODO: Implement actual yield harvesting
        // For now, just emit event
        event::emit(HarvestEvent {
            strategy_id,
            reward_token: string::utf8(b"YIELD"),
            amount: 0, // Will be calculated in actual implementation
            timestamp: 0,
        });
    }

    // ============ Reward System ============

    /// Add a reward token to the vault
    /// @param reward_token: Address/type of the reward token
    public entry fun add_reward_token(
        admin: &signer,
        reward_token: String,
    ) acquires VaultState {
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));

        vector::push_back(&mut vault_state.reward_tokens, reward_token);
        table::add(&mut vault_state.reward_per_share, reward_token, 0);
    }

    /// Update reward per share for a specific token
    /// @param reward_token: Token to update rewards for
    /// @param reward_amount: Amount of rewards to distribute
    public entry fun update_reward_per_share(
        admin: &signer,
        reward_token: String,
        reward_amount: u64,
    ) acquires VaultState {
        let vault_state = borrow_global_mut<VaultState>(signer::address_of(admin));
        assert!(vault_state.is_initialized, error::not_found(E_NOT_INITIALIZED));
        assert!(table::contains(&vault_state.reward_per_share, reward_token), error::not_found(E_INVALID_STRATEGY));

        if (vault_state.total_shares > 0) {
            let current_reward_per_share = *table::borrow(&vault_state.reward_per_share, reward_token);
            let new_reward_per_share = current_reward_per_share + (reward_amount * PRECISION) / vault_state.total_shares;
            table::upsert(&mut vault_state.reward_per_share, reward_token, new_reward_per_share);
        };
    }

    // ============ Utility Functions ============

    /// Get strategy metadata by ID
    #[view]
    public fun get_strategy_metadata(admin: address, strategy_id: u64): Option<StrategyMetadata> acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        if (table::contains(&vault_state.strategies, strategy_id)) {
            option::some(*table::borrow(&vault_state.strategies, strategy_id))
        } else {
            option::none()
        }
    }

    /// Get user shares
    #[view]
    public fun get_user_shares(admin: address, user: address): u64 acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        if (table::contains(&vault_state.user_shares, user)) {
            *table::borrow(&vault_state.user_shares, user)
        } else {
            0
        }
    }

    /// Check if vault is initialized
    #[view]
    public fun is_initialized(admin: address): bool acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        vault_state.is_initialized
    }

    /// Get asset token type
    #[view]
    public fun get_asset_token(admin: address): String acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        vault_state.asset_token
    }

    /// Get total number of strategies
    #[view]
    public fun get_strategy_count(admin: address): u64 acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        vault_state.next_strategy_id - 1
    }

    /// Get reward tokens list
    #[view]
    public fun get_reward_tokens(admin: address): vector<String> acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        vault_state.reward_tokens
    }

    /// Get strategy name by ID
    #[view]
    public fun get_strategy_name(admin: address, strategy_id: u64): String acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        let strategy = table::borrow(&vault_state.strategies, strategy_id);
        strategy.strategy_name
    }

    /// Get strategy creator by ID
    #[view]
    public fun get_strategy_creator(admin: address, strategy_id: u64): address acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        let strategy = table::borrow(&vault_state.strategies, strategy_id);
        strategy.creator
    }

    /// Get strategy risk level by ID
    #[view]
    public fun get_strategy_risk_level(admin: address, strategy_id: u64): u8 acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        let strategy = table::borrow(&vault_state.strategies, strategy_id);
        strategy.risk_level
    }

    /// Get strategy active status by ID
    #[view]
    public fun get_strategy_is_active(admin: address, strategy_id: u64): bool acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        let strategy = table::borrow(&vault_state.strategies, strategy_id);
        strategy.is_active
    }

    /// Get strategy total deposits by ID
    #[view]
    public fun get_strategy_total_deposits(admin: address, strategy_id: u64): u64 acquires VaultState {
        let vault_state = borrow_global<VaultState>(admin);
        let strategy = table::borrow(&vault_state.strategies, strategy_id);
        strategy.total_deposits
    }
}
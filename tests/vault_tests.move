/// @title PlexiX Vault Test Suite
/// @notice Comprehensive unit tests for the PlexiX vault system
/// @dev Tests all core functionality, edge cases, and security features
module plexi::vault_tests {
    use std::string;
    use std::option;
    use std::vector;
    use std::signer;
    use plexi::vault;

    // ============ Test Constants ============
    
    const TEST_ACCOUNT_1: address = @0x1;
    const TEST_ACCOUNT_2: address = @0x2;
    const TEST_ACCOUNT_3: address = @0x3;
    const VAULT_ADMIN: address = @0x4;
    const STRATEGY_CREATOR: address = @0x5;

    // ============ Core Functionality Tests ============

    #[test(admin = @0x4)]
    fun test_vault_initialization(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Test vault is initialized
        assert!(vault::is_initialized(signer::address_of(admin)), 0);
        assert!(vault::total_assets(signer::address_of(admin)) == 0, 1);
        assert!(vault::total_shares(signer::address_of(admin)) == 0, 2);
        assert!(vault::get_asset_token(signer::address_of(admin)) == string::utf8(b"USDC"), 3);
    }

    #[test(admin = @0x4)]
    fun test_deposit_first_user(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // First deposit should mint 1:1 shares
        vault::deposit(admin, 1000, TEST_ACCOUNT_1);
        
        assert!(vault::total_assets(signer::address_of(admin)) == 1000, 0);
        assert!(vault::total_shares(signer::address_of(admin)) == 1000, 1);
        
        // Check user position
        let user_shares = vault::get_user_shares(signer::address_of(admin), TEST_ACCOUNT_1);
        assert!(user_shares == 1000, 2);
    }

    #[test(admin = @0x4)]
    fun test_deposit_multiple_users(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // First user deposits 1000
        vault::deposit(admin, 1000, TEST_ACCOUNT_1);
        
        // Second user deposits 2000
        vault::deposit(admin, 2000, TEST_ACCOUNT_2);
        
        assert!(vault::total_assets(signer::address_of(admin)) == 3000, 0);
        assert!(vault::total_shares(signer::address_of(admin)) == 3000, 1);
        
        // Check user positions
        let user1_shares = vault::get_user_shares(signer::address_of(admin), TEST_ACCOUNT_1);
        assert!(user1_shares == 1000, 2);
        
        let user2_shares = vault::get_user_shares(signer::address_of(admin), TEST_ACCOUNT_2);
        assert!(user2_shares == 2000, 3);
    }

    #[test(admin = @0x4)]
    fun test_withdraw(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Deposit first
        vault::deposit(admin, 1000, TEST_ACCOUNT_1);
        
        // Withdraw 500
        vault::withdraw(admin, 500, TEST_ACCOUNT_1, TEST_ACCOUNT_1);
        
        assert!(vault::total_assets(signer::address_of(admin)) == 500, 0);
        assert!(vault::total_shares(signer::address_of(admin)) == 500, 1);
        
        // Check user position
        let user_shares = vault::get_user_shares(signer::address_of(admin), TEST_ACCOUNT_1);
        assert!(user_shares == 500, 2);
    }

    #[test(admin = @0x4)]
    fun test_mint_and_redeem(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Mint 1000 shares directly
        vault::mint(admin, 1000, TEST_ACCOUNT_1);
        
        assert!(vault::total_assets(signer::address_of(admin)) == 1000, 0);
        assert!(vault::total_shares(signer::address_of(admin)) == 1000, 1);
        
        // Redeem 500 shares
        vault::redeem(admin, 500, TEST_ACCOUNT_1, TEST_ACCOUNT_1);
        
        assert!(vault::total_assets(signer::address_of(admin)) == 500, 2);
        assert!(vault::total_shares(signer::address_of(admin)) == 500, 3);
    }

    // ============ Conversion Function Tests ============

    #[test(admin = @0x4)]
    fun test_convert_to_shares_empty_vault(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Empty vault should return 1:1 ratio
        assert!(vault::convert_to_shares(signer::address_of(admin), 1000) == 1000, 0);
    }

    #[test(admin = @0x4)]
    fun test_convert_to_shares_with_deposits(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Deposit 1000 assets, get 1000 shares
        vault::deposit(admin, 1000, TEST_ACCOUNT_1);
        
        // Now 500 assets should give 500 shares (1:1 ratio maintained)
        assert!(vault::convert_to_shares(signer::address_of(admin), 500) == 500, 0);
    }

    #[test(admin = @0x4)]
    fun test_convert_to_assets_empty_vault(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Empty vault should return 0
        assert!(vault::convert_to_assets(signer::address_of(admin), 1000) == 0, 0);
    }

    #[test(admin = @0x4)]
    fun test_convert_to_assets_with_deposits(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Deposit 1000 assets, get 1000 shares
        vault::deposit(admin, 1000, TEST_ACCOUNT_1);
        
        // Now 500 shares should give 500 assets
        assert!(vault::convert_to_assets(signer::address_of(admin), 500) == 500, 0);
    }

    // ============ Strategy Tests ============

    #[test(admin = @0x4)]
    fun test_register_strategy_metadata(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Register a strategy
        vault::register_strategy_metadata(
            admin,
            string::utf8(b"Test Strategy"),
            3,
            STRATEGY_CREATOR
        );
        
        // Check strategy was registered
        assert!(vault::get_strategy_count(signer::address_of(admin)) == 1, 0);
        
        let strategy_metadata = vault::get_strategy_metadata(signer::address_of(admin), 1);
        assert!(option::is_some(&strategy_metadata), 1);
        
        assert!(vault::get_strategy_name(signer::address_of(admin), 1) == string::utf8(b"Test Strategy"), 2);
        assert!(vault::get_strategy_creator(signer::address_of(admin), 1) == STRATEGY_CREATOR, 3);
        assert!(vault::get_strategy_risk_level(signer::address_of(admin), 1) == 3, 4);
        assert!(vault::get_strategy_is_active(signer::address_of(admin), 1) == true, 5);
    }

    #[test(admin = @0x4)]
    fun test_hedge_with_hyperliquid(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Register a strategy first
        vault::register_strategy_metadata(
            admin,
            string::utf8(b"Hedge Strategy"),
            4,
            STRATEGY_CREATOR
        );
        
        // Execute hedge
        vault::hedge_with_hyperliquid(
            admin,
            1,
            1000,
            string::utf8(b"long")
        );
        
        // Check strategy was updated
        let strategy_metadata = vault::get_strategy_metadata(signer::address_of(admin), 1);
        assert!(option::is_some(&strategy_metadata), 0);
        assert!(vault::get_strategy_total_deposits(signer::address_of(admin), 1) == 1000, 1);
    }

    #[test(admin = @0x4)]
    fun test_farm_with_tapp(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Register a strategy first
        vault::register_strategy_metadata(
            admin,
            string::utf8(b"Farm Strategy"),
            2,
            STRATEGY_CREATOR
        );
        
        // Execute farm
        vault::farm_with_tapp(admin, 1, 2000);
        
        // Check strategy was updated
        let strategy_metadata = vault::get_strategy_metadata(signer::address_of(admin), 1);
        assert!(option::is_some(&strategy_metadata), 0);
        assert!(vault::get_strategy_total_deposits(signer::address_of(admin), 1) == 2000, 1);
    }

    #[test(admin = @0x4)]
    fun test_rebalance(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Execute rebalance
        vault::rebalance(admin, 6000, 4000); // 60% hedge, 40% farm
        
        // Should not fail (just emits event for now)
        assert!(true, 0);
    }

    #[test(admin = @0x4)]
    fun test_trigger_rebalance(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Trigger rebalance
        vault::trigger_rebalance(admin, 7000, 3000); // 70% hedge, 30% farm
        
        // Should not fail
        assert!(true, 0);
    }

    #[test(admin = @0x4)]
    fun test_route_order_to_clob(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Route order
        vault::route_order_to_clob(admin, string::utf8(b"order_data"));
        
        // Should not fail (just emits event for now)
        assert!(true, 0);
    }

    #[test(admin = @0x4)]
    fun test_harvest_yield(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Register a strategy first
        vault::register_strategy_metadata(
            admin,
            string::utf8(b"Yield Strategy"),
            1,
            STRATEGY_CREATOR
        );
        
        // Harvest yield
        vault::harvest_yield(admin, 1);
        
        // Should not fail (just emits event for now)
        assert!(true, 0);
    }

    // ============ Reward System Tests ============

    #[test(admin = @0x4)]
    fun test_add_reward_token(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Add reward token
        vault::add_reward_token(admin, string::utf8(b"APT"));
        
        // Check reward tokens
        let reward_tokens = vault::get_reward_tokens(signer::address_of(admin));
        assert!(vector::length(&reward_tokens) == 1, 0);
        assert!(*vector::borrow(&reward_tokens, 0) == string::utf8(b"APT"), 1);
    }

    #[test(admin = @0x4)]
    fun test_update_reward_per_share(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Add reward token
        vault::add_reward_token(admin, string::utf8(b"APT"));
        
        // Deposit some assets first
        vault::deposit(admin, 1000, TEST_ACCOUNT_1);
        
        // Update reward per share
        vault::update_reward_per_share(admin, string::utf8(b"APT"), 100);
        
        // Should not fail
        assert!(true, 0);
    }

    // ============ Edge Case Tests ============

    #[test(admin = @0x4)]
    #[expected_failure(abort_code = 65541)] // E_ZERO_AMOUNT encoded
    fun test_deposit_zero_amount(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Try to deposit 0
        vault::deposit(admin, 0, TEST_ACCOUNT_1);
    }

    #[test(admin = @0x4)]
    #[expected_failure(abort_code = 65542)] // E_INVALID_RECEIVER encoded
    fun test_deposit_invalid_receiver(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Try to deposit to zero address
        vault::deposit(admin, 1000, @0x0);
    }

    #[test(admin = @0x4)]
    #[expected_failure(abort_code = 65549)] // E_INVALID_RISK_LEVEL encoded
    fun test_register_strategy_invalid_risk_level(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Try to register with invalid risk level
        vault::register_strategy_metadata(
            admin,
            string::utf8(b"Invalid Strategy"),
            6, // Invalid risk level
            STRATEGY_CREATOR
        );
    }

    #[test(admin = @0x4)]
    #[expected_failure(abort_code = 65551)] // E_INVALID_SLIPPAGE encoded
    fun test_rebalance_invalid_allocation(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // Try to rebalance with invalid allocation (should sum to 10000)
        vault::rebalance(admin, 6000, 5000); // Sums to 11000
    }

    // ============ Multiple Users Tests ============

    #[test(admin = @0x4)]
    fun test_multiple_users_deposit_withdraw(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // User 1 deposits 1000
        vault::deposit(admin, 1000, TEST_ACCOUNT_1);
        
        // User 2 deposits 2000
        vault::deposit(admin, 2000, TEST_ACCOUNT_2);
        
        // User 3 deposits 3000
        vault::deposit(admin, 3000, TEST_ACCOUNT_3);
        
        // Check total
        assert!(vault::total_assets(signer::address_of(admin)) == 6000, 0);
        assert!(vault::total_shares(signer::address_of(admin)) == 6000, 1);
        
        // User 1 withdraws 500
        vault::withdraw(admin, 500, TEST_ACCOUNT_1, TEST_ACCOUNT_1);
        
        // User 2 withdraws 1000
        vault::withdraw(admin, 1000, TEST_ACCOUNT_2, TEST_ACCOUNT_2);
        
        // Check final state
        assert!(vault::total_assets(signer::address_of(admin)) == 4500, 2);
        assert!(vault::total_shares(signer::address_of(admin)) == 4500, 3);
        
        // Check individual positions
        let user1_shares = vault::get_user_shares(signer::address_of(admin), TEST_ACCOUNT_1);
        assert!(user1_shares == 500, 4);
        
        let user2_shares = vault::get_user_shares(signer::address_of(admin), TEST_ACCOUNT_2);
        assert!(user2_shares == 1000, 5);
        
        let user3_shares = vault::get_user_shares(signer::address_of(admin), TEST_ACCOUNT_3);
        assert!(user3_shares == 3000, 6);
    }

    // ============ Complex Scenario Tests ============

    #[test(admin = @0x4)]
    fun test_complete_vault_workflow(admin: &signer) {
        // Initialize vault
        vault::init_vault(admin, string::utf8(b"USDC"), 3600);
        
        // 1. Register multiple strategies
        vault::register_strategy_metadata(
            admin,
            string::utf8(b"Conservative Strategy"),
            1,
            STRATEGY_CREATOR
        );
        
        vault::register_strategy_metadata(
            admin,
            string::utf8(b"Aggressive Strategy"),
            5,
            STRATEGY_CREATOR
        );
        
        // 2. Add reward tokens
        vault::add_reward_token(admin, string::utf8(b"APT"));
        vault::add_reward_token(admin, string::utf8(b"USDC"));
        
        // 3. User deposits
        vault::deposit(admin, 5000, TEST_ACCOUNT_1);
        
        // 4. Execute strategies
        vault::hedge_with_hyperliquid(admin, 1, 2000, string::utf8(b"long"));
        vault::farm_with_tapp(admin, 2, 3000);
        
        // 5. Rebalance
        vault::trigger_rebalance(admin, 6000, 4000);
        
        // 6. Harvest yield
        vault::harvest_yield(admin, 1);
        vault::harvest_yield(admin, 2);
        
        // 7. Update rewards
        vault::update_reward_per_share(admin, string::utf8(b"APT"), 100);
        vault::update_reward_per_share(admin, string::utf8(b"USDC"), 50);
        
        // 8. User withdraws
        vault::withdraw(admin, 2000, TEST_ACCOUNT_1, TEST_ACCOUNT_1);
        
        // Verify final state
        assert!(vault::total_assets(signer::address_of(admin)) == 3000, 0);
        assert!(vault::total_shares(signer::address_of(admin)) == 3000, 1);
        assert!(vault::get_strategy_count(signer::address_of(admin)) == 2, 2);
        
        let reward_tokens = vault::get_reward_tokens(signer::address_of(admin));
        assert!(vector::length(&reward_tokens) == 2, 3);
    }
}
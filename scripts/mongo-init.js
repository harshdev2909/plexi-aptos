// MongoDB initialization script
db = db.getSiblingDB('plexix');

// Create collections with indexes
db.createCollection('users');
db.users.createIndex({ "walletAddress": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });

db.createCollection('transactions');
db.transactions.createIndex({ "txHash": 1 }, { unique: true });
db.transactions.createIndex({ "userAddress": 1, "createdAt": -1 });
db.transactions.createIndex({ "type": 1, "createdAt": -1 });
db.transactions.createIndex({ "status": 1, "createdAt": -1 });
db.transactions.createIndex({ "userAddress": 1, "type": 1, "createdAt": -1 });

db.createCollection('vault_events');
db.vault_events.createIndex({ "eventType": 1, "createdAt": -1 });
db.vault_events.createIndex({ "txHash": 1, "eventSequenceNumber": 1 }, { unique: true });
db.vault_events.createIndex({ "blockHeight": -1 });
db.vault_events.createIndex({ "userAddress": 1, "createdAt": -1 });
db.vault_events.createIndex({ "eventType": 1, "userAddress": 1, "createdAt": -1 });

db.createCollection('vault_snapshots');
db.vault_snapshots.createIndex({ "timestamp": 1 }, { unique: true });
db.vault_snapshots.createIndex({ "blockHeight": -1 });
db.vault_snapshots.createIndex({ "createdAt": -1 });

print('PlexiX database initialized successfully');
print('Collections created: users, transactions, vault_events, vault_snapshots');
print('Indexes created for optimal query performance');

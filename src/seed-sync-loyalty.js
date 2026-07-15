const db = require('./config/db');

const syncLoyalty = async () => {
  try {
    console.log('🔄 Syncing existing customers with loyalty table...');

    // Get all customers who don't have loyalty records
    const [customers] = await db.query(
      `SELECT c.id, c.restaurant_id, c.loyalty_points, c.loyalty_tier 
       FROM customers c
       LEFT JOIN loyalty l ON c.id = l.customer_id
       WHERE l.id IS NULL`
    );

    if (customers.length === 0) {
      console.log('✅ All customers already have loyalty records');
      process.exit(0);
      return;
    }

    for (const customer of customers) {
      await db.query(
        `INSERT INTO loyalty (customer_id, restaurant_id, points_balance, lifetime_points, points_redeemed, tier) 
         VALUES (?, ?, ?, ?, 0, ?)`,
        [customer.id, customer.restaurant_id, customer.loyalty_points || 0, customer.loyalty_points || 0, customer.loyalty_tier || 'Bronze']
      );
      console.log(`✅ Created loyalty record for customer ${customer.id}`);
    }

    console.log(`✅ Created ${customers.length} loyalty records`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing loyalty:', error);
    process.exit(1);
  }
};

syncLoyalty();

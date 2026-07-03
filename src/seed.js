const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Create default restaurant if not exists
    const [restaurant] = await db.query(
      `INSERT IGNORE INTO restaurants (id, name, legal_name, email, phone, address, status) 
       VALUES (UUID(), 'KFC Headquarters', 'KFC Kenya Ltd', 'admin@kfc.com', '+254700000000', 'Nairobi, Kenya', 'active')`
    );

    // Get the restaurant ID
    const [restaurantRow] = await db.query(
      `SELECT id FROM restaurants WHERE email = 'admin@kfc.com' LIMIT 1`
    );
    const restaurantId = restaurantRow[0].id;

    // 2. Create default roles
    const roles = [
      { name: 'Admin', description: 'Full system access', is_system: true },
      { name: 'Manager', description: 'Restaurant manager', is_system: true },
      { name: 'Staff', description: 'Restaurant staff', is_system: true },
      { name: 'Customer', description: 'Regular customer', is_system: false }
    ];

    for (const role of roles) {
      await db.query(
        `INSERT IGNORE INTO roles (id, restaurant_id, name, description, is_system) 
         VALUES (UUID(), ?, ?, ?, ?)`,
        [restaurantId, role.name, role.description, role.is_system]
      );
    }

    // 3. Get role IDs
    const [roleRows] = await db.query(
      `SELECT id, name FROM roles WHERE restaurant_id = ?`,
      [restaurantId]
    );
    const roleMap = {};
    roleRows.forEach(r => { roleMap[r.name] = r.id; });

    // 4. Create default permissions
    const permissions = [
      // User management
      { name: 'View Users', resource: 'users', action: 'view' },
      { name: 'Create Users', resource: 'users', action: 'create' },
      { name: 'Update Users', resource: 'users', action: 'update' },
      { name: 'Delete Users', resource: 'users', action: 'delete' },
      
      // Role management
      { name: 'View Roles', resource: 'roles', action: 'view' },
      { name: 'Create Roles', resource: 'roles', action: 'create' },
      { name: 'Update Roles', resource: 'roles', action: 'update' },
      { name: 'Delete Roles', resource: 'roles', action: 'delete' },
      
      // Restaurant management
      { name: 'View Restaurants', resource: 'restaurants', action: 'view' },
      { name: 'Create Restaurants', resource: 'restaurants', action: 'create' },
      { name: 'Update Restaurants', resource: 'restaurants', action: 'update' },
      { name: 'Delete Restaurants', resource: 'restaurants', action: 'delete' },
      
      // Table management
      { name: 'View Tables', resource: 'tables', action: 'view' },
      { name: 'Create Tables', resource: 'tables', action: 'create' },
      { name: 'Update Tables', resource: 'tables', action: 'update' },
      { name: 'Delete Tables', resource: 'tables', action: 'delete' },
      
      // Order management
      { name: 'View Orders', resource: 'orders', action: 'view' },
      { name: 'Create Orders', resource: 'orders', action: 'create' },
      { name: 'Update Orders', resource: 'orders', action: 'update' },
      { name: 'Delete Orders', resource: 'orders', action: 'delete' },
      
      // Menu management
      { name: 'View Menu', resource: 'menu', action: 'view' },
      { name: 'Create Menu', resource: 'menu', action: 'create' },
      { name: 'Update Menu', resource: 'menu', action: 'update' },
      { name: 'Delete Menu', resource: 'menu', action: 'delete' },
      
      // Inventory management
      { name: 'View Inventory', resource: 'inventory', action: 'view' },
      { name: 'Create Inventory', resource: 'inventory', action: 'create' },
      { name: 'Update Inventory', resource: 'inventory', action: 'update' },
      { name: 'Delete Inventory', resource: 'inventory', action: 'delete' },
      
      // Reports
      { name: 'View Reports', resource: 'reports', action: 'view' },
      { name: 'Generate Reports', resource: 'reports', action: 'generate' }
    ];

    for (const perm of permissions) {
      await db.query(
        `INSERT IGNORE INTO permissions (id, name, resource, action) 
         VALUES (UUID(), ?, ?, ?)`,
        [perm.name, perm.resource, perm.action]
      );
    }

    // 5. Assign all permissions to Admin role
    const [allPermissions] = await db.query(`SELECT id FROM permissions`);
    const [adminRole] = await db.query(
      `SELECT id FROM roles WHERE name = 'Admin' AND restaurant_id = ?`,
      [restaurantId]
    );

    if (adminRole.length > 0) {
      for (const perm of allPermissions) {
        await db.query(
          `INSERT IGNORE INTO role_permissions (role_id, permission_id) 
           VALUES (?, ?)`,
          [adminRole[0].id, perm.id]
        );
      }
      console.log('✅ Admin permissions assigned');
    }

    // 6. Assign some permissions to Manager role
    const [managerRole] = await db.query(
      `SELECT id FROM roles WHERE name = 'Manager' AND restaurant_id = ?`,
      [restaurantId]
    );

    if (managerRole.length > 0) {
      const managerPermissions = [
        'View Users', 'View Roles', 'View Restaurants', 
        'View Tables', 'Create Tables', 'Update Tables',
        'View Orders', 'Create Orders', 'Update Orders',
        'View Menu', 'View Inventory', 'View Reports'
      ];
      
      for (const permName of managerPermissions) {
        const [perm] = await db.query(
          `SELECT id FROM permissions WHERE name = ?`,
          [permName]
        );
        if (perm.length > 0) {
          await db.query(
            `INSERT IGNORE INTO role_permissions (role_id, permission_id) 
             VALUES (?, ?)`,
            [managerRole[0].id, perm[0].id]
          );
        }
      }
      console.log('✅ Manager permissions assigned');
    }

    // 7. Create admin user
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('Admin@123', salt);

    await db.query(
      `INSERT IGNORE INTO users (id, restaurant_id, role_id, email, phone, password_hash, first_name, last_name, status) 
       VALUES (UUID(), ?, ?, 'admin@kfc.com', '+254700000001', ?, 'System', 'Admin', 'active')`,
      [restaurantId, roleMap['Admin'], password_hash]
    );

    console.log('✅ Admin user created (email: admin@kfc.com, password: Admin@123)');
    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    process.exit();
  }
};

seedDatabase();

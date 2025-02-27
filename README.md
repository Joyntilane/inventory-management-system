# Inventory Management System
A web-based inventory management system built with Node.js, SQLite, and WebSockets. This application allows users to manage products, track transactions, and view real-time updates through a clean, table-based interface with country-specific currency support.
# Features
    Product Management:
        Add, edit, remove, and update product quantities.
    Supports fields:
        ID, name, price, quantity, category, and country.
    Country-Specific Currencies:
        Displays prices with correct currency symbols (e.g., R for RSA, $ for US) based on the product’s country.
        Dropdown selection for countries in add/edit forms.
    Real-Time Updates:
        Uses WebSockets to refresh the UI instantly across all connected clients when data changes.
    Transaction History:
        Logs all product changes (add, edit, remove, restock, sale) with timestamps and values.
    Search and Filtering:
        Search products by name or category.
    Export Functionality:
        Download inventory data as a CSV file.
    Pagination:
        Paginated tables for inventory and transaction history (5 items per page).
    Persistent Storage:
        Stores data in an SQLite database (inventory.db).
# Tech Stack
    Backend:
        Node.js with Express.js for HTTP server and API.
        SQLite for persistent data storage.
        WebSocket for real-time updates.
    Frontend:
        HTML, CSS, and vanilla JavaScript with Fetch API.
        Development Tools:
            nodemon for automatic server reloading during development.
# Usage
    Adding a Product
    In the "Add Product" section, fill in:
    Product ID:
        Unique alphanumeric ID (e.g., P001).
    Name:
        Product name (e.g., Laptop).
    Price:
        Numeric price (e.g., 999.99).
    Quantity:
        Integer stock level (e.g., 10).
    Category:
        Product category (e.g., electronics).
    Country:
        Select from dropdown (e.g., RSA for South Africa).
        Click "Add Product".
    See the success message and the inventory table update live.
    Editing a Product:
        In the "Inventory Report" table, click "Edit" next to a product.
        The "Edit Product" form populates with current values.
        Modify any field (e.g., change price or country) and click "Update Product".
        Updates reflect instantly across all tabs.
    Updating Quantity:
        In the "Update Quantity" section, enter the product ID and a quantity change (positive to restock, negative to sell).
        Click "Update".
    Removing a Product:
        In the "Remove Product" section, enter the product ID.
        Click "Remove".
    Searching Products:
        In the "Search Products" section, type a name or category (e.g., top).
        Click "Search" to see filtered results.

# Viewing Reports
    Inventory Report:
        Shows all products with pagination and total value (in USD).
    Transaction History:
        Lists all logged changes with pagination.
    Exporting Data:
        Click "Download CSV" in the "Export" section to save the inventory as a CSV file.

# Limitations
    Currency Conversion:
        Total value is calculated in USD without conversion; prices are displayed in local currencies but not converted.
    Country Support:
        Limited to US, GB, EU, JP, CA—expand currencyMap in helpers.js and app.js for more.
    Testing:
        Unit tests are excluded from this repo but can be added in a tests/ folder.

# Future Enhancements
    Add real-time currency conversion using an API (e.g., Open Exchange Rates).
    Implement user authentication for secure access.
    Add sorting capabilities to tables.

# License
    This project is unlicensed.

# Acknowledgements
    Built with assistance from YouTube, StackOverflow...
    Inspired by practical inventory management needs.

## Updates: 27 February 2025

Today, I enhanced the Inventory Management System with user authentication and registration features to secure access and provide role-based dashboards.

### Key Changes
- **User Authentication:** Implemented JSON Web Tokens (JWT) for secure login, requiring users to authenticate before accessing the system.
- **Registration Endpoint:** Added a `/api/register` endpoint to allow new users to sign up. Admins must provide company details (name, address, contact) during registration, stored in a new `companies` table linked to `users`.
- **Role-Based Access:** Admins are redirected to their dashboard (`admin.html`), displaying company details, while regular users see a placeholder (`user.html`).
- **Environment Variables:** Moved the `SECRET_KEY` for JWT to a `.env` file using `dotenv` for improved security.
- **Database Fix:** Updated `db.js` to correctly return `lastID` for SQLite `INSERT` operations, fixing a registration bug.

### Setup Notes
- Install new dependencies: `npm install`.
- Create a `.env` file with `SECRET_KEY=your-secure-key-here` (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

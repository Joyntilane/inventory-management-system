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

## Updates: February 28, 2025

Today, I tweaked the admin side of the Inventory Management System to ensure each admin only sees their own inventories.

### Key Changes
- **Company-Specific Inventories:** 
  - // CHANGE: Added `company_id` column to the `products` table to link products to an admin’s company, ensuring isolation.
- **Filtered Data:** 
  - // CHANGE: Updated `inventory.js` and `inventoryRoutes.js` to filter products and transactions by the logged-in admin’s `company_id`, restricting visibility.
- **Database Schema:** 
  - // CHANGE: Modified `schema.js` to include `company_id` in `products` with a default of 1 for existing data, maintaining compatibility.

### Setup Notes
- // CHANGE: New admins create their own companies via registration.
- Test with multiple admin accounts to verify isolation.

## Updates: 1 March 2025

Today, I focused on front-end improvements, security, UX, and code quality.

### Key Changes
- **Single Access Page:** 
  - // CHANGE: Merged login/registration into `login.html` with toggle buttons.
- **Dark-Light Mode:** 
  - // CHANGE: Implemented toggleable themes across all pages with CSS variables and `localStorage`.
- **Responsiveness:** 
  - // CHANGE: Updated `style.css` with mobile-first design, fluid layouts, and media queries.
- **UX Enhancements:** 
  - // CHANGE: Added logout button to `admin.html`, loading state to `login.html`, extracted JS to `login.js`, and inline form validation feedback.
- **Security Enhancements:** 
  - // CHANGE: Added password strength validation (8+ chars, letters, numbers, symbols) in `user.js`.
  - // CHANGE: Implemented rate limiting on `/api/login` (5 attempts/15 min) with `express-rate-limit`.
- **Code Quality:** 
  - // CHANGE: Extracted inline JS from `admin.html` to `admin-inline.js`.
- **UI Trends:** 
  - // CHANGE: Applied glassmorphism, microinteractions, and responsive design.

### Setup Notes
- // CHANGE: Install dependencies: `npm install`.Run `npm run dev` and access at `http://localhost:3000`. Test responsiveness, authentication, and code style.

## Updates: 6 March 2025

### Key Changes
- **User Dashboard:** 
  - // CHANGE: Created `user.html` and `user.js` to display all products added by admins, showing price, name, and a short description in a responsive grid layout.
  - // CHANGE: Added `/api/user/all-products` endpoint in `inventoryRoutes.js` and `getAllProductsForUsers` method in `inventory.js` to fetch products for users.
  - // CHANGE: Updated `style.css` to include product card styling and responsive grid for the user dashboard.

## Testing
- Run `npm run dev`.

- Log in as a user.

- Navigate to `user.html` and verify:

    >Products are fetched and displayed in the .products-grid.

- Add products via `admin.html` and confirm they appear on the user dashboard.
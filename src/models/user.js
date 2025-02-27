const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'Fallback key'; // Fallback key

class User {
    constructor(db) {
        this.db = db;
    }

    async createUser(username, password, role = 'user', companyDetails = null) {
        const hashedPassword = await bcrypt.hash(password, 10);
        let companyId = null;

        if (role === 'admin' && companyDetails) {
            const { name, address, contact } = companyDetails;
            const result = await this.db.run(
                `INSERT INTO companies (name, address, contact) VALUES (?, ?, ?)`,
                [name, address, contact]
            );
            companyId = result.lastID;
        }

        await this.db.run(
            `INSERT INTO users (username, password, role, company_id) VALUES (?, ?, ?, ?)`,
            [username, hashedPassword, role, companyId]
        );
    }

    async findUser(username) {
        return await this.db.get(
            `SELECT u.*, c.name AS company_name, c.address AS company_address, c.contact AS company_contact
             FROM users u
             LEFT JOIN companies c ON u.company_id = c.id
             WHERE u.username = ?`,
            [username]
        );
    }

    async authenticate(username, password) {
        const user = await this.findUser(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new Error('Invalid credentials');
        }
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, companyId: user.company_id },
            SECRET_KEY,
            { expiresIn: '1h' }
        );
        return { token, role: user.role, company: { name: user.company_name, address: user.company_address, contact: user.company_contact } };
    }
}

module.exports = User;
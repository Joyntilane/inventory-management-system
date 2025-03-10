const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'fallback-secret-key';

class User {
    constructor(db) {
        this.db = db;
    }

    async createUser(username, password, role, companyDetails = null) {
        const hashedPassword = await bcrypt.hash(password, 10);
        let companyId = null;

        if (role === 'admin') {
            const companyStmt = this.db.prepare(`
                INSERT INTO companies (name, address, contact) VALUES (?, ?, ?)
            `);
            const companyInfo = companyStmt.run(companyDetails.name, companyDetails.address || '', companyDetails.contact || '');
            companyId = companyInfo.lastInsertRowid;
        }

        const userStmt = this.db.prepare(`
            INSERT INTO users (username, password, role, companyId) VALUES (?, ?, ?, ?)
        `);
        userStmt.run(username, hashedPassword, role, companyId);
    }

    async authenticate(username, password) {
        const user = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) throw new Error('User not found');

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) throw new Error('Invalid password');

        const company = user.companyId
            ? this.db.prepare('SELECT * FROM companies WHERE id = ?').get(user.companyId)
            : null;

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, companyId: user.companyId }, SECRET_KEY, { expiresIn: '1h' });
        return { token, role: user.role, company };
    }
}

module.exports = User;
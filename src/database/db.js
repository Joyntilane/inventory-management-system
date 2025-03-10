const SqliteDatabase = require('better-sqlite3');

class Database {
    constructor() {
        this.db = new SqliteDatabase('inventory.db', { verbose: console.log });
    }

    prepare(sql) {
        return this.db.prepare(sql);
    }

    run(sql, params = []) {
        const stmt = this.db.prepare(sql);
        return stmt.run(params);
    }

    get(sql, params = []) {
        const stmt = this.db.prepare(sql);
        return stmt.get(params);
    }

    all(sql, params = []) {
        const stmt = this.db.prepare(sql);
        return stmt.all(params);
    }
}

module.exports = Database;
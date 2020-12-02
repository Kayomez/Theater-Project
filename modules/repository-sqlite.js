import sqlite from 'sqlite-async'
import fs from 'fs'

export class User {
	constructor(userID, userName, email, cryptoPass) {
		this.userID = userID
		this.userName = userName
		this.email = email
		this.cryptoPass = cryptoPass
	}

	static new(userName, email, cryptoPass) {
		return new User(-1, userName, email, cryptoPass)
	}
}

export class SQLiteRepo {
	static async open(dbName = ':memory:') {
		const repo = new SQLiteRepo()
		await repo.init(dbName)
		return repo
	}

	async init(dbName = ':memory:') {
		this.db = await sqlite.open(dbName)
		const sql = fs.readFileSync('./sql/init_db.sql', 'utf8')
		await this.db.run(sql)
	}

	async getUserByName(userName) {
		return this.db.get(
			'SELECT userID, userName, email, cryptoPass FROM users WHERE userName = ?;', userName
		).then(
			(row) =>
				row && new User(row.userID, row.userName, row.email, row.cryptoPass)
		)
	}

	async insertNewUser(user) {
		return this.db.run(
			'INSERT INTO users(userName, email, cryptoPass) VALUES ($userName, $email, $cryptoPass);',
			{
				$userName: user.userName,
				$email: user.email,
				$cryptoPass: user.cryptoPass
			}
		)
	}

	close() {
		this.db.close()
	}
}

import sqlite from 'sqlite-async'
import fs from 'fs'

export const errors = {
	USERNAME_EXISTS: 'username already exists',
	EMAIL_EXISTS: 'email already in use',
	UNKNOWN_ERROR: 'an unknown error occurred, try again',
}

function getErrString(err) {
	if (err.message.includes('email')) {
		return errors.EMAIL_EXISTS
	} else if (err.message.includes('userName')) {
		return errors.USERNAME_EXISTS
	} else {
		console.log(err.message)
		return errors.UNKNOWN_ERROR
	}
}

export class User {
	constructor(userName, email, cryptoPass) {
		this.userName = userName
		this.email = email
		this.cryptoPass = cryptoPass
	}
}

export class SQLiteRepo {

	constructor(dbName = ':memory:') {
		if (dbName !== ':memory:') { // don't share in-memory databases for testing purposes
			if (SQLiteRepo.instances[dbName] !== undefined) { // instance already exists, increment users and return
				SQLiteRepo.instances[dbName].count += 1
				return SQLiteRepo.instances[dbName].instance
			}
			SQLiteRepo.instances[dbName] = { // new database, store instance
				count: 1,
				instance: this,
			}
		}

		this.name = dbName
		// store db as promise, removes convoluted async constructor but requires await or promise methods to use db.
		this.db = sqlite.open(dbName)
			.then(async db => { // run setup script then return the db, guarantees db is initialised before use
				const sql = fs.readFileSync('./sql/init_db.sql', 'utf8')
				await db.run(sql)
				return db
			})

		return this
	}

	/** close the database handle */
	close() {
		if (SQLiteRepo.instances[this.name] !== undefined) { // if instance shared de-increment users
			SQLiteRepo.instances[this.name].count -= 1
			if (SQLiteRepo.instances[this.name].count <= 0) { // no remaining users so can safely close
				this.db.then(db => db.close())
				this.db = undefined
				SQLiteRepo.instances[this.name] = undefined // remove from sharable instances
			}
		} else { // not shared so can safely close
			this.db.then(db => db.close())
			this.db = undefined
		}
	}

	// ===================================================USER TABLE===================================================

	/**
	 * Get a user from the database based on their username
	 * @param userName {string} the name to search for
	 * @returns {Promise<undefined | User>} a promise that resolves with the user, or undefined if the user is not found
	 */
	async getUserByName(userName) {
		const db = await this.db
		const row = await db.get('SELECT userName, email, cryptoPass FROM users WHERE userName = ?;', userName)
		return row === undefined ? undefined : new User(row.userName, row.email, row.cryptoPass)
	}

	/**
	 * Get a user from the database by their email
	 * @param email {string} the email to search for
	 * @returns {Promise<undefined | User>} a promise that resolves with the user, or undefined if the user is not found
	 */
	async getUserByEmail(email) {
		const db = await this.db
		const row = await db.get('SELECT userName, email, cryptoPass FROM users WHERE email = ?;', email)
		return row === undefined ? row : new User(row.userName, row.email, row.cryptoPass)
	}

	/**
	 * Adds a new user to the database.
	 * @param user {User} the user to add
	 * @returns {Promise<undefined | string>} A promise that resolves as undefined if the user was added successfully or
	 * as an error message if something went wrong.
	 */
	async insertNewUser(user) {
		const db = await this.db
		try {
			await db.run(
				'INSERT INTO users(userName, email, cryptoPass) VALUES ($userName, $email, $cryptoPass);',
				{
					$userName: user.userName,
					$email: user.email,
					$cryptoPass: user.cryptoPass,
				},
			)
		} catch (err) {
			return getErrString(err)
		}
	}

	/**
	 * Change the email address associated with the user
	 * @param userName {string} username for the entry bring modified
	 * @param email {string} the new email address
	 * @returns {Promise<undefined | string>} a promise that resolves as undefined if successful or an error message if
	 * something went wrong
	 */
	async updateUserEmail(userName, email) {
		const db = await this.db
		try {
			await db.run(
				'UPDATE users SET email = $email WHERE userName = $userName;',
				{
					$userName: userName,
					$email: email,
				},
			)
		} catch (err) {
			return getErrString(err)
		}
	}

	/**
	 * Change the password for the user
	 * @param userName {string} username for the entry being modified
	 * @param cryptoPass {string} the bcrypt hash of the password
	 * @returns {Promise<undefined | string>} a promise that resolves as undefined if successful or an error message if
	 * something went wrong
	 */
	async updateUserPass(userName, cryptoPass) {
		const db = await this.db
		try {
			db.run('UPDATE users SET cryptoPass = $cryptoPass WHERE userName = $userName;',
				{
					$userName: userName,
					$cryptoPass: cryptoPass,
				},
			)
		} catch (err) {
			return getErrString(err)
		}
	}

}

SQLiteRepo.instances = {}

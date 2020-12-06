import sqlite from 'sqlite-async'
import fs from 'fs'

export const errors = {
	USERNAME_EXISTS: 'username already exists',
	EMAIL_EXISTS: 'email already in use',
	UNKNOWN_ERROR: 'an unknown error occurred, try again'
}

export class User {
	constructor(userName, email, cryptoPass) {
		this.userName = userName
		this.email = email
		this.cryptoPass = cryptoPass
	}
}

export class SQLiteRepo {
	/**
	 * Create a new repo instance containing the passed database
	 * @param dbName {string} the path to the database being opened
	 * @returns {Promise<SQLiteRepo>} a promise resolving as the opened and initialised database.
	 */
	static async open(dbName = ':memory:') {
		const repo = new SQLiteRepo()
		await repo.init(dbName)
		return repo
	}

	/**
	 * open and initialise the passed database. will close the currently open database (if any)
	 * @param dbName {string} the name of the database to open
	 * @returns {Promise<void>}
	 */
	async init(dbName = ':memory:') {
		if (this.db !== undefined) {
			this.close()
		}
		this.db = await sqlite.open(dbName)
		const sql = fs.readFileSync('./sql/init_db.sql', 'utf8')
		await this.db.run(sql)
	}

	/**
	 * Get a user from the database based on their username
	 * @param userName {string} the name to search for
	 * @returns {Promise<undefined | User>} a promise that resolves with the user, or undefined if the user is not found
	 */
	getUserByName(userName) {
		return this.db.get('SELECT userName, email, cryptoPass FROM users WHERE userName = ?;', userName)
			.then((row) => row && new User(row.userName, row.email, row.cryptoPass))
	}

	/**
	 * Get a user from the database by their email
	 * @param email {string} the email to search for
	 * @returns {Promise<undefined | User>} a promise that resolves with the user, or undefined if the user is not found
	 */
	getUserByEmail(email) {
		return this.db.get('SELECT userName, email, cryptoPass FROM users WHERE email = ?;', email)
			.then((row) => row && new User(row.userName, row.email, row.cryptoPass))
	}

	/**
	 * Adds a new user to the database.
	 * @param user {User} the user to add
	 * @returns {Promise<undefined | string>} A promise that resolves as undefined if the user was added successfully or
	 * as an error message if something went wrong.
	 */
	insertNewUser(user) {
		return this.db.run(
			'INSERT INTO users(userName, email, cryptoPass) VALUES ($userName, $email, $cryptoPass);',
			{$userName: user.userName, $email: user.email, $cryptoPass: user.cryptoPass}
		)
			.then(() => undefined)
			.catch(err => {
				if (err.message.includes('email')) {
					return errors.EMAIL_EXISTS
				} else if (err.message.includes('userName')) {
					return errors.USERNAME_EXISTS
				} else {
					console.log(`ERROR CREATING NEW USER: ${err.message}\n`)
					return errors.UNKNOWN_ERROR
				}
			})
	}

	/**
	 * Change the email address associated with the user
	 * @param userName {string} username for the entry bring modified
	 * @param email {string} the new email address
	 * @returns {Promise<undefined | string>} a promise that resolves as undefined if successful or an error message if
	 * something went wrong
	 */
	updateUserEmail(userName, email) {
		return this.db.run(
			'UPDATE users SET email = $email WHERE userName = $userName;',
			{$userName: userName, $email: email}
		)
			.then(() => undefined)
			.catch(err => {
				if (err.message.includes('email')) {
					return errors.EMAIL_EXISTS
				} else {
					console.log(`ERROR CHANGING USER EMAIL: ${err.message}\n`)
					return errors.UNKNOWN_ERROR
				}
			})
	}

	/**
	 * Change the password for the user
	 * @param userName {string} username for the entry being modified
	 * @param cryptoPass {string} the bcrypt hash of the password
	 * @returns {Promise<undefined | string>} a promise that resolves as undefined if successful or an error message if
	 * something went wrong
	 */
	updateUserPass(userName, cryptoPass) {
		return this.db.run(
			'UPDATE users SET cryptoPass = $cryptoPass WHERE userName = $userName;',
			{
				$userName: userName,
				$cryptoPass: cryptoPass
			}
		)
			.then(() => undefined)
			.catch(err => {
				console.log(`ERROR CHANGING USER PASSWORD: ${err.message}\n`)
				return errors.UNKNOWN_ERROR
			})
	}

	/** close the database handle */
	close() {
		this.db.close()
		this.db = undefined
	}
}

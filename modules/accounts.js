/** @module Accounts */

import bcrypt from 'bcrypt-promise'
import {SQLiteRepo, User} from './repository-sqlite.js'

const SALT_ROUNDS = 10

/**
 * Accounts
 * ES6 module that handles registering accounts and logging in.
 */
export class Accounts {
	/**
	 * Create an account object
	 * @param {String} [dbName=":memory:"] - The name of the database file to use.
	 */
	constructor(dbName = ':memory:') {
		this.repo = new SQLiteRepo(dbName)
		return this
	}

	/**
	 * registers a new user
	 * @param {String} username the chosen username
	 * @param {String} pass the chosen password
	 * @param {String} email the chosen email
	 * @returns {Boolean} returns true if the new user has been added
	 */
	async register(username, pass, email) {
		Array.from(arguments).forEach(val => {
			if (val.length === 0) {
				throw new Error('missing field')
			}
		})
		pass = await bcrypt.hash(pass, SALT_ROUNDS)
		const message = await this.repo.insertNewUser(new User(username, email, pass))
		if (message !== undefined) {
			throw new Error(message)
		}
		return true
	}

	/**
	 * checks to see if a set of login credentials are valid
	 * @param {String} username the username to check
	 * @param {String} password the password to check
	 * @returns {Boolean} returns true if credentials are valid
	 */
	async login(username, password) {
		const user = await this.repo.getUserByName(username)
		if (user === undefined) {
			throw new Error(`username "${username}" not found`)
		}
		const valid = await bcrypt.compare(password, user.cryptoPass)
		if (!valid) {
			throw new Error(`invalid password for account "${username}"`)
		}
		return true
	}

	close() {
		this.repo.close()
	}
}

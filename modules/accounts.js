/** @module Accounts */

import bcrypt from 'bcrypt-promise'
import sqlite from 'sqlite-async'

const saltRounds = 10

/**
 * Accounts
 * ES6 module that handles registering accounts and logging in.
 */
class Accounts {
	/**
	 * Create an account object
	 * @param {String} [dbName=":memory:"] - The name of the database file to use.
	 */
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = 'CREATE TABLE IF NOT EXISTS users\
				(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, pass TEXT, email TEXT);'
			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * registers a new user
	 * @param {String} user the chosen username
	 * @param {String} pass the chosen password
	 * @param {String} email the chosen email
	 * @returns {Boolean} returns true if the new user has been added
	 */
	async register(user, pass, email) {
		Array.from(arguments).forEach(val => {
			if (val.length === 0) {
				throw new Error('missing field')
			}
		})
		const data = await this.db.get('SELECT count(*) as count FROM users WHERE user = ?;', user)
		if (data.count !== 0) {
			throw new Error(`username "${user}" already in use`)
		}
		const emails = await this.db.get('SELECT count(*) as count FROM users WHERE email = ?;', email)
		if (emails.count !== 0) {
			throw new Error(`email address "${email}" is already in use`)
		}
		pass = await bcrypt.hash(pass, saltRounds)
		await this.db.run('INSERT INTO users(user, pass, email) VALUES(?, ?, ?);', user, pass, email)
		return true
	}

	/**
	 * checks to see if a set of login credentials are valid
	 * @param {String} user the username to check
	 * @param {String} password the password to check
	 * @returns {Boolean} returns true if credentials are valid
	 */
	async login(user, password) {
		const records = await this.db.get('SELECT count(*) AS count FROM users WHERE user = ?;', user)
		if (!records.count) {
			throw new Error(`username "${user}" not found`)
		}
		const record = await this.db.get('SELECT pass FROM users WHERE user = ?;', user)
		const valid = await bcrypt.compare(password, record.pass)
		if (valid === false) {
			throw new Error(`invalid password for account "${user}"`)
		}
		return true
	}

	async close() {
		await this.db.close()
	}
}

export default Accounts

import test from 'ava'
import {SQLiteRepo, User, errors} from '../modules/repository-sqlite.js'

test('DATABASE: User returned if username exists', async test => {
	test.plan(2)
	const rp = await SQLiteRepo.open()
	const userIn = new User('user1', 'email1@example.com', '0123456789')
	try {
		const message = await rp.insertNewUser(userIn)
		test.is(message, undefined, 'an error message was returned')
		const userOut = await rp.getUserByName(userIn.userName)
		test.deepEqual(userOut, userIn, 'users do not match')
	} catch (e) {
		console.log(e)
		test.fail('an error was thrown')
	} finally {
		rp.close()
	}
})

test('DATABASE: undefined returned if username does not exist', async test => {
	test.plan(2)

	const rp = await SQLiteRepo.open()
	const userIn = new User('user1', 'email1@example.com', '0123456789')
	try {
		const message = await rp.insertNewUser(userIn)
		test.is(message, undefined, 'an error message was returned')
		const userOut = await rp.getUserByName('unknown')
		test.is(userOut, undefined, 'user is not undefined')
	} catch (e) {
		console.log(e)
		test.fail('an error was thrown')
	} finally {
		rp.close()
	}
})

test('DATABASE: message returned if duplicate username', async test => {
	test.plan(2)

	const rp = await SQLiteRepo.open()
	const user1 = new User('user1', 'email1@example.com', '0123456789')
	let message = await rp.insertNewUser(user1)
	test.is(message, undefined, 'an error message was returned')
	const user2 = new User(user1.userName, 'email2@example.com', '0123456789')
	message = await rp.insertNewUser(user2)
	test.is(message, errors.USERNAME_EXISTS, 'messages did not match')
	rp.close()
})

test('DATABASE: user returned if email exists', async test => {
	test.plan(2)
	const rp = await SQLiteRepo.open()
	const userIn = new User('user1', 'email1@example.com', '0123456789')
	try {
		const message = await rp.insertNewUser(userIn)
		test.is(message, undefined, 'an error message was returned')
		const userOut = await rp.getUserByEmail(userIn.email)
		test.deepEqual(userOut, userIn, 'users do not match')
	} catch (e) {
		console.log(e)
		test.fail('an error was thrown')
	} finally {
		rp.close()
	}
})

test('DATABASE: undefined returned if email does not exist', async test => {
	test.plan(2)

	const rp = await SQLiteRepo.open()
	const userIn = new User('user1', 'email1@example.com', '0123456789')
	try {
		const message = await rp.insertNewUser(userIn)
		test.is(message, undefined, 'an error message was returned')
		const userOut = await rp.getUserByEmail('unknown')
		test.is(userOut, undefined, 'user is not undefined')
	} catch (e) {
		console.log(e)
		test.fail('an error was thrown')
	} finally {
		rp.close()
	}
})

test('DATABASE: message returned if duplicate email', async test => {
	test.plan(2)

	const rp = await SQLiteRepo.open()
	const user1 = new User('user1', 'email1@example.com', '0123456789')
	let message = await rp.insertNewUser(user1)
	test.is(message, undefined, 'an error message was returned')
	const user2 = new User('user2', user1.email, '0123456789')
	message = await rp.insertNewUser(user2)
	test.is(message, errors.EMAIL_EXISTS, 'error message does not match')
	rp.close()
})

test('DATABASE: message returned if changed to duplicate email', async test => {
	test.plan(3)

	const rp = await SQLiteRepo.open()
	const user1 = new User('user1', 'email1@example.com', '0123456789')
	let message = await rp.insertNewUser(user1)
	test.is(message, undefined, 'an error message was returned')
	const user2 = new User('user2', 'email2@example.com', '0123456789')
	message = await rp.insertNewUser(user2)
	test.is(message, undefined, 'an error message was returned')
	message = await rp.updateUserEmail(user2.userName, user1.email)
	test.is(message, errors.EMAIL_EXISTS, 'error message does not match')
	rp.close()
})

test('DATABASE: password changes properly', async test => {
	test.plan(3)

	const rp = await SQLiteRepo.open()
	const user = new User('user1', 'email1@example.com', '0123456789')
	let message = await rp.insertNewUser(user)
	test.is(message, undefined, 'an error message was returned')
	const pass2 = 'qwerty'
	message = await rp.updateUserPass(user.userName, pass2)
	test.is(message, undefined, 'an error message was returned')
	const userOut = await rp.getUserByName(user.userName)
	test.deepEqual(userOut.cryptoPass, pass2, 'users do not match')
	rp.close()
})

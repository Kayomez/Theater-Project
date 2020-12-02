import test from 'ava'
import {SQLiteRepo, User} from '../modules/repository-sqlite.js'

test('DATABASE : User returned by get user', async test => {
	test.plan(3)
	const rp = await SQLiteRepo.open()
	const userName = 'jsmith'
	const email = 'jsmith@gmail.com'
	const cryptoPass = '0123456789'
	try {
		await rp.insertNewUser(User.new(userName, email, cryptoPass))
		const user = await rp.getUserByName(userName)
		test.is(user.userName, userName, 'incorrect userName')
		test.is(user.email, email, 'incorrect email')
		test.is(user.cryptoPass, cryptoPass, 'incorrect cryptoPass')
	} catch (e) {
		console.log(e.message)
		console.log(e.stackTrace)
		test.fail('an error was thrown')
	} finally {
		rp.close()
	}
})

var jwt = require('jsonwebtoken');
const SECRET_KEY = 'secret';
const { asynQuery } = require('../helper/helper');
const bcrypt = require('bcrypt');
const saltRounds = 7;

class AppsController {
    static async userRegistration(req, res, next) {
        let { email, password, first_name, last_name } = req.body;
        // VALIDATION
        if (!validE(email)) return res.status(400).send(resTemplate(102,"Parameter email tidak sesuai dengan format", null));
        if (password.length < 8) return res.status(400).send(resTemplate(102,"Parameter password tidak sesuai dengan format", null));
        let findUser = await asynQuery(`SELECT * from users where email = '${email}'`);
        if (findUser.length > 0) return res.status(400).send(resTemplate(103,"Email sudah digunakan/diregistrasi", null));

        let hashedPassword = await bcrypt.hash(password, saltRounds);
        // Insert to DB
        await asynQuery(`INSERT INTO users (email, first_name, last_name, password)
        VALUES ('${email}', '${first_name}', '${last_name}', '${hashedPassword}')`)
        res.status(200).send(resTemplate(0, "Registrasi berhasil silahkan login", null));
    }

    static async userLogin(req, res, next) {
        let { email, password } = req.body;
        if (!validE(email)) return res.status(400).send(resTemplate(102,"Parameter email tidak sesuai dengan format", null));
        if (password.length < 8) return res.status(400).send(resTemplate(102,"Parameter password tidak sesuai dengan format", null));

        let user = await asynQuery(`SELECT * FROM users WHERE email = '${email}' LIMIT 1`);
        let hashCompare
        if (user.length > 0) hashCompare = await bcrypt.compare(password, user[0].password)
        if (hashCompare) {
            var token = jwt.sign({
                data: { email: user[0].email }
                }, SECRET_KEY, { expiresIn: '12h' }
            );
        } else return res.status(401).send(resTemplate(103,"Username atau password salah", null));

        res.status(200).send(resTemplate(0, "Login Sukses", { token: token }));

    }

    static async userProfile(req, res, next) {
        let user =  await authorizationCheck(req, res);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        let findUser = await asynQuery(`SELECT * from users where email = '${user.data.email}'`);
        res.status(200).send(resTemplate(0, "Sukses", findUser[0]));
    }

    static async userUpdate(req, res, next) {
        let { first_name, last_name } = req.body;
        let user =  await authorizationCheck(req, res);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        let findUser = await asynQuery(`SELECT * from users where email = '${user.data.email}'`);
        await asynQuery(`UPDATE users
        SET first_name = '${first_name}', last_name = '${last_name}' 
        WHERE email = '${findUser[0].email}';`);
        let findUpdated = await asynQuery(`SELECT email,first_name,last_name,profile_image from users where id = '${findUser[0].id}'`);
        res.status(200).send(resTemplate(0, "Update Pofile berhasil", findUpdated[0]));
    }

    static async userUpdateImage(req, res, next) {
        let image = req.file ? req.file.path : null;
        let convertedImage = ``;
        let user =  await authorizationCheck(req, res);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        // UPDATE WITH RETURN VALUE
        if (image) {
            for (let index = 0; index < image.length; index++) {
                const char = image[index];
                if (char == `\\`) convertedImage += `\\\\\\`
                else convertedImage += char
            }
        }
        await asynQuery(`UPDATE users SET profile_image = '${convertedImage}' WHERE email = '${findUser[0].email}';`);
        let findUpdated = await asynQuery(`SELECT email,first_name,last_name,profile_image from users where id = '${findUser[0].id}'`);
        res.status(200).send(resTemplate(0, "Update Pofile Image berhasil", findUpdated[0]));
    }

    static async infoBanner(req, res, next) {
        let user =  await authorizationCheck(req, res);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        let banners = await asynQuery(`SELECT * from banner`);
        // GET FROM DB
        res.status(200).send(resTemplate(0, "Sukses", banners));
    }

    static async infoService(req, res, next) {
        let user =  await authorizationCheck(req, res);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        let services = await asynQuery(`SELECT service_code,service_name,service_icon,service_tariff from services`);
        // GET FROM DB
        res.status(200).send(resTemplate(0, "Sukses", services));
    }

    static async transactionBalance(req, res, next) {
        let user =  await authorizationCheck(req, res);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        // GET FROM DB
        let findUser = await asynQuery(`SELECT * from users where email = '${user.data.email}'`);
        let services = await asynQuery(`${queryTotal(findUser[0].id)}`);
        if (services.length > 0) services = { balance: services[0].balance }
        res.status(200).send(resTemplate(0, "Get Balance Berhasil", services));
    }

    static async transactionTopup(req, res, next) {
        let { top_up_amount } = req.body;
        let user =  await authorizationCheck(req, res);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        if (!+top_up_amount || +top_up_amount < 0) return res.status(400).send(resTemplate(102,"Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0", null));
        let findUser = await asynQuery(`SELECT * from users where email = '${user.data.email}'`);
        await asynQuery(`INSERT INTO transaction (balance,transaction_type,user_id)
        VALUES (${top_up_amount}, 'TOPUP',${findUser[0].id});`)
        let services = await asynQuery(`${queryTotal(findUser[0].id)}`);
        if (services.length > 0) services = { balance: services[0].balance }
        res.status(200).send(resTemplate(0, "Top Up Balance berhasil", services));
    }

    static async transactionInsert(req, res, next) {
        let { service_code } = req.body;
        let user =  await authorizationCheck(req, res);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        let findUser = await asynQuery(`SELECT * from users where email = '${user.data.email}'`);
        let service = await asynQuery(`SELECT * FROM services where service_code = '${service_code}'`);
        if (service.length == 0) return res.status(400).send(resTemplate(102,"Service ataus Layanan tidak ditemukan", null));

        let transaction = await asynQuery(`${queryTotal(findUser[0].id)}`); // TOTAL
        let userBalance = transaction[0].balance;
        if (service[0].service_tariff > userBalance) return res.status(400).send(resTemplate(110,"Saldo tidak cukup", null));
        let balanceAfter = userBalance - service[0].service_tariff;
        await asynQuery(`INSERT INTO transaction (balance,transaction_type,user_id, invoice_number )
            VALUES (${balanceAfter}, 'PAYMENT',${findUser[0].id}, '${balanceAfter}-JKT');`);

        let transactionAfter = await asynQuery(`${queryTotal(findUser[0].id)}`);
        res.status(200).send(resTemplate(0, "Transaksi berhasil", transactionAfter[0]));
    }

    static async transactionHistory(req, res, next) {
        let { offset,limit } = req.query;
        let adding = ''
        if (limit) adding += ` LIMIT ${limit} `
        if (offset) adding += ` OFFSET ${offset} `
        let user =  await authorizationCheck(req, res);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        let transactions = await asynQuery(`SELECT invoice_number,transaction_type,description,balance as total_amount,created_on FROM transaction ORDER BY created_on DESC ${adding};`)
        res.status(200).send(resTemplate(0, "Get History Berhasil", transactions));
    }
}

function validE(e) {
    const patt = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return patt.test(e);
}

function resTemplate(statusCode, msg, data) {
    return { status: statusCode, message: msg, data: data }
}

async function authorizationCheck(req, res) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return false
        var user = await jwt.verify(token, SECRET_KEY);
        if (!user) return false
        return user;
    } catch (error) {
        return false
    }
}

function queryTotal(id) {
    return `select ( (select sum(balance) as balance from nutech.transaction where user_id = ${id} and transaction_type = "TOPUP") - 
    (select sum(balance) as balance from nutech.transaction where user_id = ${id} and transaction_type = "PAYMENT")
    ) as balance;`
}

module.exports = AppsController;
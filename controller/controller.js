var jwt = require('jsonwebtoken');
const SECRET_KEY = 'secret';

class AppsController {
    static userRegistration(req, res, next) {
        let { email, password, first_name, last_name } = req.body;
        if (!validE(email)) return res.status(400).send(resTemplate(102,"Parameter email tidak sesuai dengan format", null));
        if (password.length < 8) return res.status(400).send(resTemplate(102,"Parameter password tidak sesuai dengan format", null));
        // Insert to DB
        res.status(200).send(resTemplate(0, "Registrasi berhasil silahkan login", null));
    }

    static userLogin(req, res, next) {
        let { email, password } = req.body;
        var token = jwt.sign({
            data: { email }
          }, SECRET_KEY, { expiresIn: '12h' }
        );

        if (!validE(email)) return res.status(400).send(resTemplate(102,"Parameter email tidak sesuai dengan format", null));
        if (password.length < 8) return res.status(400).send(resTemplate(102,"Parameter password tidak sesuai dengan format", null));

        res.status(200).send(resTemplate(0, "Login Sukses", {
            token: token
        }));

    }

    static async userProfile(req, res, next) {
        let decoded =  await authorizationCheck(req, res);
        var user = await jwt.verify(decoded.token, SECRET_KEY);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        // Get user from DB where email
        res.status(200).send(resTemplate(0, "Sukses", {
            email: user.data.email,
            first_name: '',
            last_name: '',
            profile_image: ''
        }));
    }

    static async userUpdate(req, res, next) {
        let decoded =  await authorizationCheck(req, res);
        var user = await jwt.verify(decoded.token, SECRET_KEY);
        if (!user) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
        
    }

    static userUpdateImage(req, res, next) {
        
    }

    static infoBanner(req, res, next) {
        
    }

    static infoService(req, res, next) {
        
    }

    static transactionBalance(req, res, next) {
        
    }

    static transactionTopup(req, res, next) {
        
    }

    static transactionInsert(req, res, next) {
        
    }

    static transactionHistory(req, res, next) {
        
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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
    var decoded = await jwt.verify(token, SECRET_KEY);
    if (!decoded) return res.status(401).send(resTemplate(108,"Token tidak tidak valid atau kadaluwarsa", null));
    return decoded;
}

module.exports = AppsController;
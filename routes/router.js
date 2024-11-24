const router = require('express').Router();
const appController = require('../controller/controller');
const { uploadFile } = require('../helper/helper');

// Membership
router.post('/register', appController.userRegistration);
router.post('/login', appController.userLogin);
router.get('/profile', appController.userProfile);
router.put('/profile/update', appController.userUpdate);
router.put('/profile/image', uploadFile().single("file"), appController.userUpdateImage);

// Information
router.get('/banner', appController.infoBanner);
router.get('/services', appController.infoService);
// Transaction
router.get('/balance', appController.transactionBalance);
router.post('/topup', appController.transactionTopup);
router.post('/transaction', appController.transactionInsert);
router.get('/transaction/history', appController.transactionHistory);

module.exports = router;
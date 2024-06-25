const router = require('express').Router();
const makeRequest = require('../../../utils/axios-request');


router.get('/', async function (req, res, next) {
        const result = await makeRequest('{"f":"airports"}')

        try {
            return res.send(result.data)

        } catch (err) {
            next(createError(500, err.message || 'Internal Server Error'));
        }


})

module.exports = router;
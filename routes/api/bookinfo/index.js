const makeRequest = require('../../../utils/axios-request');

const router = require('express').Router();

router.get('/:id', async (req,res, next) => {

    const bookCingode = req.params.id;

    const requestData = {
        f: "bookInfo",
        bookingCode
    }
    try {
        const response = makeRequest(JSON.stringify(requestData));
        
        return res.send(response.data);
    } catch (err) {
        next(err);
    }
})

module.exports = router;
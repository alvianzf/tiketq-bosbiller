Sure, here are a few improvements and fixes for your code:

1. Ensure `makeRequest` returns a promise since it's an async operation.
2. Await the `makeRequest` call to handle the async operation correctly.
3. Return the response correctly using `res.json` instead of `res.send` for sending JSON data.

Here's the fixed code:

```javascript
const makeRequest = require('../../../utils/axios-request');
const router = require('express').Router();

router.post('/', async (req, res, next) => {
    let requestData = req.body;
    requestData.f = "book";

    try {
        const result = await makeRequest(JSON.stringify(requestData));
        return res.json(result.data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
```

This should correctly handle the async request and response processing.
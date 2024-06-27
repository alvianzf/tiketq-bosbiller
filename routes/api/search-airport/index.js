const airportList = require('./airportList');
const router = require('express').Router();

router.get('/:query', (req, res, next) => {
    try {
        const query = req.params.query;
        const result = searchAirports(query);
        return res.json({ data: result });
    } catch (err) {
        next(err);
    }
});

function searchAirports(query) {
    if (!query) return [];

    const airports = airportList;
    const lowerCaseQuery = query.toLowerCase();

    return airports.filter(airport =>
        airport.code.toLowerCase().includes(lowerCaseQuery) ||
        airport.name.toLowerCase().includes(lowerCaseQuery)
    );
}

module.exports = router;

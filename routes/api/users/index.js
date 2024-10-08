const router = require('express').Router();
const UserDAO = require('../../../db/dao/UserDAO');

router.get('/', getAllUsers);
router.post('/register', registerUser);
router.get('/:username', getUserByUsername);
router.put('/:user_id', updateUser);
router.delete('/:id', deleteUser);

async function getAllUsers(req, res, next) {
    try {
        const users = await UserDAO.findAllUsers();
        return res.status(200).send(users);
    } catch (err) {
        return next(err);
    }
}

async function registerUser(req, res, next) {
    try {
        const { username, password } = req.body;
        await UserDAO.register(username, password, true);
        return res.status(201).send({ msg: "Added new user" });
    } catch (err) {
        return next(err);
    }
}

async function getUserByUsername(req, res, next) {
    try {
        const user = await UserDAO.findByUsername(req.params.username);
        if (!user) {
            return res.status(404).send({ msg: 'User not found' });
        }
        return res.status(200).send(user);
    } catch (err) {
        return next(err);
    }
}

async function updateUser(req, res, next) {
    try {
        const id = req.params.user_id;
        const { username, password } = req.body;
        const updated = await UserDAO.updateUser(id, { username, password });
        if (updated) {
            return res.status(200).send({ msg: 'Update successful' });
        } else {
            return res.status(404).send({ msg: 'User not found' });
        }
    } catch (err) {
        return next(err);
    }
}

async function deleteUser(req, res, next) {
    try {
        const id = req.params.id;
        const deleted = await UserDAO.deleteUser(id);
        if (deleted) {
            return res.status(200).send({ msg: 'Successfully deleted user' });
        } else {
            return res.status(404).send({ msg: 'User not found' });
        }
    } catch (err) {
        return next(err);
    }
}

module.exports = router;

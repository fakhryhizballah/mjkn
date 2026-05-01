const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers['x-token'];
    const username = req.headers['x-username'];

    if (!token || !username) {
        return res.status(401).json({
            metadata: { message: 'Token dan username diperlukan', code: 401 }
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.username !== username) {
            return res.status(401).json({
                metadata: { message: 'Token tidak valid', code: 201 }
            });
        }
        console.log(decoded);
        next();
    } catch (error) {
        return res.status(401).json({
            metadata: { message: 'Token tidak valid', code: 201 }
        });
    }
};

module.exports = authMiddleware;
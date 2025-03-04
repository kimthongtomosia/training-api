const User = require("../models/User");

module.exports = async function (req, res, next) {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ error: "Truy cap da bi tu choi. Vui long nhap ma Token de truy cap" });

    const userId = authHeader.split(" ")[1]; // Token là user ID
    if (!userId) return res.status(401).json({ error: "Invalid token format" });

    try {
        const user = await User.findById(userId); // Tìm user theo ID
        if (!user) return res.status(400).json({ error: "Invalid token" });

        req.user = user; // Gán thông tin user vào request
        next(); // Tiếp tục xử lý request
    } catch (err) {
        res.status(400).json({ error: "Invalid token" });
    }
};

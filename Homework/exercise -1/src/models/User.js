const mongoose = require("mongoose"); // Import mongoose để làm việc với MongoDB

// Định nghĩa schema cho User
const userSchema = new mongoose.Schema(
    {
        username: { 
            type: String, 
            required: true, // Bắt buộc phải có username
            unique: true,  // Đảm bảo username không trùng lặp
        },

        password: { 
            type: String, 
            required: true, // Bắt buộc phải có password
        },
        email: { 
            type: String, 
            required: true, 
            unique: true 
        }, // Thêm email vào schema

    },
    { timestamps: true } // Tự động thêm `createdAt` và `updatedAt`
);

// Xuất model User để sử dụng trong các file khác
module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose"); // Import mongoose để làm việc với MongoDB

// Định nghĩa schema cho Todo
const todoSchema = new mongoose.Schema(
    {
        title: { type: String, required: true }, // Tiêu đề của todo, bắt buộc phải có
        description: String, // Mô tả chi tiết (không bắt buộc)

        status: {
            type: String,
            enum: ["pending", "in_progress", "completed"], // Chỉ cho phép các giá trị này
            default: "pending", // Mặc định là "pending"
        },

        dueDate: Date, // Ngày đến hạn của todo

        createdBy: {
            type: mongoose.Schema.Types.ObjectId, // Liên kết với User (khóa ngoại)
            ref: "User", // Tham chiếu đến model User
        },
    },
    { timestamps: true } // Tự động thêm createdAt và updatedAt
);

// Xuất model Todo để sử dụng trong các file khác
module.exports = mongoose.model("Todo", todoSchema);

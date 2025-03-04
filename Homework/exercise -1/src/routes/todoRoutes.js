const express = require("express");
const { check, validationResult } = require("express-validator"); // Import express-validator để kiểm tra đầu vào
const Todo = require("../models/Todo"); // Import model Todo để thao tác với MongoDB
const authMiddleware = require("../middleware/authMiddleware"); // Middleware xác thực người dùng

const router = express.Router(); // Tạo một instance của Express Router

// Route tạo mới một todo
router.post("/", authMiddleware, // Middleware xác thực, đảm bảo người dùng đã đăng nhập
  [check("title").notEmpty().withMessage("Title is required"), // Kiểm tra đầu vào: title không được rỗng
  check("status").isIn(["pending", "in_progress", "completed"]).withMessage("Invalid status"),
  check("dueDate").isISO8601().withMessage("Invalid date format"),
  check("description").optional().isLength({ max: 255 }).withMessage("Description can be up to 255 characters") // Kiểm tra đầu vào
  ],

  async (req, res) => {
    const errors = validationResult(req); // Kiểm tra nếu có lỗi validation
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { title, description, status, dueDate } = req.body; // Lấy dữ liệu từ request body
    const newTodo = new Todo({
      title,
      description,
      status,
      dueDate,
      createdBy: req.user.id, // Gán người tạo là user đã đăng nhập (lấy từ authMiddleware)
    });

    await newTodo.save(); // Lưu vào database
    res.status(201).json(newTodo); // Trả về response với mã 201 (Created)
  }
);

// Route lấy danh sách todo của người dùng
router.get("/", authMiddleware, async (req, res) => {
    const { title, description, status, dueDate } = req.query; // Lấy query params để lọc

    let filter = { createdBy: req.user.id }; // Chỉ lấy các todo do user hiện tại tạo

    // Tìm kiếm theo title (không phân biệt hoa thường)
    if (title) filter.title = new RegExp(title, "i");

    // Tìm kiếm theo description (không phân biệt hoa thường)
    if (description) filter.description = new RegExp(description, "i");

    // Lọc theo status (chính xác)
    if (status) filter.status = status;

    // Lọc theo dueDate (ngày đến hạn, có thể tìm chính xác hoặc lớn hơn/nhỏ hơn một ngày nhất định)
    if (dueDate) {
        const dateFilter = new Date(dueDate);
        filter.dueDate = {
            $gte: new Date(dateFilter.setHours(0, 0, 0, 0)), // Lấy từ đầu ngày
            $lte: new Date(dateFilter.setHours(23, 59, 59, 999)), // Đến cuối ngày
        };
    }

    const todos = await Todo.find(filter); // Truy vấn MongoDB với các điều kiện lọc
    res.json(todos); // Trả về danh sách todo sau khi lọc
});


// Route cập nhật một todo theo ID
router.put("/:id", authMiddleware, async (req, res) => {
  const updatedTodo = await Todo.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id }, // Chỉ cho phép cập nhật nếu todo thuộc về user hiện tại
    req.body, // Dữ liệu mới được gửi từ request body
    { new: true } // Trả về object sau khi update thay vì object cũ
  );

  res.json(updatedTodo); // Trả về todo sau khi cập nhật
});

// Route xóa một todo theo ID
router.delete("/:id", authMiddleware, async (req, res) => {
  await Todo.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id }); // Chỉ xóa nếu todo thuộc về user hiện tại
  res.json({ message: "Xoa Todo thanh cong!" }); // Trả về thông báo thành công
});

module.exports = router; // Xuất router để sử dụng trong ứng dụng

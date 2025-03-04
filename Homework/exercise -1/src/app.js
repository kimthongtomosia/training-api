require("dotenv").config(); // Load biến môi trường từ file .env
const express = require("express"); // Import Express
const mongoose = require("mongoose"); // Import Mongoose để kết nối MongoDB

const app = express(); // Khởi tạo ứng dụng Express

app.use(express.json()); // Middleware để parse JSON từ request body

// 📌 Kết nối MongoDB Atlas
mongoose.connect(
    'mongodb+srv://tmsthong:maFmAWkNEqLoNKSj@cluster0.oban5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    {
        useNewUrlParser: true, // Sử dụng cú pháp URL mới (không cần thiết từ MongoDB 4.0+)
        useUnifiedTopology: true // Sử dụng engine kết nối mới (không cần thiết từ MongoDB 4.0+)
    }
)
.then(() => console.log('Kết nối MongoDB thành công')) // Nếu kết nối thành công
.catch((err) => console.error('Kết nối MongoDB lỗi:', err)); // Nếu lỗi xảy ra

// 📌 Import Routes
app.use("/api/auth", require("./routes/authRoutes")); // Định tuyến cho auth (đăng ký, đăng nhập)
app.use("/api/todos", require("./routes/todoRoutes")); // Định tuyến cho Todo CRUD

// 📌 Middleware xử lý lỗi chung
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: err.status || 500,
        message: err.message
    });
});

// 📌 Lắng nghe server trên cổng 3000
app.listen(3000, () => console.log("Server running trên port 3000"));

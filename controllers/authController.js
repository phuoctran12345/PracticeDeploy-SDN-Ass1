const User = require('../models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'autorent-pro-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Thiếu: name, email, phone, password' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    const user = new User({
      name,
      email,
      phone,
      password,
      role: role || 'customer',
    });
    await user.save();
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    return res.status(201).json({
      message: 'Đăng ký thành công',
      data: { user: user.toJSON(), token },
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu sai' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu sai' });
    }
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    return res.json({
      message: 'Đăng nhập thành công',
      data: { user: user.toJSON(), token },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

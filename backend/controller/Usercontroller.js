import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import validator from "validator";
import crypto from "crypto";
import userModel from "../models/Usermodel.js";
import transporter from "../config/nodemailer.js";
import { getWelcomeTemplate } from "../email.js";
import { getPasswordResetTemplate } from "../email.js";

const createtoken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

dotenv.config();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const Registeruser = await userModel.findOne({ email });
    if (!Registeruser) {
      return res.json({ message: "Email not found", success: false });
    }
    const isMatch = await bcrypt.compare(password, Registeruser.password);
    if (isMatch) {
      const token = createtoken(Registeruser._id);
      return res.json({
        token,
        user: { name: Registeruser.name, email: Registeruser.email },
        success: true,
      });
    } else {
      return res.json({ message: "Invalid password", success: false });
    }
  } catch (error) {
    console.error(error);
    res.json({ message: "Server error", success: false });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!validator.isEmail(email)) {
      return res.json({ message: "Invalid email", success: false });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email, password: hashedPassword });
    await newUser.save();
    const token = createtoken(newUser._id);

    // send email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Welcome to UrbanSquare - Your Account Has Been Created",
      html: getWelcomeTemplate(name),
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      token,
      user: { name: newUser.name, email: newUser.email },
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.json({ message: "Server error", success: false });
  }
};

const forgotpassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Email not found", success: false });
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 10 * 60 * 1000; // 1 hour
    await user.save();
    const resetUrl = `${process.env.WEBSITE_URL}/reset/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset - UrbanSquare Security",
      html: getPasswordResetTemplate(resetUrl),
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Email sent", success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const resetpassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await userModel.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired token", success: false });
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();
    return res
      .status(200)
      .json({ message: "Password reset successful", success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const adminlogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.json({ token, success: true });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid credentials", success: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const logout = async (req, res) => {
  try {
    return res.json({ message: "Logged out", success: true });
  } catch (error) {
    console.error(error);
    return res.json({ message: "Server error", success: false });
  }
};

// get name and email

const getname = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.json({ message: "Server error", success: false });
  }
};

export {
  login,
  register,
  forgotpassword,
  resetpassword,
  adminlogin,
  logout,
  getname,
};

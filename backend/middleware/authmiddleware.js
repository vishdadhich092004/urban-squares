import jwt from "jsonwebtoken";
import userModel from "../models/Usermodel.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};

// In backend/middleware/authmiddleware.js
export const checkAppointmentOwnership = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this appointment",
      });
    }

    req.appointment = appointment;
    next();
  } catch (error) {
    console.error("Error checking appointment ownership:", error);
    res.status(500).json({
      success: false,
      message: "Error checking appointment ownership",
    });
  }
};

export default protect;

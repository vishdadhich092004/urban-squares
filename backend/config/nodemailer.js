import nodemailer from "nodemailer";
import dotenv from "dotenv";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "cordia.gerhold@ethereal.email",
    pass: "MmudTpZtE4HSK3ZVeG",
  },
});

export default transporter;

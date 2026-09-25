import { prisma } from "../config/db.connect.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";

const register = async (req, res) => {
  try {
    const { name, fullName, email, password, role, photoUrl } = req.body;
    const resolvedFullName = fullName || name;

    if (!resolvedFullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password" });
    }

    // 1. check if user already exists
    const userExist = await prisma.user.findUnique({ where: { email } });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. hash password (NEVER store plain text)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Determine role and starting coins
    const validRoles = ["WORKER", "BUYER", "ADMIN"];
    const userRole =
      role && validRoles.includes(role.toUpperCase())
        ? role.toUpperCase()
        : "WORKER";
    const startingCoins = userRole === "BUYER" ? 50 : 10;

    // 4. create new user
    const user = await prisma.user.create({
      data: {
        fullName: resolvedFullName,
        email,
        password: hashedPassword,
        role: userRole,
        coins: startingCoins,
        photoUrl: photoUrl || null,
      },
    });

    // 5. generate jwt token + set cookie
    const token = generateToken(user.id, res);

    // 6. return response (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "User registered successfully",
      user: { ...userWithoutPassword, name: user.fullName },
      token,
    });
  } catch (error) {
    console.log("Error during registration", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // 1. check the user exists
    const userExist = await prisma.user.findUnique({ where: { email } });
    if (!userExist) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. compare password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, userExist.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // 3. generate jwt token + set cookie
    const token = generateToken(userExist.id, res);

    // 4. return response (exclude password)
    const { password: _, ...userWithoutPassword } = userExist;
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "User logged in successfully",
      user: { ...userWithoutPassword, name: userExist.fullName },
      token,
    });
  } catch (error) {
    console.log("Error during login", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const LogOut = async (req, res) => {
  try {
    res.clearCookie("jwt", "", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
      expires: new Date(0),
    });
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.log("Error during logout", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      statusCode: 200,
      user: req.user,
    });
  } catch (error) {
    console.log("Error getting user profile", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { register, login, LogOut, getMe };

const User = require("../models/User");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken");
    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const addUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: "fail", message: "User already exists" });
    }
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({
      status: "success",
      data: { user: { name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message || "Internal server error",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const allowedUpdates = {
      name: req.body.name,
      role: req.body.role,
    };
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

    const userToUpdate = await User.findById(id);

    if (!userToUpdate) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }
    
    if (userToUpdate.role === 'admin' && userToUpdate._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ status: 'fail', message: 'Admins cannot update other admins.' });
    }
    
    if (userToUpdate._id.toString() === req.user._id.toString() && req.body.role && req.body.role !== 'admin') {
        return res.status(400).json({ status: 'fail', message: "Admins cannot change their own role." });
    }

    const updatedUser = await User.findByIdAndUpdate(id, allowedUpdates, {
        new: true,
        runValidators: true
    }).select("-password -refreshToken");

    res.status(200).json({ status: "success", data: { user: updatedUser } });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }
    
    if (userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ status: "fail", message: "You cannot delete your own admin account." });
    }

    if (userToDelete.role === 'admin') {
      return res.status(403).json({ status: "fail", message: "Admins cannot delete other admins." });
    }

    await User.findByIdAndDelete(id);
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

module.exports = {
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
};
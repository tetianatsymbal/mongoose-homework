import User from "../models/user.model.js";
import Article from "../models/article.model.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find(
      {},
      { _id: 1, fullName: 1, email: 1, age: 1 }
    ).sort({ age: req.query.sort || 1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getUserByIdWithArticles = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "articles",
      "-_id title subtitle createdAt"
    );
    if (!user) {
      return next(createError(404, "User not found"));
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    age: req.body.age,
    role: req.body.role,
  });

  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.age = req.body.age;

    await user.save();
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(createError(404, "User not found"));
    }
    await Article.deleteMany({ owner: String(user._id) });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};

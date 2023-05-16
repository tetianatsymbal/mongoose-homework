import Article from "../models/article.model.js";
import User from "../models/user.model.js";

export const getArticles = async (req, res, next) => {
  const { title, page = 1, limit = 10 } = req.query;

  try {
    const filter = title
      ? {
          title: { $regex: title, $options: "i" },
        }
      : {};
    const articles = await Article.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("owner", "fullName email age");

    res.json(articles);
  } catch (err) {
    next(err);
  }
};

export const getArticleById = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id).populate(
      "owner",
      "fullName email age"
    );
    if (!article) {
      return next(createError(404, "Article not found"));
    }

    res.json(article);
  } catch (err) {
    next(err);
  }
};

export const createArticle = async (req, res, next) => {
  try {
    const { title, subtitle, description, owner, category } = req.body;
    const user = await User.findById(owner);
    if (!user) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const article = new Article({
      title,
      subtitle,
      description,
      owner,
      category,
    });

    await article.save();
    user.articles.push(article._id);
    user.numberOfArticles += 1;
    await user.save();

    res.status(201).json(article);
  } catch (err) {
    next(err);
  }
};

export const updateArticleById = async (req, res, next) => {
  const articleId = req.params.id;
  const { title, subtitle, description, owner, category } = req.body;

  try {
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const user = await User.findById(owner);
    if (!user) {
      return res.status(404).json({ message: "Owner not found" });
    }

    if (String(article.owner) !== String(owner)) {
      return res
        .status(403)
        .json({ message: "Only the owner can update the article" });
    }

    article.title = title;
    article.subtitle = subtitle;
    article.description = description;
    article.category = category;

    await article.save();
    res.json(article);
  } catch (err) {
    next(err);
  }
};

export const deleteArticleById = async (req, res, next) => {
  try {
    const deletedArticle = await Article.findById(req.params.id);
    if (!deletedArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    const user = await User.findById(deletedArticle.owner);
    if (!user) {
      return res.status(404).json({ message: "Owner not found" });
    }

    if (String(deletedArticle.owner) !== String(req.body.userId)) {
      return res
        .status(403)
        .json({ message: "Only the owner can delete the article" });
    }

    await deletedArticle.deleteOne();

    user.articles = user.articles.filter(
      (article) => String(article) !== String(deletedArticle._id)
    );
    user.numberOfArticles -= 1;
    await user.save();

    res.json({ message: "Article deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const likeArticle = async (req, res, next) => {
  const articleId = req.params.id;

  try {
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const user = await User.findById(req.body.userId);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    article.likes.push(user._id);
    await article.save();

    user.likedArticles.push(article._id);
    await user.save();

    res.json(article);
  } catch (err) {
    next(err);
  }
};

export const unlikeArticle = async (req, res, next) => {
  const articleId = req.params.id;

  try {
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const user = await User.findById(req.body.userId);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    article.likes = article.likes.filter(
      (u) => String(u._id) !== String(user._id)
    );
    await article.save();

    user.likedArticles = user.likedArticles.filter(
      (a) => String(a._id) !== String(article._id)
    );
    await user.save();

    res.json(article);
  } catch (err) {
    next(err);
  }
};

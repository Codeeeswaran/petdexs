const express = require("express");
const router = express.Router();
const sellerModel = require("../../models/seller/sellerModel");
const jwt = require("jsonwebtoken");
const generateToken = require("../../utils/auth");

router.get("/signup", (req, res) => {
  if (req.cookies.seller) {
    res.json({ msg: "Dashboard" });
  } else {
    res.render("seller/signup", { emailExist: false });
  }
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const findEmail = await sellerModel.findOne({
    where: {
      email: email,
    },
  });

  if (findEmail) {
    res.render("seller/signup", { emailExist: true });
  } else {
    const createSeller = await sellerModel
      .create({
        name: name,
        email: email,
        password: password,
      })
      .then((data) => {
        const token = generateToken(data.dataValues.id);
        res.cookie("seller", token, {
          expires: new Date(Date.now() + 172800 * 1000),
          secure: true,
          httpOnly: true,
        });

        res.json({ msg: "Seller Dashboard" });
      });
  }

  // const findEmail=await
});

router.get("/login", (req, res) => {
  if (req.cookies.seller) {
    res.json({ msg: "Seller Dashboard" });
  } else {
    res.render("seller/login",{emailExist:true,passwordError:false});
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const findEmail = await sellerModel.findOne({
    where: {
      email: email,
    },
  });

  if (findEmail) {
    if (password == findEmail.dataValues.password) {
      const token = generateToken(findEmail.dataValues.id);
      res.cookie("seller", token, {
        expires: new Date(Date.now() + 172800 * 1000),
        secure: true,
        httpOnly: true,
      });

      res.json({ msg: "Seller Dashboard" });
    } else {
      res.render("seller/login", { emailExist: true, passwordError: true });
    }
  } else {
    res.render("seller/login", { emailExist: false, passwordError: false });
  }
});

module.exports = router;

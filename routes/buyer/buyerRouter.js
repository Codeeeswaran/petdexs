const express = require("express");
const router = express.Router();
const buyerModel = require("../../models/buyer/buyerModel");
const jwt = require("jsonwebtoken");
const generateToken = require("../../utils/auth");

router.get("/signup", (req, res) => {
  if (req.cookies.buyer) {
    res.json({ msg: "Dashboard" });
  } else {
    res.render("buyer/signup", { emailExist: false });
  }
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const findEmail = await buyerModel.findOne({
    where: {
      email: email,
    },
  });

  if (findEmail) {
    res.render("buyer/signup", { emailExist: true });
  } else {
    const createBuyer = await buyerModel
      .create({
        name: name,
        email: email,
        password: password,
      })
      .then((data) => {
        const token = generateToken(data.dataValues.id);
        res.cookie("buyer", token, {
          expires: new Date(Date.now() + 172800 * 1000),
          secure: true,
          httpOnly: true,
        });

        res.json({ msg: "Dashboard" });
      });
  }

  // const findEmail=await
});

router.get("/login", (req, res) => {
  if (req.cookies.buyer) {
    res.json({ msg: "Dashboard" });
  } else {
    res.render("buyer/login",{emailExist:true,passwordError:false});
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const findEmail = await buyerModel.findOne({
    where: {
      email: email,
    },
  });

  if (findEmail) {
    if (password == findEmail.dataValues.password) {
      const token = generateToken(findEmail.dataValues.id);
      res.cookie("buyer", token, {
        expires: new Date(Date.now() + 172800 * 1000),
        secure: true,
        httpOnly: true,
      });

      res.json({ msg: "Dashboard" });
    } else {
      res.render("buyer/login", { emailExist: true, passwordError: true });
    }
  } else {
    res.render("buyer/login", { emailExist: false, passwordError: false });
  }
});

module.exports = router;

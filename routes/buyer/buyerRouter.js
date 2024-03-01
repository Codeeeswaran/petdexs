const express = require("express");
const router = express.Router();
const buyerModel = require("../../models/buyer/buyerModel");
const jwt = require("jsonwebtoken");
const generateToken = require("../../utils/auth");
const verifyToken = require("../../utils/verifyToken");
const petModel = require("../../models/seller/petModel");
const sellerModel = require("../../models/seller/sellerModel");
const { where, Op, Sequelize } = require("sequelize");

router.get("/signup", (req, res) => {
  if (req.cookies.buyer) {
    const id = verifyToken(req.cookies.buyer);
    res.redirect(`/buyer/${id}/dashboard`);
  } else {
    res.render("buyer/signup", { emailExist: false });
  }
});

router.post("/signup", async (req, res) => {
  const { name, email, password, place } = req.body;
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
        place: place,
      })
      .then((data) => {
        const token = generateToken(data.dataValues.id);
        res.cookie("buyer", token, {
          expires: new Date(Date.now() + 172800 * 1000),
          secure: true,
          httpOnly: true,
        });

        res.redirect(`/buyer/${data.dataValues.id}/dashboard`);
      });
  }
});

router.get("/login", async (req, res) => {
  if (req.cookies.buyer) {
    const id = verifyToken(req.cookies.buyer);
    res.redirect(`/buyer/${id}/dashboard`);
  } else {
    res.render("buyer/login", { emailExist: true, passwordError: false });
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

      res.redirect(`/buyer/${findEmail.dataValues.id}/dashboard`);
    } else {
      res.render("buyer/login", { emailExist: true, passwordError: true });
    }
  } else {
    res.render("buyer/login", { emailExist: false, passwordError: false });
  }
});

router.get("/:id/dashboard", async (req, res) => {
  const { query } = req.query;
  const { id } = req.params;

  if (req.cookies.buyer) {
    if (query) {
      const pets = await petModel
        .findAll({
          where: {
            breed: {
              [Op.iLike]: `%${query}%`,
            },
          },
        })
        .then((data) => {
          res.render("buyer/dashboard", { pets: data, id: id });
        })
        .catch((err) => {
          res.json({ err: err.message });
        });
    } else {
      const pets = await petModel
        .findAll({})
        .then((data) => {
          res.render("buyer/dashboard", { pets: data, id: id });
        })
        .catch((err) => {
          res.json({ err: err.message });
        });
    }
  } else {
    res.redirect("/buyer/login");
  }
});

router.get("/:id/petdetails/:petid", async (req, res) => {
  const { id, petid } = req.params;

  if (req.cookies.buyer) {
    const pet = await petModel
      .findByPk(petid)
      .then(async (data) => {
        const owner = await sellerModel
          .findOne({
            where: {
              id: data?.dataValues?.sellerId,
            },
          })
          .then((data2) => {
            res.render("buyer/petdetails", {
              pet: data.dataValues,
              id: id,
              owner: data2.dataValues,
            });
          })
          .catch((err) => {
            res.json({ err: err.message });
          });
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  } else {
    res.redirect("/buyer/login");
  }
});

router.get("/:id/saved/:petid", async (req, res) => {
  const { id, petid } = req.params;
  const buyerProfile = await buyerModel.findByPk(id);
  if (req.cookies.buyer) {
    const findpet = await petModel.findByPk(petid);
    if (petid) {
      if (buyerProfile.dataValues.saved == null) {
        buyerProfile
          .update(
            {
              saved: [findpet.dataValues.id],
            },
            {
              where: {
                id: id,
              },
            }
          )
          .then(() => {
            res.redirect(`/buyer/${id}/dashboard`);
          })
          .catch((err) => {
            res.json({ err: err.message });
          });
      } else {
        buyerProfile
          .update(
            {
              saved: [...buyerProfile.dataValues.saved, findpet.dataValues.id],
            },
            {
              where: {
                id: id,
              },
            }
          )
          .then(() => {
            res.redirect(`/buyer/${id}/dashboard`);
          })
          .catch((err) => {
            res.json({ err: err.message });
          });
      }
    } else {
      res.redirect(`/buyer/${id}/dashboard`);
    }
  } else {
    res.redirect("/buyer/login");
  }
});

router.get("/:id/remove/:post", async (req, res) => {
  const { id, post } = req.params;
  if (req.cookies.buyer) {
    const findId = await buyerModel.findByPk(id);

    if (!findId) {
      res.clearCookie("buyer");
      res.redirect(`/buyer/login`);
    } else {
      const findId = await buyerModel.findByPk(id);

      if (!findId) {
        res.clearCookie("buyer");
        res.redirect("/buyer/login");
      } else {
        const deletePost = await buyerModel
          .update(
            {
              saved: Sequelize.fn("array_remove", Sequelize.col("saved"), post),
            },
            {
              where: {},
              returning: true,
            }
          )
          .then(() => {
            res.redirect(`/buyer/${id}/profile`);
          })
          .catch((err) => {
            res.json({ err: err.message });
          });
      }
    }
  } else {
    res.redirect("/buyer/login");
  }
});

router.get("/:id/profile", async (req, res) => {
  console.log("Working");
  const { id } = req.params;
  if (req.cookies.buyer) {
    const profile = await buyerModel.findByPk(id);
    console.log(profile);
    const savedPets = await petModel.findAll({
      where: {
        id: profile?.dataValues?.saved,
      },
    });
    console.log(savedPets);
    res.render("buyer/profile", {
      profile: profile.dataValues,
      saved: savedPets,
      id: id,
    });
  } else {
    res.redirect("/buyer/login");
  }
});

router.get('/logout',(req,res)=>{
  res.clearCookie('buyer');
  res.redirect('/buyer/login');
})

module.exports = router;

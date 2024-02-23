const express = require("express");
const router = express.Router();
const adminlogin = require("../../models/admin/adminModel");
const jwt = require("jsonwebtoken");
const usernameExtractor = require("../../utils/usernameExtractor");
const generateToken = require("../../utils/auth");
const sellerModel = require("../../models/seller/sellerModel");
const petModel = require("../../models/seller/petModel");

//login routes
router.get("/login", async (req, res) => {
  /* This code block is checking if there is already an existing admin account in the database. */
  if (req.cookies.admin) {
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (findId) {
      res.redirect(`/admin/dashboard`);
    } else {
      res.redirect(`/admin/login`);
    }
  } else {
    const result = await adminlogin.count();

    if (result == 1) {
      res.render("admin/login", {
        emailExist: true,
        passwordError: false,
      });
    } else {
      res.redirect("signup");
    }
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    //find hashpassword of a particular email
    const findEmail = await adminlogin.findOne({
      where: {
        email: email,
      },
    });

    //check if the hash password of the given email is find or not
    if (!findEmail) {
      res.render("admin/login", {
        emailExist: false,
        passwordError: false,
      });
    } else {
      const checkPassword = await adminlogin.findOne({
        where: {
          password: password,
        },
      });

      /* This code block is checking if the password entered by the user matches the hashed password
           stored in the database. */
      if (checkPassword) {
        const token = generateToken(checkPassword.dataValues.id);
        res.cookie("admin", token, {
          expires: new Date(Date.now() + 172800 * 1000),
          secure: true,
          httpOnly: true,
        });
        res.redirect("/admin/dashboard");
      } else {
        res.render("admin/login", {
          emailExist: true,
          passwordError: true,
        });
      }
    }
  } catch (err) {
    res.json({ err: err.message });
  }
});

//GET admin signup
router.get("/signup", async (req, res) => {
  /* This code block is checking if there is already an existing admin account in the database. */
  const result = await adminlogin.count();
  if (result == 1) {
    res.redirect("login");
  } else {
    res.render("admin/signup", {
      passwordError: false,
    });
  }
});

//POST admin signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  /* This code block is handling the signup functionality. */

  const username = usernameExtractor(email);
  const data = await adminlogin
    .create({
      username: username,
      email: email,
      password: password,
    })
    .then((data) => {
      const token = generateToken(data.dataValues.id);
      res.cookie("admin", token, {
        expires: new Date(Date.now() + 172800 * 1000),
        secure: true,
        httpOnly: true,
      });
      res.redirect("/admin/dashboard");
    });
});

router.get("/dashboard", async (req, res) => {
  /* This code block is checking if there is already an existing admin account in the database. */
  if (req.cookies.admin) {
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (findId) {
      const sellers = await sellerModel.findAll({
        where: {
          verify: false,
        },
      });
      res.render(`admin/dashboard`, { sellers: sellers });
    } else {
      res.clearCookie("admin");
      res.redirect(`/admin/login`);
    }
  } else {
    res.redirect(`/admin/login`);
  }
});

router.get("/delete/:id", async (req, res) => {
  const { id } = req.params;

  if (req.cookies.admin) {
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (findId) {
      const deleteUser = await sellerModel.findByPk(id);
      const deletePet = await petModel.destroy({
        where: {
          sellerId: id,
        },
      });
      deleteUser
        .destroy()
        .then(() => {
          res.redirect("/admin/dashboard");
        })
        .catch((err) => {
          res.json({ err: err.message });
        });
    } else {
      res.clearCookie("admin");
      res.redirect(`/admin/login`);
    }
  } else {
    res.redirect(`/admin/login`);
  }
});

router.get("/verify/:id", async (req, res) => {
  const { id } = req.params;

  if (req.cookies.admin) {
    const token = jwt.verify(req.cookies.admin, process.env.JWT_SECRET_TOKEN);
    const findId = await adminlogin.findByPk(token);

    if (findId) {
      const updateSeller = await sellerModel
        .update(
          {
            verify: true,
          },
          {
            where: {
              id: id,
            },
          }
        )
        .then(() => {
          res.redirect("/admin/dashboard");
        })
        .catch((err) => {
          res.json({ err: err.message });
        });
    } else {
      res.clearCookie("admin");
      res.redirect(`/admin/login`);
    }
  } else {
    res.redirect(`/admin/login`);
  }
});

router.get('/logout',(req,res)=>{
    res.clearCookie('admin');
    res.redirect('/admin/login');
})

module.exports = router;

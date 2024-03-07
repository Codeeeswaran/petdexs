const express = require("express");
const router = express.Router();
const adminlogin = require("../../models/admin/adminModel");
const jwt = require("jsonwebtoken");
const usernameExtractor = require("../../utils/usernameExtractor");
const generateToken = require("../../utils/auth");
const sellerModel = require("../../models/seller/sellerModel");
const petModel = require("../../models/seller/petModel");
const sequelizeConfig = require("../../config/sequelize.config");
const ExcelJS = require("exceljs");
const path = require("path");

//login routes
router.get("/login", async (req, res) => {
  /* This code block is checking if there is already an existing admin account in the database. */
  try {
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
        console.log("No");
        res.render("admin/login", {
          emailExist: true,
          passwordError: false,
        });
      } else {
        console.log("Yes");
        res.redirect("/admin/signup");
      }
    }
  } catch (error) {
    res.json({ error: error.message });
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
    res.redirect("/admin/login");
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
      const sellers = await sellerModel.findAll({});
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

router.get('/delete',async(req,res)=>{
  if(req.cookies.admin){
    const deletePets=await petModel.drop().then(async () => {
      console.log("Drop all the Table");
      (await sequelizeConfig.sync()).authenticate().then(() => {
        console.log("All Table created Successfully");
        res.redirect("/");
      });
    }).catch((err)=>{
      res.json({err:err.message})
    })
  }else{
    res.redirect('/admin/login')
  }
 
})

router.get("/history/:id", async (req, res) => {
  const { id } = req.params;
  const findSeller = await sellerModel.findByPk(id);
  if (req.cookies.admin) {
    if (findSeller) {
      const findPets = await petModel
        .findAll({
          where: {
            sellerId: id,
          },
        })
        .then((pets) => {
          res.render("admin/history", { pets: pets });
        })
        .catch((err) => {
          res.json({ err: err.message });
        });
    } else {
      res.redirect("/admin/dashboard");
    }
  } else {
    res.redirect("/admin/login");
  }
});

router.get("/report/:id", async (req, res) => {
  let report = [];
  const { id } = req.params;
  const findSeller = await sellerModel.findByPk(id);
  if (req.cookies.admin) {
    if (findSeller) {
      const findPets = await petModel.findAll({
        where: {
          sellerId: id,
        },
      });

      findPets.filter((pet) => {
        if (
          new Date(pet.dataValues.createdAt).getMonth() + 1 ==
            new Date().getMonth() + 1 &&
          new Date(pet.dataValues.createdAt).getDate() == new Date().getDate()
        ) {
          report.push(pet);
        }
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        `${findSeller.dataValues.name}-${new Date().getMonth() + 1}`
      );
      const column = (worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Pet Name", key: "name", width: 10 },
        { header: "Breed", key: "breed", width: 15 },
        { header: "Age", key: "age", width: 10 },
        { header: "Color", key: "color", width: 10 },
        { header: "Description", key: "description", width: 40 },
        { header: "Total Quantity", key: "total", width: 10 },
        { header: "Unsold", key: "quantity", width: 10 },
        { header: "Sold", key: "sell", width: 10 },
      ]);

      report.forEach((data) => {
        const rowData = {
          id: data.id,
          name: data.name,
          breed: data.breed,
          age: data.age,
          color: data.color,
          description: data.description,
          total: data.total,
          quantity: data.quantity,
          sell: data.sell,
        };
        worksheet.addRow(Object.values(rowData));
      });

      workbook.xlsx
        .writeFile(
          path.join(__dirname, "excel", `${findSeller.dataValues.name}.xlsx`)
        )
        .then(() => {
          res.sendFile(
            path.join(__dirname, "excel", `${findSeller.dataValues.name}.xlsx`),
            `${findSeller.dataValues.name}.xlsx`,
            (err) => {
              if (err) {
                res.status(500).json({ error: "Error sending the file" });
              } else {
                console.log("File sent successfully");
              }
            }
          );
        })
        .catch((err) => {
          res.status(500).json({ error: err.message });
        });
    } else {
      res.redirect("/admin/dashboard");
    }
  } else {
    res.redirect("/admin/login");
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("admin");
  res.redirect("/admin/login");
});

module.exports = router;

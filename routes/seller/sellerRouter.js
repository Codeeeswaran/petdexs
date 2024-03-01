const express = require("express");
const router = express.Router();
const sellerModel = require("../../models/seller/sellerModel");
const jwt = require("jsonwebtoken");
const generateToken = require("../../utils/auth");
const verifyToken = require("../../utils/verifyToken");
const cloudinaryConfig = require("../../config/cloudinary.config");
const multer = require("multer");
const petModel = require("../../models/seller/petModel");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/signup", async (req, res) => {
  if (req.cookies.seller) {
    const id = verifyToken(req.cookies.seller);
    const findId = await sellerModel.findByPk(id);
    if (findId) {
      res.redirect(`/seller/${id}/postpets`);
    } else {
      res.render("seller/signup", { emailExist: false });
    }
  } else {
    res.render("seller/signup", { emailExist: false });
  }
});

router.post("/signup", async (req, res) => {
  const { name, email, password, place, contact } = req.body;
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
        place: place,
        contact: contact,
        verify: false,
      })
      .then((data) => {
        const token = generateToken(data.dataValues.id);
        res.cookie("seller", token, {
          expires: new Date(Date.now() + 172800 * 1000),
          secure: true,
          httpOnly: true,
        });

        res.redirect(`/seller/${data.dataValues.id}/postpets`);
      });
  }

  // const findEmail=await
});

router.get("/login", async (req, res) => {
  if (req.cookies.seller) {
    const id = verifyToken(req.cookies.seller);
    const findId = await sellerModel.findByPk(id);
    if (findId) {
      res.redirect(`/seller/${id}/postpets`);
    } else {
      res.render("seller/login", { emailExist: true, passwordError: false });
    }
  } else {
    res.render("seller/login", { emailExist: true, passwordError: false });
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

      res.redirect(`/seller/${findEmail.dataValues.id}/postpets`);
    } else {
      res.render("seller/login", { emailExist: true, passwordError: true });
    }
  } else {
    res.render("seller/login", { emailExist: false, passwordError: false });
  }
});

router.get("/:id/postpets", async (req, res) => {
  if (req.cookies.seller) {
    const id = verifyToken(req.cookies.seller);
    const findId = await sellerModel.findByPk(id);
    if (findId) {
      res.render("seller/postpets");
    } else {
      res.redirect("/seller/login");
    }
  } else {
    res.redirect("/seller/login");
  }
});

router.post("/:id/postpets", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, breed, color, age, description } = req.body;

    /* The line `const fileBuffer = req.file.buffer.toString("base64");` is converting the file
       buffer of the uploaded file into a base64 encoded string. */
    const fileBuffer = req.file.buffer.toString("base64");

    /* The code `const fileUpload = await cloudinaryConfig.uploader.upload(...)` is uploading an image
     file to the Cloudinary service. */
    const fileUpload = await cloudinaryConfig.uploader.upload(
      `data:image/png;base64,${fileBuffer}`,
      {
        folder: "/petdex",
        public_id: Date.now() + "-" + req.file.originalname,
        encoding: "base64",
      }
    );

    const uploadData = await petModel
      .create({
        name: name,
        age: age,
        breed: breed,
        description: description,
        color: color,
        sellerId: id,
        img: fileUpload.secure_url,
      })
      .then(() => {
        res.redirect(`/seller/${id}/yourpets`);
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  } catch (error) {
    res.json({ err: error.message });
  }
});

router.get("/:id/yourpets", async (req, res) => {
  const { id } = req.params;
  const findPets = await petModel.findAll({
    where: {
      sellerId: id,
    },
  });
  if (req.cookies.seller) {
    const findId = await sellerModel.findByPk(id);
    if (findId) {
      res.render("seller/yourpets", { pets: findPets });
    } else {
      res.redirect("/seller/login");
    }
  } else {
    res.redirect("/seller/login");
  }
});

router.get("/:id/petdetails/:petid", async (req, res) => {
  const { id, petid } = req.params;
  const findProfile = await sellerModel.findByPk(id);
  const findPets = await petModel.findOne({
    where: {
      id: petid,
    },
  });
  if (req.cookies.seller) {
    res.render("seller/petdetails", {
      pet: findPets?.dataValues,
      owner: findProfile.dataValues,
    });
  } else {
    res.redirect("/seller/login");
  }
});

router.get("/:id/delete/:petid", async (req, res) => {
  const { id, petid } = req.params;
  const findPets = await petModel.findOne({
    where: {
      id: petid,
      sellerId: id,
    },
  });
  if (req.cookies.seller) {
    findPets
      .destroy()
      .then(() => {
        res.redirect(`/seller/${id}/yourpets`);
      })
      .catch((err) => {
        res.json({ err: err.message });
      });
  } else {
    res.redirect("/seller/login");
  }
});

router.get("/:id/update/:petid", async (req, res) => {
  const { id, petid } = req.params;
  const findPets = await petModel.findOne({
    where: {
      id: petid,
      sellerId: id,
    },
  });
  if (req.cookies.seller) {
    res.render("seller/updatepet", { pet: findPets?.dataValues });
  } else {
    res.redirect("/seller/login");
  }
});

router.post("/:id/update/:petid", upload.single("file"), async (req, res) => {
  try {
    const { id, petid } = req.params;
    const { name, breed, color, age, description } = req.body;

    if (!req.file) {
      const updatePet = await petModel
        .update(req.body, {
          where: {
            id: petid,
          },
        })
        .then(() => {
          res.redirect(`/seller/${id}/yourpets`);
        })
        .catch((err) => {
          res.json({ err: err.message });
        });
    } else {
      /* The line `const fileBuffer = req.file.buffer.toString("base64");` is converting the file
       buffer of the uploaded file into a base64 encoded string. */
      const fileBuffer = req.file.buffer.toString("base64");

      /* The code `const fileUpload = await cloudinaryConfig.uploader.upload(...)` is uploading an image
     file to the Cloudinary service. */
      const fileUpload = await cloudinaryConfig.uploader.upload(
        `data:image/png;base64,${fileBuffer}`,
        {
          folder: "/petdex",
          public_id: Date.now() + "-" + req.file.originalname,
          encoding: "base64",
        }
      );

      const updatePet = await petModel
        .update(
          {
            name: name,
            age: age,
            breed: breed,
            description: description,
            color: color,
            sellerId: id,
            img: fileUpload.secure_url,
          },
          {
            where: {
              id: petid,
            },
          }
        )
        .then(() => {
          res.redirect(`/seller/${id}/yourpets`);
        })
        .catch((err) => {
          res.json({ err: err.message });
        });
    }
  } catch (error) {
    res.json({ err: error.message });
  }
});


router.get('/logout',(req,res)=>{
  res.clearCookie('seller');
  res.redirect('/seller/login');
})

module.exports = router;

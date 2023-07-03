//write the code for the user controller here.
const asyncHandler = require("express-async-handler");
const User = require("../models/UserModels");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const secret_key = "jwt-UPC-SeCrEt-KeY-FoR-AuThEnTiCaTiOn";

const createToken = (id) => {
  return jwt.sign({ id }, secret_key);
};

const EmailUser = asyncHandler(async (req, res) => {
  const { upc_id, code } = req.query;
  const user = await User.findOne({ upc_id }).lean();
  if (!user) {
    return res.json({ message: "Wrong UPC id Or Password" });
  } else {
    const subject = "UPC INC Reset Password";
    sendEmail(user.email, code, subject);
  }
});

const getUserDetails = asyncHandler(async (req, res) => {
  const { upc_id, password } = req.query;
  console.log("get request : " + upc_id);
  const user = await User.findOne({ upc_id }).lean();

  if (!user) {
    return res.json({
      message: "Wrong UPC id or password!!!",
    });
  } else {
    const auth = await bcrypt.compare(password, user.password);
    console.log(auth);
    if (auth) {
      const token = createToken(user._id);
      res.cookie("jwt", token, {
        withCredentials: true,
        httpOnly: false,
      });
      res.status(201).json({ user: user, token: token });
    } else {
      return res.json({
        message: "Wrong UPC id or password!!!",
      });
    }
  }
});
const getUserProfile = asyncHandler(async (req, res, next) => {
  console.log(req.body);

  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, secret_key, async (err, decodedToken) => {
      if (err) {
        res.json({ status: false });
        next();
      } else {
        const user = await User.findById(decodedToken.id);
        if (user) {
          res.json({ status: true, user: user });
        } else {
          res.json({ status: false });
          next();
        }
      }
    });
  } else {
    res.json({ status: false });
    next();
  }
});

const createNewUser = asyncHandler(async (req, res) => {
  console.log(req.body);

  const { user } = await req.body;

  const userObject = user;

  const userreg = await User.create(userObject);

  if (userreg) {
    const token = createToken(userreg._id);
    res.cookie("jwt", token, {
      withCredentials: true,
      httpOnly: false,
    });
    res.status(201).json({ message: `new user registered` });
  } else {
    res.status(400).json({ message: `Invalid user data received` });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const { user } = req.body;
  console.log("patch req : " + user.upc_id);

  let userUp = await User.findOne({ upc_id: user.upc_id }).exec();
  if (!userUp) {
    console.log(userUp);
    return res
      .status(400)
      .json({ message: `user not found, please login again` });
  }
  userUp.examsCleared = user.examsCleared;
  userUp.application_sector = user.application_sector;
  userUp.additionalInfo = user.additionalInfo;
  userUp.applicationFor = user.applicationFor;
  userUp.presentEmployment = user.presentEmployment;
  userUp.areaOfInterest = user.areaOfInterest;
  userUp.internships = user.internships;
  userUp.workExperiences = user.workExperiences;
  userUp.projects = user.projects;
  userUp.achievements = user.achievements;
  userUp.skills = user.skills;
  userUp.ExtraCurriculars = user.ExtraCurriculars;
  userUp.publication = user.publication;
  userUp.reference = user.reference;

  const updatedUser = await userUp.save().then(() => {
    res.status(200).json({
      success: true,
      message: "updated",
    });
  });
  console.log(updateUser);
});
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  console.log(email);
  const subject = "UPC INC Email Verification";
  const resp = await sendEmail(email, code, subject);
  console.log(resp);
  res.json(resp);
});
const resetPassword = asyncHandler(async (req, res) => {
  const { upc_id, newPass } = req.body;
  let user = await User.findOne({ upc_id: upc_id }).exec();
  user.password = newPass;
  const updatedUser = await user.save().then(() => {
    res.status(200).json({
      success: true,
      message: "updated",
    });
  });
});
const sendEmail = async (email, code, subject) => {
  const emailHTML = `<h3>Email verification Code</h3>
     <h1>"${code}"</h1>
     <p>Please enter this verification code and verify your email</p>`;

  let smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "atharvakvrdso@gmail.com",
      pass: "icjlcqmqauwaucch",
    },
  });
  //  let transporter = nodemailer.createTransport({
  //    service: "gmail",
  //    auth: {
  //      user: "atharvakvrdso@gmail.com",
  //      pass: "AT06bh@$",
  //    },
  //  });

  let mailOptions = {
    from: "atharvakvrdso@gmail.com",
    to: email,
    subject: subject,
    html: emailHTML,
  };
  await smtpTransport.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
      return err;
    } else {
      console.log(info);
      return info;
    }
  });
};
//Register a user => /api/v1/register
const testController = (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "This is a test controller",
  });
};
module.exports = {
  testController,
  getUserDetails,
  createNewUser,
  updateUser,
  getUserProfile,
  verifyEmail,
  EmailUser,
  resetPassword,
};

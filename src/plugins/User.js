const mongoose = require("mongoose");
const Router = require("../services/Router");
const setup = require("tz-mongoose-plugins");

// --------------------- routes ---------------------

const routes = [
  {
    path: "/user",
    childrens: [
      {
        path: "/register",
        methods: "post",
      },
      {
        path: "/login",
        methods: "post",
        router: async (req, res) => {
          try {
            console.log("login");
            const { email, password } = req.body;
            const { user, token } = await mongoose
              .model("users")
              .login(email, password);
            res.success({ data: token, user, message: "Logged in !" });
          } catch (err) {
            res.error(err);
          }
        },
      },
      {
        path: "/reset-password",
        methods: "post",
        auth: true,
        router: async (req, res) => {
          try {
            const { oldPassword, newPassword } = req.body;
            await mongoose
              .model("users")
              .resetPassword(req.item._id, oldPassword, newPassword);
            res.success();
          } catch (error) {
            res.error(error);
          }
        },
      },
      {
        path: "/me",
        methods: "get",
        auth: true,
        router: async (req, res) => res.success(),
      },
      {
        path: "/delete",
        methods: "delete",
        auth: true,
        router: async (req, res) => {
          try {
            // await mongoose.model('users').delete(req.item._id,)
            res.success();
          } catch (error) {
            res.error(error);
          }
        },
      },
      {
        path: "/suspend",
        auth: true,
        admin: true,
        methods: "post",
      },
      {
        path: "/reactive",
        auth: true,
        admin: true,
        methods: "post",
      },
    ],
  },
];

// --------------------- exports ---------------------

const users = (app) => {

  // --------------------- mongoose plugins ---------------------

  setup("users");

  // --------------------- router ---------------------

  Router(app, routes);

};
module.exports = users

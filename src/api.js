import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { resolveDomain, resolveAddr, getAllDomains } from "./utils.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(
  bodyParser.urlencoded({
    limit: "200mb",
    extended: false,
  }),
);
app.use(bodyParser.json({ limit: "200mb" }));

app.use(function (req, res, next) {
  req.setTimeout(500000, function () {});
  next();
});

app.use((err, req, res, next) => {
  console.error("An error occurred:", err);
  res.status(500).json({ error: "An internal server error occurred." });
});

app.use(
  cors({
    origin: "*",
  }),
);

app.get("/resolve/addr/:addr", async (req, res) => {
  try {
    const { addr } = req.params;
    const response = await resolveAddr(addr);

    res.send(response);
  } catch (error) {
    console.log(error);
    return {};
  }
});

app.get("/resolve/domain/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    const response = await resolveDomain(domain);

    res.send(response);
  } catch (error) {
    console.log(error);
    return {};
  }
});

app.get("/acc/:addr", async (req, res) => {
  try {
    const { addr } = req.params;
    const response = await getAllDomains(addr);

    res.send(response);
  } catch (error) {
    console.log(error);
    return {};
  }
});

app.listen(port, () => console.log("Server started"));

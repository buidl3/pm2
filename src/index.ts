import "colors";
import * as glob from "glob";

function encode(data) {
  return Buffer.from(data, "utf8").toString("base64");
}

function decode(data) {
  return JSON.parse(Buffer.from(data, "base64").toString("utf8") || "{}");
}

function env() {
  const vars: any = {};

  const genv = require("dotenv").config({ path: ".env" });

  for (const app of getModules()) {
    const menv = require("dotenv").config({ path: app + "/.env" });
    vars[app] = { ...(genv.parsed || {}), ...(menv.parsed || {}) };
  }

  return {
    __BUIDL3_ENV: encode(JSON.stringify(vars)),
  };
}

function getModules(path = "modules/*"): Array<string> {
  return glob.sync(path);
}

function appify(app) {
  const env_dev = require("dotenv").config({ path: app + "/.env" });
  const env_production = decode(process.env.__BUIDL3_ENV || "")[app] || {};

  const script = glob.sync(app + "/index*")[0];
  if (!script) {
    console.error(
      "[BUIDL3][ERROR]".red + " Error: Entrypoint not found for " + app
    );
    process.exit(2);
  }

  return {
    name: app,
    script,
    autorestart: false,
    env: env_dev.parsed || {},
    env_production,
  };
}

export default { getModules, appify, env };

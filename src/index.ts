import "colors";
import * as glob from "glob";

function encode(data) {
  return Buffer.from(data || "", "utf8").toString("base64");
}

function decode(data) {
  return JSON.parse(Buffer.from(data || "", "base64").toString("utf8") || "{}");
}

function getModules(path = "modules/*"): Array<string> {
  const paths = glob.sync(path);

  const modules: Array<string> = [];
  for (const path of paths) {
    const b3ignore = glob.sync(path + "/.b3ignore")[0];
    if (!!b3ignore) continue;

    modules.push(path);
  }

  return modules;
}

function env() {
  const vars: any = {};

  // Global variables
  const genv = require("dotenv").config({ path: ".env" });

  // Network variables
  const nenv = require("dotenv").config({ path: "networks/.env" });
  vars["networks"] = nenv.parsed || {};

  // Per-app variables
  for (const $module of getModules()) {
    const menv = require("dotenv").config({ path: $module + "/.env" });
    vars["modules:" + $module] = {
      ...(genv.parsed || {}),
      ...(menv.parsed || {}),
    };
  }

  return {
    __BUIDL3_ENV: encode(JSON.stringify(vars)),
  };
}

function appify(app) {
  const env_data = decode(process.env.__BUIDL3_ENV);

  const env_dev = require("dotenv").config({ path: app + "/.env" });
  const nenv_dev = require("dotenv").config({ path: "networks/.env" });

  const env_production = env_data?.["modules:" + app];

  const nenv_production = env_data?.["networks"];

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
    env: {
      ...(env_dev.parsed || {}),
      __BUIDL3_NETWORK: encode(JSON.stringify(nenv_dev.parsed || {})),
    },
    env_production: {
      ...(env_production || {}),
      __BUIDL3_NETWORK: encode(JSON.stringify(nenv_production || {})),
    },
  };
}

export default { getModules, appify, env };

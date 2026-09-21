import { expect } from "chai";
import { join } from "path";
import * as tmpTestDir from "temp-dir";
import * as rimraf from "rimraf";
import * as PropertiesReader from "properties-reader";
import * as fs from "fs";
import * as sinon from "sinon";

import * as nsVsMock from "./ext/mockVscode";
import { mockVscode } from "./ext/mockUtil";
mockVscode(nsVsMock.testVscode, "src/chisel.ts");

import * as utils from "../src/utils";
import { deleteChiselParamsFromFile, checkAndCreateChiselTask } from "../src/chisel";

describe("chisel unit tests", () => {
  const serviceName = "chisel-service-name";
  let envFilePath: string;

  /* important: 
       VCAP_SERVICES contains special charecters and also \n that may cause to an issue in the a string 
       when we read the text from the file the propertyReader add to the string "\" before each "\n" (e.g.: \\n)  
       therefore we must define the VCAP service with \\n 
    */
  const VCAP_SERVICE_WITH_ALL_CHARS =
    '{"hana":[{"name":"test-service","instance_name":"test-service","label":"hana","tags":["hana","database","relational","mta-resource-name:hdi_hdb","endpoint:https://api.test.com","org:org","space:space"],"plan":"hdi-shared","credentials":{"certificate":"-----BEGIN CERTIFICATE-----\\nXXXXz\\nCAUw7C29=\\n-----END CERTIFICATE-----\\n","driver":"test.Driver","hdi_password":"hdi_password_value","hdi_user":"hdi_user","host":"host_value","password":"password_value","port":"XXXX","schema":"schema_key","service_key_name":"xxxx","url":"jdbc:test://test.ondemand.com:36603?encrypt=true\u0026validateCertificate=true\u0026currentschema=SCHEMA_42","user":"user_value"}}]}';
  const envWithChisel = {
    TUNNEL_PARAM: "2020:127.0.0.1:2020",
    CHISEL_URL: "https://chise-server.cfapps.test.hana.ondemand.com",
    CHISEL_USER: "chisel-user",
    CHISEL_PASSWORD: "chisel-password",
    VCAP_SERVICES: VCAP_SERVICE_WITH_ALL_CHARS,
  };

  beforeEach(() => {
    envFilePath = join(tmpTestDir, ".envtest");
  });

  afterEach(() => {
    rimraf.sync(envFilePath, { glob: false });
    sinon.restore();
  });

  describe("checkAndCreateChiselTask", () => {
    const expectedChiselTask = {
      label: `openChiselTunnerFor-${serviceName}`,
      type: "shell",
      command: "chisel",
      isBackground: true,
      problemMatcher: "$chisel-client",
      args: [
        "client",
        "--auth",
        "chisel-user:chisel-password",
        "https://chise-server.cfapps.test.hana.ondemand.com",
        "2020:127.0.0.1:2020",
      ],
    };
    it("ok:: verify created chisel task structure", async () => {
      await utils.writeProperties(envFilePath, envWithChisel);
      expect(await checkAndCreateChiselTask(envFilePath, serviceName)).deep.equal(expectedChiselTask);
    });

    it("ok:: create 'undefined' when chisel params not appear in the environment file", async () => {
      await utils.writeProperties(envFilePath, {});
      expect(await checkAndCreateChiselTask(envFilePath, serviceName)).to.be.undefined;
    });

    it("ok:: create 'undefined' chisel URL is empty", async () => {
      await utils.writeProperties(envFilePath, { CHISEL_URL: "" });
      expect(await checkAndCreateChiselTask(envFilePath, serviceName)).to.be.undefined;
    });

    it("ok:: create 'undefined' when .env file does not exists", async () => {
      expect(await checkAndCreateChiselTask(envFilePath, serviceName)).to.be.undefined;
    });

    it("ok:: create chisel task and ignore from invalid format text in the .env file", async () => {
      const text =
        "invalid format text that ignore by the reader\n" +
        "TUNNEL_PARAM= 2020:127.0.0.1:2020\n" +
        "CHISEL_URL= https://chise-server.cfapps.test.hana.ondemand.com\n" +
        "CHISEL_USER= chisel-user\n" +
        "CHISEL_PASSWORD= chisel-password\n" +
        "VCAP_SERVICES= VCAP_SERVICES_VALUE";

      await fs.promises.writeFile(envFilePath, text);
      expect(await checkAndCreateChiselTask(envFilePath, serviceName)).deep.equal(expectedChiselTask);
    });
  });

  describe("deleteChiselParamsFromFile", () => {
    const expectedProperties = {
      VCAP_SERVICES: VCAP_SERVICE_WITH_ALL_CHARS,
    };
    it("ok:: return true when delete chisel params from the .env file", async () => {
      await utils.writeProperties(envFilePath, envWithChisel);
      expect(await deleteChiselParamsFromFile(envFilePath)).to.be.true;
      const actualProperties = PropertiesReader(envFilePath);
      expect(actualProperties.getAllProperties()).deep.equal(expectedProperties);
    });

    it("ok:: return true and ignored from empty properties when override the .env file", async () => {
      const text =
        "TUNNEL_PARAM=2020:127.0.0.1:2020\n" +
        "CHISEL_URL= https://chise-server.cfapps.test.hana.ondemand.com\n" +
        'CHISEL_USER= "chisel-user"\n' +
        "CHISEL_PASSWORD= chisel-password\n" +
        "VCAP_SERVICES=" +
        VCAP_SERVICE_WITH_ALL_CHARS +
        "\n" +
        "EMPTY_VALUE=";
      await fs.promises.writeFile(envFilePath, text);
      expect(await deleteChiselParamsFromFile(envFilePath)).to.be.true;
      const actualProperties = PropertiesReader(envFilePath);
      expect(actualProperties.getAllProperties()).deep.equal(expectedProperties);
    });

    it("ok:: return false when chisel params does not exists in .env file", async () => {
      await utils.writeProperties(envFilePath, expectedProperties);
      expect(await deleteChiselParamsFromFile(envFilePath)).to.be.false;
      const actualProperties = PropertiesReader(envFilePath);
      expect(actualProperties.getAllProperties()).deep.equal(expectedProperties);
    });

    it("ok:: return false when .env file does not exists ", async () => {
      expect(await deleteChiselParamsFromFile(envFilePath)).to.be.false;
    });

    it("ok:: return false when write to .env file is failed", async () => {
      const envWithChisel = {
        TUNNEL_PARAM: "2020:127.0.0.1:2020",
        CHISEL_URL: "https://chise-server.cfapps.test.hana.ondemand.com",
        CHISEL_USER: "chisel-user",
        CHISEL_PASSWORD: "chisel-password",
        VCAP_SERVICES: "test",
      };
      await utils.writeProperties(envFilePath, envWithChisel);
      const expObj = {
        VCAP_SERVICES: "test",
      };
      sinon
        .stub(utils, "writeProperties")
        .withArgs(envFilePath, expObj)
        .throwsException("mock failed to write to .env file");
      expect(await deleteChiselParamsFromFile(envFilePath)).to.be.false;
    });

    it("ok:: return false when properties does not exists in the .env file", async () => {
      //await writeProperties(envFilePath, {});
      expect(await deleteChiselParamsFromFile(envFilePath)).to.be.false;
    });
  });
});

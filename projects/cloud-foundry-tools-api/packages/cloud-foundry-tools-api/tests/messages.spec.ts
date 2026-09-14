import { expect } from "chai";
import { messages } from "../src/messages";

it("messages", () => {
  expect(messages.service_not_found("testInstance")).to.be.not.undefined;
  expect(messages.exceed_number_of_attempts("4")).to.be.not.undefined;
  expect(messages.failed_creating_entity("description", "name")).to.be.not.undefined;
});

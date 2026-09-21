import { expect } from "chai";
import { messages } from "../src/messages";

describe("messages unit test", () => {
  it("messages", () => {
    expect(messages.service_created("test")).to.be.not.undefined;
    expect(messages.activation_extension("test")).to.be.not.undefined;
    expect(messages.extension_active("test")).to.be.not.undefined;
    expect(messages.targeting("testOrg", "testSpace")).to.be.not.undefined;
    expect(messages.targeting("testOrg", "testSpace")).to.be.not.undefined;
    expect(messages.no_service_plan_info_found("testPlan", "testService")).to.be.not.undefined;
    expect(messages.no_services_instance_byname_found("testService")).to.be.not.undefined;
    expect(messages.no_services_found("my-plan {1}")).to.be.ok;
    expect(messages.service_bound_successful("planName")).to.be.ok;
    expect(messages.service_instances_list_incomplete(["s-1", "s-2"])).to.be.equal(
      "Could not get the details of the following service instances: 's-1,s-2'. Try to verify the specified service instances, then log in again to Cloud Foundry."
    );
    expect(messages.service_instances_list_incomplete(["s-1", "s-2", "s-3", "s-4"])).to.be.equal(
      "Could not get the details of some service instances. Try to verify the service instances, then log in again to Cloud Foundry."
    );
    expect(messages.target_created("my-target")).to.be.ok;
  });
});

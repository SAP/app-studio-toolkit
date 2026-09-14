export const messages = {
  space_not_set: `The selected action failed because there is no Cloud Foundry space assigned.`,
  service_creation_started: `Service instance creation started, waiting for 'Ready' state...`,
  create_service_canceled_by_requester: `The service instance creation was cancelled by the requester. The service may have been partially created, consider deleting it using the 'cf delete-service' command.`,
  cf_setting_not_set: `Could not find the Cloud Foundry settings. Make sure you have assigned an org and space in Cloud Foundry.`,
  no_valid_filters: `Could not find any valid filters.`,
  failed_creating_entity: (description: string, name: string): string =>
    `Could not create the entity since ${description}, consider deleting it using the 'cf delete-service ${name} command'.`,
  exceed_number_of_attempts: (name: string): string =>
    `Could not verify the service instance creation. Check its status using the 'cf service ${name}' command.`,
  service_not_found: (instanceName: string): string => `Could not find the '${instanceName}' service instance.`,
  service_creation_failed: (error: string): string => `Service instance creation failed: ${error}`,
  not_allowed_filter: (param: string, query: string): string =>
    `The '${param}' parameter is not allowed in the '${query}' query.`,
};

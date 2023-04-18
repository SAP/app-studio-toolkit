export const messages = {
  lbl_dev_space_explorer_no_dev_spaces: `Could not find any devspaces in landscape.`,
  lbl_dev_space_explorer_authentication_failure: `Could not authenticate to landscape.`,
  lbl_dev_space_explorer_loading: `Loading...`,
  lbl_icon_missing: (iconName: string): string =>
    `Could not find an icon named '${iconName}'. Make sure you imported the matching file.`,
  lbl_logged_in: `Logged in`,
  lbl_not_logged_in: `Not logged in`,
  lbl_landscape_context_status: (isLoggedIn: boolean) =>
    `landscape-${isLoggedIn ? "log-in" : "log-out"}`,
  lbl_devspace_status_runnig: `running`,
  lbl_devspace_status_not_runnig: `not_running`,
  lbl_devspace_status_error: `error`,
  lbl_devspace_status_transitioning: `transitioning`,
  lbl_devspace_context_runnig: `dev-space-running`,
  lbl_devspace_context_stopped: `dev-space-stopped`,
  lbl_devspace_context_transitioning: `dev-space-transitioning`,
  lbl_devspace_context_error: `dev-space-error`,
  lbl_delete_landscape: (label: string) =>
    `This action will delete the landscape '${label}'`,
  lbl_delete_devspace: (label: string, id: string) =>
    `This action will delete the ws '${label}' (${id})`,
  lbl_yes: `Yes`,
  lbl_no: `No`,

  err_incorrect_jwt: (url: string) =>
    `Incorrect token recieved for ${url}. Login failed`,
  err_listening: (message: string, url: string) =>
    `Error listening to get jwt: ${message} for ${url}`,
  err_get_jwt_timeout: (ms: number) => `Login time out in ${ms} ms.`,
  err_get_jwt_not_exists: `Personal Access Token does not exist`,
  err_get_jwt_required: `Personal Access Token is required`,
  err_open_devspace_in_bas: (landscapeUrl: string, err: string) =>
    `Can't open the devspace ${landscapeUrl}: ${err}`,
  err_copy_devspace_id: (err: string) =>
    `Can't copy devspace identificator: ${err}}`,
  err_assert_unreachable: `Didn't expect to get here`,
  err_get_devspace: (message: string) => `Failed to get Dev Spaces, ${message}`,
  err_devspace_delete: (wsId: string, reason: string) =>
    `Failed Deleting '${wsId}': ${reason}`,
  err_ws_update: (wsId: string, reason: string) =>
    `Failed to update ws ${wsId}, ${reason}`,
  err_name_validation: `The name must start with a letter or number and may contain any alphanumeric charcters or undrscores. Special characters can't be used.`,

  info_obtaining_key: `Obtaining SSH key`,
  info_save_pk_to_file: `Save PK to file`,
  info_update_config_file_with_ssh_connection: `Update config file with SSH connection`,
  info_closing_old_tunnel: `Closing old tunnel to dev-space`,
  info_staring_new_tunnel: `Starting new tunnel to dev-space`,
  info_devspace_state_updated: (
    wsName: string,
    wsId: string,
    suspend: boolean
  ) => `Devspace ${wsName} (${wsId}) was ${suspend ? "stoped" : "started"}`,
  info_wsid_copied: `ws id was copied to clip board`,
  info_devspace_deleted: (wsId: string) => `Deleted Dev Space '${wsId}'`,
};

export const messages = {
  DEV_SPACE_EXPLORER_NO_DEV_SPACES: `Could not find any devspaces in landscape.`,
  DEV_SPACE_EXPLORER_AUTHENTICATION_FAILURE: `Could not authenticate to landscape.`,
  DEV_SPACE_EXPLORER_LOADING: `Loading...`,
  ICON_MISSING: (iconName: string): string =>
    `Could not find an icon named '${iconName}'. Make sure you imported the matching file.`,
  name_extention: `BAS Remote Explorer`,
  err_incorrect_jwt: (url: string) =>
    `Incorrect jwt recieved. Please refresh your browser window to relogin and try again. for ${url}`,
  err_listening: (port: number, message: string, url: string) =>
    `Error listening on port ${port} to get jwt: ${message} for ${url}`,
  err_get_jwt_timeout: (ms: number) => `Getting JWT Timed out in ${ms} ms.`,
  err_authentication: (landscape: string) =>
    `Authentication to ${landscape} failed, press refresh to try again`,
  err_get_devspace: (message: string) => `Failed to get Dev Spaces, ${message}`,
  err_get_key: (message: string) => `Failed to get SSHP Key, ${message}`,
  err_get_extpack: (message: string) =>
    `Failed to get Extension packs, ${message}`,
  err_devspace_delete: (wsId: string, reason: string) =>
    `Failed Deleting '${wsId}': ${reason}`,
  err_devspace_create: (name: string, reason: string) =>
    `Failed Creating '${name}', ${reason}`,
  err_config_update: (name: string, reason: string) =>
    `Could't update config file ${name} : ${reason}`,
  err_ws_update: (wsId: string, reason: string) =>
    `Failed to update ws ${wsId}, ${reason}`,
  err_name_validation: `The name must start with a letter or number and may contain any alphanumeric charcters or undrscores. Special characters can't be used.`,
  txt_login_canceled: (landscape: string) =>
    `User canceled request to login for ${landscape}`,
  info_feature_not_supported: () => `This feature is not supported yet`,
  info_wsid_copied: `ws id was copied to clip board`,
  info_config_not_exist: (name: string) =>
    `SSH Config file ${name} doest exist, creating new file`,
  info_devspace_deleted: (wsId: string) => `Deleted Dev Space '${wsId}'`,
  info_devspace_edited: (name: string, id: string) =>
    `WS ${name} (${id}) was edited`,
  info_devspace_create: (name: string) => `Creating Dev Space '${name}'`,
  lbl_delete_landscape: (label: string) =>
    `This action will delete the landscape '${label}'`,
  lbl_delete_devspace: (label: string, id: string) =>
    `This action will delete the ws '${label}' (${id})`,
  lbl_yes: `Yes`,
  lbl_no: `No`,
};

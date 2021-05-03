interface WorkspaceApi {
    /*
     * Get all the projects in the workspace
     *
     * Return type is array of ProjectAPIs
     */
    getProjects(): Promise<ProjectApi[]>;

    /* Get the project based on tag provided
     *
     * Returns ProjectAPI for the tag
     *
     */
    getProjectsByTags(tag: Tag): Promise<ProjectApi>;
}

interface ProjectApi {
    /**
     * Read project, its modules and entities
     *
     */
    read(): Promise<Project | undefined>;
}

interface ProjectData {

    /**
     * Project type
     */
    type: string;

    /**
     * Display name
     */
    name: string;

    /**
     * Project path
     */
    path: string;

    /**
     * Technical id for the service used as prefix for all cloud artifacts created for the project
     *
     * @todo: This should be moved to "project properties" later
     */
    prefix: string;

    /**
     * Namespace for the service used for the registration in BTP services such as HTML5 App Repo
     *
     * @todo: This should be moved to "project properties" later
     */
    cloudService: string;

    /**
     * Tags related to the Project
     */
    tags?: string[];
}

interface Project extends ProjectData {
    modules: Module[];
}

interface Module extends ModuleData {
    items: Item[];
}

interface Item {
    /** Item type
     *
     * @todo Type values are subject to change. Please always use ItemType enumeration.
     */
    type: string;

    /** Technical name
     *
     * Technical, not translated, name for the entity to be displayed as the "name of the entity" in the UIs.
     * No need to concatenate it with other names to make it unique.
     */
    name: string;

    /** Reference within the project
     *
     * This is used to identify the entity within the project. It needs to be unique in the project.
     * If needed, prepend a string to it to make it unique. e.g. the module name.
     */
    ref: string;

    /** Path of entity within the project
     *
     * Project-relative path to the entity.
     * It should be the file that should be opened to edit the entity in an editor.
     */
    path: string;

    /**
     * Links
     */
    links?: ItemLink[];

    /** Tags related to the item
     *
     * Tags can be used for filtering.
     * It would be beneficial to use this information to avoid to read entities, that do not match these tags.
     */
    tags?: string[];
}

export default interface ItemLink {
    /** Link type */
    linkType: LinkType;

    /** Target type  */
    type: string;

    /** Target reference */
    ref: string;
}
